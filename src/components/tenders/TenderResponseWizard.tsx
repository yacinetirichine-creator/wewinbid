'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Users,
  Euro,
  FileCheck,
  Send,
  Download,
  Loader2,
  Sparkles,
  Clock,
  AlertCircle,
  ChevronRight,
  Upload,
  RefreshCw,
  Eye,
  MessageSquare,
  CalendarCheck,
  Building2,
  Award,
  FileSignature,
  Package,
  Lock,
  Cloud,
  Printer,
} from 'lucide-react';
import { Button, Card, Badge, Progress, Textarea, Input, Checkbox } from '@/components/ui';
import { SaveIndicator } from '@/components/ui/SaveIndicator';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';
import { cn } from '@/lib/utils';
import { TenderAnalysisResult } from './TenderAIAnalysis';
import { 
  generateDC1, 
  generateMemoireTechnique, 
  downloadPDF,
} from '@/lib/pdf-generation';

// Types pour le wizard
interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'current' | 'completed' | 'error';
  optional?: boolean;
  aiAssisted?: boolean;
}

interface DocumentItem {
  id: string;
  name: string;
  type: 'required' | 'optional' | 'generated';
  status: 'missing' | 'uploaded' | 'generating' | 'ready' | 'error';
  aiGenerated?: boolean;
  downloadUrl?: string;
  template?: string;
}

interface TenderResponseWizardProps {
  analysis: TenderAnalysisResult;
  tenderId: string;
  onComplete: (response: any) => void;
  onCancel: () => void;
}

// Configuration des étapes - avec clés de traduction
const WIZARD_STEP_KEYS = [
  {
    id: 'technical',
    titleKey: 'step.technical.title',
    descriptionKey: 'step.technical.description',
    icon: FileCheck,
    status: 'current' as const,
    aiAssisted: true,
  },
  {
    id: 'team',
    titleKey: 'step.team.title',
    descriptionKey: 'step.team.description',
    icon: Users,
    status: 'pending' as const,
    aiAssisted: true,
  },
  {
    id: 'financial',
    titleKey: 'step.financial.title',
    descriptionKey: 'step.financial.description',
    icon: Euro,
    status: 'pending' as const,
    aiAssisted: false,
  },
  {
    id: 'administrative',
    titleKey: 'step.administrative.title',
    descriptionKey: 'step.administrative.description',
    icon: FileText,
    status: 'pending' as const,
    aiAssisted: true,
  },
  {
    id: 'review',
    titleKey: 'step.review.title',
    descriptionKey: 'step.review.description',
    icon: Eye,
    status: 'pending' as const,
  },
  {
    id: 'submit',
    titleKey: 'step.submit.title',
    descriptionKey: 'step.submit.description',
    icon: Download,
    status: 'pending' as const,
  },
];

// Documents par étape - avec clés de traduction
const DOCUMENT_KEYS_BY_STEP: Record<string, Array<{
  id: string;
  nameKey: string;
  type: 'required' | 'optional' | 'generated';
  status: 'missing' | 'uploaded' | 'generating' | 'ready' | 'error';
  aiGenerated?: boolean;
  downloadUrl?: string;
  template?: string;
}>> = {
  administrative: [
    { id: 'dc1', nameKey: 'doc.dc1', type: 'required', status: 'missing', aiGenerated: true },
    { id: 'dc2', nameKey: 'doc.dc2', type: 'required', status: 'missing', aiGenerated: true },
    { id: 'kbis', nameKey: 'doc.kbis', type: 'required', status: 'missing' },
    { id: 'attestation_fiscale', nameKey: 'doc.attestation_fiscale', type: 'required', status: 'missing' },
    { id: 'attestation_sociale', nameKey: 'doc.attestation_sociale', type: 'required', status: 'missing' },
    { id: 'assurance_rc', nameKey: 'doc.assurance_rc', type: 'required', status: 'missing' },
    { id: 'assurance_decennale', nameKey: 'doc.assurance_decennale', type: 'optional', status: 'missing' },
    { id: 'acte_engagement', nameKey: 'doc.acte_engagement', type: 'generated', status: 'missing', aiGenerated: true },
  ],
  technical: [
    { id: 'memoire_technique', nameKey: 'doc.memoire_technique', type: 'generated', status: 'missing', aiGenerated: true },
    { id: 'note_methodologique', nameKey: 'doc.note_methodologique', type: 'generated', status: 'missing', aiGenerated: true },
    { id: 'planning', nameKey: 'doc.planning', type: 'generated', status: 'missing', aiGenerated: true },
    { id: 'references', nameKey: 'doc.references', type: 'generated', status: 'missing', aiGenerated: true },
    { id: 'certifications', nameKey: 'doc.certifications', type: 'required', status: 'missing' },
    { id: 'organigramme', nameKey: 'doc.organigramme', type: 'generated', status: 'missing', aiGenerated: true },
  ],
  team: [
    { id: 'cv_responsable', nameKey: 'doc.cv_responsable', type: 'required', status: 'missing', aiGenerated: true },
    { id: 'cv_equipe', nameKey: 'doc.cv_equipe', type: 'required', status: 'missing', aiGenerated: true },
    { id: 'moyens_humains', nameKey: 'doc.moyens_humains', type: 'generated', status: 'missing', aiGenerated: true },
    { id: 'qualifications', nameKey: 'doc.qualifications', type: 'optional', status: 'missing' },
  ],
  financial: [
    { id: 'dpgf', nameKey: 'doc.dpgf', type: 'required', status: 'missing' },
    { id: 'bpu', nameKey: 'doc.bpu', type: 'required', status: 'missing' },
    { id: 'detail_estimatif', nameKey: 'doc.detail_estimatif', type: 'optional', status: 'missing' },
    { id: 'sous_traitance', nameKey: 'doc.sous_traitance', type: 'optional', status: 'missing', aiGenerated: true },
  ],
};

// Traductions multilingues
const WIZARD_TRANSLATIONS: Record<string, Record<string, string>> = {
  fr: {
    // Étapes
    'step.technical.title': 'Offre technique',
    'step.technical.description': 'Mémoire technique, méthodologie, références',
    'step.team.title': 'Équipe proposée',
    'step.team.description': 'CV, qualifications, moyens humains',
    'step.financial.title': 'Offre financière',
    'step.financial.description': 'Prix unitaires, décomposition, détail estimatif',
    'step.administrative.title': 'Documents administratifs',
    'step.administrative.description': 'Attestations, extrait Kbis, documents légaux',
    'step.review.title': 'Vérification finale',
    'step.review.description': 'Vérifier et valider le dossier',
    'step.submit.title': 'Téléchargement',
    'step.submit.description': 'Télécharger le dossier complet',

    // Documents administratifs
    'doc.dc1': 'Formulaire DC1 (lettre de candidature)',
    'doc.dc2': 'Formulaire DC2 (déclaration du candidat)',
    'doc.kbis': 'Extrait Kbis (moins de 3 mois)',
    'doc.attestation_fiscale': 'Attestation de régularité fiscale',
    'doc.attestation_sociale': 'Attestation URSSAF',
    'doc.assurance_rc': 'Attestation d\'assurance RC professionnelle',
    'doc.assurance_decennale': 'Attestation d\'assurance décennale',
    'doc.acte_engagement': 'Acte d\'engagement',

    // Documents techniques
    'doc.memoire_technique': 'Mémoire technique',
    'doc.note_methodologique': 'Note méthodologique',
    'doc.planning': 'Planning prévisionnel',
    'doc.references': 'Liste des références',
    'doc.certifications': 'Certificats et qualifications',
    'doc.organigramme': 'Organigramme du projet',

    // Documents équipe
    'doc.cv_responsable': 'CV du responsable de projet',
    'doc.cv_equipe': 'CV de l\'équipe proposée',
    'doc.moyens_humains': 'Tableau des moyens humains',
    'doc.qualifications': 'Qualifications de l\'équipe',

    // Documents financiers
    'doc.dpgf': 'DPGF (décomposition du prix global forfaitaire)',
    'doc.bpu': 'BPU (bordereau des prix unitaires)',
    'doc.detail_estimatif': 'Détail estimatif',
    'doc.sous_traitance': 'Déclaration de sous-traitance (DC4)',

    // UI
    'tenderResponseWizard.header.title': 'Réponse à l\'appel d\'offres',
    'tenderResponseWizard.header.deadline': 'Échéance : {date}',
    'tenderResponseWizard.action.saveAndExit': 'Enregistrer et quitter',
    'tenderResponseWizard.progress.label': 'Progression du dossier',
    'tenderResponseWizard.action.generateWithAi': 'Générer avec l\'IA',
    'tenderResponseWizard.action.generatingWithProgress': 'Génération… {progress}%',
    'tenderResponseWizard.doc.required': 'Obligatoire',
    'tenderResponseWizard.doc.optional': 'Optionnel',
    'tenderResponseWizard.doc.generating': 'Génération…',
    'tenderResponseWizard.doc.upload': 'Téléverser',
    'tenderResponseWizard.doc.download': 'Télécharger le document',
    'tenderResponseWizard.notes.title': 'Notes pour cette étape',
    'tenderResponseWizard.notes.placeholder': 'Ajoutez vos notes, remarques ou points d\'attention…',
    'tenderResponseWizard.aiTips.title': 'Conseils IA',
    'tenderResponseWizard.aiTips.line1': 'Pour cette étape, notre IA peut générer automatiquement les documents marqués',
    'tenderResponseWizard.aiTips.line2': 'Les documents générés sont personnalisés en fonction de votre profil entreprise et des exigences de l\'AO.',
    'tenderResponseWizard.attention.title': 'Points d\'attention',
    'tenderResponseWizard.attention.admin.1': 'Vérifiez que l\'extrait Kbis a moins de 3 mois',
    'tenderResponseWizard.attention.admin.2': 'Votre attestation fiscale doit être à jour',
    'tenderResponseWizard.attention.tech.1': 'Le mémoire technique représente 40% de la note finale',
    'tenderResponseWizard.attention.tech.2': 'Incluez des références récentes similaires',
    'tenderResponseWizard.attention.team.1': 'Mettez en valeur les certifications pertinentes',
    'tenderResponseWizard.attention.fin.1': 'Le prix représente 60% de la note finale',
    'tenderResponseWizard.attention.fin.2': 'Vérifiez que chaque ligne est chiffrée',
    'tenderResponseWizard.review.title': 'Vérification finale',
    'tenderResponseWizard.review.subtitle': 'Assurez-vous que votre dossier est complet avant de finaliser.',
    'tenderResponseWizard.review.requiredDocs': '{done}/{total} documents obligatoires',
    'tenderResponseWizard.review.action.complete': 'Complet',
    'tenderResponseWizard.review.checklist.title': 'Checklist finale',
    'tenderResponseWizard.review.checklist.1': 'J\'ai vérifié que tous les documents sont signés',
    'tenderResponseWizard.review.checklist.2': 'Les montants financiers sont corrects',
    'tenderResponseWizard.review.checklist.3': 'Le dossier respecte le format demandé',
    'tenderResponseWizard.review.checklist.4': 'J\'ai relu le mémoire technique',
    'tenderResponseWizard.submit.title': 'Votre dossier est prêt !',
    'tenderResponseWizard.submit.subtitle': 'Tous les documents ont été générés et assemblés. Vous pouvez télécharger le dossier complet.',
    'tenderResponseWizard.submit.stats.documents': 'Documents',
    'tenderResponseWizard.submit.stats.compatibility': 'Compatibilité',
    'tenderResponseWizard.submit.stats.status': 'Statut',
    'tenderResponseWizard.submit.stats.onTime': 'Dans les temps',
    'tenderResponseWizard.submit.action.downloadFull': 'Télécharger le dossier complet',
    'tenderResponseWizard.submit.zipNote': 'Fichier ZIP sécurisé • Prêt pour soumission',
    'tenderResponseWizard.nav.previous': 'Précédent',
    'tenderResponseWizard.nav.next': 'Suivant',
    'tenderResponseWizard.nav.finalize': 'Finaliser',
    'tenderResponseWizard.log.draftSaved': 'Brouillon enregistré :',
    'tenderResponseWizard.log.saveError': 'Erreur de sauvegarde :',
  },
  en: {
    // Steps
    'step.technical.title': 'Technical offer',
    'step.technical.description': 'Technical proposal, methodology, references',
    'step.team.title': 'Proposed team',
    'step.team.description': 'CVs, qualifications, staffing',
    'step.financial.title': 'Financial offer',
    'step.financial.description': 'Unit prices, price breakdown, pricing detail',
    'step.administrative.title': 'Administrative documents',
    'step.administrative.description': 'Certificates, registration extract, legal documents',
    'step.review.title': 'Final review',
    'step.review.description': 'Check and validate the file',
    'step.submit.title': 'Download',
    'step.submit.description': 'Download the complete file',

    // Administrative documents
    'doc.dc1': 'DC1 form (application letter)',
    'doc.dc2': 'DC2 form (candidate declaration)',
    'doc.kbis': 'Company registration extract (less than 3 months old)',
    'doc.attestation_fiscale': 'Tax compliance certificate',
    'doc.attestation_sociale': 'URSSAF certificate',
    'doc.assurance_rc': 'Professional liability insurance certificate',
    'doc.assurance_decennale': 'Decennial liability insurance certificate',
    'doc.acte_engagement': 'Commitment deed',

    // Technical documents
    'doc.memoire_technique': 'Technical proposal',
    'doc.note_methodologique': 'Method statement',
    'doc.planning': 'Indicative schedule',
    'doc.references': 'Reference list',
    'doc.certifications': 'Certificates and qualifications',
    'doc.organigramme': 'Project organization chart',

    // Team documents
    'doc.cv_responsable': 'Project manager CV',
    'doc.cv_equipe': 'Proposed team CVs',
    'doc.moyens_humains': 'Staffing table',
    'doc.qualifications': 'Team qualifications',

    // Financial documents
    'doc.dpgf': 'DPGF (lump-sum price breakdown)',
    'doc.bpu': 'BPU (unit price schedule)',
    'doc.detail_estimatif': 'Estimate detail',
    'doc.sous_traitance': 'Subcontracting declaration (DC4)',

    // UI
    'tenderResponseWizard.header.title': 'Tender response',
    'tenderResponseWizard.header.deadline': 'Deadline: {date}',
    'tenderResponseWizard.action.saveAndExit': 'Save & exit',
    'tenderResponseWizard.progress.label': 'File progress',
    'tenderResponseWizard.action.generateWithAi': 'Generate with AI',
    'tenderResponseWizard.action.generatingWithProgress': 'Generating… {progress}%',
    'tenderResponseWizard.doc.required': 'Required',
    'tenderResponseWizard.doc.optional': 'Optional',
    'tenderResponseWizard.doc.generating': 'Generating…',
    'tenderResponseWizard.doc.upload': 'Upload',
    'tenderResponseWizard.doc.download': 'Download document',
    'tenderResponseWizard.notes.title': 'Notes for this step',
    'tenderResponseWizard.notes.placeholder': 'Add your notes, remarks, or points of attention…',
    'tenderResponseWizard.aiTips.title': 'AI tips',
    'tenderResponseWizard.aiTips.line1': 'For this step, our AI can automatically generate documents marked with',
    'tenderResponseWizard.aiTips.line2': 'Generated documents are personalized based on your company profile and the tender requirements.',
    'tenderResponseWizard.attention.title': 'Points to watch',
    'tenderResponseWizard.attention.admin.1': 'Make sure the company registration extract is less than 3 months old',
    'tenderResponseWizard.attention.admin.2': 'Your tax compliance certificate must be up to date',
    'tenderResponseWizard.attention.tech.1': 'The technical proposal represents 40% of the final score',
    'tenderResponseWizard.attention.tech.2': 'Include recent similar references',
    'tenderResponseWizard.attention.team.1': 'Highlight relevant certifications',
    'tenderResponseWizard.attention.fin.1': 'Price represents 60% of the final score',
    'tenderResponseWizard.attention.fin.2': 'Double-check that every line item is priced',
    'tenderResponseWizard.review.title': 'Final review',
    'tenderResponseWizard.review.subtitle': 'Make sure your file is complete before finalizing.',
    'tenderResponseWizard.review.requiredDocs': '{done}/{total} required documents',
    'tenderResponseWizard.review.action.complete': 'Complete',
    'tenderResponseWizard.review.checklist.title': 'Final checklist',
    'tenderResponseWizard.review.checklist.1': 'I verified that all documents are signed',
    'tenderResponseWizard.review.checklist.2': 'Financial amounts are correct',
    'tenderResponseWizard.review.checklist.3': 'The file matches the required format',
    'tenderResponseWizard.review.checklist.4': 'I proofread the technical proposal',
    'tenderResponseWizard.submit.title': 'Your file is ready!',
    'tenderResponseWizard.submit.subtitle': 'All documents have been generated and assembled. You can download the complete file.',
    'tenderResponseWizard.submit.stats.documents': 'Documents',
    'tenderResponseWizard.submit.stats.compatibility': 'Compatibility',
    'tenderResponseWizard.submit.stats.status': 'Status',
    'tenderResponseWizard.submit.stats.onTime': 'On time',
    'tenderResponseWizard.submit.action.downloadFull': 'Download full file',
    'tenderResponseWizard.submit.zipNote': 'Secure ZIP file • Ready for submission',
    'tenderResponseWizard.nav.previous': 'Previous',
    'tenderResponseWizard.nav.next': 'Next',
    'tenderResponseWizard.nav.finalize': 'Finalize',
    'tenderResponseWizard.log.draftSaved': 'Draft saved:',
    'tenderResponseWizard.log.saveError': 'Save error:',
  },
};

export function TenderResponseWizard({
  analysis,
  tenderId,
  onComplete,
  onCancel,
}: TenderResponseWizardProps) {
  const { locale } = useLocale();
  const entries = useMemo(
    () => WIZARD_TRANSLATIONS[locale] || WIZARD_TRANSLATIONS['fr'],
    [locale]
  );
  const { t } = useUiTranslations(locale, entries);

  // Créer les étapes avec les traductions
  const translatedSteps = useMemo(() =>
    WIZARD_STEP_KEYS.map((s, i) => ({
      id: s.id,
      title: t(s.titleKey),
      description: t(s.descriptionKey),
      icon: s.icon,
      status: (i === 0 ? 'current' : 'pending') as WizardStep['status'],
      aiAssisted: s.aiAssisted,
    })),
    [t]
  );

  // Créer les documents avec les traductions
  const translatedDocuments = useMemo(() => {
    const result: Record<string, DocumentItem[]> = {};
    Object.entries(DOCUMENT_KEYS_BY_STEP).forEach(([stepId, docs]) => {
      result[stepId] = docs.map(doc => ({
        ...doc,
        name: t(doc.nameKey),
      }));
    });
    return result;
  }, [t]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<WizardStep[]>(translatedSteps);
  const [documents, setDocuments] = useState<Record<string, DocumentItem[]>>(translatedDocuments);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  // Auto-save hook
  const {
    draft,
    loading: draftLoading,
    saveStatus,
    lastSaved,
    updateDraft,
    updateNotes: saveNotes,
    updateChecklist: saveChecklist,
    setCurrentStep: saveCurrentStep,
    updateDocumentStatus,
    saveNow,
  } = useAutoSave(tenderId, {
    debounceMs: 1500,
    onSave: (savedDraft) => {
      console.log(t('tenderResponseWizard.log.draftSaved'), savedDraft.id);
    },
    onError: (error) => {
      console.error(t('tenderResponseWizard.log.saveError'), error);
    },
  });

  // Restaurer le brouillon au chargement
  useEffect(() => {
    if (draft && !draftLoading) {
      if (draft.current_step > 0) {
        setCurrentStepIndex(draft.current_step);
        setSteps(prev => prev.map((s, i) => ({
          ...s,
          status: i < draft.current_step ? 'completed' : i === draft.current_step ? 'current' : 'pending',
        })));
      }
      if (Object.keys(draft.notes).length > 0) {
        setNotes(draft.notes);
      }
      if (Object.keys(draft.checklist).length > 0) {
        setChecklist(draft.checklist);
      }
    }
  }, [draft, draftLoading]);

  const currentStep = steps[currentStepIndex];
  const currentDocuments = documents[currentStep.id] || [];

  // Calcul du progrès global
  const calculateOverallProgress = () => {
    const allDocs = Object.values(documents).flat();
    const completedDocs = allDocs.filter(d => d.status === 'ready' || d.status === 'uploaded');
    return Math.round((completedDocs.length / allDocs.length) * 100);
  };

  // Aller à l'étape suivante avec sauvegarde
  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const newIndex = currentStepIndex + 1;
      setSteps(prev => prev.map((s, i) => ({
        ...s,
        status: i < newIndex ? 'completed' : i === newIndex ? 'current' : s.status,
      })));
      setCurrentStepIndex(newIndex);
      saveCurrentStep(newIndex);
    }
  };

  // Retourner à l'étape précédente avec sauvegarde
  const prevStep = () => {
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1;
      setSteps(prev => prev.map((s, i) => ({
        ...s,
        status: i === newIndex ? 'current' : i < newIndex ? 'completed' : 'pending',
      })));
      setCurrentStepIndex(newIndex);
      saveCurrentStep(newIndex);
    }
  };

  // Mettre à jour les notes avec sauvegarde
  const handleNotesChange = useCallback((stepId: string, note: string) => {
    setNotes(prev => ({ ...prev, [stepId]: note }));
    saveNotes(stepId, note);
  }, [saveNotes]);

  // Mettre à jour la checklist avec sauvegarde
  const handleChecklistChange = useCallback((itemId: string, checked: boolean) => {
    setChecklist(prev => ({ ...prev, [itemId]: checked }));
    saveChecklist(itemId, checked);
  }, [saveChecklist]);

  // Generate documents with AI + PDF
  const generateDocuments = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    const docsToGenerate = currentDocuments.filter(d => d.aiGenerated && d.status === 'missing');
    
    for (let i = 0; i < docsToGenerate.length; i++) {
      const doc = docsToGenerate[i];
      
      // Marquer comme en génération
      setDocuments(prev => ({
        ...prev,
        [currentStep.id]: prev[currentStep.id].map(d => 
          d.id === doc.id ? { ...d, status: 'generating' as const } : d
        ),
      }));

      try {
        // Generate the PDF based on document id
        if (doc.id === 'dc1') {
          const companyInfo = {
            name: '',
            siret: '',
            address: '',
            city: '',
            postalCode: '',
            email: '',
            phone: '',
            legalForm: '',
          };
          
          const tenderInfo = {
            reference: analysis.reference,
            title: analysis.title,
            buyer: analysis.buyer?.name || 'Public buyer',
            deadline: analysis.dates.submissionDeadline,
          };
          
          const blob = await generateDC1(companyInfo, tenderInfo, false);
          // Stocker le blob pour téléchargement ultérieur
          setDocuments(prev => ({
            ...prev,
            [currentStep.id]: prev[currentStep.id].map(d => 
              d.id === doc.id ? { ...d, status: 'ready' as const, downloadUrl: URL.createObjectURL(blob) } : d
            ),
          }));
        } else if (doc.id === 'memoire_technique') {
          const companyInfo = {
            name: '',
            siret: '',
            address: '',
            city: '',
            postalCode: '',
            email: '',
            phone: '',
            legalForm: '',
          };
          
          const tenderInfo = {
            reference: analysis.reference,
            title: analysis.title,
            buyer: analysis.buyer?.name || 'Public buyer',
            deadline: analysis.dates.submissionDeadline,
          };

          const analysisData = {
            summary: analysis.summary || 'Tender summary',
            requirements: [
              ...(analysis.requirements?.technical || []),
              ...(analysis.requirements?.administrative || []),
              ...(analysis.requirements?.financial || []),
              ...(analysis.requirements?.certifications || []),
            ],
            methodology: 'Response methodology',
          };

          const references: { clientName: string; projectTitle: string; year: number; value: number; description: string }[] = [];

          const blob = await generateMemoireTechnique(companyInfo, tenderInfo, analysisData, references);
          setDocuments(prev => ({
            ...prev,
            [currentStep.id]: prev[currentStep.id].map(d => 
              d.id === doc.id ? { ...d, status: 'ready' as const, downloadUrl: URL.createObjectURL(blob) } : d
            ),
          }));
        } else {
          // For other documents, simulate generation
          await new Promise(resolve => setTimeout(resolve, 1500));
          setDocuments(prev => ({
            ...prev,
            [currentStep.id]: prev[currentStep.id].map(d => 
              d.id === doc.id ? { ...d, status: 'ready' as const } : d
            ),
          }));
        }
      } catch (error) {
        console.error('Document generation error:', error);
        setDocuments(prev => ({
          ...prev,
          [currentStep.id]: prev[currentStep.id].map(d => 
            d.id === doc.id ? { ...d, status: 'missing' as const } : d
          ),
        }));
      }

      setGenerationProgress(Math.round(((i + 1) / docsToGenerate.length) * 100));
    }

    setIsGenerating(false);
  };

  // Download a generated document
  const downloadDocument = (doc: DocumentItem) => {
    if (doc.downloadUrl) {
      const link = document.createElement('a');
      link.href = doc.downloadUrl;
      link.download = `${doc.name}.pdf`;
      link.click();
    }
  };

  // Upload a document
  const handleFileUpload = (docId: string, file: File) => {
    setDocuments(prev => ({
      ...prev,
      [currentStep.id]: prev[currentStep.id].map(d => 
        d.id === docId ? { ...d, status: 'uploaded' as const } : d
      ),
    }));
  };

  // Download the complete file
  const downloadCompleteDossier = () => {
    // Simulation du téléchargement
    console.log('Downloading the complete file');
    onComplete({
      tenderId,
      documents: Object.values(documents).flat().filter(d => d.status === 'ready' || d.status === 'uploaded'),
      notes,
      completedAt: new Date().toISOString(),
    });
  };

  // Vérifier si l'étape peut continuer
  const canProceed = () => {
    const requiredDocs = currentDocuments.filter(d => d.type === 'required');
    return requiredDocs.every(d => d.status === 'ready' || d.status === 'uploaded');
  };

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header fixe */}
      <div className="sticky top-0 z-10 bg-white border-b border-surface-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-surface-900">
                {t('tenderResponseWizard.header.title')}
              </h1>
              <p className="text-sm text-surface-500">{analysis.reference} - {analysis.title}</p>
            </div>
            <div className="flex items-center gap-4">
              <SaveIndicator status={saveStatus} lastSaved={lastSaved} />
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-surface-600">
                  {t('tenderResponseWizard.header.deadline', {
                    date: new Date(analysis.dates.submissionDeadline).toLocaleDateString(locale),
                  })}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => { saveNow(); onCancel(); }}>
                {t('tenderResponseWizard.action.saveAndExit')}
              </Button>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-surface-600">{t('tenderResponseWizard.progress.label')}</span>
              <span className="font-semibold text-primary-600">{calculateOverallProgress()}%</span>
            </div>
            <Progress value={calculateOverallProgress()} className="h-2" />
          </div>

          {/* Navigation par étapes */}
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isClickable = idx <= currentStepIndex || step.status === 'completed';
              
              return (
                <button
                  key={step.id}
                  onClick={() => isClickable && setCurrentStepIndex(idx)}
                  disabled={!isClickable}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap',
                    step.status === 'current' && 'bg-primary-100 text-primary-700',
                    step.status === 'completed' && 'bg-green-100 text-green-700',
                    step.status === 'pending' && 'text-surface-400',
                    isClickable && step.status !== 'current' && 'hover:bg-surface-100 cursor-pointer',
                  )}
                >
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : step.status === 'current' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-primary-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary-500" />
                    </div>
                  ) : (
                    <Circle className="w-5 h-5 text-surface-300" />
                  )}
                  <span className="text-sm font-medium">{step.title}</span>
                  {step.aiAssisted && (
                    <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                  )}
                  {idx < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-surface-300 ml-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Étapes documents */}
            {['administrative', 'technical', 'team', 'financial'].includes(currentStep.id) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Liste des documents */}
                <div className="lg:col-span-2 space-y-4">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-xl">
                          {<currentStep.icon className="w-6 h-6 text-primary-600" />}
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-surface-900">{currentStep.title}</h2>
                          <p className="text-sm text-surface-500">{currentStep.description}</p>
                        </div>
                      </div>
                      
                      {currentStep.aiAssisted && (
                        <Button
                          variant="primary"
                          onClick={generateDocuments}
                          disabled={isGenerating || !currentDocuments.some(d => d.aiGenerated && d.status === 'missing')}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {t('tenderResponseWizard.action.generatingWithProgress', { progress: generationProgress })}
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              {t('tenderResponseWizard.action.generateWithAi')}
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {currentDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className={cn(
                            'flex items-center gap-4 p-4 rounded-xl border transition-all',
                            doc.status === 'ready' && 'border-green-200 bg-green-50',
                            doc.status === 'uploaded' && 'border-blue-200 bg-blue-50',
                            doc.status === 'generating' && 'border-yellow-200 bg-yellow-50',
                            doc.status === 'missing' && 'border-surface-200 bg-white',
                            doc.status === 'error' && 'border-red-200 bg-red-50',
                          )}
                        >
                          <div className={cn(
                            'p-2 rounded-lg',
                            doc.status === 'ready' && 'bg-green-100',
                            doc.status === 'uploaded' && 'bg-blue-100',
                            doc.status === 'generating' && 'bg-yellow-100',
                            doc.status === 'missing' && 'bg-surface-100',
                          )}>
                            {doc.status === 'ready' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                            {doc.status === 'uploaded' && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                            {doc.status === 'generating' && <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />}
                            {doc.status === 'missing' && <FileText className="w-5 h-5 text-surface-400" />}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-surface-900">{doc.name}</p>
                              {doc.type === 'required' && (
                                <Badge variant="danger" size="sm">{t('tenderResponseWizard.doc.required')}</Badge>
                              )}
                              {doc.type === 'optional' && (
                                <Badge variant="secondary" size="sm">{t('tenderResponseWizard.doc.optional')}</Badge>
                              )}
                              {doc.aiGenerated && (
                                <Badge variant="warning" size="sm" className="flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  IA
                                </Badge>
                              )}
                            </div>
                            {doc.status === 'generating' && (
                              <p className="text-sm text-yellow-600 mt-1">{t('tenderResponseWizard.doc.generating')}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {doc.status === 'missing' && !doc.aiGenerated && (
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => e.target.files?.[0] && handleFileUpload(doc.id, e.target.files[0])}
                                />
                                <Button type="button" variant="outline" size="sm">
                                  <Upload className="w-4 h-4 mr-1" />
                                  {t('tenderResponseWizard.doc.upload')}
                                </Button>
                              </label>
                            )}
                            {(doc.status === 'ready' || doc.status === 'uploaded') && (
                              <>
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => downloadDocument(doc)}
                                  title={t('tenderResponseWizard.doc.download')}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Notes et commentaires */}
                  <Card className="p-6">
                    <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-surface-400" />
                      {t('tenderResponseWizard.notes.title')}
                    </h3>
                    <Textarea
                      value={notes[currentStep.id] || ''}
                      onChange={(e) => handleNotesChange(currentStep.id, e.target.value)}
                      placeholder={t('tenderResponseWizard.notes.placeholder')}
                      rows={4}
                    />
                  </Card>
                </div>

                {/* Sidebar - Aide et conseils */}
                <div className="space-y-4">
                  <Card className="p-6 bg-primary-50 border-primary-200">
                    <h3 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary-600" />
                      {t('tenderResponseWizard.aiTips.title')}
                    </h3>
                    <div className="space-y-3 text-sm text-primary-800">
                      <p>
                        {t('tenderResponseWizard.aiTips.line1')}{' '}
                        <Badge variant="warning" size="sm"><Sparkles className="w-3 h-3" /></Badge>
                      </p>
                      <p>
                        {t('tenderResponseWizard.aiTips.line2')}
                      </p>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold text-surface-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      {t('tenderResponseWizard.attention.title')}
                    </h3>
                    <ul className="space-y-2 text-sm text-surface-600">
                      {currentStep.id === 'administrative' && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            {t('tenderResponseWizard.attention.admin.1')}
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            {t('tenderResponseWizard.attention.admin.2')}
                          </li>
                        </>
                      )}
                      {currentStep.id === 'technical' && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            {t('tenderResponseWizard.attention.tech.1')}
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            {t('tenderResponseWizard.attention.tech.2')}
                          </li>
                        </>
                      )}
                      {currentStep.id === 'team' && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            {t('tenderResponseWizard.attention.team.1')}
                          </li>
                        </>
                      )}
                      {currentStep.id === 'financial' && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            {t('tenderResponseWizard.attention.fin.1')}
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            {t('tenderResponseWizard.attention.fin.2')}
                          </li>
                        </>
                      )}
                    </ul>
                  </Card>

                  {/* Exigences extraites */}
                  <Card className="p-6">
                    <h3 className="font-semibold text-surface-900 mb-3 flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-surface-400" />
                      Exigences détectées
                    </h3>
                    <ul className="space-y-2 text-sm">
                      {currentStep.id === 'administrative' && analysis.requirements.administrative.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-surface-600">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {req}
                        </li>
                      ))}
                      {currentStep.id === 'technical' && analysis.requirements.technical.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-surface-600">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {req}
                        </li>
                      ))}
                      {currentStep.id === 'financial' && analysis.requirements.financial.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-surface-600">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </div>
            )}

            {/* Étape de vérification */}
            {currentStep.id === 'review' && (
              <div className="max-w-4xl mx-auto">
                <Card className="p-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Eye className="w-8 h-8 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-surface-900">{t('tenderResponseWizard.review.title')}</h2>
                    <p className="text-surface-500 mt-2">
                      {t('tenderResponseWizard.review.subtitle')}
                    </p>
                  </div>

                  <div className="space-y-6">
                    {Object.entries(documents).filter(([key]) => key !== 'review' && key !== 'submit').map(([stepId, docs]) => {
                      const step = steps.find(s => s.id === stepId);
                      const requiredDocs = docs.filter(d => d.type === 'required');
                      const completedRequired = requiredDocs.filter(d => d.status === 'ready' || d.status === 'uploaded').length;
                      const allComplete = completedRequired === requiredDocs.length;

                      return (
                        <div key={stepId} className={cn(
                          'p-4 rounded-xl border',
                          allComplete ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
                        )}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {allComplete ? (
                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                              ) : (
                                <AlertCircle className="w-6 h-6 text-orange-500" />
                              )}
                              <div>
                                <p className="font-semibold text-surface-900">{step?.title}</p>
                                <p className="text-sm text-surface-500">
                                  {t('tenderResponseWizard.review.requiredDocs', {
                                    done: completedRequired,
                                    total: requiredDocs.length,
                                  })}
                                </p>
                              </div>
                            </div>
                            {!allComplete && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentStepIndex(steps.findIndex(s => s.id === stepId))}
                              >
                                {t('tenderResponseWizard.review.action.complete')}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Checklist finale */}
                  <div className="mt-8 pt-6 border-t border-surface-200">
                    <h3 className="font-semibold text-surface-900 mb-4">{t('tenderResponseWizard.review.checklist.title')}</h3>
                    <div className="space-y-3">
                      {[
                        t('tenderResponseWizard.review.checklist.1'),
                        t('tenderResponseWizard.review.checklist.2'),
                        t('tenderResponseWizard.review.checklist.3'),
                        t('tenderResponseWizard.review.checklist.4'),
                      ].map((item, idx) => (
                        <label key={idx} className="flex items-center gap-3 cursor-pointer">
                          <Checkbox
                            checked={checklist[`check_${idx}`] || false}
                            onChange={(e) => handleChecklistChange(`check_${idx}`, e.target.checked)}
                          />
                          <span className="text-surface-700">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Étape de téléchargement */}
            {currentStep.id === 'submit' && (
              <div className="max-w-4xl mx-auto">
                <Card className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                  >
                    <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Package className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-surface-900">
                      {t('tenderResponseWizard.submit.title')}
                    </h2>
                    <p className="text-surface-500 mt-2 max-w-md mx-auto">
                      {t('tenderResponseWizard.submit.subtitle')}
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="p-4 bg-surface-50 rounded-xl">
                      <FileText className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                      <p className="font-semibold text-surface-900">
                        {Object.values(documents).flat().filter(d => d.status === 'ready' || d.status === 'uploaded').length}
                      </p>
                      <p className="text-sm text-surface-500">{t('tenderResponseWizard.submit.stats.documents')}</p>
                    </div>
                    <div className="p-4 bg-surface-50 rounded-xl">
                      <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <p className="font-semibold text-surface-900">
                        {analysis.matchScore || 0}%
                      </p>
                      <p className="text-sm text-surface-500">{t('tenderResponseWizard.submit.stats.compatibility')}</p>
                    </div>
                    <div className="p-4 bg-surface-50 rounded-xl">
                      <CalendarCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="font-semibold text-surface-900">
                        {t('tenderResponseWizard.submit.stats.onTime')}
                      </p>
                      <p className="text-sm text-surface-500">{t('tenderResponseWizard.submit.stats.status')}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={downloadCompleteDossier}
                      className="px-12 shadow-lg shadow-primary-500/25"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      {t('tenderResponseWizard.submit.action.downloadFull')}
                    </Button>
                    
                    <div className="flex items-center gap-2 text-sm text-surface-500">
                      <Lock className="w-4 h-4" />
                      <span>{t('tenderResponseWizard.submit.zipNote')}</span>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer de navigation */}
      <div className="sticky bottom-0 bg-white border-t border-surface-200 py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStepIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('tenderResponseWizard.nav.previous')}
          </Button>
          
          {currentStep.id !== 'submit' && (
            <Button
              variant="primary"
              onClick={nextStep}
              disabled={['administrative', 'technical', 'team', 'financial'].includes(currentStep.id) && !canProceed()}
            >
              {currentStep.id === 'review'
                ? t('tenderResponseWizard.nav.finalize')
                : t('tenderResponseWizard.nav.next')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TenderResponseWizard;
