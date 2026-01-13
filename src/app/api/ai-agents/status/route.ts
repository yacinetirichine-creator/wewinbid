import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/ai-agents/status
 * Récupère le statut des agents IA (réservé aux admins)
 */
export async function GET() {
  try {
    const supabase = createClient();

    // Vérifier l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier le rôle admin
    const { data: profile } = (await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()) as { data: { role: string } | null };

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer les configurations des agents
    const { data: configs } = (await supabase
      .from('ai_agent_configs')
      .select('*')
      .order('agent_name')) as { data: any[] | null };

    // Récupérer les dernières actions (24h)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: recentActions } = (await supabase
      .from('ai_actions')
      .select('*')
      .gte('created_at', oneDayAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50)) as { data: any[] | null };

    // Calculer les statistiques par agent
    const landingStats = calculateAgentStats(
      recentActions?.filter((a) => a.agent_name === 'landing') || []
    );
    const appStats = calculateAgentStats(
      recentActions?.filter((a) => a.agent_name === 'app') || []
    );

    const landingConfig = configs?.find((c) => c.agent_name === 'landing');
    const appConfig = configs?.find((c) => c.agent_name === 'app');

    return NextResponse.json({
      landingAgent: {
        status: landingConfig?.enabled ? 'active' : 'paused',
        autonomyLevel: landingConfig?.autonomy_level || 'medium',
        ...landingStats,
        config: landingConfig,
      },
      appAgent: {
        status: appConfig?.enabled ? 'active' : 'paused',
        autonomyLevel: appConfig?.autonomy_level || 'medium',
        ...appStats,
        config: appConfig,
      },
      recentActions: recentActions?.slice(0, 10) || [],
    });
  } catch (error) {
    console.error('Erreur récupération statut agents:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai-agents/status
 * Met à jour la configuration d'un agent (pause/resume)
 */
export async function PATCH(request: Request) {
  try {
    const supabase = createClient();

    // Vérifier l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier le rôle admin
    const { data: profile } = (await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()) as { data: { role: string } | null };

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { agentName, enabled, autonomyLevel } = body;

    if (!agentName || !['landing', 'app'].includes(agentName)) {
      return NextResponse.json(
        { error: 'Agent invalide' },
        { status: 400 }
      );
    }

    // Mettre à jour la configuration
    const updateData: any = { updated_at: new Date().toISOString() };
    if (typeof enabled === 'boolean') updateData.enabled = enabled;
    if (autonomyLevel) updateData.autonomy_level = autonomyLevel;

    const { data, error } = await supabase
      .from('ai_agent_configs')
      .update(updateData)
      .eq('agent_name', agentName)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      config: data,
    });
  } catch (error) {
    console.error('Erreur mise à jour config agent:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour calculer les stats
function calculateAgentStats(actions: any[]) {
  const totalActions = actions.length;
  const approvedActions = actions.filter((a) => a.approved).length;
  const pendingApprovals = actions.filter((a) => !a.approved).length;
  const successRate =
    totalActions > 0 ? (approvedActions / totalActions) * 100 : 0;

  const lastAction = actions[0]?.created_at || null;

  const recentChanges = actions.slice(0, 5).map((a) => ({
    type: a.action_type,
    files: a.files_modified,
    impact: a.description,
    timestamp: a.created_at,
    approved: a.approved,
  }));

  return {
    lastAction,
    totalActions,
    successRate: Math.round(successRate * 10) / 10,
    pendingApprovals,
    recentChanges,
  };
}
