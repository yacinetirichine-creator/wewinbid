import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { TeamService } from '@/lib/services/team-service';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20' as any,
});

// Price ID for extra team members (€10/month)
// This should be created in Stripe dashboard and stored in env
const EXTRA_MEMBER_PRICE_ID = process.env.STRIPE_EXTRA_MEMBER_PRICE_ID || '';

/**
 * GET /api/team/billing
 * Get current team billing information
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const teamService = new TeamService(supabase);
    const team = await teamService.getUserTeam(user.id);

    if (!team) {
      return NextResponse.json({ error: 'Équipe non trouvée' }, { status: 404 });
    }

    // Only owner can view billing
    if (team.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Seul le propriétaire peut voir la facturation' },
        { status: 403 }
      );
    }

    const billingInfo = await teamService.getTeamBillingInfo(team.id);

    // Get Stripe subscription details if available
    let stripeDetails = null;
    if (team.stripe_subscription_item_id) {
      try {
        const subscriptionItem = await stripe.subscriptionItems.retrieve(
          team.stripe_subscription_item_id
        );
        stripeDetails = {
          quantity: subscriptionItem.quantity,
          status: 'active'
        };
      } catch (e) {
        console.error('Error fetching Stripe subscription item:', e);
      }
    }

    return NextResponse.json({
      billing: billingInfo,
      stripe: stripeDetails,
      team: {
        id: team.id,
        name: team.name,
        max_free_members: team.max_free_members,
        extra_member_price: team.extra_member_price
      }
    });
  } catch (error) {
    console.error('Error getting team billing:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/team/billing
 * Sync team member count with Stripe billing
 * Called after adding/removing members
 */
export async function POST() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const teamService = new TeamService(supabase);
    const team = await teamService.getUserTeam(user.id);

    if (!team) {
      return NextResponse.json({ error: 'Équipe non trouvée' }, { status: 404 });
    }

    // Only owner can manage billing
    if (team.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Seul le propriétaire peut gérer la facturation' },
        { status: 403 }
      );
    }

    const billingInfo = await teamService.getTeamBillingInfo(team.id);

    // If no extra members, nothing to bill
    if (billingInfo.extra_members === 0) {
      // If there was a subscription item, update quantity to 0
      if (team.stripe_subscription_item_id) {
        try {
          await stripe.subscriptionItems.update(team.stripe_subscription_item_id, {
            quantity: 0
          });
        } catch (e) {
          console.error('Error updating Stripe quantity:', e);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Aucun membre supplémentaire à facturer',
        billing: billingInfo
      });
    }

    // Get user's Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id || !profile?.subscription_id) {
      return NextResponse.json(
        { error: 'Pas d\'abonnement Stripe actif. Veuillez souscrire à un plan Pro ou Enterprise.' },
        { status: 400 }
      );
    }

    // If we already have a subscription item, update the quantity
    if (team.stripe_subscription_item_id) {
      try {
        await stripe.subscriptionItems.update(team.stripe_subscription_item_id, {
          quantity: billingInfo.extra_members
        });

        return NextResponse.json({
          success: true,
          message: `Facturation mise à jour: ${billingInfo.extra_members} membre(s) supplémentaire(s)`,
          billing: billingInfo
        });
      } catch (e) {
        console.error('Error updating Stripe subscription item:', e);
        // Fall through to create new item
      }
    }

    // Create new subscription item for extra members
    if (!EXTRA_MEMBER_PRICE_ID) {
      console.warn('STRIPE_EXTRA_MEMBER_PRICE_ID not configured');
      return NextResponse.json({
        success: true,
        message: 'Facturation non configurée (mode développement)',
        billing: billingInfo
      });
    }

    try {
      const subscriptionItem = await stripe.subscriptionItems.create({
        subscription: profile.subscription_id,
        price: EXTRA_MEMBER_PRICE_ID,
        quantity: billingInfo.extra_members
      });

      // Save subscription item ID to team
      await supabase
        .from('teams')
        .update({ stripe_subscription_item_id: subscriptionItem.id })
        .eq('id', team.id);

      return NextResponse.json({
        success: true,
        message: `Facturation activée: ${billingInfo.extra_members} membre(s) supplémentaire(s) à ${billingInfo.per_member_cost}€/mois`,
        billing: billingInfo,
        stripe_item_id: subscriptionItem.id
      });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      return NextResponse.json(
        { error: 'Erreur Stripe lors de l\'ajout de la facturation' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error syncing team billing:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
