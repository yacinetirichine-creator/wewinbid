'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, TrendingUp, Users, Euro, FileText, Trophy, 
  BarChart3, Globe, Award, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { AppLayout, PageHeader } from '@/components/layout/Sidebar';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, Skeleton, Badge } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

interface AdminMetrics {
  overview: {
    totalCompanies: number;
    activeCompanies: number;
    totalTenders: number;
    wonTenders: number;
    lostTenders: number;
    submittedTenders: number;
    inProgressTenders: number;
    conversionRate: number;
    totalRevenue: number;
    potentialRevenue: number;
    mrr: number;
    arr: number;
  };
  subscriptions: {
    free: number;
    pro: number;
    business: number;
  };
  topSectors: Array<{ name: string; count: number }>;
  topCountries: Array<{ code: string; count: number }>;
  monthlyStats: Array<{
    month: string;
    tenders: number;
    companies: number;
    revenue: number;
  }>;
  topCompanies: Array<{
    id: string;
    name: string;
    plan: string;
    tendersCount: number;
    revenue: number;
  }>;
}

export default function AdminDashboard() {
  const { locale } = useLocale();

  const entries = useMemo(
    () => ({
      'admin.dashboard.title': 'Admin Dashboard',
      'admin.dashboard.subtitle': 'Platform overview',
      'admin.dashboard.subtitleLong': 'Overall metrics for the WeWinBid platform',

      'admin.dashboard.error.accessDenied': 'Access denied – admin rights required',
      'admin.dashboard.error.fetchFailed': 'Failed to fetch metrics',
      'admin.dashboard.error.loadMetrics': 'Unable to load metrics',
      'admin.dashboard.error.generic': 'Error',
      'admin.dashboard.retry': 'Try again',

      'admin.dashboard.stats.customerCompanies': 'Customer companies',
      'admin.dashboard.stats.activeCompanies': '{count} active',

      'admin.dashboard.stats.tendersProcessed': 'Tenders processed',
      'admin.dashboard.stats.tendersInProgress': '{count} in progress',

      'admin.dashboard.stats.revenueGenerated': 'Revenue generated',
      'admin.dashboard.stats.revenuePotential': '{value} potential',

      'admin.dashboard.stats.conversionRate': 'Conversion rate',
      'admin.dashboard.stats.wonTenders': '{count} tenders won',

      'admin.dashboard.mrr.title': 'MRR (Monthly Recurring Revenue)',
      'admin.dashboard.mrr.subtitle': '{pro} Pro · {business} Business',

      'admin.dashboard.arr.title': 'ARR (Annual Recurring Revenue)',
      'admin.dashboard.arr.subtitle': 'Annual projection',

      'admin.dashboard.subscriptions.title': 'Subscription breakdown',
      'admin.dashboard.subscriptions.free': 'Free plan',
      'admin.dashboard.subscriptions.pro': 'Pro plan',
      'admin.dashboard.subscriptions.business': 'Business plan',

      'admin.dashboard.topSectors.title': 'Top 5 sectors',
      'admin.dashboard.topCountries.title': 'Top 5 countries',

      'admin.dashboard.monthly.title': 'Trends (last 6 months)',
      'admin.dashboard.monthly.col.month': 'Month',
      'admin.dashboard.monthly.col.newCompanies': 'New companies',
      'admin.dashboard.monthly.col.tenders': 'Tenders',
      'admin.dashboard.monthly.col.revenue': 'Revenue',

      'admin.dashboard.topCompanies.title': 'Top 10 companies',
      'admin.dashboard.topCompanies.col.company': 'Company',
      'admin.dashboard.topCompanies.col.plan': 'Plan',
      'admin.dashboard.topCompanies.col.tenders': 'Tenders',
      'admin.dashboard.topCompanies.col.revenue': 'Revenue',
    }),
    []
  );

  const { t } = useUiTranslations(locale, entries);

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/metrics/admin');
      
      if (!response.ok) {
        if (response.status === 403) {
          setError(t('admin.dashboard.error.accessDenied'));
        } else {
          throw new Error(t('admin.dashboard.error.fetchFailed'));
        }
        return;
      }
      
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(t('admin.dashboard.error.loadMetrics'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <PageHeader
            title={t('admin.dashboard.title')}
            subtitle={t('admin.dashboard.subtitle')}
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !metrics) {
    return (
      <AppLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-red-600">{error || t('admin.dashboard.error.generic')}</p>
            <button
              onClick={fetchMetrics}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              {t('admin.dashboard.retry')}
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { overview, subscriptions, topSectors, topCountries, monthlyStats, topCompanies } = metrics;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title={t('admin.dashboard.title')}
          subtitle={t('admin.dashboard.subtitleLong')}
        />

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatsCard
              title={t('admin.dashboard.stats.customerCompanies')}
              value={overview.totalCompanies}
              icon={<Building2 className="h-6 w-6" />}
              color="blue"
              subtitle={t('admin.dashboard.stats.activeCompanies', { count: overview.activeCompanies })}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatsCard
              title={t('admin.dashboard.stats.tendersProcessed')}
              value={overview.totalTenders}
              icon={<FileText className="h-6 w-6" />}
              color="purple"
              subtitle={t('admin.dashboard.stats.tendersInProgress', { count: overview.inProgressTenders })}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StatsCard
              title={t('admin.dashboard.stats.revenueGenerated')}
              value={formatCurrency(overview.totalRevenue)}
              icon={<Euro className="h-6 w-6" />}
              color="green"
              subtitle={t('admin.dashboard.stats.revenuePotential', { value: formatCurrency(overview.potentialRevenue) })}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <StatsCard
              title={t('admin.dashboard.stats.conversionRate')}
              value={`${overview.conversionRate}%`}
              icon={<Trophy className="h-6 w-6" />}
              color="green"
              subtitle={t('admin.dashboard.stats.wonTenders', { count: overview.wonTenders })}
            />
          </motion.div>
        </div>

        {/* Revenus récurrents */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('admin.dashboard.mrr.title')}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {formatCurrency(overview.mrr)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {t('admin.dashboard.mrr.subtitle', { pro: subscriptions.pro, business: subscriptions.business })}
                  </p>
                </div>
                <div className="rounded-lg bg-green-50 p-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('admin.dashboard.arr.title')}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {formatCurrency(overview.arr)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {t('admin.dashboard.arr.subtitle')}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Répartition des abonnements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {t('admin.dashboard.subscriptions.title')}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('admin.dashboard.subscriptions.free')}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{subscriptions.free}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {Math.round((subscriptions.free / overview.totalCompanies) * 100)}%
                    </p>
                  </div>
                  <Badge variant="gray">€0</Badge>
                </div>
              </div>
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">{t('admin.dashboard.subscriptions.pro')}</p>
                    <p className="mt-2 text-3xl font-bold text-blue-900">{subscriptions.pro}</p>
                    <p className="mt-1 text-sm text-blue-600">
                      {Math.round((subscriptions.pro / overview.totalCompanies) * 100)}%
                    </p>
                  </div>
                  <Badge variant="blue">€49</Badge>
                </div>
              </div>
              <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">{t('admin.dashboard.subscriptions.business')}</p>
                    <p className="mt-2 text-3xl font-bold text-purple-900">{subscriptions.business}</p>
                    <p className="mt-1 text-sm text-purple-600">
                      {Math.round((subscriptions.business / overview.totalCompanies) * 100)}%
                    </p>
                  </div>
                  <Badge variant="purple">€149</Badge>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Top Secteurs et Pays */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">{t('admin.dashboard.topSectors.title')}</h3>
              </div>
              <div className="space-y-3">
                {topSectors.map((sector, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{sector.name}</span>
                    <span className="font-semibold text-gray-900">{sector.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">{t('admin.dashboard.topCountries.title')}</h3>
              </div>
              <div className="space-y-3">
                {topCountries.map((country, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{country.code}</span>
                    <span className="font-semibold text-gray-900">{country.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Évolution mensuelle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t('admin.dashboard.monthly.title')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-600">
                    <th className="pb-3">{t('admin.dashboard.monthly.col.month')}</th>
                    <th className="pb-3">{t('admin.dashboard.monthly.col.newCompanies')}</th>
                    <th className="pb-3">{t('admin.dashboard.monthly.col.tenders')}</th>
                    <th className="pb-3">{t('admin.dashboard.monthly.col.revenue')}</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {monthlyStats.map((stat, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-3 font-medium text-gray-900">{stat.month}</td>
                      <td className="py-3 text-gray-700">{stat.companies}</td>
                      <td className="py-3 text-gray-700">{stat.tenders}</td>
                      <td className="py-3 font-semibold text-green-600">
                        {formatCurrency(stat.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* Top 10 entreprises */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t('admin.dashboard.topCompanies.title')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-600">
                    <th className="pb-3">{t('admin.dashboard.topCompanies.col.company')}</th>
                    <th className="pb-3">{t('admin.dashboard.topCompanies.col.plan')}</th>
                    <th className="pb-3">{t('admin.dashboard.topCompanies.col.tenders')}</th>
                    <th className="pb-3">{t('admin.dashboard.topCompanies.col.revenue')}</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {topCompanies.map((company, index) => (
                    <tr key={company.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                            {index + 1}
                          </span>
                          <span className="font-medium text-gray-900">{company.name}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            company.plan === 'business'
                              ? 'purple'
                              : company.plan === 'pro'
                              ? 'blue'
                              : 'gray'
                          }
                        >
                          {company.plan}
                        </Badge>
                      </td>
                      <td className="py-3 text-gray-700">{company.tendersCount}</td>
                      <td className="py-3 font-semibold text-green-600">
                        {formatCurrency(company.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
