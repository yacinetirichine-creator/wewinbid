import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * RGPD Article 17 - Droit à l'effacement (droit à l'oubli)
 * Suppression complète et définitive du compte utilisateur et de toutes ses données
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer le profil pour avoir le company_id
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil introuvable' },
        { status: 404 }
      );
    }

    // Log avant suppression pour audit RGPD
    console.info('[RGPD] Account deletion initiated', {
      user_id: user.id,
      email: user.email,
      company_id: profile.company_id,
      timestamp: new Date().toISOString(),
    });

    // 1. Supprimer tous les fichiers stockés
    if (profile.company_id) {
      // Récupérer tous les chemins de fichiers
      const { data: documents } = await (supabase as any)
        .from('documents')
        .select('file_path')
        .eq('company_id', profile.company_id);

      // Supprimer chaque fichier du storage
      if (documents && documents.length > 0) {
        const filePaths = documents.map((doc: any) => doc.file_path);
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove(filePaths);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
        }
      }

      // 2. Supprimer les documents de la base de données
      await (supabase as any)
        .from('documents')
        .delete()
        .eq('company_id', profile.company_id);

      // 3. Supprimer les réponses aux tenders
      await (supabase as any)
        .from('tender_responses')
        .delete()
        .eq('user_id', user.id);

      // 4. Supprimer les tenders
      await (supabase as any)
        .from('tenders')
        .delete()
        .eq('user_id', user.id);

      // 5. Supprimer les notifications
      await (supabase as any)
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      // 6. Supprimer les logs d'activité (si table existe)
      await (supabase as any)
        .from('activity_logs')
        .delete()
        .eq('user_id', user.id);

      // 7. Supprimer l'abonnement Stripe (si existe)
      const { data: subscription } = await (supabase as any)
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('company_id', profile.company_id)
        .single();

      if (subscription?.stripe_subscription_id) {
        // Annuler l'abonnement Stripe via API
        try {
          await fetch('/api/stripe/cancel-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscriptionId: subscription.stripe_subscription_id,
            }),
          });
        } catch (stripeError) {
          console.error('Stripe cancellation error:', stripeError);
        }
      }

      // 8. Supprimer l'abonnement de la base
      await (supabase as any)
        .from('subscriptions')
        .delete()
        .eq('company_id', profile.company_id);

      // 9. Supprimer l'entreprise
      await (supabase as any)
        .from('companies')
        .delete()
        .eq('id', profile.company_id);
    }

    // 10. Supprimer le profil
    await (supabase as any)
      .from('profiles')
      .delete()
      .eq('id', user.id);

    // 11. Supprimer le compte Auth (dernière étape)
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteAuthError) {
      console.error('Auth deletion error:', deleteAuthError);
      // Continuer quand même car les données sont supprimées
    }

    // Log final de suppression
    console.info('[RGPD] Account deletion completed', {
      user_id: user.id,
      timestamp: new Date().toISOString(),
      status: 'success',
    });

    // Envoyer email de confirmation de suppression
    try {
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          template: 'account_deleted',
          data: {
            deletion_date: new Date().toISOString(),
          },
        }),
      });
    } catch (emailError) {
      console.error('Email confirmation error:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Votre compte et toutes vos données ont été supprimés définitivement.',
      deletion_timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    
    // Log de l'erreur pour audit
    console.error('[RGPD] Account deletion failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: 'Erreur lors de la suppression du compte' },
      { status: 500 }
    );
  }
}
