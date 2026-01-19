import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withErrorHandler } from '@/lib/errors';

/**
 * GET /api/metrics/admin - Métriques globales pour le dashboard admin
 * Retourne les statistiques de toute la plateforme
 * ATTENTION: Route réservée aux administrateurs
 */
async function getHandler(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Vérifier si l'utilisateur est admin
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: any | null };

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  // Récupérer toutes les entreprises
  const { data: companies } = await (supabase as any)
    .from('companies')
    .select('id, name, created_at, subscription_plan, subscription_status') as { data: any[] | null };

  const totalCompanies = companies?.length || 0;
  const activeCompanies = companies?.filter(c => c.subscription_status === 'active').length || 0;
  const freeCompanies = companies?.filter(c => !c.subscription_plan || c.subscription_plan === 'free').length || 0;
  const proCompanies = companies?.filter(c => c.subscription_plan === 'pro').length || 0;
  const businessCompanies = companies?.filter(c => c.subscription_plan === 'business').length || 0;

  // Récupérer tous les appels d'offres
  const { data: tenders } = await (supabase as any)
    .from('tenders')
    .select('id, status, type, estimated_value, created_at, sector, country, company_id') as { data: any[] | null };

  const totalTenders = tenders?.length || 0;
  const wonTenders = tenders?.filter(t => t.status === 'WON').length || 0;
  const lostTenders = tenders?.filter(t => t.status === 'LOST').length || 0;
  const submittedTenders = tenders?.filter(t => t.status === 'SUBMITTED').length || 0;
  const inProgressTenders = tenders?.filter(t => ['DRAFT', 'ANALYSIS', 'IN_PROGRESS', 'REVIEW'].includes(t.status)).length || 0;

  // Chiffre d'affaires estimé (appels d'offres gagnés)
  const totalRevenue = tenders?.filter(t => t.status === 'WON').reduce((sum, t) => sum + (t.estimated_value || 0), 0) || 0;
  
  // CA potentiel (en cours + soumis)
  const potentialRevenue = tenders
    ?.filter(t => ['SUBMITTED', 'IN_PROGRESS', 'REVIEW'].includes(t.status))
    .reduce((sum, t) => sum + (t.estimated_value || 0), 0) || 0;

  // Taux de conversion global
  const totalSubmitted = submittedTenders + wonTenders + lostTenders;
  const conversionRate = totalSubmitted > 0 ? Math.round((wonTenders / totalSubmitted) * 100) : 0;

  // Répartition par secteur (top 5)
  const sectorMap = new Map<string, number>();
  tenders?.forEach(t => {
    if (t.sector) {
      sectorMap.set(t.sector, (sectorMap.get(t.sector) || 0) + 1);
    }
  });
  const topSectors = Array.from(sectorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Répartition par pays (top 5)
  const countryMap = new Map<string, number>();
  tenders?.forEach(t => {
    if (t.country) {
      countryMap.set(t.country, (countryMap.get(t.country) || 0) + 1);
    }
  });
  const topCountries = Array.from(countryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, count]) => ({ code, count }));

  // Tendances mensuelles (6 derniers mois)
  const monthlyStats = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const monthTenders = tenders?.filter(t => {
      const created = new Date(t.created_at);
      return created >= monthStart && created <= monthEnd;
    });
    
    const monthCompanies = companies?.filter(c => {
      const created = new Date(c.created_at);
      return created >= monthStart && created <= monthEnd;
    });

    monthlyStats.push({
      month: monthStart.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      tenders: monthTenders?.length || 0,
      companies: monthCompanies?.length || 0,
      revenue: monthTenders?.filter(t => t.status === 'WON').reduce((sum, t) => sum + (t.estimated_value || 0), 0) || 0,
    });
  }

  // Entreprises les plus actives (top 10)
  const companyTenderCount = new Map<string, { companyId: string; count: number; revenue: number }>();
  tenders?.forEach(t => {
    if (t.company_id) {
      const existing = companyTenderCount.get(t.company_id) || { companyId: t.company_id, count: 0, revenue: 0 };
      existing.count++;
      if (t.status === 'WON') {
        existing.revenue += t.estimated_value || 0;
      }
      companyTenderCount.set(t.company_id, existing);
    }
  });
  
  const topCompaniesIds = Array.from(companyTenderCount.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(c => c.companyId);

  const { data: topCompaniesDetails } = await (supabase as any)
    .from('companies')
    .select('id, name, subscription_plan')
    .in('id', topCompaniesIds) as { data: any[] | null };

  const topCompanies = topCompaniesIds.map(id => {
    const company = topCompaniesDetails?.find(c => c.id === id);
    const stats = companyTenderCount.get(id)!;
    return {
      id,
      name: company?.name || 'Unknown',
      plan: company?.subscription_plan || 'free',
      tendersCount: stats.count,
      revenue: stats.revenue,
    };
  });

  // MRR (Monthly Recurring Revenue) - estimé
  const mrr = (proCompanies * 49) + (businessCompanies * 149);
  const arr = mrr * 12; // Annual Recurring Revenue

  return NextResponse.json({
    overview: {
      totalCompanies,
      activeCompanies,
      totalTenders,
      wonTenders,
      lostTenders,
      submittedTenders,
      inProgressTenders,
      conversionRate,
      totalRevenue,
      potentialRevenue,
      mrr,
      arr,
    },
    subscriptions: {
      free: freeCompanies,
      pro: proCompanies,
      business: businessCompanies,
    },
    topSectors,
    topCountries,
    monthlyStats,
    topCompanies,
  });
}

export const GET = withErrorHandler(getHandler as any);
