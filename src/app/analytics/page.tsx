'use client';

import { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { 
  Card, 
  CardContent,
  Button, 
  Badge,
  Skeleton,
} from '@/components/ui';
import { NewAppLayout as AppLayout, PageHeader } from '@/components/layout/NewAppLayout';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Trophy,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Filter,
  ChevronDown,
  Euro,
  FileText,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

// Recharts components for data visualization
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

// Types
interface AnalyticsData {
  overview: {
    totalTenders: number;
    tendersThisMonth: number;
    tendersChange: number;
    wonTenders: number;
    wonThisMonth: number;
    wonChange: number;
    totalRevenue: number;
    revenueThisMonth: number;
    revenueChange: number;
    winRate: number;
    winRateChange: number;
  };
  byStatus: {
    status: 'won' | 'lost' | 'in_progress' | 'draft';
    count: number;
    value: number;
  }[];
  bySector: {
    sector: string;
    total: number;
    won: number;
    winRate: number;
  }[];
  winnerAnalysis: {
    id: string;
    tender_title: string;
    winner_name: string;
    winning_price: number;
    your_price?: number;
    price_gap?: number;
    sector: string;
    buyer: string;
    award_date: string;
  }[];
  monthlyTrend: {
    month: string;
    submitted: number;
    won: number;
    revenue: number;
  }[];
  recommendations: {
    type: 'success' | 'warning' | 'info';
    titleKey: string;
    descriptionKey: string;
    descriptionParams?: Record<string, string | number>;
  }[];
}

// Données initiales vides (données réelles)
const EMPTY_DATA: AnalyticsData = {
  overview: {
    totalTenders: 0,
    tendersThisMonth: 0,
    tendersChange: 0,
    wonTenders: 0,
    wonThisMonth: 0,
    wonChange: 0,
    totalRevenue: 0,
    revenueThisMonth: 0,
    revenueChange: 0,
    winRate: 0,
    winRateChange: 0,
  },
  byStatus: [],
  bySector: [],
  winnerAnalysis: [],
  monthlyTrend: [],
  recommendations: [],
};

// Composant carte statistique
function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  prefix = '', 
  suffix = '',
  locale,
}: { 
  title: string; 
  value: number | string; 
  change?: number; 
  icon: any; 
  prefix?: string;
  suffix?: string;
  locale: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">
              {prefix}{typeof value === 'number' ? value.toLocaleString(locale) : value}{suffix}
            </p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {change >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span>{Math.abs(change)}%</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-primary-100 rounded-xl">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant barre de progression
function ProgressBar({ value, max, color = 'primary' }: { value: number; max: number; color?: string }) {
  const percentage = (value / max) * 100;
  const colorClasses: Record<string, string> = {
    primary: 'bg-primary-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// Page principale
export default function AnalyticsPage() {
  const { locale } = useLocale();
  const entries = useMemo(
    () => ({
      'analytics.title': 'Statistiques',
      'analytics.subtitle': 'Suivez vos performances et améliorez votre taux de réussite',
      'analytics.period.3m': '3 derniers mois',
      'analytics.period.6m': '6 derniers mois',
      'analytics.period.12m': '12 derniers mois',
      'analytics.period.all': 'Tout',
      'analytics.export': 'Exporter',

      'analytics.stat.totalSubmitted': "AO soumis au total",
      'analytics.stat.won': 'AO gagnés',
      'analytics.stat.revenue': 'Chiffre d\'affaires',
      'analytics.stat.winRate': 'Taux de réussite',

      'analytics.section.statusDistribution': 'Répartition par statut',
      'analytics.section.monthlyRevenue': 'Revenus mensuels',
      'analytics.section.sectorPerformance': 'Performance par secteur',
      'analytics.section.monthlyTrend': 'Tendance mensuelle',
      'analytics.section.aiRecommendations': 'Recommandations IA',
      'analytics.section.recentWinners': 'Analyse des attributaires',
      'analytics.section.recentWinners.subtitle': 'Comparez vos prix avec les gagnants pour optimiser vos futures offres',

      'analytics.chart.monthlyTrend': 'Tendance mensuelle (Interactif)',
      'analytics.chart.submitted': 'Soumis',
      'analytics.chart.won': 'Gagnés',
      'analytics.chart.revenue': 'CA',

      'analytics.status.won': 'Gagnés',
      'analytics.status.lost': 'Perdus',
      'analytics.status.in_progress': 'En cours',
      'analytics.status.draft': 'Brouillons',

      'analytics.tooltip.statusCount': '{status}: {count}',
      'analytics.tooltip.submittedCount': '{count} soumis',
      'analytics.tooltip.wonCount': '{count} gagné(s)',
      'analytics.sector.wonOfTotal': '{won}/{total} gagnés',

      'analytics.badge.poweredByAi': 'Propulsé par l\'IA',
      'analytics.you': 'Vous',
      'analytics.result.won': 'Gagné',

      'analytics.table.tender': 'Appel d\'offres',
      'analytics.table.winner': 'Attributaire',
      'analytics.table.winningPrice': 'Prix gagnant',
      'analytics.table.yourPrice': 'Votre prix',
      'analytics.table.gap': 'Écart',
      'analytics.table.date': 'Date',

      'analytics.reco.keepGoing.title': 'Continuez ainsi !',
      'analytics.reco.keepGoing.description.withWinRate': 'Vous avez {total} AO en cours. Votre taux de réussite est de {winRate}%.',
      'analytics.reco.keepGoing.description.goodLuck': 'Vous avez {total} AO en cours. Bonne chance pour vos candidatures !',

      'analytics.empty.title': 'Pas encore de données',
      'analytics.empty.description': "Créez vos premiers appels d'offres pour voir les statistiques ici.",
    }),
    []
  );
  const { t } = useUiTranslations(locale, entries);
  const [data, setData] = useState<AnalyticsData>(EMPTY_DATA);
  const [period, setPeriod] = useState('12m');
  const [loading, setLoading] = useState(true);

  // Charger les données réelles depuis Supabase
  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Récupérer le company_id
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (!profile?.company_id) {
          setLoading(false);
          return;
        }

        // Charger tous les tenders de l'entreprise
        const { data: tenders } = await (supabase as any)
          .from('tenders')
          .select('*')
          .eq('company_id', profile.company_id);

        if (!tenders || tenders.length === 0) {
          setLoading(false);
          return;
        }

        // Calculer les statistiques
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const totalTenders = tenders.length;
        const tendersThisMonth = tenders.filter((t: any) => new Date(t.created_at) >= startOfMonth).length;
        const tendersLastMonth = tenders.filter((t: any) => {
          const d = new Date(t.created_at);
          return d >= startOfLastMonth && d < startOfMonth;
        }).length;

        const wonTenders = tenders.filter((t: any) => t.status === 'won').length;
        const lostTenders = tenders.filter((t: any) => t.status === 'lost').length;
        const totalRevenue = tenders
          .filter((t: any) => t.status === 'won')
          .reduce((sum: number, t: any) => sum + (t.estimated_value || 0), 0);

        const winRate = (wonTenders + lostTenders) > 0 
          ? Math.round((wonTenders / (wonTenders + lostTenders)) * 1000) / 10 
          : 0;

        // Calculer les changements
        const tendersChange = tendersLastMonth > 0 
          ? Math.round(((tendersThisMonth - tendersLastMonth) / tendersLastMonth) * 100) 
          : 0;

        // Stats par statut
        const byStatus = [
          { status: 'won' as const, count: wonTenders, value: totalRevenue },
          { status: 'lost' as const, count: lostTenders, value: 0 },
          { status: 'in_progress' as const, count: tenders.filter((t: any) => ['draft', 'in_progress', 'submitted'].includes(t.status)).length, value: 0 },
        ].filter(s => s.count > 0);

        // Tendance mensuelle (12 derniers mois)
        const monthlyTrend = [];
        const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'short' });
        for (let i = 11; i >= 0; i--) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
          const monthTenders = tenders.filter((t: any) => {
            const d = new Date(t.created_at);
            return d >= monthDate && d < nextMonth;
          });
          const monthWon = monthTenders.filter((t: any) => t.status === 'won');
          monthlyTrend.push({
            month: monthFormatter.format(monthDate),
            submitted: monthTenders.length,
            won: monthWon.length,
            revenue: monthWon.reduce((sum: number, t: any) => sum + (t.estimated_value || 0), 0),
          });
        }

        setData({
          overview: {
            totalTenders,
            tendersThisMonth,
            tendersChange,
            wonTenders,
            wonThisMonth: tenders.filter((t: any) => t.status === 'won' && new Date(t.updated_at) >= startOfMonth).length,
            wonChange: 0,
            totalRevenue,
            revenueThisMonth: 0,
            revenueChange: 0,
            winRate,
            winRateChange: 0,
          },
          byStatus,
          bySector: [],
          winnerAnalysis: [],
          monthlyTrend,
          recommendations: totalTenders === 0 ? [] : [
            {
              type: 'info',
              titleKey: 'analytics.reco.keepGoing.title',
              descriptionKey:
                wonTenders > 0
                  ? 'analytics.reco.keepGoing.description.withWinRate'
                  : 'analytics.reco.keepGoing.description.goodLuck',
              descriptionParams: {
                total: totalTenders,
                winRate,
              },
            },
          ],
        });
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [locale, period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calcul du max pour le graphique
  const maxMonthlyValue = Math.max(...data.monthlyTrend.map(m => m.submitted));

  return (
    <AppLayout>
      <PageHeader
        title={t('analytics.title')}
        description={t('analytics.subtitle')}
        actions={
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              className="px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="3m">{t('analytics.period.3m')}</option>
              <option value="6m">{t('analytics.period.6m')}</option>
              <option value="12m">{t('analytics.period.12m')}</option>
              <option value="all">{t('analytics.period.all')}</option>
            </select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              {t('analytics.export')}
            </Button>
          </div>
        }
      />

      <div className="px-4 sm:px-6 pb-6 space-y-6">
        {/* Cartes principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t('analytics.stat.totalSubmitted')}
            value={data.overview.totalTenders}
            change={data.overview.tendersChange}
            icon={FileText}
            locale={locale}
          />
          <StatCard
            title={t('analytics.stat.won')}
            value={data.overview.wonTenders}
            change={data.overview.wonChange}
            icon={Trophy}
            locale={locale}
          />
          <StatCard
            title={t('analytics.stat.revenue')}
            value={formatCurrency(data.overview.totalRevenue)}
            change={data.overview.revenueChange}
            icon={Euro}
            locale={locale}
          />
          <StatCard
            title={t('analytics.stat.winRate')}
            value={data.overview.winRate}
            suffix="%"
            change={data.overview.winRateChange}
            icon={Target}
            locale={locale}
          />
        </div>

        {/* Graphiques Recharts améliorés */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tendance mensuelle avec Recharts */}
          <Card className="col-span-1 lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900">{t('analytics.chart.monthlyTrend')}</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm text-gray-500">{t('analytics.chart.submitted')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-500">{t('analytics.chart.won')}</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.monthlyTrend}>
                  <defs>
                    <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="submitted" 
                    stroke="#3B82F6" 
                    fillOpacity={1}
                    fill="url(#colorSubmitted)"
                    name={t('analytics.chart.submitted')}
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="won" 
                    stroke="#10B981" 
                    fillOpacity={1}
                    fill="url(#colorWon)"
                    name={t('analytics.chart.won')}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribution par statut avec PieChart */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-6">{t('analytics.section.statusDistribution')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={data.byStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) =>
                      t('analytics.tooltip.statusCount', {
                        status: t(`analytics.status.${status}`),
                        count,
                      })
                    }
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.byStatus.map((entry, index) => {
                      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px' 
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Nouveaux graphiques: Revenus et Performance par secteur */}
        <div className="grid grid-cols-2 gap-6">
          {/* Revenus mensuels */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-6">{t('analytics.section.monthlyRevenue')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={data.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                    formatter={(value: number) => [formatCurrency(value), t('analytics.chart.revenue')]}
                  />
                  <Bar dataKey="revenue" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Taux de réussite par secteur */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-6">{t('analytics.section.sectorPerformance')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={data.bySector} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" domain={[0, 100]} stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis dataKey="sector" type="category" width={130} stroke="#6B7280" style={{ fontSize: '11px' }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, t('analytics.stat.winRate')]}
                  />
                  <Bar dataKey="winRate" fill="#10B981" radius={[0, 8, 8, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Anciens graphiques barres (conservés pour compatibilité) */}
        <div className="grid grid-cols-2 gap-6">
          {/* Tendance mensuelle */}
          <Card className="col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900">{t('analytics.section.monthlyTrend')}</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary-500" />
                    <span className="text-sm text-gray-500">{t('analytics.chart.submitted')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-500">{t('analytics.chart.won')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-end gap-2 h-48">
                {data.monthlyTrend.map((month) => (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-1 justify-center" style={{ height: '160px' }}>
                      <div 
                        className="w-4 bg-primary-200 rounded-t transition-all duration-300 hover:bg-primary-300"
                        style={{ height: `${(month.submitted / maxMonthlyValue) * 100}%`, marginTop: 'auto' }}
                        title={t('analytics.tooltip.submittedCount', { count: month.submitted })}
                      />
                      <div 
                        className="w-4 bg-green-400 rounded-t transition-all duration-300 hover:bg-green-500"
                        style={{ height: `${(month.won / maxMonthlyValue) * 100}%`, marginTop: 'auto' }}
                        title={t('analytics.tooltip.wonCount', { count: month.won })}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{month.month}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Répartition par statut */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-6">{t('analytics.section.statusDistribution')}</h3>
              <div className="space-y-4">
                {data.byStatus.map((item) => {
                  const total = data.byStatus.reduce((acc, s) => acc + s.count, 0);
                  const percentage = ((item.count / total) * 100).toFixed(1);
                  const colorMap: Record<string, string> = {
                    won: 'green',
                    lost: 'red',
                    in_progress: 'primary',
                    draft: 'yellow',
                  };
                  return (
                    <div key={item.status}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">{t(`analytics.status.${item.status}`)}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {item.count} ({percentage}%)
                        </span>
                      </div>
                      <ProgressBar value={item.count} max={total} color={colorMap[item.status] || 'primary'} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance par secteur et Analyse des gagnants */}
        <div className="grid grid-cols-2 gap-6">
          {/* Performance par secteur */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-6">{t('analytics.section.sectorPerformance')}</h3>
              <div className="space-y-4">
                {data.bySector.map((sector) => (
                  <div key={sector.sector} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{sector.sector}</span>
                        <span className="text-sm text-gray-500">
                          {t('analytics.sector.wonOfTotal', { won: sector.won, total: sector.total })}
                        </span>
                      </div>
                      <ProgressBar 
                        value={sector.winRate} 
                        max={100} 
                        color={sector.winRate >= 30 ? 'green' : sector.winRate >= 20 ? 'yellow' : 'red'} 
                      />
                    </div>
                    <span className={`text-sm font-semibold ${
                      sector.winRate >= 30 ? 'text-green-600' : 
                      sector.winRate >= 20 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {sector.winRate}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommandations IA */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold text-gray-900">{t('analytics.section.aiRecommendations')}</h3>
              </div>
              <div className="space-y-4">
                {data.recommendations.map((rec, index) => {
                  const iconMap = {
                    success: CheckCircle2,
                    warning: AlertTriangle,
                    info: Sparkles,
                  };
                  const colorMap = {
                    success: 'text-green-500 bg-green-50',
                    warning: 'text-yellow-500 bg-yellow-50',
                    info: 'text-blue-500 bg-blue-50',
                  };
                  const Icon = iconMap[rec.type];
                  return (
                    <div key={index} className={`p-4 rounded-xl ${colorMap[rec.type].split(' ')[1]}`}>
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${colorMap[rec.type].split(' ')[0]}`} />
                        <div>
                          <p className="font-medium text-gray-900">{t(rec.titleKey)}</p>
                          <p className="text-sm text-gray-600 mt-1">{t(rec.descriptionKey, rec.descriptionParams)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analyse des attributaires */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-900">{t('analytics.section.recentWinners')}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {t('analytics.section.recentWinners.subtitle')}
                </p>
              </div>
              <Badge variant="info">
                <Sparkles className="w-3 h-3 mr-1" />
                {t('analytics.badge.poweredByAi')}
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('analytics.table.tender')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('analytics.table.winner')}</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">{t('analytics.table.winningPrice')}</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">{t('analytics.table.yourPrice')}</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">{t('analytics.table.gap')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('analytics.table.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.winnerAnalysis.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900 text-sm">{item.tender_title}</p>
                        <p className="text-xs text-gray-500">{item.buyer}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-900">{item.winner_name}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(item.winning_price)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-600">
                        {item.your_price ? formatCurrency(item.your_price) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.price_gap !== undefined ? (
                          <span className={`text-sm font-medium ${
                            item.price_gap > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.price_gap > 0 ? '+' : ''}{item.price_gap.toFixed(1)}%
                          </span>
                        ) : (
                          <Badge variant="success" className="text-xs">{t('analytics.result.won')}</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(item.award_date).toLocaleDateString(locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
