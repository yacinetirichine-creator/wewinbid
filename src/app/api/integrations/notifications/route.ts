import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface SlackWebhookPayload {
  channel?: string;
  text: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
}

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  accessory?: {
    type: string;
    url?: string;
    text?: { type: string; text: string };
    action_id?: string;
  };
  elements?: Array<{
    type: string;
    text?: { type: string; text: string; emoji?: boolean };
    url?: string;
    action_id?: string;
  }>;
}

interface SlackAttachment {
  color?: string;
  title?: string;
  text?: string;
  fields?: Array<{ title: string; value: string; short?: boolean }>;
}

interface TeamsWebhookPayload {
  '@type': string;
  '@context': string;
  summary: string;
  themeColor?: string;
  title?: string;
  sections?: TeamsSection[];
  potentialAction?: TeamsAction[];
}

interface TeamsSection {
  activityTitle?: string;
  activitySubtitle?: string;
  activityImage?: string;
  facts?: Array<{ name: string; value: string }>;
  text?: string;
  markdown?: boolean;
}

interface TeamsAction {
  '@type': string;
  name: string;
  targets?: Array<{ os: string; uri: string }>;
}

// Envoyer une notification Slack
async function sendSlackNotification(
  webhookUrl: string,
  payload: SlackWebhookPayload
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    return false;
  }
}

// Envoyer une notification Teams
async function sendTeamsNotification(
  webhookUrl: string,
  payload: TeamsWebhookPayload
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch (error) {
    console.error('Error sending Teams notification:', error);
    return false;
  }
}

// Créer un message Slack formaté pour un appel d'offres
export function createTenderSlackMessage(
  tender: {
    title: string;
    reference?: string;
    type: string;
    deadline?: string;
    budget?: number;
    score?: number;
    status?: string;
  },
  event: 'new' | 'deadline_reminder' | 'status_change' | 'score_update',
  appUrl: string
): SlackWebhookPayload {
  const eventConfig = {
    new: {
      emoji: '📋',
      title: 'Nouvel appel d\'offres détecté',
      color: '#3b82f6',
    },
    deadline_reminder: {
      emoji: '⏰',
      title: 'Rappel de deadline',
      color: '#f59e0b',
    },
    status_change: {
      emoji: '🔄',
      title: 'Changement de statut',
      color: '#8b5cf6',
    },
    score_update: {
      emoji: '📊',
      title: 'Score mis à jour',
      color: '#10b981',
    },
  };

  const config = eventConfig[event];
  const deadlineText = tender.deadline
    ? new Date(tender.deadline).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Non spécifiée';

  return {
    text: `${config.emoji} ${config.title}: ${tender.title}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${config.emoji} ${config.title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${tender.title}*\n${tender.reference ? `Réf: ${tender.reference}` : ''}`,
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Voir le détail',
          },
          url: appUrl,
          action_id: 'view_tender',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            `📁 *Type:* ${tender.type === 'PUBLIC' ? 'Public' : 'Privé'}`,
            `📅 *Deadline:* ${deadlineText}`,
            tender.budget ? `💰 *Budget:* ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(tender.budget)}` : null,
            tender.score !== undefined ? `🎯 *Score:* ${tender.score}%` : null,
            tender.status ? `📌 *Statut:* ${tender.status}` : null,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      },
    ],
    attachments: [
      {
        color: config.color,
        fields: [],
      },
    ],
  };
}

// Créer un message Teams formaté
export function createTenderTeamsMessage(
  tender: {
    title: string;
    reference?: string;
    type: string;
    deadline?: string;
    budget?: number;
    score?: number;
    status?: string;
  },
  event: 'new' | 'deadline_reminder' | 'status_change' | 'score_update',
  appUrl: string
): TeamsWebhookPayload {
  const eventConfig = {
    new: {
      title: '📋 Nouvel appel d\'offres détecté',
      color: '3b82f6',
    },
    deadline_reminder: {
      title: '⏰ Rappel de deadline',
      color: 'f59e0b',
    },
    status_change: {
      title: '🔄 Changement de statut',
      color: '8b5cf6',
    },
    score_update: {
      title: '📊 Score mis à jour',
      color: '10b981',
    },
  };

  const config = eventConfig[event];
  const deadlineText = tender.deadline
    ? new Date(tender.deadline).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Non spécifiée';

  const facts = [
    { name: 'Type', value: tender.type === 'PUBLIC' ? 'Public' : 'Privé' },
    { name: 'Deadline', value: deadlineText },
  ];

  if (tender.budget) {
    facts.push({
      name: 'Budget',
      value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(tender.budget),
    });
  }

  if (tender.score !== undefined) {
    facts.push({ name: 'Score', value: `${tender.score}%` });
  }

  if (tender.status) {
    facts.push({ name: 'Statut', value: tender.status });
  }

  return {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    summary: `${config.title}: ${tender.title}`,
    themeColor: config.color,
    title: config.title,
    sections: [
      {
        activityTitle: tender.title,
        activitySubtitle: tender.reference ? `Référence: ${tender.reference}` : undefined,
        facts,
        markdown: true,
      },
    ],
    potentialAction: [
      {
        '@type': 'OpenUri',
        name: 'Voir le détail',
        targets: [{ os: 'default', uri: appUrl }],
      },
    ],
  };
}

// POST - Envoyer une notification
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, event_type, tender_data, webhook_url } = body;

    if (!platform || !event_type || !tender_data) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Si pas de webhook_url fourni, récupérer depuis les settings de l'org
    let targetWebhookUrl = webhook_url;
    if (!targetWebhookUrl) {
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      const { data: settings } = await supabase
        .from('organization_settings')
        .select('slack_webhook_url, teams_webhook_url')
        .eq('organization_id', userData?.organization_id)
        .single();

      targetWebhookUrl = platform === 'slack' 
        ? settings?.slack_webhook_url 
        : settings?.teams_webhook_url;
    }

    if (!targetWebhookUrl) {
      return NextResponse.json(
        { error: `Webhook ${platform} non configuré` },
        { status: 400 }
      );
    }

    const appUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tenders/${tender_data.id}`;
    let success = false;

    if (platform === 'slack') {
      const payload = createTenderSlackMessage(tender_data, event_type, appUrl);
      success = await sendSlackNotification(targetWebhookUrl, payload);
    } else if (platform === 'teams') {
      const payload = createTenderTeamsMessage(tender_data, event_type, appUrl);
      success = await sendTeamsNotification(targetWebhookUrl, payload);
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Échec de l\'envoi de la notification' },
        { status: 500 }
      );
    }

    // Log l'envoi
    await supabase.from('notification_logs').insert({
      user_id: user.id,
      type: `${platform}_webhook`,
      channel: platform,
      data: { event_type, tender_id: tender_data.id },
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de la notification' },
      { status: 500 }
    );
  }
}
