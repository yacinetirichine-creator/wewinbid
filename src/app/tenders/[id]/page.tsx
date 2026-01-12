'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  UserGroupIcon,
  LinkIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, Badge, Modal, Select, Alert, Skeleton, ScoreGauge, EmptyState } from '@/components/ui';
import { AppLayout, PageHeader } from '@/components/layout/Sidebar';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate, getDaysRemaining, getScoreColor } from '@/lib/utils';
import { getCountryConfig, getRequiredDocuments } from '@/lib/countries';
import type { Tender, TenderStatus, Document as TenderDocument } from '@/types/database';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<TenderStatus, { label: string; color: string; icon: typeof CheckCircleIcon }> = {
  DRAFT: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700', icon: DocumentTextIcon },
  ANALYSIS: { label: 'Analyse', color: 'bg-blue-100 text-blue-700', icon: ChartBarIcon },
  IN_PROGRESS: { label: 'En cours', color: 'bg-amber-100 text-amber-700', icon: ClockIcon },
  REVIEW: { label: 'Révision', color: 'bg-purple-100 text-purple-700', icon: ArrowPathIcon },
  SUBMITTED: { label: 'Soumis', color: 'bg-cyan-100 text-cyan-700', icon: CheckCircleIcon },
  WON: { label: 'Gagné', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircleIcon },
  LOST: { label: 'Perdu', color: 'bg-rose-100 text-rose-700', icon: XCircleIcon },
  ABANDONED: { label: 'Abandonné', color: 'bg-slate-100 text-slate-500', icon: XCircleIcon },
};

export default function TenderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tender, setTender] = useState<Tender | null>(null);
  const [documents, setDocuments] = useState<TenderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const supabase = createClient();

  const tenderId = params.id as string;

  useEffect(() => {
    fetchTender();
    fetchDocuments();
  }, [tenderId]);

  async function fetchTender() {
    try {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .eq('id', tenderId)
        .single();

      if (error) throw error;
      setTender(data);
    } catch (error) {
      console.error('Error fetching tender:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function fetchDocuments() {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('tender_id', tenderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }

  async function updateStatus(newStatus: TenderStatus) {
    if (!tender) return;
    
    try {
      const { error } = await supabase
        .from('tenders')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString(),
          ...(newStatus === 'SUBMITTED' ? { submission_date: new Date().toISOString() } : {}),
        })
        .eq('id', tenderId);

      if (error) throw error;

      setTender({ ...tender, status: newStatus });
      setShowStatusModal(false);
      toast.success('Statut mis à jour');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  async function calculateAIScore() {
    setIsCalculatingScore(true);
    try {
      // Simuler un calcul IA (à remplacer par l'appel API réel)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const score = Math.floor(Math.random() * 40) + 60; // Score entre 60 et 100
      const recommendations = [
        'Renforcer la section références',
        'Ajouter des certifications qualité',
        'Détailler la méthodologie proposée',
      ];

      const { error } = await supabase
        .from('tenders')
        .update({ 
          ai_score: score,
          ai_recommendations: recommendations,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tenderId);

      if (error) throw error;

      setTender(prev => prev ? { 
        ...prev, 
        ai_score: score,
        ai_recommendations: recommendations,
      } : null);

      toast.success(`Score IA calculé : ${score}%`);
    } catch (error) {
      console.error('Error calculating score:', error);
      toast.error('Erreur lors du calcul');
    } finally {
      setIsCalculatingScore(false);
    }
  }

  async function deleteTender() {
    try {
      const { error } = await supabase
        .from('tenders')
        .delete()
        .eq('id', tenderId);

      if (error) throw error;

      toast.success('Appel d\'offres supprimé');
      router.push('/tenders');
    } catch (error) {
      console.error('Error deleting tender:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-64" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!tender) {
    return (
      <AppLayout>
        <EmptyState
          icon={<DocumentTextIcon className="w-12 h-12" />}
          title="AO non trouvé"
          description="Cet appel d'offres n'existe pas ou a été supprimé."
          action={
            <Link href="/tenders">
              <Button>Retour aux AO</Button>
            </Link>
          }
        />
      </AppLayout>
    );
  }

  const statusConfig = STATUS_CONFIG[tender.status];
  const StatusIcon = statusConfig.icon;
  const daysRemaining = tender.deadline ? getDaysRemaining(tender.deadline) : null;
  const isUrgent = daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0;
  const isOverdue = daysRemaining !== null && daysRemaining < 0;
  const countryConfig = getCountryConfig('FR'); // TODO: stocker le pays dans le tender
  const requiredDocs = getRequiredDocuments('FR', tender.type);

  return (
    <AppLayout>
      <PageHeader
        title={tender.title}
        subtitle={`Référence: ${tender.reference}`}
        backLink="/tenders"
      >
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowStatusModal(true)}>
            <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${statusConfig.color}`}>
              <StatusIcon className="w-4 h-4" />
              {statusConfig.label}
            </div>
          </Button>
          <Link href={`/tenders/${tenderId}/edit`}>
            <Button variant="secondary" size="sm">
              <PencilIcon className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </Link>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Card */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge variant={tender.type === 'PUBLIC' ? 'info' : 'secondary'}>
                  {tender.type === 'PUBLIC' ? 'Marché Public' : 'Marché Privé'}
                </Badge>
                {tender.sector && (
                  <Badge variant="secondary">{tender.sector}</Badge>
                )}
              </div>
              {tender.source_url && (
                <a 
                  href={tender.source_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm"
                >
                  <LinkIcon className="w-4 h-4" />
                  Source
                </a>
              )}
            </div>

            {tender.description && (
              <p className="text-slate-600 mb-6">{tender.description}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Acheteur</p>
                <div className="flex items-center gap-2">
                  <BuildingOfficeIcon className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-900">{tender.buyer_name || '-'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Valeur estimée</p>
                <div className="flex items-center gap-2">
                  <CurrencyEuroIcon className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-900">
                    {tender.estimated_value ? formatCurrency(Number(tender.estimated_value), 'EUR') : '-'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Date limite</p>
                <div className={`flex items-center gap-2 ${
                  isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-600' : ''
                }`}>
                  <CalendarIcon className="w-4 h-4" />
                  <span className="font-medium">
                    {tender.deadline ? formatDate(tender.deadline) : '-'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Jours restants</p>
                <div className={`flex items-center gap-2 ${
                  isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-slate-900'
                }`}>
                  <ClockIcon className="w-4 h-4" />
                  <span className="font-medium">
                    {daysRemaining !== null ? (
                      isOverdue ? 'Expiré' : `J-${daysRemaining}`
                    ) : '-'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Documents */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Documents</h3>
              <Button variant="secondary" size="sm">
                <PlusIcon className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">Aucun document pour cet AO</p>
                <Button variant="secondary" size="sm">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Ajouter un document
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <DocumentTextIcon className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900">{doc.name}</p>
                        <p className="text-xs text-slate-500">{doc.type}</p>
                      </div>
                    </div>
                    <Badge variant={
                      doc.status === 'VALIDATED' ? 'success' :
                      doc.status === 'REVIEW' ? 'warning' : 'secondary'
                    } size="sm">
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Checklist des documents requis */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="font-medium text-slate-700 mb-3">Documents requis ({tender.type})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {requiredDocs.filter(d => d.mandatory).slice(0, 8).map((doc) => {
                  const hasDoc = documents.some(d => d.type === doc.type);
                  return (
                    <div
                      key={doc.type}
                      className={`flex items-center gap-2 p-2 rounded text-sm ${
                        hasDoc ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {hasDoc ? (
                        <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircleIcon className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="truncate">{doc.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Score IA */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Score IA</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={calculateAIScore}
                loading={isCalculatingScore}
              >
                <SparklesIcon className="w-4 h-4 mr-1" />
                {tender.ai_score ? 'Recalculer' : 'Calculer'}
              </Button>
            </div>

            {tender.ai_score !== null ? (
              <div className="text-center">
                <ScoreGauge score={tender.ai_score} size="lg" />
                <p className="text-sm text-slate-500 mt-2">
                  Probabilité de succès estimée
                </p>

                {tender.ai_recommendations && tender.ai_recommendations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 text-left">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      Recommandations
                    </h4>
                    <ul className="space-y-2">
                      {tender.ai_recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <SparklesIcon className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <SparklesIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-4">
                  Calculez votre score de compatibilité IA
                </p>
                <Button 
                  onClick={calculateAIScore}
                  loading={isCalculatingScore}
                  className="bg-gradient-to-r from-primary-600 to-secondary-600"
                >
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  Analyser
                </Button>
              </div>
            )}
          </Card>

          {/* Contact acheteur */}
          {(tender.buyer_contact || tender.buyer_email || tender.buyer_phone) && (
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Contact acheteur</h3>
              <div className="space-y-3">
                {tender.buyer_contact && (
                  <div className="flex items-center gap-3">
                    <UserGroupIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{tender.buyer_contact}</span>
                  </div>
                )}
                {tender.buyer_email && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-primary-600 hover:underline">
                      <a href={`mailto:${tender.buyer_email}`}>{tender.buyer_email}</a>
                    </span>
                  </div>
                )}
                {tender.buyer_phone && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">{tender.buyer_phone}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Notes */}
          {tender.notes && (
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Notes</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{tender.notes}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Modal changement de statut */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Changer le statut"
      >
        <div className="space-y-3">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={status}
                onClick={() => updateStatus(status as TenderStatus)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                  tender.status === status
                    ? 'ring-2 ring-primary-500 bg-primary-50'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-medium text-slate-900">{config.label}</span>
                {tender.status === status && (
                  <CheckCircleIcon className="w-5 h-5 text-primary-600 ml-auto" />
                )}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Modal suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer l'appel d'offres"
      >
        <p className="text-slate-600 mb-6">
          Êtes-vous sûr de vouloir supprimer cet appel d'offres ? Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={deleteTender}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
