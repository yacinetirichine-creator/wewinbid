import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer les données de la requête
    const body = await req.json();
    const { priceId, plan, interval } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID manquant' },
        { status: 400 }
      );
    }

    // Récupérer le profil utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil utilisateur introuvable' },
        { status: 404 }
      );
    }

    let customerId = profile.stripe_customer_id;

    // Créer le customer Stripe si nécessaire
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Sauvegarder le customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Créer la session Checkout
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
        plan: plan,
        interval: interval,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan: plan,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    });

  } catch (error: any) {
    console.error('Erreur création session Stripe:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la session' },
      { status: 500 }
    );
  }
}
