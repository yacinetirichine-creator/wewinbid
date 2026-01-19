/**
 * @fileoverview Create Stripe Checkout session for subscription.
 * POST /api/stripe/checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe, getPriceId } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { withErrorHandler } from '@/lib/errors';
import { z } from 'zod';

const CheckoutSchema = z.object({
  plan: z.enum(['pro', 'business']),
  interval: z.enum(['monthly', 'yearly']),
});

async function handler(req: NextRequest) {
  // Parse and validate request
  const body = await req.json();
  const { plan, interval } = CheckoutSchema.parse(body);

  // Get authenticated user
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get or create Stripe customer
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: {
        supabase_user_id: user.id,
      },
    });

    customerId = customer.id;

    // Save customer ID to database
    await (supabase as any)
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  // Get price ID
  const priceId = getPriceId(plan, interval);

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?checkout=cancelled`,
    metadata: {
      user_id: user.id,
      plan,
      interval,
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan,
        interval,
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    customer_update: {
      address: 'auto',
    },
  });

  return NextResponse.json({
    sessionId: session.id,
    url: session.url,
  });
}

export const POST = withErrorHandler(handler as any);
