import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Type pour les tenders
interface Tender {
  id: string;
  created_at: string;
  status: string;
  type?: string;
  category?: string;
  estimated_value?: number;
  client_name?: string;
  submitted_at?: string;
  user_id: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('end') || new Date().toISOString();

    // Calculer la période précédente (même durée)
    const duration = new Date(endDate).getTime() - new Date(startDate).getTime();
    const previousStart = new Date(new Date(startDate).getTime() - duration).toISOString();
    const previousEnd = startDate;

    // Récupérer les données de la période actuelle
    const { data: currentTenders, error: tendersError } = await supabase
      .from('tenders')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('user_id', user.id) as { data: Tender[] | null; error: any };

    if (tendersError) throw tendersError;

    // Récupérer les données de la période précédente
    const { data: previousTenders } = await supabase
      .from('tenders')
      .select('*')
      .gte('created_at', previousStart)
      .lte('created_at', previousEnd)
      .eq('user_id', user.id) as { data: Tender[] | null; error: any };

    // Calculer les métriques
    const calculateMetrics = (tenders: Tender[]) => {
      const total = tenders.length;
      const won = tenders.filter(t => t.status === 'won').length;
      const lost = tenders.filter(t => t.status === 'lost').length;
      const pending = tenders.filter(t => t.status === 'pending' || t.status === 'draft').length;
      const revenue = tenders
        .filter(t => t.status === 'won')
        .reduce((sum, t) => sum + (t.estimated_value || 0), 0);
      const avgDealSize = won > 0 ? revenue / won : 0;
      const winRate = total > 0 ? (won / (won + lost)) * 100 : 0;

      // Temps de réponse moyen (jours entre création et soumission)
      const responseTimes = tenders
        .filter((t): t is Tender & { submitted_at: string } => !!t.submitted_at)
        .map(t => {
          const created = new Date(t.created_at).getTime();
          const submitted = new Date(t.submitted_at).getTime();
          return (submitted - created) / (1000 * 60 * 60 * 24);
        });
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;

      return {
        totalTenders: total,
        wonTenders: won,
        lostTenders: lost,
        pendingTenders: pending,
        totalRevenue: revenue,
        avgDealSize,
        winRate,
        avgResponseTime,
      };
    };

    const currentMetrics = calculateMetrics(currentTenders || []);
    const previousMetrics = calculateMetrics(previousTenders || []);

    // Générer les tendances (grouper par jour/semaine/mois selon la période)
    const generateTrends = (tenders: Tender[], start: string, end: string) => {
      const startD = new Date(start);
      const endD = new Date(end);
      const days = Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));
      
      const trends: { date: string; tenders: number; won: number; revenue: number }[] = [];
      
      // Grouper par semaine si période > 60 jours, sinon par jour
      const interval = days > 60 ? 7 : 1;
      
      for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + interval)) {
        const nextD = new Date(d);
        nextD.setDate(nextD.getDate() + interval);
        
        const periodTenders = tenders.filter(t => {
          const created = new Date(t.created_at);
          return created >= d && created < nextD;
        });
        
        trends.push({
          date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
          tenders: periodTenders.length,
          won: periodTenders.filter(t => t.status === 'won').length,
          revenue: periodTenders
            .filter(t => t.status === 'won')
            .reduce((sum, t) => sum + (t.estimated_value || 0), 0),
        });
      }
      
      return trends;
    };

    // Répartition par catégorie/type
    const byCategory = (currentTenders || []).reduce((acc: any[], tender) => {
      const category = tender.category || tender.type || 'Autre';
      const existing = acc.find(c => c.category === category);
      if (existing) {
        existing.count++;
        if (tender.status === 'won') existing.won++;
        existing.value += tender.estimated_value || 0;
      } else {
        acc.push({
          category,
          count: 1,
          won: tender.status === 'won' ? 1 : 0,
          value: tender.estimated_value || 0,
        });
      }
      return acc;
    }, []).sort((a, b) => b.count - a.count).slice(0, 6);

    // Répartition par type
    const typeMap: Record<string, number> = {};
    (currentTenders || []).forEach(tender => {
      const type = tender.type || 'Autre';
      typeMap[type] = (typeMap[type] || 0) + 1;
    });
    const total = currentTenders?.length || 1;
    const byType = Object.entries(typeMap).map(([type, count]) => ({
      type: type === 'public' ? 'Public' : type === 'private' ? 'Privé' : type,
      count,
      percentage: Math.round((count / total) * 100),
    }));

    // Entonnoir de conversion
    const conversionFunnel = [
      { 
        stage: 'Appels identifiés', 
        count: currentTenders?.length || 0, 
        rate: 100 
      },
      { 
        stage: 'Dossiers commencés', 
        count: (currentTenders || []).filter(t => t.status !== 'identified').length,
        rate: total > 0 ? ((currentTenders || []).filter(t => t.status !== 'identified').length / total) * 100 : 0
      },
      { 
        stage: 'Soumis', 
        count: (currentTenders || []).filter(t => t.submitted_at).length,
        rate: total > 0 ? ((currentTenders || []).filter(t => t.submitted_at).length / total) * 100 : 0
      },
      { 
        stage: 'Gagnés', 
        count: currentMetrics.wonTenders,
        rate: total > 0 ? (currentMetrics.wonTenders / total) * 100 : 0
      },
    ];

    // Top clients (regrouper par client_name)
    const clientMap: Record<string, { tenders: number; value: number; won: number }> = {};
    (currentTenders || []).forEach(tender => {
      const client = tender.client_name || 'Client inconnu';
      if (!clientMap[client]) {
        clientMap[client] = { tenders: 0, value: 0, won: 0 };
      }
      clientMap[client].tenders++;
      clientMap[client].value += tender.estimated_value || 0;
      if (tender.status === 'won') clientMap[client].won++;
    });
    const topClients = Object.entries(clientMap)
      .map(([name, data]) => ({
        name,
        tenders: data.tenders,
        value: data.value,
        winRate: data.tenders > 0 ? (data.won / data.tenders) * 100 : 0,
      }))
      .sort((a, b) => b.tenders - a.tenders)
      .slice(0, 5);

    return NextResponse.json({
      current: {
        overview: currentMetrics,
        trends: generateTrends(currentTenders || [], startDate, endDate),
        byCategory,
        byRegion: [], // À implémenter selon le schéma
        byType,
        topClients,
        teamPerformance: [], // À implémenter si équipe
        conversionFunnel,
      },
      previous: {
        overview: previousMetrics,
        trends: generateTrends(previousTenders || [], previousStart, previousEnd),
        byCategory: [],
        byRegion: [],
        byType: [],
        topClients: [],
        teamPerformance: [],
        conversionFunnel: [],
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des analytics' },
      { status: 500 }
    );
  }
}
