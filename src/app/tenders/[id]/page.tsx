'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate, getDaysRemaining, getScoreColor } from '@/lib/utils';
import { getCountryConfig, getRequiredDocuments } from '@/lib/countries';
import type { Tender, TenderStatus, Document as TenderDocument } from '@/types/database';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<
  TenderStatus,
  { labelKey: string; color: string; icon: typeof CheckCircleIcon }
> = {
  DRAFT: { labelKey: 'tenders.detail.status.draft', color: 'bg-slate-100 text-slate-700', icon: DocumentTextIcon },
  ANALYSIS: { labelKey: 'tenders.detail.status.analysis', color: 'bg-blue-100 text-blue-700', icon: ChartBarIcon },
  IN_PROGRESS: { labelKey: 'tenders.detail.status.inProgress', color: 'bg-amber-100 text-amber-700', icon: ClockIcon },
  REVIEW: { labelKey: 'tenders.detail.status.review', color: 'bg-purple-100 text-purple-700', icon: ArrowPathIcon },
  SUBMITTED: { labelKey: 'tenders.detail.status.submitted', color: 'bg-cyan-100 text-cyan-700', icon: CheckCircleIcon },
  WON: { labelKey: 'tenders.detail.status.won', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircleIcon },
  LOST: { labelKey: 'tenders.detail.status.lost', color: 'bg-rose-100 text-rose-700', icon: XCircleIcon },
  ABANDONED: { labelKey: 'tenders.detail.status.abandoned', color: 'bg-slate-100 text-slate-500', icon: XCircleIcon },
};

export default function TenderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLocale();

  const entries = useMemo(
    () => ({
      ...(locale === 'fr' ? {
        // Status
        'tenders.detail.status.draft': 'Brouillon',
        'tenders.detail.status.analysis': 'Analyse',
        'tenders.detail.status.inProgress': 'En cours',
        'tenders.detail.status.review': 'Révision',
        'tenders.detail.status.submitted': 'Soumis',
        'tenders.detail.status.won': 'Gagné',
        'tenders.detail.status.lost': 'Perdu',
        'tenders.detail.status.abandoned': 'Abandonné',

        // Toasts
        'tenders.detail.toast.mustBeLoggedIn': 'Vous devez être connecté',
        'tenders.detail.toast.companyNotFound': 'Entreprise non trouvée',
        'tenders.detail.toast.tenderNotFoundOrDenied': 'Appel d\'offres non trouvé ou accès refusé',
        'tenders.detail.toast.loadError': 'Erreur lors du chargement',
        'tenders.detail.toast.loadTranslationsError': 'Erreur lors du chargement des traductions',
        'tenders.detail.toast.translationCreated': 'Traduction en {language} créée avec succès',
        'tenders.detail.toast.translationError': 'Erreur lors de la traduction',
        'tenders.detail.toast.translationUpdated': 'Traduction mise à jour avec succès',
        'tenders.detail.toast.updateError': 'Erreur lors de la mise à jour',
        'tenders.detail.toast.statusUpdated': 'Statut mis à jour',
        'tenders.detail.toast.aiScoreCalculated': 'Score IA calculé : {score}%',
        'tenders.detail.toast.aiScoreError': 'Erreur lors du calcul',
        'tenders.detail.toast.tenderDeleted': 'Appel d\'offres supprimé',
        'tenders.detail.toast.deleteError': 'Erreur lors de la suppression',

        // Languages
        'tenders.detail.language.fr': 'Français',
        'tenders.detail.language.en': 'Anglais',
        'tenders.detail.language.de': 'Allemand',
        'tenders.detail.language.es': 'Espagnol',
        'tenders.detail.language.it': 'Italien',
        'tenders.detail.language.pt': 'Portugais',
        'tenders.detail.language.nl': 'Néerlandais',
        'tenders.detail.language.arMA': 'Darija (Maroc)',

        // Quality
        'tenders.detail.quality.excellent': 'Excellent',
        'tenders.detail.quality.good': 'Bon',
        'tenders.detail.quality.average': 'Moyen',
        'tenders.detail.quality.low': 'Faible',

        // Empty state
        'tenders.detail.empty.title': 'Appel d\'offres non trouvé',
        'tenders.detail.empty.description': 'Cet appel d\'offres n\'existe pas ou a été supprimé.',
        'tenders.detail.empty.back': 'Retour aux appels d\'offres',

        // Actions
        'tenders.detail.reference': 'Référence : {reference}',
        'tenders.detail.actions.continueResponse': 'Continuer la réponse',
        'tenders.detail.actions.edit': 'Modifier',

        // Tabs
        'tenders.detail.tabs.details': 'Détails',
        'tenders.detail.tabs.translations': 'Traductions',
        'tenders.detail.tabs.comments': 'Commentaires',
        'tenders.detail.tabs.history': 'Historique',

        // Type
        'tenders.detail.type.public': 'Marché public',
        'tenders.detail.type.private': 'Marché privé',
        'tenders.detail.source': 'Source',

        // Fields
        'tenders.detail.fields.buyer': 'Acheteur',
        'tenders.detail.fields.estimatedValue': 'Valeur estimée',
        'tenders.detail.fields.deadline': 'Date limite',
        'tenders.detail.fields.daysRemaining': 'Jours restants',
        'tenders.detail.deadline.expired': 'Expiré',
        'tenders.detail.deadline.dMinus': 'J-{days}',

        // Documents
        'tenders.detail.documents.title': 'Documents',
        'tenders.detail.documents.add': 'Ajouter',
        'tenders.detail.documents.empty': 'Aucun document pour cet appel d\'offres',
        'tenders.detail.documents.addOne': 'Ajouter un document',
        'tenders.detail.documents.required': 'Documents requis ({type})',

        // Translations
        'tenders.detail.translations.cardTitle': 'Traduire cet appel d\'offres',
        'tenders.detail.translations.cardSubtitle': 'Générez une traduction automatique par IA ou créez une traduction manuelle.',
        'tenders.detail.translations.targetLanguage': 'Langue cible',
        'tenders.detail.translations.aiModel': 'Modèle IA',
        'tenders.detail.translations.model.gpt4': 'GPT-4 (Haute qualité)',
        'tenders.detail.translations.model.gpt35': 'GPT-3.5 Turbo (Rapide)',
        'tenders.detail.translations.model.claude3': 'Claude 3 (Précis)',
        'tenders.detail.translations.inProgress': 'Traduction en cours…',
        'tenders.detail.translations.translateWithAi': 'Traduire avec l\'IA',
        'tenders.detail.translations.alreadyExists': 'Une traduction existe déjà pour cette langue',
        'tenders.detail.translations.available': 'Traductions disponibles ({count})',
        'tenders.detail.translations.none.title': 'Aucune traduction',
        'tenders.detail.translations.none.desc': 'Créez votre première traduction pour étendre la portée de cet appel d\'offres',
        'tenders.detail.translations.method.ai': 'IA',
        'tenders.detail.translations.method.manual': 'Manuelle',
        'tenders.detail.translations.method.hybrid': 'Hybride',
        'tenders.detail.translations.form.translatedTitle': 'Titre traduit',
        'tenders.detail.translations.form.translatedTitle.placeholder': 'Saisissez le titre traduit…',
        'tenders.detail.translations.form.translatedDescription': 'Description traduite',
        'tenders.detail.translations.form.translatedDescription.placeholder': 'Saisissez la description traduite…',
        'tenders.detail.translations.form.qualityScore': 'Score de qualité : {score}%',
        'tenders.detail.translations.form.save': 'Enregistrer',
        'tenders.detail.translations.form.cancel': 'Annuler',
        'tenders.detail.translations.view.title': 'Titre',
        'tenders.detail.translations.view.description': 'Description',
        'tenders.detail.translations.view.reviewed': 'Validée',
        'tenders.detail.translations.view.review': 'Valider',

        // AI Score
        'tenders.detail.aiScore.title': 'Score IA',
        'tenders.detail.aiScore.calculate': 'Calculer',
        'tenders.detail.aiScore.recalculate': 'Recalculer',
        'tenders.detail.aiScore.estimated': 'Probabilité de succès estimée',
        'tenders.detail.aiScore.recommendations': 'Recommandations',
        'tenders.detail.aiScore.empty': 'Calculez votre score de compatibilité IA',
        'tenders.detail.aiScore.analyze': 'Analyser',
        'tenders.detail.aiScore.reco1': 'Renforcer la section références',
        'tenders.detail.aiScore.reco2': 'Ajouter des certifications qualité',
        'tenders.detail.aiScore.reco3': 'Détailler la méthodologie proposée',

        // Buyer contact & Notes
        'tenders.detail.buyerContact.title': 'Contact acheteur',
        'tenders.detail.notes.title': 'Notes',

        // Modals
        'tenders.detail.modal.status.title': 'Changer le statut',
        'tenders.detail.modal.delete.title': 'Supprimer l\'appel d\'offres',
        'tenders.detail.modal.delete.body': 'Êtes-vous sûr de vouloir supprimer cet appel d\'offres ? Cette action est irréversible.',
        'tenders.detail.modal.delete.cancel': 'Annuler',
        'tenders.detail.modal.delete.confirm': 'Supprimer',
      } : {
        // English translations
        'tenders.detail.status.draft': 'Draft',
        'tenders.detail.status.analysis': 'Analysis',
        'tenders.detail.status.inProgress': 'In progress',
        'tenders.detail.status.review': 'Review',
        'tenders.detail.status.submitted': 'Submitted',
        'tenders.detail.status.won': 'Won',
        'tenders.detail.status.lost': 'Lost',
        'tenders.detail.status.abandoned': 'Abandoned',

        'tenders.detail.toast.mustBeLoggedIn': 'You must be signed in',
        'tenders.detail.toast.companyNotFound': 'Company not found',
        'tenders.detail.toast.tenderNotFoundOrDenied': 'Tender not found or access denied',
        'tenders.detail.toast.loadError': 'Error while loading',
        'tenders.detail.toast.loadTranslationsError': 'Error while loading translations',
        'tenders.detail.toast.translationCreated': 'Translation to {language} created successfully',
        'tenders.detail.toast.translationError': 'Error while translating',
        'tenders.detail.toast.translationUpdated': 'Translation updated successfully',
        'tenders.detail.toast.updateError': 'Error while updating',
        'tenders.detail.toast.statusUpdated': 'Status updated',
        'tenders.detail.toast.aiScoreCalculated': 'AI score calculated: {score}%',
        'tenders.detail.toast.aiScoreError': 'Error while calculating',
        'tenders.detail.toast.tenderDeleted': 'Tender deleted',
        'tenders.detail.toast.deleteError': 'Error while deleting',

        'tenders.detail.language.fr': 'French',
        'tenders.detail.language.en': 'English',
        'tenders.detail.language.de': 'German',
        'tenders.detail.language.es': 'Spanish',
        'tenders.detail.language.it': 'Italian',
        'tenders.detail.language.pt': 'Portuguese',
        'tenders.detail.language.nl': 'Dutch',
        'tenders.detail.language.arMA': 'Darija (Morocco)',

        'tenders.detail.quality.excellent': 'Excellent',
        'tenders.detail.quality.good': 'Good',
        'tenders.detail.quality.average': 'Average',
        'tenders.detail.quality.low': 'Low',

        'tenders.detail.empty.title': 'Tender not found',
        'tenders.detail.empty.description': 'This tender does not exist or has been deleted.',
        'tenders.detail.empty.back': 'Back to tenders',

        'tenders.detail.reference': 'Reference: {reference}',
        'tenders.detail.actions.continueResponse': 'Continue response',
        'tenders.detail.actions.edit': 'Edit',

        'tenders.detail.tabs.details': 'Details',
        'tenders.detail.tabs.translations': 'Translations',
        'tenders.detail.tabs.comments': 'Comments',
        'tenders.detail.tabs.history': 'History',

        'tenders.detail.type.public': 'Public procurement',
        'tenders.detail.type.private': 'Private procurement',
        'tenders.detail.source': 'Source',

        'tenders.detail.fields.buyer': 'Buyer',
        'tenders.detail.fields.estimatedValue': 'Estimated value',
        'tenders.detail.fields.deadline': 'Deadline',
        'tenders.detail.fields.daysRemaining': 'Days remaining',
        'tenders.detail.deadline.expired': 'Expired',
        'tenders.detail.deadline.dMinus': 'D-{days}',

        'tenders.detail.documents.title': 'Documents',
        'tenders.detail.documents.add': 'Add',
        'tenders.detail.documents.empty': 'No documents for this tender',
        'tenders.detail.documents.addOne': 'Add a document',
        'tenders.detail.documents.required': 'Required documents ({type})',

        'tenders.detail.translations.cardTitle': 'Translate this tender',
        'tenders.detail.translations.cardSubtitle': 'Generate an automatic AI translation or create a manual translation.',
        'tenders.detail.translations.targetLanguage': 'Target language',
        'tenders.detail.translations.aiModel': 'AI model',
        'tenders.detail.translations.model.gpt4': 'GPT-4 (High quality)',
        'tenders.detail.translations.model.gpt35': 'GPT-3.5 Turbo (Fast)',
        'tenders.detail.translations.model.claude3': 'Claude 3 (Accurate)',
        'tenders.detail.translations.inProgress': 'Translation in progress…',
        'tenders.detail.translations.translateWithAi': 'Translate with AI',
        'tenders.detail.translations.alreadyExists': 'A translation already exists for this language',
        'tenders.detail.translations.available': 'Available translations ({count})',
        'tenders.detail.translations.none.title': 'No translations',
        'tenders.detail.translations.none.desc': 'Create your first translation to expand the reach of this tender',
        'tenders.detail.translations.method.ai': 'AI',
        'tenders.detail.translations.method.manual': 'Manual',
        'tenders.detail.translations.method.hybrid': 'Hybrid',
        'tenders.detail.translations.form.translatedTitle': 'Translated title',
        'tenders.detail.translations.form.translatedTitle.placeholder': 'Enter the translated title…',
        'tenders.detail.translations.form.translatedDescription': 'Translated description',
        'tenders.detail.translations.form.translatedDescription.placeholder': 'Enter the translated description…',
        'tenders.detail.translations.form.qualityScore': 'Quality score: {score}%',
        'tenders.detail.translations.form.save': 'Save',
        'tenders.detail.translations.form.cancel': 'Cancel',
        'tenders.detail.translations.view.title': 'Title',
        'tenders.detail.translations.view.description': 'Description',
        'tenders.detail.translations.view.reviewed': 'Reviewed',
        'tenders.detail.translations.view.review': 'Review',

        'tenders.detail.aiScore.title': 'AI score',
        'tenders.detail.aiScore.calculate': 'Calculate',
        'tenders.detail.aiScore.recalculate': 'Recalculate',
        'tenders.detail.aiScore.estimated': 'Estimated probability of success',
        'tenders.detail.aiScore.recommendations': 'Recommendations',
        'tenders.detail.aiScore.empty': 'Calculate your AI compatibility score',
        'tenders.detail.aiScore.analyze': 'Analyze',
        'tenders.detail.aiScore.reco1': 'Strengthen the references section',
        'tenders.detail.aiScore.reco2': 'Add quality certifications',
        'tenders.detail.aiScore.reco3': 'Detail the proposed methodology',

        'tenders.detail.buyerContact.title': 'Buyer contact',
        'tenders.detail.notes.title': 'Notes',

        'tenders.detail.modal.status.title': 'Change status',
        'tenders.detail.modal.delete.title': 'Delete tender',
        'tenders.detail.modal.delete.body': 'Are you sure you want to delete this tender? This action cannot be undone.',
        'tenders.detail.modal.delete.cancel': 'Cancel',
        'tenders.detail.modal.delete.confirm': 'Delete',
      }),
    }),
    [locale]
  );

  const { t } = useUiTranslations(locale, entries);

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
        toast.error(t('tenders.detail.toast.mustBeLoggedIn'));
        router.push('/auth/login');
        return;
      }

      // Récupérer le company_id de l'utilisateur
      const { data: memberData } = await (supabase
        .from('company_members') as any)
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!memberData?.company_id) {
        toast.error(t('tenders.detail.toast.companyNotFound'));
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
          toast.error(t('tenders.detail.toast.tenderNotFoundOrDenied'));
          router.push('/tenders');
          return;
        }
        throw error;
      }
      
      setTender(data);
    } catch (error) {
      console.error('Error fetching tender:', error);
      toast.error(t('tenders.detail.toast.loadError'));
    } finally {
      setLoading(false);
    }
  }, [getSupabase, router, t, tenderId]);

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
      toast.error(t('tenders.detail.toast.loadTranslationsError'));
    } finally {
      setLoadingTranslations(false);
    }
  }, [t, tenderId]);

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
      toast.success(t('tenders.detail.toast.translationCreated', { language: getLanguageName(selectedTargetLang) }));
      await fetchTranslations();
    } catch (error: any) {
      console.error('Error creating translation:', error);
      toast.error(error.message || t('tenders.detail.toast.translationError'));
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

      toast.success(t('tenders.detail.toast.translationUpdated'));
      setEditingTranslation(null);
      setReviewForm({ title: '', description: '', quality_score: 0 });
      await fetchTranslations();
    } catch (error) {
      console.error('Error updating translation:', error);
      toast.error(t('tenders.detail.toast.updateError'));
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
      fr: 'tenders.detail.language.fr',
      en: 'tenders.detail.language.en',
      de: 'tenders.detail.language.de',
      es: 'tenders.detail.language.es',
      it: 'tenders.detail.language.it',
      pt: 'tenders.detail.language.pt',
      nl: 'tenders.detail.language.nl',
      'ar-MA': 'tenders.detail.language.arMA',
    };
    const key = languages[code];
    return key ? t(key) : code.toUpperCase();
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
    if (score >= 90) return t('tenders.detail.quality.excellent');
    if (score >= 75) return t('tenders.detail.quality.good');
    if (score >= 60) return t('tenders.detail.quality.average');
    return t('tenders.detail.quality.low');
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
      toast.success(t('tenders.detail.toast.statusUpdated'));
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('tenders.detail.toast.updateError'));
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
        t('tenders.detail.aiScore.reco1'),
        t('tenders.detail.aiScore.reco2'),
        t('tenders.detail.aiScore.reco3'),
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

      toast.success(t('tenders.detail.toast.aiScoreCalculated', { score }));
    } catch (error) {
      console.error('Error calculating score:', error);
      toast.error(t('tenders.detail.toast.aiScoreError'));
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

      toast.success(t('tenders.detail.toast.tenderDeleted'));
      router.push('/tenders');
    } catch (error) {
      console.error('Error deleting tender:', error);
      toast.error(t('tenders.detail.toast.deleteError'));
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
          title={t('tenders.detail.empty.title')}
          description={t('tenders.detail.empty.description')}
          action={
            <Link href="/tenders">
              <Button>{t('tenders.detail.empty.back')}</Button>
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
        description={t('tenders.detail.reference', { reference: tender.reference })}
        actions={
          <div className="flex items-center gap-2">
            {/* Bouton Continuer la réponse pour les AO en cours */}
            {['ANALYSIS', 'IN_PROGRESS', 'REVIEW', 'DRAFT'].includes(tender.status) && (
              <Link href={`/tenders/${tenderId}/respond`}>
                <Button size="sm">
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  {t('tenders.detail.actions.continueResponse')}
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowStatusModal(true)}>
              <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${statusConfig.color}`}>
                <StatusIcon className="w-4 h-4" />
                {t(statusConfig.labelKey)}
              </div>
            </Button>
            <Link href={`/tenders/${tenderId}/edit`}>
              <Button variant="secondary" size="sm">
                <PencilIcon className="w-4 h-4 mr-2" />
                {t('tenders.detail.actions.edit')}
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
                  {t('tenders.detail.tabs.details')}
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
                  {t('tenders.detail.tabs.translations')}
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
                  {t('tenders.detail.tabs.comments')}
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'history'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('tenders.detail.tabs.history')}
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
                          {tender.type === 'PUBLIC'
                            ? t('tenders.detail.type.public')
                            : t('tenders.detail.type.private')}
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
                          {t('tenders.detail.source')}
                        </a>
                      )}
                    </div>

                    {tender.description && (
                      <p className="text-slate-600 mb-6">{tender.description}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">{t('tenders.detail.fields.buyer')}</p>
                        <div className="flex items-center gap-2">
                          <BuildingOfficeIcon className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-900">{tender.buyer_name || '-'}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">{t('tenders.detail.fields.estimatedValue')}</p>
                        <div className="flex items-center gap-2">
                          <CurrencyEuroIcon className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-900">
                            {tender.estimated_value ? formatCurrency(Number(tender.estimated_value), 'EUR') : '-'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">{t('tenders.detail.fields.deadline')}</p>
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
                        <p className="text-xs text-slate-500 mb-1">{t('tenders.detail.fields.daysRemaining')}</p>
                        <div className={`flex items-center gap-2 ${
                          isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-slate-900'
                        }`}>
                          <ClockIcon className="w-4 h-4" />
                          <span className="font-medium">
                            {daysRemaining !== null ? (
                              isOverdue
                                ? t('tenders.detail.deadline.expired')
                                : t('tenders.detail.deadline.dMinus', { days: daysRemaining })
                            ) : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">{t('tenders.detail.documents.title')}</h3>
                      <Button variant="secondary" size="sm">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        {t('tenders.detail.documents.add')}
                      </Button>
                    </div>

                    {documents.length === 0 ? (
                      <div className="text-center py-8">
                        <DocumentTextIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 mb-4">{t('tenders.detail.documents.empty')}</p>
                        <Button variant="secondary" size="sm">
                          <PlusIcon className="w-4 h-4 mr-2" />
                          {t('tenders.detail.documents.addOne')}
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
                      <h4 className="font-medium text-slate-700 mb-3">
                        {t('tenders.detail.documents.required', { type: tender.type })}
                      </h4>
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
                        <h3 className="font-semibold text-slate-900 mb-2">{t('tenders.detail.translations.cardTitle')}</h3>
                        <p className="text-sm text-slate-600 mb-4">
                          {t('tenders.detail.translations.cardSubtitle')}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              {t('tenders.detail.translations.targetLanguage')}
                            </label>
                            <select
                              value={selectedTargetLang}
                              onChange={(e) => setSelectedTargetLang(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              disabled={isTranslating}
                            >
                              <option value="en">🇬🇧 {t('tenders.detail.language.en')}</option>
                              <option value="de">🇩🇪 {t('tenders.detail.language.de')}</option>
                              <option value="es">🇪🇸 {t('tenders.detail.language.es')}</option>
                              <option value="it">🇮🇹 {t('tenders.detail.language.it')}</option>
                              <option value="pt">🇵🇹 {t('tenders.detail.language.pt')}</option>
                              <option value="nl">🇳🇱 {t('tenders.detail.language.nl')}</option>
                              <option value="ar-MA">🇲🇦 {t('tenders.detail.language.arMA')}</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              {t('tenders.detail.translations.aiModel')}
                            </label>
                            <select
                              value={selectedAiModel}
                              onChange={(e) => setSelectedAiModel(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              disabled={isTranslating}
                            >
                              <option value="gpt-4">{t('tenders.detail.translations.model.gpt4')}</option>
                              <option value="gpt-3.5-turbo">{t('tenders.detail.translations.model.gpt35')}</option>
                              <option value="claude-3">{t('tenders.detail.translations.model.claude3')}</option>
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
                              {t('tenders.detail.translations.inProgress')}
                            </>
                          ) : (
                            <>
                              <SparklesIcon className="w-4 h-4 mr-2" />
                              {t('tenders.detail.translations.translateWithAi')}
                            </>
                          )}
                        </Button>
                        
                        {translations.some(t => t.target_lang === selectedTargetLang) && (
                          <p className="text-sm text-amber-600 mt-2 flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            {t('tenders.detail.translations.alreadyExists')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Existing Translations */}
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <LanguageIcon className="w-5 h-5 text-indigo-600" />
                      {t('tenders.detail.translations.available', { count: translations.length })}
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
                        <h4 className="font-medium text-slate-900 mb-2">{t('tenders.detail.translations.none.title')}</h4>
                        <p className="text-sm text-slate-500">
                          {t('tenders.detail.translations.none.desc')}
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
                                      {t('tenders.detail.translations.method.ai')}
                                    </span>
                                  ) : translation.translation_method === 'MANUAL' ? (
                                    <span className="flex items-center gap-1">
                                      <PencilIcon className="w-3 h-3" />
                                      {t('tenders.detail.translations.method.manual')}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <CheckIcon className="w-3 h-3" />
                                      {t('tenders.detail.translations.method.hybrid')}
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
                                      {t('tenders.detail.translations.form.translatedTitle')}
                                    </label>
                                    <input
                                      type="text"
                                      value={reviewForm.title}
                                      onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                      placeholder={t('tenders.detail.translations.form.translatedTitle.placeholder')}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                      {t('tenders.detail.translations.form.translatedDescription')}
                                    </label>
                                    <textarea
                                      value={reviewForm.description}
                                      onChange={(e) => setReviewForm({ ...reviewForm, description: e.target.value })}
                                      rows={6}
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                      placeholder={t('tenders.detail.translations.form.translatedDescription.placeholder')}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                      {t('tenders.detail.translations.form.qualityScore', { score: reviewForm.quality_score })}
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
                                      {[0, 50, 100].map((value) => (
                                        <span key={value}>{`${value}%`}</span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex gap-2 pt-2">
                                    <Button onClick={updateTranslation} variant="primary" size="sm">
                                      <CheckIcon className="w-4 h-4 mr-2" />
                                      {t('tenders.detail.translations.form.save')}
                                    </Button>
                                    <Button 
                                      onClick={() => {
                                        setEditingTranslation(null);
                                        setReviewForm({ title: '', description: '', quality_score: 0 });
                                      }} 
                                      variant="ghost" 
                                      size="sm"
                                    >
                                      {t('tenders.detail.translations.form.cancel')}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                // View Mode
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs text-slate-500 mb-1">{t('tenders.detail.translations.view.title')}</p>
                                    <p className="font-medium text-slate-900">
                                      {translation.title_translated || tender.title}
                                    </p>
                                  </div>

                                  {translation.description_translated && (
                                    <div>
                                      <p className="text-xs text-slate-500 mb-1">{t('tenders.detail.translations.view.description')}</p>
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
                                          {t('tenders.detail.translations.view.reviewed')}
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
                                      {t('tenders.detail.translations.view.review')}
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
              <h3 className="font-semibold text-slate-900">{t('tenders.detail.aiScore.title')}</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={calculateAIScore}
                loading={isCalculatingScore}
              >
                <SparklesIcon className="w-4 h-4 mr-1" />
                {tender.ai_score ? t('tenders.detail.aiScore.recalculate') : t('tenders.detail.aiScore.calculate')}
              </Button>
            </div>

            {tender.ai_score !== null ? (
              <div className="text-center">
                <ScoreGauge score={tender.ai_score} size="lg" />
                <p className="text-sm text-slate-500 mt-2">
                  {t('tenders.detail.aiScore.estimated')}
                </p>

                {tender.ai_recommendations && tender.ai_recommendations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 text-left">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      {t('tenders.detail.aiScore.recommendations')}
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
                  {t('tenders.detail.aiScore.empty')}
                </p>
                <Button 
                  onClick={calculateAIScore}
                  loading={isCalculatingScore}
                  className="bg-gradient-to-r from-primary-600 to-secondary-600"
                >
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  {t('tenders.detail.aiScore.analyze')}
                </Button>
              </div>
            )}
          </Card>

          {/* Contact acheteur */}
          {(tender.buyer_contact || tender.buyer_email || tender.buyer_phone) && (
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">{t('tenders.detail.buyerContact.title')}</h3>
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
              <h3 className="font-semibold text-slate-900 mb-4">{t('tenders.detail.notes.title')}</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{tender.notes}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Modal changement de statut */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title={t('tenders.detail.modal.status.title')}
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
                <span className="font-medium text-slate-900">{t(config.labelKey)}</span>
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
        title={t('tenders.detail.modal.delete.title')}
      >
        <p className="text-slate-600 mb-6">
          {t('tenders.detail.modal.delete.body')}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
            {t('tenders.detail.modal.delete.cancel')}
          </Button>
          <Button variant="danger" onClick={deleteTender}>
            {t('tenders.detail.modal.delete.confirm')}
          </Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
