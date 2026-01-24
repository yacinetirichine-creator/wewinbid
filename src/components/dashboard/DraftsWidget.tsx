'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Play,
  ArrowRight,
  Clock,
  Calendar,
  AlertTriangle,
  FileText,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, Badge, Button, Progress } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

interface DraftTender {
  id: string;
  title: string;
  buyer_name: string;
  deadline: string;
  status: string;
  tender_response?: {
    id: string;
    completion_percentage: number;
    updated_at: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  ANALYSIS: 'En analyse',
  IN_PROGRESS: 'En cours',
  REVIEW: 'En révision',
};

export function DraftsWidget() {
  const [drafts, setDrafts] = useState<DraftTender[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }, []);

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: tenders, error } = await supabase
          .from('tenders')
          .select(`
            id,
            title,
            buyer_name,
            deadline,
            status,
            tender_response:tender_responses(
              id,
              completion_percentage,
              updated_at
            )
          `)
          .in('status', ['DRAFT', 'ANALYSIS', 'IN_PROGRESS', 'REVIEW'])
          .eq('created_by', user.id)
          .order('updated_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        const formattedDrafts = (tenders || []).map((tender: any) => ({
          ...tender,
          tender_response: tender.tender_response?.[0] || null
        })) as DraftTender[];

        setDrafts(formattedDrafts);
      } catch (error) {
        console.error('Error fetching drafts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, [getSupabase]);

  const getDaysUntilDeadline = (deadline: string) => {
    return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getUrgencyBadge = (deadline: string | null) => {
    if (!deadline) return null;
    const days = getDaysUntilDeadline(deadline);

    if (days < 0) {
      return (
        <Badge variant="danger" size="sm">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expiré
        </Badge>
      );
    }
    if (days <= 3) {
      return (
        <Badge variant="danger" size="sm">
          <Clock className="w-3 h-3 mr-1" />
          {days}j
        </Badge>
      );
    }
    if (days <= 7) {
      return (
        <Badge variant="warning" size="sm">
          <Calendar className="w-3 h-3 mr-1" />
          {days}j
        </Badge>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Dossiers en cours</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Dossiers en cours</h3>
        </div>
        <div className="flex items-center gap-2">
          {drafts.length > 0 && (
            <Badge variant="primary">{drafts.length}</Badge>
          )}
          <Link href="/tenders/drafts">
            <Button variant="ghost" size="sm">
              Voir tout
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {drafts.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {drafts.map((draft) => {
              const progress = draft.tender_response?.completion_percentage || 0;

              return (
                <Link
                  key={draft.id}
                  href={draft.tender_response ? `/tenders/${draft.id}/respond` : `/tenders/${draft.id}`}
                  className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                          {STATUS_LABELS[draft.status] || draft.status}
                        </span>
                        {getUrgencyBadge(draft.deadline)}
                      </div>
                      <h4 className="font-medium text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {draft.title}
                      </h4>
                      {draft.buyer_name && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                          {draft.buyer_name}
                        </p>
                      )}

                      {/* Progress bar */}
                      {progress > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-500 dark:text-slate-400">Progression</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{progress}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                progress >= 80 ? 'bg-green-500' :
                                progress >= 50 ? 'bg-blue-500' :
                                'bg-amber-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Play className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">
              Aucun dossier en cours
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Créez un nouveau dossier pour commencer
            </p>
            <Link href="/tenders/new">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau dossier
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DraftsWidget;
