'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  LanguageIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, Badge, Modal, Select, Alert, Skeleton, ScoreGauge, EmptyState } from '@/components/ui';
import { AppLayout, PageHeader } from '@/components/layout/Sidebar';
import { CommentsThread } from '@/components/tenders/CommentsThread';
import { HistoryTimeline } from '@/components/tenders/HistoryTimeline';
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
  const [activeTab, setActiveTab] = useState<'details' | 'translations' | 'comments' | 'history'>('details');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Translation states
  const [translations, setTranslations] = useState<any[]>([]);
  const [loadingTranslations, setLoadingTranslations] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedTargetLang, setSelectedTargetLang] = useState<string>('en');
  const [selectedAiModel, setSelectedAiModel] = useState<string>('gpt-4');
  const [editingTranslation, setEditingTranslation] = useState<any | null>(null);
  const [reviewForm, setReviewForm] = useState({ title: '', description: '', quality_score: 0 });

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }, []);

  const tenderId = params.id as string;

  const fetchUser = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }, [getSupabase]);

  const fetchTender = useCallback(async () => {
    try {
      const supabase = getSupabase();
      
      // Vérifier l'accès de l'utilisateur
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté');
        router.push('/auth/login');
        return;
      }

      // Récupérer le company_id de l'utilisateur
      const { data: memberData } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!memberData?.company_id) {
        toast.error('Entreprise non trouvée');
        router.push('/tenders');
        return;
      }

      // Récupérer l'AO avec vérification company_id
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .eq('id', tenderId)
        .eq('company_id', memberData.company_id) // ⚠️ Vérification de sécurité
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast.error('Appel d\'offres non trouvé ou accès refusé');
          router.push('/tenders');
          return;
        }
        throw error;
      }
      
      setTender(data);
    } catch (error) {
      console.error('Error fetching tender:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [getSupabase, tenderId]);

  const fetchDocuments = useCallback(async () => {
    try {
      const supabase = getSupabase();
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
  }, [getSupabase, tenderId]);

  const fetchTranslations = useCallback(async () => {
    setLoadingTranslations(true);
    try {
      const response = await fetch(`/api/tenders/${tenderId}/translations`);
      if (!response.ok) throw new Error('Failed to fetch translations');
      
      const data = await response.json();
      setTranslations(data.translations || []);
    } catch (error) {
      console.error('Error fetching translations:', error);
      toast.error('Erreur lors du chargement des traductions');
    } finally {
      setLoadingTranslations(false);
    }
  }, [tenderId]);

  useEffect(() => {
    fetchUser();
    fetchTender();
    fetchDocuments();
  }, [fetchUser, fetchTender, fetchDocuments]);

  useEffect(() => {
    if (activeTab === 'translations') {
      fetchTranslations();
    }
  }, [activeTab, fetchTranslations]);

  async function createTranslation() {
    if (!tender) return;
    
    setIsTranslating(true);
    try {
      const response = await fetch(`/api/tenders/${tenderId}/translations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_lang: 'fr',
          target_lang: selectedTargetLang,
          ai_model: selectedAiModel,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Translation failed');
      }

      const data = await response.json();
      toast.success(`Traduction en ${getLanguageName(selectedTargetLang)} créée avec succès`);
      await fetchTranslations();
    } catch (error: any) {
      console.error('Error creating translation:', error);
      toast.error(error.message || 'Erreur lors de la traduction');
    } finally {
      setIsTranslating(false);
    }
  }

  async function updateTranslation() {
    if (!editingTranslation) return;

    try {
      const response = await fetch(`/api/tenders/${tenderId}/translations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          translation_id: editingTranslation.id,
          title_translated: reviewForm.title,
          description_translated: reviewForm.description,
          quality_score: reviewForm.quality_score,
        }),
      });

      if (!response.ok) throw new Error('Failed to update translation');

      toast.success('Traduction mise à jour avec succès');
      setEditingTranslation(null);
      setReviewForm({ title: '', description: '', quality_score: 0 });
      await fetchTranslations();
    } catch (error) {
      console.error('Error updating translation:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  function startEditingTranslation(translation: any) {
    setEditingTranslation(translation);
    setReviewForm({
      title: translation.title_translated || '',
      description: translation.description_translated || '',
      quality_score: translation.quality_score || 0,
    });
  }

  function getLanguageName(code: string): string {
    const languages: Record<string, string> = {
      'fr': 'Français',
      'en': 'Anglais',
      'de': 'Allemand',
      'es': 'Espagnol',
      'it': 'Italien',
      'pt': 'Portugais',
      'nl': 'Néerlandais',
      'ar-MA': 'Darija (Maroc)',
    };
    return languages[code] || code.toUpperCase();
  }

  function getLanguageFlag(code: string): string {
    const flags: Record<string, string> = {
      'fr': '🇫🇷',
      'en': '🇬🇧',
      'de': '🇩🇪',
      'es': '🇪🇸',
      'it': '🇮🇹',
      'pt': '🇵🇹',
      'nl': '🇳🇱',
      'ar-MA': '🇲🇦',
    };
    return flags[code] || '🌐';
  }

  function getQualityColor(score: number): string {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50';
    if (score >= 75) return 'text-blue-600 bg-blue-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  }

  function getQualityLabel(score: number): string {
    if (score >= 90) return 'Excellente';
    if (score >= 75) return 'Bonne';
    if (score >= 60) return 'Moyenne';
    return 'Faible';
  }

  async function updateStatus(newStatus: TenderStatus) {
    if (!tender) return;
    
    try {
      const supabase = getSupabase();
      const { error } = await (supabase as any)
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
      const supabase = getSupabase();
      // Simuler un calcul IA (à remplacer par l'appel API réel)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const score = Math.floor(Math.random() * 40) + 60; // Score entre 60 et 100
      const recommendations = [
        'Renforcer la section références',
        'Ajouter des certifications qualité',
        'Détailler la méthodologie proposée',
      ];

      const { error } = await (supabase as any)
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
      const supabase = getSupabase();
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
        description={`Référence: ${tender.reference}`}
        actions={
          <div className="flex items-center gap-2">
            {/* Bouton Continuer la réponse pour les AO en cours */}
            {['ANALYSIS', 'IN_PROGRESS', 'REVIEW', 'DRAFT'].includes(tender.status) && (
              <Link href={`/tenders/${tenderId}/respond`}>
                <Button size="sm">
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  Continuer la réponse
                </Button>
              </Link>
            )}
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
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Onglets */}
          <Card className="p-0">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'details'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Détails
                </button>
                <button
                  onClick={() => setActiveTab('translations')}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'translations'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LanguageIcon className="w-4 h-4" />
                  Traductions
                  {translations.length > 0 && (
                    <Badge variant="primary" className="ml-1">{translations.length}</Badge>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'comments'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Commentaires
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'history'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Historique
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Info Card */}
                  <div>
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
                  </div>

                  {/* Documents */}
                  <div>
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
                  </div>
                </div>
              )}

              {activeTab === 'translations' && (
                <div className="space-y-6">
                  {/* Translation Creation */}
                  <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-indigo-600 rounded-lg">
                        <LanguageIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-2">Traduire cet appel d'offres</h3>
                        <p className="text-sm text-slate-600 mb-4">
                          Générez une traduction automatique avec IA ou créez une traduction manuelle
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Langue cible
                            </label>
                            <select
                              value={selectedTargetLang}
                              onChange={(e) => setSelectedTargetLang(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              disabled={isTranslating}
                            >
                              <option value="en">🇬🇧 Anglais</option>
                              <option value="de">🇩🇪 Allemand</option>
                              <option value="es">🇪🇸 Espagnol</option>
                              <option value="it">🇮🇹 Italien</option>
                              <option value="pt">🇵🇹 Portugais</option>
                              <option value="nl">🇳🇱 Néerlandais</option>
                              <option value="ar-MA">🇲🇦 Darija (Maroc)</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Modèle IA
                            </label>
                            <select
                              value={selectedAiModel}
                              onChange={(e) => setSelectedAiModel(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              disabled={isTranslating}
                            >
                              <option value="gpt-4">GPT-4 (Haute qualité)</option>
                              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Rapide)</option>
                              <option value="claude-3">Claude 3 (Précis)</option>
                            </select>
                          </div>
                        </div>

                        <Button
                          onClick={createTranslation}
                          disabled={isTranslating || translations.some(t => t.target_lang === selectedTargetLang)}
                          variant="primary"
                        >
                          {isTranslating ? (
                            <>
                              <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                              Traduction en cours...
                            </>
                          ) : (
                            <>
                              <SparklesIcon className="w-4 h-4 mr-2" />
                              Traduire avec IA
                            </>
                          )}
                        </Button>
                        
                        {translations.some(t => t.target_lang === selectedTargetLang) && (
                          <p className="text-sm text-amber-600 mt-2 flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            Une traduction existe déjà pour cette langue
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Existing Translations */}
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <LanguageIcon className="w-5 h-5 text-indigo-600" />
                      Traductions disponibles ({translations.length})
                    </h3>

                    {loadingTranslations ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <Skeleton key={i} className="h-32" />
                        ))}
                      </div>
                    ) : translations.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                        <LanguageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h4 className="font-medium text-slate-900 mb-2">Aucune traduction</h4>
                        <p className="text-sm text-slate-500">
                          Créez votre première traduction pour étendre la portée de cet AO
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {translations.map((translation) => (
                          <motion.div
                            key={translation.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                          >
                            {/* Translation Header */}
                            <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{getLanguageFlag(translation.target_lang)}</span>
                                <div>
                                  <h4 className="font-medium text-slate-900">
                                    {getLanguageName(translation.target_lang)}
                                  </h4>
                                  <p className="text-xs text-slate-500">
                                    {translation.source_lang.toUpperCase()} → {translation.target_lang.toUpperCase()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {/* Translation Method Badge */}
                                <Badge 
                                  variant={translation.translation_method === 'AI' ? 'info' : 
                                          translation.translation_method === 'MANUAL' ? 'secondary' : 
                                          'success'}
                                >
                                  {translation.translation_method === 'AI' ? (
                                    <span className="flex items-center gap-1">
                                      <SparklesIcon className="w-3 h-3" />
                                      IA
                                    </span>
                                  ) : translation.translation_method === 'MANUAL' ? (
                                    <span className="flex items-center gap-1">
                                      <PencilIcon className="w-3 h-3" />
                                      Manuelle
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <CheckIcon className="w-3 h-3" />
                                      Hybride
                                    </span>
                                  )}
                                </Badge>

                                {/* Quality Score */}
                                {translation.quality_score && (
                                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getQualityColor(translation.quality_score)}`}>
                                    {translation.quality_score}% - {getQualityLabel(translation.quality_score)}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Translation Content */}
                            <div className="p-4 space-y-4">
                              {editingTranslation?.id === translation.id ? (
                                // Edit Mode
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                      Titre traduit
                                    </label>
                                    <input
                                      type="text"
                                      value={reviewForm.title}
                                      onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                      placeholder="Entrez le titre traduit..."
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                      Description traduite
                                    </label>
                                    <textarea
                                      value={reviewForm.description}
                                      onChange={(e) => setReviewForm({ ...reviewForm, description: e.target.value })}
                                      rows={6}
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                      placeholder="Entrez la description traduite..."
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                      Score de qualité: {reviewForm.quality_score}%
                                    </label>
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      step="5"
                                      value={reviewForm.quality_score}
                                      onChange={(e) => setReviewForm({ ...reviewForm, quality_score: Number(e.target.value) })}
                                      className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                                      <span>0%</span>
                                      <span>50%</span>
                                      <span>100%</span>
                                    </div>
                                  </div>

                                  <div className="flex gap-2 pt-2">
                                    <Button onClick={updateTranslation} variant="primary" size="sm">
                                      <CheckIcon className="w-4 h-4 mr-2" />
                                      Enregistrer
                                    </Button>
                                    <Button 
                                      onClick={() => {
                                        setEditingTranslation(null);
                                        setReviewForm({ title: '', description: '', quality_score: 0 });
                                      }} 
                                      variant="ghost" 
                                      size="sm"
                                    >
                                      Annuler
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                // View Mode
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs text-slate-500 mb-1">Titre</p>
                                    <p className="font-medium text-slate-900">
                                      {translation.title_translated || tender.title}
                                    </p>
                                  </div>

                                  {translation.description_translated && (
                                    <div>
                                      <p className="text-xs text-slate-500 mb-1">Description</p>
                                      <p className="text-sm text-slate-700 line-clamp-3">
                                        {translation.description_translated}
                                      </p>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                      {translation.ai_model && (
                                        <span className="flex items-center gap-1">
                                          <SparklesIcon className="w-3 h-3" />
                                          {translation.ai_model}
                                        </span>
                                      )}
                                      {translation.reviewed_by && (
                                        <span className="flex items-center gap-1">
                                          <CheckCircleIcon className="w-3 h-3 text-emerald-500" />
                                          Révisé
                                        </span>
                                      )}
                                      <span>{formatDate(translation.created_at)}</span>
                                    </div>

                                    <Button
                                      onClick={() => startEditingTranslation(translation)}
                                      variant="ghost"
                                      size="sm"
                                    >
                                      <PencilIcon className="w-4 h-4 mr-2" />
                                      Réviser
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'comments' && currentUserId && (
                <CommentsThread tenderId={tenderId} currentUserId={currentUserId} />
              )}

              {activeTab === 'history' && (
                <HistoryTimeline tenderId={tenderId} />
              )}
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
