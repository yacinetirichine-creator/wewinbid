import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withErrorHandler } from '@/lib/errors';

/**
 * GET /api/metrics/client - Métriques pour le dashboard client
 * Retourne les statistiques de l'entreprise de l'utilisateur
 */
async function getHandler(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: 'No company associated' }, { status: 400 });
  }

  // Récupérer tous les appels d'offres
  const { data: tenders } = await supabase
    .from('tenders')
    .select(`
      id,
      title,
      reference,
      status,
      type,
      estimated_value,
      deadline,
      created_at,
      buyer:buyers(name)
    `)
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false }) as { data: any[] | null };

  // Calculer les métriques
  const totalTenders = tenders?.length || 0;
  const submittedTenders = tenders?.filter(t => ['SUBMITTED', 'WON', 'LOST'].includes(t.status)).length || 0;
  const wonTenders = tenders?.filter(t => t.status === 'WON').length || 0;
  const lostTenders = tenders?.filter(t => t.status === 'LOST').length || 0;
  const inProgressTenders = tenders?.filter(t => ['DRAFT', 'ANALYSIS', 'IN_PROGRESS', 'REVIEW'].includes(t.status)).length || 0;
  
  // Taux de conversion
  const conversionRate = submittedTenders > 0 ? Math.round((wonTenders / submittedTenders) * 100) : 0;
  
  // Valeur totale estimée
  const totalValue = tenders?.reduce((sum, t) => sum + (t.estimated_value || 0), 0) || 0;
  const wonValue = tenders?.filter(t => t.status === 'WON').reduce((sum, t) => sum + (t.estimated_value || 0), 0) || 0;
  
  // Clients uniques (buyers)
  const uniqueBuyers = new Set(tenders?.map(t => t.buyer?.name).filter(Boolean));
  const totalClients = uniqueBuyers.size;
  
  // Deadlines à venir (prochains 30 jours)
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingDeadlines = tenders?.filter(t => {
    if (!t.deadline || ['WON', 'LOST', 'ABANDONED'].includes(t.status)) return false;
    const deadline = new Date(t.deadline);
    return deadline >= now && deadline <= in30Days;
  }).length || 0;
  
  // Appels d'offres urgents (< 7 jours)
  const urgentTenders = tenders?.filter(t => {
    if (!t.deadline || ['WON', 'LOST', 'ABANDONED'].includes(t.status)) return false;
    const deadline = new Date(t.deadline);
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 7;
  }).length || 0;

  // Répartition par statut
  const statusDistribution = {
    draft: tenders?.filter(t => t.status === 'DRAFT').length || 0,
    analysis: tenders?.filter(t => t.status === 'ANALYSIS').length || 0,
    inProgress: tenders?.filter(t => t.status === 'IN_PROGRESS').length || 0,
    review: tenders?.filter(t => t.status === 'REVIEW').length || 0,
    submitted: tenders?.filter(t => t.status === 'SUBMITTED').length || 0,
    won: wonTenders,
    lost: lostTenders,
    abandoned: tenders?.filter(t => t.status === 'ABANDONED').length || 0,
  };

  // Tendances (comparaison avec le mois précédent)
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const tendersLastMonth = tenders?.filter(t => new Date(t.created_at) >= lastMonth).length || 0;
  const tendersPreviousMonth = tenders?.filter(t => {
    const created = new Date(t.created_at);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    return created >= twoMonthsAgo && created < lastMonth;
  }).length || 0;
  
  const tendersGrowth = tendersPreviousMonth > 0 
    ? Math.round(((tendersLastMonth - tendersPreviousMonth) / tendersPreviousMonth) * 100)
    : 0;

  // Appels d'offres récents (top 5)
  const recentTenders = tenders?.slice(0, 5).map(t => ({
    id: t.id,
    title: t.title,
    reference: t.reference,
    status: t.status,
    buyer_name: t.buyer?.name,
    deadline: t.deadline,
    estimated_value: t.estimated_value,
    created_at: t.created_at,
  })) || [];

  return NextResponse.json({
    overview: {
      totalTenders,
      submittedTenders,
      wonTenders,
      lostTenders,
      inProgressTenders,
      conversionRate,
      totalValue,
      wonValue,
      totalClients,
      upcomingDeadlines,
      urgentTenders,
    },
    statusDistribution,
    trends: {
      tendersGrowth,
      tendersLastMonth,
    },
    recentTenders,
  });
}

export const GET = withErrorHandler(getHandler);
