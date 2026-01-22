'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles,
  Upload,
  ArrowRight,
  Clock,
  FileText,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, Button, Badge, Skeleton } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface RecentAnalysis {
  id: string;
  analysis_data: {
    title: string;
    reference: string;
    matchScore?: number;
    buyer?: { name: string };
    dates?: { submissionDeadline?: string };
  };
  created_at: string;
}

export function AIAnalysisWidget() {
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalyses() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('tender_analyses')
          .select('id, analysis_data, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (!error && data) {
          setRecentAnalyses(data);
        }
      } catch (error) {
        console.error('Erreur chargement analyses:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalyses();
  }, []);

  const getDaysRemaining = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white pb-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Analyse IA</h3>
              <p className="text-sm text-white/80">Analysez vos appels d'offres</p>
            </div>
          </div>
          <Link href="/tenders/analyze">
            <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
              <Upload className="w-4 h-4 mr-2" />
              Analyser
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="-mt-10 relative z-10">
        {/* CTA Card */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4 border border-surface-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-xl flex-shrink-0">
              <Zap className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-surface-900">Nouveau DCE ?</h4>
              <p className="text-sm text-surface-500">
                Uploadez vos documents et obtenez une analyse instantanée
              </p>
            </div>
            <Link href="/tenders/analyze">
              <Button variant="primary" size="sm">
                Commencer
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Analyses récentes */}
        <div>
          <h4 className="text-sm font-medium text-surface-500 mb-3">
            Analyses récentes
          </h4>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} variant="rectangular" className="h-16 rounded-lg" />
              ))}
            </div>
          ) : recentAnalyses.length > 0 ? (
            <div className="space-y-2">
              {recentAnalyses.map((analysis) => {
                const deadline = analysis.analysis_data.dates?.submissionDeadline;
                const daysLeft = deadline ? getDaysRemaining(deadline) : null;

                return (
                  <motion.div
                    key={analysis.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg hover:bg-surface-100 transition-colors cursor-pointer"
                  >
                    {analysis.analysis_data.matchScore !== undefined && (
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold',
                        getScoreColor(analysis.analysis_data.matchScore)
                      )}>
                        {analysis.analysis_data.matchScore}%
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-900 text-sm truncate">
                        {analysis.analysis_data.title || 'Sans titre'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-surface-500">
                        <span>{analysis.analysis_data.reference}</span>
                        {daysLeft !== null && daysLeft > 0 && (
                          <>
                            <span>•</span>
                            <span className={cn(
                              daysLeft <= 7 && 'text-orange-600 font-medium'
                            )}>
                              J-{daysLeft}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-surface-400" />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-surface-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune analyse récente</p>
            </div>
          )}
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-surface-200">
          <div className="text-center">
            <p className="text-xl font-bold text-surface-900">{recentAnalyses.length}</p>
            <p className="text-xs text-surface-500">Analysés</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-primary-600">
              {recentAnalyses.filter(a => (a.analysis_data.matchScore || 0) >= 70).length}
            </p>
            <p className="text-xs text-surface-500">Compatibles</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-surface-900">~2min</p>
            <p className="text-xs text-surface-500">Par analyse</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AIAnalysisWidget;
