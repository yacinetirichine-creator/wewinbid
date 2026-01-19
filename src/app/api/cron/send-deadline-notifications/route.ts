import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import nodemailer from 'nodemailer';

/**
 * Cron job pour envoyer les notifications email
 * À appeler via Vercel Cron ou service similaire
 * POST /api/cron/send-deadline-notifications
 */
export async function POST(request: Request) {
  try {
    // Vérifier le token de sécurité (Vercel Cron)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const supabase = await createClient();

    // Récupérer tous les tenders avec deadlines à venir
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: tenders } = (await (supabase as any)
      .from('tenders')
      .select(`
        *,
        company:companies (
          id,
          name
        ),
        profile:profiles!company_id (
          id,
          email
        )
      `)
      .lte('deadline', in7Days.toISOString())
      .gte('deadline', now.toISOString())
      .in('status', ['DRAFT', 'ANALYSIS', 'IN_PROGRESS', 'REVIEW'])) as { data: any[] | null };

    if (!tenders || tenders.length === 0) {
      return NextResponse.json({ message: 'Aucun tender à notifier', sent: 0 });
    }

    let sent = 0;

    // Configurer le transporteur email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    for (const tender of tenders) {
      const deadline = new Date(tender.deadline);
      const diffMs = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let notificationType: string | null = null;
      let title = '';
      let message = '';

      // Déterminer le type de notification
      if (diffDays <= 1 && diffDays > 0) {
        notificationType = 'DEADLINE_24H';
        title = '⚠️ Échéance dans 24h !';
        message = `L'appel d'offres "${tender.title}" doit être soumis avant demain.`;
      } else if (diffDays <= 3 && diffDays > 1) {
        notificationType = 'DEADLINE_3D';
        title = 'Échéance dans 3 jours';
        message = `L'appel d'offres "${tender.title}" doit être soumis dans 3 jours.`;
      } else if (diffDays <= 7 && diffDays > 3) {
        notificationType = 'DEADLINE_7D';
        title = 'Échéance dans 7 jours';
        message = `L'appel d'offres "${tender.title}" doit être soumis dans une semaine.`;
      }

      if (!notificationType) continue;

      // Vérifier si la notification n'a pas déjà été envoyée
      const { data: existingNotif } = await (supabase as any)
        .from('notification_sent')
        .select('id')
        .eq('notification_type', notificationType)
        .eq('tender_id', tender.id)
        .eq('user_id', tender.profile.id)
        .single();

      if (existingNotif) continue; // Déjà envoyée

      // Vérifier les préférences utilisateur
      const { data: prefs } = (await (supabase as any)
        .from('notification_preferences')
        .select('*')
        .eq('user_id', tender.profile.id)
        .single()) as { data: any | null };

      const field = notificationType.toLowerCase().replace('_', '_');
      if (prefs && !prefs.email_enabled) continue;
      if (prefs && prefs[field] === false) continue;

      // Créer la notification dans la DB
      await (supabase as any).from('notifications').insert({
        user_id: tender.profile.id,
        type: notificationType,
        title,
        message,
        link: `/tenders/${tender.id}`,
        tender_id: tender.id,
      });

      // Envoyer l'email
      try {
        await transporter.sendMail({
          from: `"WeWinBid" <${process.env.SMTP_USER}>`,
          to: tender.profile.email,
          subject: title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e40af;">${title}</h2>
              <p>${message}</p>
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <strong>Référence:</strong> ${tender.reference}<br>
                <strong>Client:</strong> ${tender.buyer?.name || 'N/A'}<br>
                <strong>Échéance:</strong> ${new Date(tender.deadline).toLocaleDateString('fr-FR')}<br>
                <strong>Valeur estimée:</strong> ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(tender.estimated_value || 0)}
              </div>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/tenders/${tender.id}" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
                Voir l'appel d'offres
              </a>
              <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                Vous recevez cet email car vous avez activé les notifications de deadlines.
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color: #2563eb;">Gérer mes préférences</a>
              </p>
            </div>
          `,
        });

        // Marquer comme envoyée
        await (supabase as any).from('notification_sent').insert({
          notification_type: notificationType,
          tender_id: tender.id,
          user_id: tender.profile.id,
        });

        sent++;
      } catch (emailError) {
        console.error('Erreur envoi email:', emailError);
      }
    }

    return NextResponse.json({ 
      message: `${sent} notifications envoyées`,
      sent,
      total: tenders.length 
    });
  } catch (error) {
    console.error('Erreur cron notifications:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
