'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  FileText,
  Euro,
  Target,
  Trophy,
  Clock,
  Users,
  PieChart,
  Activity,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button, Badge, Progress } from '@/components/ui';
import {
  HorizontalBarChart,
  DonutChart,
  TrendChart,
  MetricsGrid,
  LeaderboardWidget,
  ComparisonWidget,
} from '@/components/dashboard/AnalyticsCharts';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

// Types
interface DateRange {
  start: Date;
  end: Date;
  labelKey: string;
}

interface AnalyticsData {
  overview: {
    totalTenders: number;
    wonTenders: number;
    lostTenders: number;
    pendingTenders: number;
    totalRevenue: number;
    avgDealSize: number;
    winRate: number;
    avgResponseTime: number;
  };
  trends: {
    date: string;
    tenders: number;
    won: number;
    revenue: number;
  }[];
  byCategory: {
    category: string;
    count: number;
    won: number;
    value: number;
  }[];
  byRegion: {
    region: string;
    count: number;
    won: number;
  }[];
  byType: {
    type: string;
    count: number;
    percentage: number;
  }[];
  topClients: {
    name: string;
    tenders: number;
    value: number;
    winRate: number;
  }[];
  teamPerformance: {
    member: string;
    avatar?: string;
    tendersHandled: number;
    won: number;
    avgScore: number;
  }[];
  conversionFunnel: {
    stage: string;
    count: number;
    rate: number;
  }[];
}

interface AnalyticsReportProps {
  organizationId?: string;
  className?: string;
}

// Périodes prédéfinies
const DATE_RANGES: DateRange[] = [
  {
    labelKey: 'analyticsReport.range.7d',
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
  {
    labelKey: 'analyticsReport.range.30d',
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
  {
    labelKey: 'analyticsReport.range.90d',
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
  {
    labelKey: 'analyticsReport.range.thisYear',
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(),
  },
  {
    labelKey: 'analyticsReport.range.lastYear',
    start: new Date(new Date().getFullYear() - 1, 0, 1),
    end: new Date(new Date().getFullYear() - 1, 11, 31),
  },
];

/**
 * Sélecteur de période
 */
function DateRangePicker({
  value,
  onChange,
  className,
  t,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors"
      >
        <Calendar className="w-4 h-4 text-surface-500" />
        <span className="text-sm font-medium text-surface-700">{t(value.labelKey)}</span>
        <ChevronDown className={cn('w-4 h-4 text-surface-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-1 right-0 z-50 bg-white border border-surface-200 rounded-lg shadow-lg py-1 min-w-[180px]">
            {DATE_RANGES.map((range) => (
              <button
                key={range.labelKey}
                onClick={() => {
                  onChange(range);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm hover:bg-surface-50 transition-colors',
                  value.labelKey === range.labelKey
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-surface-700'
                )}
              >
                {t(range.labelKey)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * KPI Card avec variation
 */
function KPICard({
  title,
  value,
  previousValue,
  format = 'number',
  icon: Icon,
  color = 'primary',
  locale,
  vsPreviousPeriodLabel,
  daysUnit,
}: {
  title: string;
  value: number;
  previousValue?: number;
  format?: 'number' | 'currency' | 'percent' | 'days';
  icon: React.ComponentType<{ className?: string }>;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  locale: string;
  vsPreviousPeriodLabel: string;
  daysUnit: string;
}) {
  const change = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;
  const isPositive = change >= 0;

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'percent':
        return `${val.toFixed(1)}%`;
      case 'days':
        return `${val.toFixed(0)} ${daysUnit}`;
      default:
        return val.toLocaleString(locale);
    }
  };

  const colorClasses = {
    primary: 'from-primary-500/20 to-primary-500/5 text-primary-600',
    success: 'from-green-500/20 to-green-500/5 text-green-600',
    warning: 'from-amber-500/20 to-amber-500/5 text-amber-600',
    danger: 'from-red-500/20 to-red-500/5 text-red-600',
  };

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-30`} />
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-surface-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-surface-900">{formatValue(value)}</p>
            {previousValue !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={cn('text-sm font-medium', isPositive ? 'text-green-600' : 'text-red-600')}>
                  {isPositive ? '+' : ''}{change.toFixed(1)}%
                </span>
                <span className="text-sm text-surface-400">{vsPreviousPeriodLabel}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Entonnoir de conversion
 */
function ConversionFunnel({
  data,
  className,
  title,
}: {
  data: AnalyticsData['conversionFunnel'];
  className?: string;
  title: string;
}) {
  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary-500" />
          <h3 className="font-semibold text-surface-900">{title}</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((stage, idx) => {
            const width = (stage.count / maxCount) * 100;
            const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-green-500'];

            return (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-surface-700">{stage.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-surface-900 font-semibold">{stage.count}</span>
                    {idx > 0 && (
                      <Badge variant={stage.rate >= 50 ? 'success' : stage.rate >= 25 ? 'warning' : 'danger'} size="sm">
                        {stage.rate.toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="h-8 bg-surface-100 rounded-lg overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                    className={cn('h-full rounded-lg', colors[idx % colors.length])}
                  />
                </div>
                {idx < data.length - 1 && (
                  <div className="flex justify-center my-1">
                    <ArrowRight className="w-4 h-4 text-surface-300 rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Rapport d'analytics complet
 */
export function AnalyticsReport({ organizationId, className }: AnalyticsReportProps) {
  const { locale } = useLocale();
  const entries = useMemo(
    () => ({
      'analyticsReport.title': 'Analytics dashboard',
      'analyticsReport.subtitle': 'Overview of your performance',
      'analyticsReport.refresh': 'Refresh',
      'analyticsReport.export': 'Export',

      'analyticsReport.kpi.tenders': 'Tenders',
      'analyticsReport.kpi.winRate': 'Win rate',
      'analyticsReport.kpi.revenue': 'Revenue',
      'analyticsReport.kpi.avgResponseTime': 'Average response time',
      'analyticsReport.kpi.vsPreviousPeriod': 'vs previous period',

      'analyticsReport.chart.performanceEvolution': 'Performance trend',
      'analyticsReport.chart.typeDistribution': 'Distribution by type',
      'analyticsReport.chart.typeDistribution.subtitle': 'Tender categories',
      'analyticsReport.chart.total': 'Total',

      'analyticsReport.section.conversionFunnel': 'Conversion funnel',
      'analyticsReport.section.topClients': 'Top clients',
      'analyticsReport.section.topClients.subtitle': 'By contract volume',
      'analyticsReport.section.topClients.valueLabel': 'Contracts',
      'analyticsReport.section.byCategory': 'By category',
      'analyticsReport.section.byCategory.subtitle': 'Number of responses',

      'analyticsReport.section.teamPerformance': 'Team performance',
      'analyticsReport.table.member': 'Member',
      'analyticsReport.table.casesHandled': 'Cases handled',
      'analyticsReport.table.won': 'Won',
      'analyticsReport.table.winRate': 'Win rate',
      'analyticsReport.table.avgScore': 'Average score',

      'analyticsReport.section.comparison': 'Comparison with previous period',
      'analyticsReport.comparison.tendersHandled': 'Tenders processed',
      'analyticsReport.comparison.wonDeals': 'Deals won',
      'analyticsReport.comparison.revenue': 'Revenue',
      'analyticsReport.comparison.winRate': 'Win rate',

      'analyticsReport.unit.daysShort': 'd',

      'analyticsReport.range.7d': 'Last 7 days',
      'analyticsReport.range.30d': 'Last 30 days',
      'analyticsReport.range.90d': 'Last 90 days',
      'analyticsReport.range.thisYear': 'This year',
      'analyticsReport.range.lastYear': 'Last year',
    }),
    []
  );
  const { t } = useUiTranslations(locale, entries);

  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES[1]); // 30 derniers jours
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [previousData, setPreviousData] = useState<AnalyticsData | null>(null);

  // Charger les données
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      });
      if (organizationId) params.set('organization', organizationId);

      const response = await fetch(`/api/analytics?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.current);
        setPreviousData(result.previous);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, organizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Exporter le rapport
  const exportReport = async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      const params = new URLSearchParams({
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
        format,
      });
      
      const response = await fetch(`/api/analytics/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${t(dateRange.labelKey).replace(/\s/g, '-')}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  if (loading || !data) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header avec contrôles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">{t('analyticsReport.title')}</h1>
          <p className="text-surface-500">{t('analyticsReport.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} t={t} />
          <Button variant="outline" onClick={() => loadData()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('analyticsReport.refresh')}
          </Button>
          <div className="relative group">
            <Button variant="primary">
              <Download className="w-4 h-4 mr-2" />
              {t('analyticsReport.export')}
            </Button>
            <div className="absolute top-full mt-1 right-0 z-50 bg-white border border-surface-200 rounded-lg shadow-lg py-1 min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={() => exportReport('pdf')}
                className="w-full px-4 py-2 text-left text-sm text-surface-700 hover:bg-surface-50"
              >
                PDF
              </button>
              <button
                onClick={() => exportReport('csv')}
                className="w-full px-4 py-2 text-left text-sm text-surface-700 hover:bg-surface-50"
              >
                CSV
              </button>
              <button
                onClick={() => exportReport('excel')}
                className="w-full px-4 py-2 text-left text-sm text-surface-700 hover:bg-surface-50"
              >
                Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('analyticsReport.kpi.tenders')}
          value={data.overview.totalTenders}
          previousValue={previousData?.overview.totalTenders}
          icon={FileText}
          color="primary"
          locale={locale}
          vsPreviousPeriodLabel={t('analyticsReport.kpi.vsPreviousPeriod')}
          daysUnit={t('analyticsReport.unit.daysShort')}
        />
        <KPICard
          title={t('analyticsReport.kpi.winRate')}
          value={data.overview.winRate}
          previousValue={previousData?.overview.winRate}
          format="percent"
          icon={Target}
          color="success"
          locale={locale}
          vsPreviousPeriodLabel={t('analyticsReport.kpi.vsPreviousPeriod')}
          daysUnit={t('analyticsReport.unit.daysShort')}
        />
        <KPICard
          title={t('analyticsReport.kpi.revenue')}
          value={data.overview.totalRevenue}
          previousValue={previousData?.overview.totalRevenue}
          format="currency"
          icon={Euro}
          color="primary"
          locale={locale}
          vsPreviousPeriodLabel={t('analyticsReport.kpi.vsPreviousPeriod')}
          daysUnit={t('analyticsReport.unit.daysShort')}
        />
        <KPICard
          title={t('analyticsReport.kpi.avgResponseTime')}
          value={data.overview.avgResponseTime}
          previousValue={previousData?.overview.avgResponseTime}
          format="days"
          icon={Clock}
          color="warning"
          locale={locale}
          vsPreviousPeriodLabel={t('analyticsReport.kpi.vsPreviousPeriod')}
          daysUnit={t('analyticsReport.unit.daysShort')}
        />
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendance temporelle */}
        <TrendChart
          title={t('analyticsReport.chart.performanceEvolution')}
          subtitle={t(dateRange.labelKey)}
          data={data.trends.map(t => ({ date: t.date, value: t.tenders }))}
          trend={data.overview.totalTenders > (previousData?.overview.totalTenders || 0) ? 'up' : 'down'}
          trendLabel={`${Math.abs(
            ((data.overview.totalTenders - (previousData?.overview.totalTenders || 0)) / 
            (previousData?.overview.totalTenders || 1)) * 100
          ).toFixed(1)}%`}
        />

        {/* Répartition par type */}
        <DonutChart
          title={t('analyticsReport.chart.typeDistribution')}
          subtitle={t('analyticsReport.chart.typeDistribution.subtitle')}
          data={data.byType.map(t => ({
            label: t.type,
            value: t.count,
          }))}
          centerValue={data.overview.totalTenders}
          centerLabel={t('analyticsReport.chart.total')}
        />
      </div>

      {/* Deuxième ligne de graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entonnoir de conversion */}
        <ConversionFunnel data={data.conversionFunnel} title={t('analyticsReport.section.conversionFunnel')} />

        {/* Top clients */}
        <LeaderboardWidget
          title={t('analyticsReport.section.topClients')}
          subtitle={t('analyticsReport.section.topClients.subtitle')}
          valueLabel={t('analyticsReport.section.topClients.valueLabel')}
          items={data.topClients.map((client, idx) => ({
            rank: idx + 1,
            name: client.name,
            value: client.tenders,
            change: client.winRate >= 50 ? 'up' : client.winRate >= 25 ? 'same' : 'down',
          }))}
        />

        {/* Performance par catégorie */}
        <HorizontalBarChart
          title={t('analyticsReport.section.byCategory')}
          subtitle={t('analyticsReport.section.byCategory.subtitle')}
          data={data.byCategory.map(c => ({
            label: c.category,
            value: c.count,
          }))}
        />
      </div>

      {/* Performance équipe */}
      {data.teamPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              <h3 className="font-semibold text-surface-900">{t('analyticsReport.section.teamPerformance')}</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-surface-500 border-b border-surface-200">
                    <th className="pb-3 font-medium">{t('analyticsReport.table.member')}</th>
                    <th className="pb-3 font-medium text-center">{t('analyticsReport.table.casesHandled')}</th>
                    <th className="pb-3 font-medium text-center">{t('analyticsReport.table.won')}</th>
                    <th className="pb-3 font-medium text-center">{t('analyticsReport.table.winRate')}</th>
                    <th className="pb-3 font-medium text-center">{t('analyticsReport.table.avgScore')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.teamPerformance.map((member) => {
                    const winRate = member.tendersHandled > 0 
                      ? (member.won / member.tendersHandled) * 100 
                      : 0;

                    return (
                      <tr key={member.member} className="border-b border-surface-100 last:border-0">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            {member.avatar ? (
                              <Image
                                src={member.avatar}
                                alt={member.member}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full"
                                unoptimized
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-700">
                                  {member.member.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="font-medium text-surface-900">{member.member}</span>
                          </div>
                        </td>
                        <td className="py-4 text-center text-surface-700">{member.tendersHandled}</td>
                        <td className="py-4 text-center">
                          <Badge variant="success">{member.won}</Badge>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Progress value={winRate} className="w-16 h-2" />
                            <span className="text-sm text-surface-600">{winRate.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <Badge 
                            variant={member.avgScore >= 80 ? 'success' : member.avgScore >= 60 ? 'warning' : 'secondary'}
                          >
                            {member.avgScore.toFixed(0)}/100
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparaison avec période précédente */}
      {previousData && (
        <ComparisonWidget
          title={t('analyticsReport.section.comparison')}
          items={[
            {
              label: t('analyticsReport.comparison.tendersHandled'),
              current: data.overview.totalTenders,
              previous: previousData.overview.totalTenders,
            },
            {
              label: t('analyticsReport.comparison.wonDeals'),
              current: data.overview.wonTenders,
              previous: previousData.overview.wonTenders,
            },
            {
              label: t('analyticsReport.comparison.revenue'),
              current: data.overview.totalRevenue,
              previous: previousData.overview.totalRevenue,
              unit: ' €',
            },
            {
              label: t('analyticsReport.comparison.winRate'),
              current: data.overview.winRate,
              previous: previousData.overview.winRate,
              unit: '%',
            },
          ]}
        />
      )}
    </div>
  );
}

export default AnalyticsReport;
