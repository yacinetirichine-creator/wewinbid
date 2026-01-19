import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeObject } from '@/lib/sanitize';

/**
 * RGPD Article 20 - Droit à la portabilité des données
 * Export de toutes les données personnelles de l'utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // 1. Profil utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // 2. Informations d'entreprise
    const { data: company } = profile?.company_id
      ? await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single()
      : { data: null };

    // 3. Tenders créés
    const { data: tenders } = await supabase
      .from('tenders')
      .select('*')
      .eq('user_id', user.id);

    // 4. Documents uploadés
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id);

    // 5. Réponses aux tenders
    const { data: responses } = await supabase
      .from('tender_responses')
      .select('*')
      .eq('user_id', user.id);

    // 6. Abonnement et paiements
    const { data: subscription } = profile?.company_id
      ? await supabase
          .from('subscriptions')
          .select('*')
          .eq('company_id', profile.company_id)
          .single()
      : { data: null };

    // 7. Notifications
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id);

    // 8. Activité récente (si table existe)
    const { data: activity } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    // Compilation de toutes les données
    const exportData = {
      export_metadata: {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        format: 'JSON',
        rgpd_compliance: 'Article 20 - Droit à la portabilité',
      },
      authentication: {
        email: user.email,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at,
      },
      profile: sanitizeObject(profile || {}),
      company: sanitizeObject(company || {}),
      tenders: {
        count: tenders?.length || 0,
        data: tenders?.map(t => sanitizeObject(t)) || [],
      },
      documents: {
        count: documents?.length || 0,
        data: documents?.map(d => ({
          ...sanitizeObject(d),
          // Ne pas exposer les URLs signées complètes pour la sécurité
          file_path: d.file_path,
          note: 'Les fichiers peuvent être téléchargés depuis votre tableau de bord',
        })) || [],
      },
      responses: {
        count: responses?.length || 0,
        data: responses?.map(r => sanitizeObject(r)) || [],
      },
      subscription: sanitizeObject(subscription || {}),
      notifications: {
        count: notifications?.length || 0,
        data: notifications?.map(n => sanitizeObject(n)) || [],
      },
      activity_logs: {
        count: activity?.length || 0,
        data: activity?.map(a => sanitizeObject(a)) || [],
        note: 'Limité aux 100 dernières activités',
      },
      legal_information: {
        data_controller: 'JARVIS SAS',
        address: '64 Avenue Marinville, 94100 Saint-Maur-des-Fossés',
        dpo_contact: 'commercial@wewinbid.com',
        data_retention: {
          active_account: 'Durée de l\'abonnement + 5 ans (obligations légales)',
          deleted_account: '30 jours puis suppression définitive',
        },
        your_rights: [
          'Droit d\'accès',
          'Droit de rectification',
          'Droit à l\'effacement',
          'Droit à la limitation du traitement',
          'Droit à la portabilité',
          'Droit d\'opposition',
        ],
      },
    };

    // Log de l'export pour audit RGPD
    console.info('[RGPD] Data export', {
      user_id: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    // Retourner le JSON en download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="wewinbid-data-export-${user.id}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'export des données' },
      { status: 500 }
    );
  }
}
