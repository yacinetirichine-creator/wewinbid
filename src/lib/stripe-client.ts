'use client';

/**
 * @fileoverview Stripe client-side utilities.
 * Loads Stripe.js and provides helper functions.
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get or create Stripe.js instance.
 * Reuses the same instance for performance.
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!key) {
      console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
      return Promise.resolve(null);
    }
    
    stripePromise = loadStripe(key);
  }
  
  return stripePromise;
}

/**
 * Redirect to Stripe Checkout.
 * 
 * @param sessionId - Stripe Checkout Session ID
 * 
 * @example
 * ```ts
 * const { sessionId } = await fetch('/api/checkout', { ... }).then(r => r.json());
 * await redirectToCheckout(sessionId);
 * ```
 */
export async function redirectToCheckout(sessionId: string): Promise<void> {
  const stripe = await getStripe();
  
  if (!stripe) {
    throw new Error('Stripe.js failed to load');
  }
  
  const { error } = await stripe.redirectToCheckout({ sessionId });
  
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Redirect to Stripe Customer Portal.
 * Allows users to manage subscriptions, billing info, invoices.
 */
export async function redirectToCustomerPortal(): Promise<void> {
  try {
    const response = await fetch('/api/stripe/customer-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }
    
    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    console.error('Customer portal error:', error);
    throw error;
  }
}
