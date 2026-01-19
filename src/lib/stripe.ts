/**
 * @fileoverview Stripe configuration for payment processing.
 * Server-side Stripe instance for API routes and webhooks.
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

/**
 * Stripe server-side instance.
 * Used in API routes and webhooks.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20' as any,
  typescript: true,
  appInfo: {
    name: 'WeWinBid',
    version: '1.0.0',
    url: 'https://wewinbid.com',
  },
});

/**
 * Stripe Price IDs from environment variables.
 * These should match the prices created in Stripe Dashboard.
 */
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY!,
  BUSINESS_MONTHLY: process.env.STRIPE_PRICE_BUSINESS_MONTHLY!,
  BUSINESS_YEARLY: process.env.STRIPE_PRICE_BUSINESS_YEARLY!,
} as const;

/**
 * Map plan names to Stripe Price IDs.
 */
export function getPriceId(plan: 'pro' | 'business', interval: 'monthly' | 'yearly'): string {
  const key = `${plan.toUpperCase()}_${interval.toUpperCase()}` as keyof typeof STRIPE_PRICES;
  const priceId = STRIPE_PRICES[key];
  
  if (!priceId) {
    throw new Error(`Stripe Price ID not found for ${plan} ${interval}`);
  }
  
  return priceId;
}

/**
 * Webhook event types we handle.
 */
export const STRIPE_WEBHOOK_EVENTS = {
  CHECKOUT_COMPLETED: 'checkout.session.completed',
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED: 'payment_intent.payment_failed',
} as const;

/**
 * Verify Stripe webhook signature.
 * Prevents fake webhook requests.
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error}`);
  }
}
