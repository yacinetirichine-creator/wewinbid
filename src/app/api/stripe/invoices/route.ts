/**
 * GET /api/stripe/invoices
 * Retourne les factures Stripe du customer associé à l'utilisateur.
 */

import { NextResponse } from 'next/server';
import { getStripeServer } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { withErrorHandler } from '@/lib/errors';

async function handler() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  const customerId = profile?.stripe_customer_id as string | undefined;
  if (!customerId) {
    return NextResponse.json({ invoices: [], payment_method: null, next_billing_date: null });
  }

  const stripe = getStripeServer();

  // Factures
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 20,
  });

  const mappedInvoices = invoices.data.map((inv) => {
    const amountCents = typeof inv.amount_paid === 'number' ? inv.amount_paid : (inv.amount_due ?? 0);
    const amount = Math.round((amountCents / 100) * 100) / 100;

    return {
      id: inv.number || inv.id,
      date: new Date((inv.created || 0) * 1000).toISOString(),
      amount,
      status: inv.status || 'open',
      url: inv.hosted_invoice_url || undefined,
      pdf: inv.invoice_pdf || undefined,
    };
  });

  // Moyen de paiement (best effort)
  let paymentMethodText: string | null = null;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    const isDeletedCustomer =
      typeof customer !== 'string' && 'deleted' in customer && Boolean((customer as any).deleted);

    const defaultPm =
      typeof customer !== 'string' && !isDeletedCustomer
        ? ((customer as any).invoice_settings?.default_payment_method as string | null)
        : null;

    if (defaultPm) {
      const pm = await stripe.paymentMethods.retrieve(defaultPm);
      const card = pm?.card;
      if (card?.brand && card?.last4 && card?.exp_month && card?.exp_year) {
        paymentMethodText = `${String(card.brand).toUpperCase()} •••• ${card.last4} (exp ${card.exp_month}/${card.exp_year})`;
      }
    }
  } catch {
    // ignore
  }

  // Prochaine échéance (best effort)
  let nextBillingDate: string | null = null;
  try {
    const upcoming = await stripe.invoices.retrieveUpcoming({ customer: customerId });
    if (upcoming?.next_payment_attempt) {
      nextBillingDate = new Date(upcoming.next_payment_attempt * 1000).toISOString();
    }
  } catch {
    // ignore si pas d'abonnement actif
  }

  return NextResponse.json({
    invoices: mappedInvoices,
    payment_method: paymentMethodText,
    next_billing_date: nextBillingDate,
  });
}

export const GET = withErrorHandler(handler as any);
