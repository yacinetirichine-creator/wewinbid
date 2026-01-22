'use client';

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FileText, TrendingUp, Target, Users, Clock, ArrowRight,
  Plus, Trophy, AlertTriangle, CheckCircle, Activity, Calendar,
  Euro, Percent, Briefcase, Bell
} from 'lucide-react';
import { AppLayout, PageHeader } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, Badge, Progress, Button, Skeleton, ScoreGauge, Alert } from '@/components/ui';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { TendersTable } from '@/components/dashboard/TendersTable';
import { MatchedTendersWidget } from '@/components/dashboard/MatchedTendersWidget';
import { DashboardStatsWidget } from '@/components/dashboard/DashboardStatsWidget';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate, getDaysRemaining } from '@/lib/utils';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

// Types
interface DashboardStats {
  totalTenders: number;
  activeTenders: number;
  wonTenders: number;
  lostTenders: number;
  pendingTenders: number;
  totalRevenue: number;
  avgScore: number;
  winRate: number;
}

interface RecentTender {
  id: string;
  reference: string;
  title: string;
  client_name: string;
  status: string;
  type: string;
  deadline: string;
  estimated_value: number;
  compatibility_score: number | null;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  created_at: string;
  tender_id: string | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

// Stats Card Component
function StatCard({
  icon: Icon, 
  label, 
  value, 
  change, 
  changeType,
  color = 'indigo'
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  color?: 'indigo' | 'emerald' | 'amber' | 'rose';
}) {
  const colorClasses = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-500',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-500',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-500',
    rose: 'from-rose-500/20 to-rose-500/5 text-rose-500',
  };

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-50`} />
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">{label}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            {change && (
              <p className={`text-sm mt-1 ${
                changeType === 'positive' ? 'text-emerald-600' :
                changeType === 'negative' ? 'text-rose-600' :
                'text-slate-500'
              }`}>
                {change}
              </p>
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

// Tender Row Component
function TenderRow({ tender, t }: { tender: RecentTender; t: (key: string) => string }) {
  const daysLeft = getDaysRemaining(tender.deadline);
  const isUrgent = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;
  
  return (
    <Link href={`/tenders/${tender.id}`}>
      <div className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-lg transition-colors group">
        <div className={`w-2 h-12 rounded-full ${
          tender.type === 'public' ? 'bg-blue-500' : 'bg-teal-500'
        }`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-slate-400">{tender.reference}</span>
            <Badge variant={tender.type === 'public' ? 'primary' : 'secondary'} size="sm">
              {tender.type === 'public' ? t('dashboard.tenders.public') : t('dashboard.tenders.private')}
            </Badge>
            {isUrgent && (
              <Badge variant="danger" size="sm">
                <Clock className="w-3 h-3 mr-1" />
                {t('dashboard.tenders.urgent')}
              </Badge>
            )}
          </div>
          <h4 className="font-medium text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
            {tender.title}
          </h4>
          <p className="text-sm text-slate-500">{tender.client_name}</p>
        </div>

        <div className="text-right hidden sm:block">
          <p className="font-semibold text-slate-900">{formatCurrency(tender.estimated_value)}</p>
          <p className="text-sm text-slate-500">
            {daysLeft !== null ? (
              daysLeft < 0 ? t('dashboard.tenders.expired') : t('dashboard.tenders.daysLeft').replace('{days}', String(daysLeft))
            ) : (
              formatDate(tender.deadline)
            )}
          </p>
        </div>

        {tender.compatibility_score !== null && (
          <div className="hidden md:block">
            <ScoreGauge score={tender.compatibility_score} size="sm" />
          </div>
        )}

        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
      </div>
    </Link>
  );
}

// Activity Item Component
function ActivityItem({ activity }: { activity: RecentActivity }) {
  const iconMap: Record<string, any> = {
    tender_created: FileText,
    tender_submitted: CheckCircle,
    tender_won: Trophy,
    tender_lost: AlertTriangle,
    document_uploaded: FileText,
    score_updated: Target,
  };
  
  const Icon = iconMap[activity.type] || Activity;
  
  return (
    <div className="flex items-start gap-3 p-3">
      <div className="p-2 rounded-lg bg-slate-100">
        <Icon className="w-4 h-4 text-slate-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700">{activity.description}</p>
        <p className="text-xs text-slate-400 mt-1">{formatDate(activity.created_at)}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }, []);
  const { locale } = useLocale();

  const entries = useMemo(
    () => ({
      'dashboard.title': 'Tableau de bord',
      'dashboard.subtitle': "Vue d'ensemble de votre activité commerciale",
      'dashboard.actions.newTender': "Nouvel appel d'offres",
      'dashboard.welcome.title': 'Bienvenue sur WeWinBid !',
      'dashboard.welcome.body': "Votre compte a été créé avec succès. Commencez par créer votre premier appel d'offres.",
      'dashboard.stats.activeTenders': "Appels d'offres actifs",
      'dashboard.stats.totalSuffix': '{count} au total',
      'dashboard.stats.won': 'Marchés remportés',
      'dashboard.stats.winRate': '{rate}% de réussite',
      'dashboard.stats.revenue': 'CA généré',
      'dashboard.stats.avgScore': 'Score moyen',
      'dashboard.recent.title': "Appels d'offres récents",
      'dashboard.recent.subtitle': 'Vos dernières opportunités',
      'dashboard.recent.viewAll': 'Voir tout',
      'dashboard.recent.empty.title': "Aucun appel d'offres",
      'dashboard.recent.empty.body': "Commencez par créer votre premier appel d'offres",
      'dashboard.recent.empty.cta': "Créer un appel d'offres",
      'dashboard.notifications.title': 'Notifications',
      'dashboard.activity.title': 'Activité récente',
      'dashboard.activity.empty': 'Aucune activité récente',
      'dashboard.help.title': "Besoin d'aide ?",
      'dashboard.help.body': "Découvrez comment optimiser vos réponses aux appels d'offres",
      'dashboard.help.cta': 'Guide de démarrage',
      'dashboard.quick.pending': 'En attente de résultat',
      'dashboard.quick.deadlines': 'Échéances cette semaine',
      'dashboard.quick.winRate': 'Taux de réussite',
      'dashboard.quick.total': 'Total des dossiers',
      'dashboard.tenders.public': 'Public',
      'dashboard.tenders.private': 'Privé',
      'dashboard.tenders.urgent': 'Urgent',
      'dashboard.tenders.expired': 'Expiré',
      'dashboard.tenders.daysLeft': '{days}j restants',
    }),
    []
  );

  const { t } = useUiTranslations(locale, entries);
  const router = useRouter();
  
  const [showWelcome, setShowWelcome] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Vérifier si l'utilisateur a configuré son entreprise
  useEffect(() => {
    const checkOnboarding = async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        setNeedsOnboarding(true);
        router.push('/onboarding');
      }
    };
    checkOnboarding();
  }, [getSupabase, router]);

  // ✅ React Query: Auto-caching with 5min stale time
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's company
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!(profile as any)?.company_id) return null;

      // Load stats
      const { data: tenders } = await (supabase as any)
        .from('tenders')
        .select('status, estimated_value, compatibility_score')
        .eq('company_id', (profile as any).company_id);

      let stats: DashboardStats | null = null;
      if (tenders) {
        const totalTenders = tenders.length;
        const activeTenders = tenders.filter((t: any) => ['draft', 'in_progress', 'submitted'].includes(t.status)).length;
        const wonTenders = tenders.filter((t: any) => t.status === 'won').length;
        const lostTenders = tenders.filter((t: any) => t.status === 'lost').length;
        const pendingTenders = tenders.filter((t: any) => t.status === 'submitted').length;
        const totalRevenue = tenders.filter((t: any) => t.status === 'won').reduce((sum: any, t: any) => sum + (t.estimated_value || 0), 0);
        const scores = tenders.filter((t: any) => t.compatibility_score !== null).map((t: any) => t.compatibility_score as number);
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: any, b: any) => a + b, 0) / scores.length) : 0;
        const winRate = totalTenders > 0 ? Math.round((wonTenders / (wonTenders + lostTenders)) * 100) || 0 : 0;

        stats = {
          totalTenders,
          activeTenders,
          wonTenders,
          lostTenders,
          pendingTenders,
          totalRevenue,
          avgScore,
          winRate,
        };
      }

      // Load recent tenders
      const { data: recentTendersData } = await supabase
        .from('tenders')
        .select('id, reference, title, client_name, status, type, deadline, estimated_value, compatibility_score')
        .eq('company_id', profile.company_id)
        .order('updated_at', { ascending: false })
        .limit(5);

      // Load activities
      const { data: activitiesData } = await supabase
        .from('activities')
        .select('id, type, description, created_at, tender_id')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Load notifications
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('id, title, message, type, is_read, created_at')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        stats,
        recentTenders: recentTendersData || [],
        activities: activitiesData || [],
        notifications: notificationsData || [],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1,
  });

  const stats = dashboardData?.stats || null;
  const recentTenders = dashboardData?.recentTenders || [];
  const activities = dashboardData?.activities || [];
  const notifications = dashboardData?.notifications || [];

  // Check for welcome message on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('welcome') === 'true') {
        setShowWelcome(true);
        window.history.replaceState({}, '', '/dashboard');
      }
    }
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const formatTemplate = (template: string, values: Record<string, string | number>) => {
    return Object.entries(values).reduce((acc, [key, value]) => {
      return acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }, template);
  };

  return (
    <AppLayout>
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.subtitle')}
        actions={
          <Link href="/tenders/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              {t('dashboard.actions.newTender')}
            </Button>
          </Link>
        }
      />

      {showWelcome && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Alert type="success" dismissible onDismiss={() => setShowWelcome(false)}>
            <strong>{t('dashboard.welcome.title')}</strong> {t('dashboard.welcome.body')}
          </Alert>
        </motion.div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton variant="rectangular" className="h-96 rounded-xl lg:col-span-2" />
            <Skeleton variant="rectangular" className="h-96 rounded-xl" />
          </div>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* New: Dashboard Stats Widget */}
          <motion.div variants={item}>
            <DashboardStatsWidget />
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={FileText}
              label={t('dashboard.stats.activeTenders')}
              value={stats?.activeTenders || 0}
              change={formatTemplate(t('dashboard.stats.totalSuffix'), { count: stats?.totalTenders || 0 })}
              color="indigo"
            />
            <StatCard
              icon={Trophy}
              label={t('dashboard.stats.won')}
              value={stats?.wonTenders || 0}
              change={stats?.winRate ? formatTemplate(t('dashboard.stats.winRate'), { rate: stats.winRate }) : undefined}
              changeType="positive"
              color="emerald"
            />
            <StatCard
              icon={Euro}
              label={t('dashboard.stats.revenue')}
              value={formatCurrency(stats?.totalRevenue || 0)}
              color="amber"
            />
            <StatCard
              icon={Target}
              label={t('dashboard.stats.avgScore')}
              value={`${stats?.avgScore || 0}%`}
              color="indigo"
            />
          </motion.div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Matched Tenders Widget - New */}
            <motion.div variants={item} className="lg:col-span-2">
              <MatchedTendersWidget minScore={70} limit={10} />
            </motion.div>

            {/* Recent Tenders */}
            <motion.div variants={item} className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{t('dashboard.recent.title')}</h3>
                    <p className="text-sm text-slate-500">{t('dashboard.recent.subtitle')}</p>
                  </div>
                  <Link href="/tenders">
                    <Button variant="ghost" size="sm">
                      {t('dashboard.recent.viewAll')}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  {recentTenders.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {recentTenders.map((tender: any) => (
                        <TenderRow key={tender.id} tender={tender} t={t} />
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h4 className="font-medium text-slate-900 mb-2">{t('dashboard.recent.empty.title')}</h4>
                      <p className="text-sm text-slate-500 mb-4">
                        {t('dashboard.recent.empty.body')}
                      </p>
                      <Link href="/tenders/new">
                        <Button variant="primary" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          {t('dashboard.recent.empty.cta')}
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Notifications */}
              {notifications.length > 0 && (
                <motion.div variants={item}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-semibold text-slate-900">{t('dashboard.notifications.title')}</h3>
                      </div>
                      <Badge variant="primary">{notifications.length}</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-100">
                        {notifications.slice(0, 3).map((notif: any) => (
                          <div key={notif.id} className="p-4">
                            <h4 className="font-medium text-slate-900 text-sm">{notif.title}</h4>
                            <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Activity Feed */}
              <motion.div variants={item}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-500" />
                      <h3 className="font-semibold text-slate-900">{t('dashboard.activity.title')}</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {activities.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {activities.slice(0, 5).map((activity: any) => (
                          <ActivityItem key={activity.id} activity={activity} />
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-sm text-slate-500">
                        {t('dashboard.activity.empty')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div variants={item}>
                <Card className="bg-gradient-to-br from-indigo-500 to-violet-600 border-0">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-white mb-2">{t('dashboard.help.title')}</h3>
                    <p className="text-sm text-indigo-100 mb-4">
                      {t('dashboard.help.body')}
                    </p>
                    <Button variant="secondary" size="sm" className="bg-white text-indigo-600 hover:bg-indigo-50">
                      {t('dashboard.help.cta')}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <motion.div variants={item}>
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-amber-500" />
                      <span className="text-2xl font-bold text-slate-900">{stats?.pendingTenders || 0}</span>
                    </div>
                    <p className="text-sm text-slate-500">{t('dashboard.quick.pending')}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-indigo-500" />
                      <span className="text-2xl font-bold text-slate-900">
                        {recentTenders.filter((t: any) => {
                          const days = getDaysRemaining(t.deadline);
                          return days !== null && days <= 7 && days >= 0;
                        }).length}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{t('dashboard.quick.deadlines')}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Percent className="w-5 h-5 text-emerald-500" />
                      <span className="text-2xl font-bold text-slate-900">{stats?.winRate || 0}%</span>
                    </div>
                    <p className="text-sm text-slate-500">{t('dashboard.quick.winRate')}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Briefcase className="w-5 h-5 text-violet-500" />
                      <span className="text-2xl font-bold text-slate-900">{stats?.totalTenders || 0}</span>
                    </div>
                    <p className="text-sm text-slate-500">{t('dashboard.quick.total')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AppLayout>
  );
}
