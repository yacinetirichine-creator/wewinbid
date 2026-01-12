'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FileText, TrendingUp, Target, Users, Clock, ArrowRight,
  Plus, Trophy, AlertTriangle, CheckCircle, Activity, Calendar,
  Euro, Percent, Briefcase, Bell
} from 'lucide-react';
import { AppLayout, PageHeader } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, Badge, Progress, Button, Skeleton, ScoreGauge, Alert } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate, getDaysRemaining } from '@/lib/utils';

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
function TenderRow({ tender }: { tender: RecentTender }) {
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
              {tender.type === 'public' ? 'Public' : 'Privé'}
            </Badge>
            {isUrgent && (
              <Badge variant="danger" size="sm">
                <Clock className="w-3 h-3 mr-1" />
                Urgent
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
              daysLeft < 0 ? 'Expiré' : `${daysLeft}j restants`
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
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTenders, setRecentTenders] = useState<RecentTender[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check for welcome param
    const params = new URLSearchParams(window.location.search);
    if (params.get('welcome') === 'true') {
      setShowWelcome(true);
      // Remove the param from URL
      window.history.replaceState({}, '', '/dashboard');
    }

    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's company
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      // Load stats
      const { data: tenders } = await supabase
        .from('tenders')
        .select('status, estimated_value, compatibility_score')
        .eq('company_id', profile.company_id);

      if (tenders) {
        const totalTenders = tenders.length;
        const activeTenders = tenders.filter(t => ['draft', 'in_progress', 'submitted'].includes(t.status)).length;
        const wonTenders = tenders.filter(t => t.status === 'won').length;
        const lostTenders = tenders.filter(t => t.status === 'lost').length;
        const pendingTenders = tenders.filter(t => t.status === 'submitted').length;
        const totalRevenue = tenders.filter(t => t.status === 'won').reduce((sum, t) => sum + (t.estimated_value || 0), 0);
        const scores = tenders.filter(t => t.compatibility_score !== null).map(t => t.compatibility_score as number);
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const winRate = totalTenders > 0 ? Math.round((wonTenders / (wonTenders + lostTenders)) * 100) || 0 : 0;

        setStats({
          totalTenders,
          activeTenders,
          wonTenders,
          lostTenders,
          pendingTenders,
          totalRevenue,
          avgScore,
          winRate,
        });
      }

      // Load recent tenders
      const { data: recentTendersData } = await supabase
        .from('tenders')
        .select('id, reference, title, client_name, status, type, deadline, estimated_value, compatibility_score')
        .eq('company_id', profile.company_id)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (recentTendersData) {
        setRecentTenders(recentTendersData);
      }

      // Load activities
      const { data: activitiesData } = await supabase
        .from('activities')
        .select('id, type, description, created_at, tender_id')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activitiesData) {
        setActivities(activitiesData);
      }

      // Load notifications
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('id, title, message, type, is_read, created_at')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (notificationsData) {
        setNotifications(notificationsData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <AppLayout>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre activité commerciale"
        actions={
          <Link href="/tenders/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Nouvel appel d'offres
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
          <Alert variant="success" onClose={() => setShowWelcome(false)}>
            <strong>Bienvenue sur WeWinBid !</strong> Votre compte a été créé avec succès. 
            Commencez par créer votre premier appel d'offres.
          </Alert>
        </motion.div>
      )}

      {loading ? (
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
          {/* Stats Grid */}
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={FileText}
              label="Appels d'offres actifs"
              value={stats?.activeTenders || 0}
              change={`${stats?.totalTenders || 0} au total`}
              color="indigo"
            />
            <StatCard
              icon={Trophy}
              label="Marchés remportés"
              value={stats?.wonTenders || 0}
              change={stats?.winRate ? `${stats.winRate}% de réussite` : undefined}
              changeType="positive"
              color="emerald"
            />
            <StatCard
              icon={Euro}
              label="CA généré"
              value={formatCurrency(stats?.totalRevenue || 0)}
              color="amber"
            />
            <StatCard
              icon={Target}
              label="Score moyen"
              value={`${stats?.avgScore || 0}%`}
              color="indigo"
            />
          </motion.div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Tenders */}
            <motion.div variants={item} className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">Appels d'offres récents</h3>
                    <p className="text-sm text-slate-500">Vos dernières opportunités</p>
                  </div>
                  <Link href="/tenders">
                    <Button variant="ghost" size="sm">
                      Voir tout
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  {recentTenders.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {recentTenders.map((tender) => (
                        <TenderRow key={tender.id} tender={tender} />
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h4 className="font-medium text-slate-900 mb-2">Aucun appel d'offres</h4>
                      <p className="text-sm text-slate-500 mb-4">
                        Commencez par créer votre premier appel d'offres
                      </p>
                      <Link href="/tenders/new">
                        <Button variant="primary" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Créer un appel d'offres
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
                        <h3 className="font-semibold text-slate-900">Notifications</h3>
                      </div>
                      <Badge variant="primary">{notifications.length}</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-100">
                        {notifications.slice(0, 3).map((notif) => (
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
                      <h3 className="font-semibold text-slate-900">Activité récente</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {activities.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {activities.slice(0, 5).map((activity) => (
                          <ActivityItem key={activity.id} activity={activity} />
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-sm text-slate-500">
                        Aucune activité récente
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div variants={item}>
                <Card className="bg-gradient-to-br from-indigo-500 to-violet-600 border-0">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-white mb-2">Besoin d'aide ?</h3>
                    <p className="text-sm text-indigo-100 mb-4">
                      Découvrez comment optimiser vos réponses aux appels d'offres
                    </p>
                    <Button variant="secondary" size="sm" className="bg-white text-indigo-600 hover:bg-indigo-50">
                      Guide de démarrage
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
                    <p className="text-sm text-slate-500">En attente de résultat</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-indigo-500" />
                      <span className="text-2xl font-bold text-slate-900">
                        {recentTenders.filter(t => {
                          const days = getDaysRemaining(t.deadline);
                          return days !== null && days <= 7 && days >= 0;
                        }).length}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">Échéances cette semaine</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Percent className="w-5 h-5 text-emerald-500" />
                      <span className="text-2xl font-bold text-slate-900">{stats?.winRate || 0}%</span>
                    </div>
                    <p className="text-sm text-slate-500">Taux de réussite</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Briefcase className="w-5 h-5 text-violet-500" />
                      <span className="text-2xl font-bold text-slate-900">{stats?.totalTenders || 0}</span>
                    </div>
                    <p className="text-sm text-slate-500">Total des dossiers</p>
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
