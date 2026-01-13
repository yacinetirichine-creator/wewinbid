'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, TrendingUp, Users, Euro, FileText, Trophy, 
  BarChart3, Globe, Award, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { AppLayout, PageHeader } from '@/components/layout/Sidebar';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, Skeleton, Badge } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

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
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/metrics/admin');
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('Accès refusé - Droits administrateur requis');
        } else {
          throw new Error('Failed to fetch metrics');
        }
        return;
      }
      
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Impossible de charger les métriques');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <PageHeader
            title="Dashboard Administrateur"
            description="Vue globale de la plateforme"
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
            <p className="text-lg font-medium text-red-600">{error || 'Erreur'}</p>
            <button
              onClick={fetchMetrics}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Réessayer
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
          title="Dashboard Administrateur"
          description="Vue globale des métriques de la plateforme WeWinBid"
        />

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatsCard
              title="Entreprises clientes"
              value={overview.totalCompanies}
              icon={<Building2 className="h-6 w-6" />}
              color="blue"
              subtitle={`${overview.activeCompanies} actives`}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatsCard
              title="Appels d'offres traités"
              value={overview.totalTenders}
              icon={<FileText className="h-6 w-6" />}
              color="purple"
              subtitle={`${overview.inProgressTenders} en cours`}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StatsCard
              title="Chiffre d'affaires généré"
              value={formatCurrency(overview.totalRevenue)}
              icon={<Euro className="h-6 w-6" />}
              color="green"
              subtitle={`${formatCurrency(overview.potentialRevenue)} potentiel`}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <StatsCard
              title="Taux de conversion"
              value={`${overview.conversionRate}%`}
              icon={<Trophy className="h-6 w-6" />}
              color="green"
              subtitle={`${overview.wonTenders} AO gagnés`}
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
                  <p className="text-sm font-medium text-gray-600">MRR (Revenu Mensuel Récurrent)</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {formatCurrency(overview.mrr)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {subscriptions.pro} Pro · {subscriptions.business} Business
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
                  <p className="text-sm font-medium text-gray-600">ARR (Revenu Annuel Récurrent)</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {formatCurrency(overview.arr)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Projection annuelle
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
              Répartition des abonnements
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Plan Free</p>
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
                    <p className="text-sm font-medium text-blue-600">Plan Pro</p>
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
                    <p className="text-sm font-medium text-purple-600">Plan Business</p>
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
                <h3 className="text-lg font-semibold text-gray-900">Top 5 Secteurs</h3>
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
                <h3 className="text-lg font-semibold text-gray-900">Top 5 Pays</h3>
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
              <h3 className="text-lg font-semibold text-gray-900">Évolution (6 derniers mois)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-600">
                    <th className="pb-3">Mois</th>
                    <th className="pb-3">Nouvelles entreprises</th>
                    <th className="pb-3">Appels d'offres</th>
                    <th className="pb-3">CA généré</th>
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
              <h3 className="text-lg font-semibold text-gray-900">Top 10 Entreprises</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-600">
                    <th className="pb-3">Entreprise</th>
                    <th className="pb-3">Plan</th>
                    <th className="pb-3">Appels d'offres</th>
                    <th className="pb-3">CA généré</th>
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
