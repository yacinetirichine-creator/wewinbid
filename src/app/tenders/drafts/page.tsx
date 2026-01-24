'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FileText,
  Clock,
  Calendar,
  Euro,
  Play,
  Trash2,
  ArrowRight,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Building2,
  Briefcase,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface DraftTender {
  id: string;
  reference: string;
  title: string;
  buyer_name: string;
  deadline: string;
  estimated_value: number;
  status: string;
  ai_score?: number;
  created_at: string;
  updated_at: string;
  tender_response?: {
    id: string;
    current_step: number;
    completion_percentage: number;
    updated_at: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: 'Brouillon', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  ANALYSIS: { label: 'En analyse', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  IN_PROGRESS: { label: 'En cours', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  REVIEW: { label: 'En révision', color: 'text-purple-600', bgColor: 'bg-purple-100' },
};

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftTender[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchDrafts = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch tenders with in-progress statuses
      const { data: tenders, error } = await supabase
        .from('tenders')
        .select(`
          *,
          tender_response:tender_responses(
            id,
            current_step,
            completion_percentage,
            updated_at
          )
        `)
        .in('status', ['DRAFT', 'ANALYSIS', 'IN_PROGRESS', 'REVIEW'])
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Flatten tender_response (it comes as array)
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
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleDelete = async (tenderId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce dossier ?')) return;

    try {
      const supabase = createClient();
      await supabase.from('tenders').delete().eq('id', tenderId);
      await fetchDrafts();
    } catch (error) {
      console.error('Error deleting tender:', error);
    }
  };

  const filteredDrafts = drafts.filter(draft => {
    const matchesSearch =
      draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || draft.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getUrgencyColor = (days: number) => {
    if (days < 0) return 'text-red-600 bg-red-50';
    if (days <= 3) return 'text-red-600 bg-red-50';
    if (days <= 7) return 'text-amber-600 bg-amber-50';
    return 'text-green-600 bg-green-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Briefcase className="h-7 w-7 text-blue-600" />
                Dossiers en cours
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {filteredDrafts.length} dossier{filteredDrafts.length > 1 ? 's' : ''} en cours de rédaction
              </p>
            </div>

            <Link
              href="/tenders/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="h-5 w-5" />
              Nouveau dossier
            </Link>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mt-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un dossier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900"
              >
                <option value="all">Tous les statuts</option>
                <option value="DRAFT">Brouillon</option>
                <option value="ANALYSIS">En analyse</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="REVIEW">En révision</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filteredDrafts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Aucun dossier en cours
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Commencez par créer un nouveau dossier ou analyser un appel d&apos;offres
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/tenders/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Créer un dossier
              </Link>
              <Link
                href="/tenders/analyze"
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Analyser un AO
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDrafts.map((draft, index) => {
              const daysLeft = draft.deadline ? getDaysUntilDeadline(draft.deadline) : null;
              const statusConfig = STATUS_CONFIG[draft.status] || STATUS_CONFIG.DRAFT;
              const progress = draft.tender_response?.completion_percentage || 0;

              return (
                <motion.div
                  key={draft.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={draft.tender_response ? `/tenders/${draft.id}/respond` : `/tenders/${draft.id}`}
                    className="block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                          {draft.reference && (
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              {draft.reference}
                            </span>
                          )}
                          {draft.ai_score && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              draft.ai_score >= 70 ? 'bg-green-100 text-green-700' :
                              draft.ai_score >= 50 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {draft.ai_score}% compatible
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {draft.title}
                        </h3>

                        {/* Buyer */}
                        {draft.buyer_name && (
                          <div className="flex items-center gap-2 mt-1 text-slate-600 dark:text-slate-400">
                            <Building2 className="h-4 w-4" />
                            <span>{draft.buyer_name}</span>
                          </div>
                        )}

                        {/* Meta info */}
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          {draft.deadline && daysLeft !== null && (
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${getUrgencyColor(daysLeft)}`}>
                              <Calendar className="h-4 w-4" />
                              <span>
                                {daysLeft < 0 ? 'Échéance dépassée' :
                                 daysLeft === 0 ? 'Aujourd\'hui' :
                                 daysLeft === 1 ? 'Demain' :
                                 `${daysLeft} jours`}
                              </span>
                            </div>
                          )}

                          {draft.estimated_value > 0 && (
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <Euro className="h-4 w-4" />
                              <span>{new Intl.NumberFormat('fr-FR').format(draft.estimated_value)} €</span>
                            </div>
                          )}

                          {draft.tender_response && (
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <Clock className="h-4 w-4" />
                              <span>
                                Modifié {new Date(draft.tender_response.updated_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Progress bar */}
                        {progress > 0 && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-slate-600 dark:text-slate-400">Progression</span>
                              <span className="font-medium text-slate-900 dark:text-white">{progress}%</span>
                            </div>
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDelete(draft.id, e)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>

                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg group-hover:bg-blue-700 transition-colors">
                          <Play className="h-4 w-4" />
                          <span>Continuer</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Stats summary */}
        {filteredDrafts.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {drafts.filter(d => d.status === 'DRAFT').length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Brouillons</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {drafts.filter(d => d.status === 'IN_PROGRESS').length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">En cours</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {drafts.filter(d => d.status === 'REVIEW').length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">En révision</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold text-amber-600">
                {drafts.filter(d => {
                  const days = d.deadline ? getDaysUntilDeadline(d.deadline) : 999;
                  return days >= 0 && days <= 7;
                }).length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Urgents (&lt;7j)</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
