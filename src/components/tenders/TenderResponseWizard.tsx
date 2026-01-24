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

// Configuration des étapes - Documents administratifs à la fin
const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'technical',
    title: 'Technical offer',
    description: 'Technical proposal, methodology, references',
    icon: FileCheck,
    status: 'current',
    aiAssisted: true,
  },
  {
    id: 'team',
    title: 'Proposed team',
    description: 'CVs, qualifications, staffing',
    icon: Users,
    status: 'pending',
    aiAssisted: true,
  },
  {
    id: 'financial',
    title: 'Financial offer',
    description: 'Unit prices, price breakdown, pricing detail',
    icon: Euro,
    status: 'pending',
    aiAssisted: false,
  },
  {
    id: 'administrative',
    title: 'Administrative documents',
    description: 'Certificates, registration extract, legal documents',
    icon: FileText,
    status: 'pending',
    aiAssisted: true,
  },
  {
    id: 'review',
    title: 'Final review',
    description: 'Check and validate the file',
    icon: Eye,
    status: 'pending',
  },
  {
    id: 'submit',
    title: 'Download',
    description: 'Download the complete file',
    icon: Download,
    status: 'pending',
  },
];

// Documents par étape
const DOCUMENTS_BY_STEP: Record<string, DocumentItem[]> = {
  administrative: [
    { id: 'dc1', name: 'DC1 form (application letter)', type: 'required', status: 'missing', aiGenerated: true },
    { id: 'dc2', name: 'DC2 form (candidate declaration)', type: 'required', status: 'missing', aiGenerated: true },
    { id: 'kbis', name: 'Company registration extract (less than 3 months old)', type: 'required', status: 'missing' },
    { id: 'attestation_fiscale', name: 'Tax compliance certificate', type: 'required', status: 'missing' },
    { id: 'attestation_sociale', name: 'URSSAF certificate', type: 'required', status: 'missing' },
    { id: 'assurance_rc', name: "Professional liability insurance certificate", type: 'required', status: 'missing' },
    { id: 'assurance_decennale', name: 'Decennial liability insurance certificate', type: 'optional', status: 'missing' },
    { id: 'acte_engagement', name: 'Commitment deed', type: 'generated', status: 'missing', aiGenerated: true },
  ],
  technical: [
    { id: 'memoire_technique', name: 'Technical proposal', type: 'generated', status: 'missing', aiGenerated: true },
    { id: 'note_methodologique', name: 'Method statement', type: 'generated', status: 'missing', aiGenerated: true },
    { id: 'planning', name: 'Indicative schedule', type: 'generated', status: 'missing', aiGenerated: true },
    { id: 'references', name: 'Reference list', type: 'generated', status: 'missing', aiGenerated: true },
    { id: 'certifications', name: 'Certificates and qualifications', type: 'required', status: 'missing' },
    { id: 'organigramme', name: 'Project organization chart', type: 'generated', status: 'missing', aiGenerated: true },
  ],
  team: [
    { id: 'cv_responsable', name: 'Project manager CV', type: 'required', status: 'missing', aiGenerated: true },
    { id: 'cv_equipe', name: 'Proposed team CVs', type: 'required', status: 'missing', aiGenerated: true },
    { id: 'moyens_humains', name: 'Staffing table', type: 'generated', status: 'missing', aiGenerated: true },
    { id: 'qualifications', name: 'Team qualifications', type: 'optional', status: 'missing' },
  ],
  financial: [
    { id: 'dpgf', name: 'DPGF (lump-sum price breakdown)', type: 'required', status: 'missing' },
    { id: 'bpu', name: 'BPU (unit price schedule)', type: 'required', status: 'missing' },
    { id: 'detail_estimatif', name: 'Estimate detail', type: 'optional', status: 'missing' },
    { id: 'sous_traitance', name: 'Subcontracting declaration (DC4)', type: 'optional', status: 'missing', aiGenerated: true },
  ],
};

export function TenderResponseWizard({
  analysis,
  tenderId,
  onComplete,
  onCancel,
}: TenderResponseWizardProps) {
  const { locale } = useLocale();
  const entries = useMemo(
    () => ({
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
    }),
    []
  );
  const { t } = useUiTranslations(locale, entries);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<WizardStep[]>(
    WIZARD_STEPS.map((s, i) => ({ ...s, status: i === 0 ? 'current' : 'pending' }))
  );
  const [documents, setDocuments] = useState<Record<string, DocumentItem[]>>(DOCUMENTS_BY_STEP);
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
                      const step = WIZARD_STEPS.find(s => s.id === stepId);
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
                                onClick={() => setCurrentStepIndex(WIZARD_STEPS.findIndex(s => s.id === stepId))}
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
