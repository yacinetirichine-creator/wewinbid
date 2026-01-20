/**
 * @fileoverview Stripe webhook handler.
 * POST /api/stripe/webhook
 * 
 * Handles subscription lifecycle events:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.paid
 * - invoice.payment_failed
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { verifyWebhookSignature, STRIPE_WEBHOOK_EVENTS } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Use service role key for database updates (lazy to avoid build-time failures)
let supabaseServiceClient: ReturnType<typeof createClient> | null = null;

function getSupabaseServiceClient() {
  if (supabaseServiceClient) return supabaseServiceClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  }

  supabaseServiceClient = createClient(supabaseUrl, serviceRoleKey);
  return supabaseServiceClient;
}

/**
 * Handle checkout.session.completed event.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = getSupabaseServiceClient();

  const userId = session.metadata?.user_id;
  const plan = session.metadata?.plan;
  const interval = session.metadata?.interval;

  if (!userId || !plan || !interval) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  // Update user profile
  await (supabase as any)
    .from('profiles')
    .update({
      subscription_plan: plan,
      subscription_interval: interval,
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  console.log(`✅ Checkout completed for user ${userId}: ${plan} ${interval}`);
}

/**
 * Handle customer.subscription.updated event.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = getSupabaseServiceClient();

  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error('Missing user_id in subscription metadata:', subscription.id);
    return;
  }

  const status = subscription.status;
  const plan = subscription.metadata?.plan;
  const interval = subscription.metadata?.interval;

  // Update subscription status
  await (supabase as any)
    .from('profiles')
    .update({
      subscription_status: status,
      subscription_plan: plan || null,
      subscription_interval: interval || null,
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  console.log(`✅ Subscription updated for user ${userId}: ${status}`);
}

/**
 * Handle customer.subscription.deleted event.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = getSupabaseServiceClient();

  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error('Missing user_id in subscription metadata:', subscription.id);
    return;
  }

  // Revert to free plan
  await (supabase as any)
    .from('profiles')
    .update({
      subscription_plan: 'free',
      subscription_status: 'canceled',
      subscription_interval: null,
      subscription_current_period_end: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  console.log(`✅ Subscription canceled for user ${userId}`);
}

/**
 * Handle invoice.payment_failed event.
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = getSupabaseServiceClient();

  const customerId = invoice.customer as string;

  // Get user from customer ID
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (profile) {
    // Update status
    await (supabase as any)
      .from('profiles')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    // TODO: Send email notification
    console.log(`⚠️ Payment failed for user ${profile.id}`);
  }
}

/**
 * Main webhook handler.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = verifyWebhookSignature(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle event
  try {
    switch (event.type) {
      case STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED:
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case STRIPE_WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED:
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case STRIPE_WEBHOOK_EVENTS.SUBSCRIPTION_DELETED:
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case STRIPE_WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED:
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case STRIPE_WEBHOOK_EVENTS.INVOICE_PAID:
        console.log('✅ Invoice paid:', event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
