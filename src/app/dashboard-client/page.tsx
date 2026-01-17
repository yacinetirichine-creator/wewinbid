'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, TrendingUp, Target, Users, CheckCircle, Clock, AlertTriangle,
  Euro, Percent, Activity, ArrowUpRight, ArrowDownRight, Trophy
} from 'lucide-react';
import { AppLayout, PageHeader } from '@/components/layout/Sidebar';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { TendersTable } from '@/components/dashboard/TendersTable';
import { Card, Skeleton } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ClientMetrics {
  overview: {
    totalTenders: number;
    submittedTenders: number;
    wonTenders: number;
    lostTenders: number;
    inProgressTenders: number;
    conversionRate: number;
    totalValue: number;
    wonValue: number;
    totalClients: number;
    upcomingDeadlines: number;
    urgentTenders: number;
  };
  statusDistribution: {
    draft: number;
    analysis: number;
    inProgress: number;
    review: number;
    submitted: number;
    won: number;
    lost: number;
    abandoned: number;
  };
  trends: {
    tendersGrowth: number;
    tendersLastMonth: number;
  };
  recentTenders: any[];
}

export default function ClientDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<ClientMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/metrics/client');
      
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
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
            title="Tableau de bord"
            description="Vue d'ensemble de vos appels d'offres"
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
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
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <p className="mt-4 text-lg font-medium text-gray-900">{error || 'Erreur'}</p>
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

  const { overview, statusDistribution, trends, recentTenders } = metrics;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Tableau de bord"
          description="Vue d'ensemble de vos réponses aux appels d'offres"
          action={{
            label: 'Nouvel appel d\'offres',
            href: '/tenders/new',
          }}
        />

        {/* Alertes urgentes */}
        {overview.urgentTenders > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-red-200 bg-red-50">
              <div className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900">
                    {overview.urgentTenders} appel{overview.urgentTenders > 1 ? 's' : ''} d'offres urgent{overview.urgentTenders > 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-red-700">
                    Échéance dans moins de 7 jours
                  </p>
                </div>
                <button
                  onClick={() => router.push('/tenders')}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Voir →
                </button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatsCard
              title="Total des réponses"
              value={overview.totalTenders}
              icon={<FileText className="h-6 w-6" />}
              color="blue"
              trend={{
                value: trends.tendersGrowth,
                label: 'vs mois dernier',
                isPositive: trends.tendersGrowth >= 0,
              }}
              subtitle={`${overview.inProgressTenders} en cours`}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatsCard
              title="Appels d'offres gagnés"
              value={overview.wonTenders}
              icon={<Trophy className="h-6 w-6" />}
              color="green"
              subtitle={`${overview.conversionRate}% de taux de conversion`}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StatsCard
              title="Clients actifs"
              value={overview.totalClients}
              icon={<Users className="h-6 w-6" />}
              color="purple"
              subtitle="Clients uniques"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <StatsCard
              title="Chiffre d'affaires gagné"
              value={formatCurrency(overview.wonValue)}
              icon={<Euro className="h-6 w-6" />}
              color="green"
              subtitle={`${formatCurrency(overview.totalValue)} au total`}
            />
          </motion.div>
        </div>

        {/* Métriques secondaires */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taux de conversion</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {overview.conversionRate}%
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {overview.wonTenders} / {overview.submittedTenders} soumis
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <Percent className="h-6 w-6 text-blue-600" />
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
                  <p className="text-sm font-medium text-gray-600">Échéances à venir</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {overview.upcomingDeadlines}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Dans les 30 prochains jours
                  </p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-3">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Réponses soumises</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {overview.submittedTenders}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    En attente de résultat
                  </p>
                </div>
                <div className="rounded-lg bg-purple-50 p-3">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Répartition par statut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Répartition par statut
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Brouillons</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {statusDistribution.draft}
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-600">En analyse</p>
                <p className="mt-1 text-2xl font-bold text-blue-900">
                  {statusDistribution.analysis}
                </p>
              </div>
              <div className="rounded-lg bg-yellow-50 p-4">
                <p className="text-sm text-yellow-600">En cours</p>
                <p className="mt-1 text-2xl font-bold text-yellow-900">
                  {statusDistribution.inProgress}
                </p>
              </div>
              <div className="rounded-lg bg-purple-50 p-4">
                <p className="text-sm text-purple-600">En révision</p>
                <p className="mt-1 text-2xl font-bold text-purple-900">
                  {statusDistribution.review}
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-600">Soumis</p>
                <p className="mt-1 text-2xl font-bold text-blue-900">
                  {statusDistribution.submitted}
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-green-600">Gagnés</p>
                <p className="mt-1 text-2xl font-bold text-green-900">
                  {statusDistribution.won}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-600">Perdus</p>
                <p className="mt-1 text-2xl font-bold text-red-900">
                  {statusDistribution.lost}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Abandonnés</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {statusDistribution.abandoned}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tableau des appels d'offres récents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Appels d'offres récents
            </h2>
            <button
              onClick={() => router.push('/tenders')}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Voir tout →
            </button>
          </div>
          <TendersTable
            tenders={recentTenders}
            onTenderClick={(id) => router.push(`/tenders/${id}`)}
          />
        </motion.div>
      </div>
    </AppLayout>
  );
}
