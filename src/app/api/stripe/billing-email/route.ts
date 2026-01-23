/**
 * PATCH /api/stripe/billing-email
 * Met à jour l'email de facturation côté DB (companies.email) et côté Stripe (customer.email).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { withErrorHandler } from '@/lib/errors';

function isValidEmail(value: string) {
  // Validation simple (suffisante ici)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function handler(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const billingEmailRaw = String(body?.billing_email ?? '').trim();

  if (billingEmailRaw && !isValidEmail(billingEmailRaw)) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }

  // Trouver l'entreprise du user
  const { data: membership } = await (supabase as any)
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single();

  const companyId = membership?.company_id as string | undefined;
  if (!companyId) {
    return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
  }

  // Update DB (companies.email)
  const { error: updateCompanyError } = await (supabase as any)
    .from('companies')
    .update({
      email: billingEmailRaw || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', companyId);

  if (updateCompanyError) {
    return NextResponse.json({ error: 'Impossible de sauvegarder l\'email' }, { status: 500 });
  }

  // Update Stripe (best effort)
  if (billingEmailRaw) {
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    const customerId = profile?.stripe_customer_id as string | undefined;
    if (customerId) {
      try {
        const stripe = getStripeServer();
        await stripe.customers.update(customerId, { email: billingEmailRaw });
      } catch (err) {
        console.warn('Stripe customer email update failed:', err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}

export const PATCH = withErrorHandler(handler as any);
