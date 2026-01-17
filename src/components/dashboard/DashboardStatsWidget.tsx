'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Bell, TrendingUp, Sparkles, Calendar, Activity } from 'lucide-react';
import { Card } from '@/components/ui';

interface DashboardStats {
  total_matched_tenders: number;
  upcoming_deadlines: number;
  active_searches: number;
  win_rate: number;
}

export function DashboardStatsWidget() {
  const [stats, setStats] = useState<DashboardStats>({
    total_matched_tenders: 0,
    upcoming_deadlines: 0,
    active_searches: 0,
    win_rate: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      setStats((prev) => data.stats || prev);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    {
      icon: Target,
      label: 'AO Correspondants',
      value: stats.total_matched_tenders,
      color: 'from-blue-500/20 to-blue-500/5 text-blue-600',
      bgColor: 'bg-blue-50',
      suffix: '',
    },
    {
      icon: Calendar,
      label: 'Deadlines cette semaine',
      value: stats.upcoming_deadlines,
      color: 'from-amber-500/20 to-amber-500/5 text-amber-600',
      bgColor: 'bg-amber-50',
      suffix: '',
    },
    {
      icon: Bell,
      label: 'Alertes actives',
      value: stats.active_searches,
      color: 'from-purple-500/20 to-purple-500/5 text-purple-600',
      bgColor: 'bg-purple-50',
      suffix: '',
    },
    {
      icon: Trophy,
      label: 'Taux de victoire',
      value: stats.win_rate.toFixed(1),
      color: 'from-green-500/20 to-green-500/5 text-green-600',
      bgColor: 'bg-green-50',
      suffix: '%',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-50`} />
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className="w-5 h-5" style={{ color: stat.color.split(' ')[1].replace('text-', '') }} />
                </div>
                {stat.label === 'Taux de victoire' && stats.win_rate > 0 && (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                )}
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stat.value}{stat.suffix}
                </p>
              </div>

              {/* Additional context */}
              {stat.label === 'AO Correspondants' && stats.total_matched_tenders > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Basé sur vos préférences
                  </p>
                </div>
              )}

              {stat.label === 'Deadlines cette semaine' && stats.upcoming_deadlines > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-amber-600 font-medium">
                    Agissez rapidement !
                  </p>
                </div>
              )}

              {stat.label === 'Taux de victoire' && stats.win_rate > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Performance</span>
                    <span className={`font-medium ${
                      stats.win_rate >= 30 ? 'text-green-600' :
                      stats.win_rate >= 15 ? 'text-amber-600' :
                      'text-gray-600'
                    }`}>
                      {stats.win_rate >= 30 ? 'Excellent' :
                       stats.win_rate >= 15 ? 'Bon' :
                       'À améliorer'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
