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
    title: 'Offre technique',
    description: 'Mémoire technique, méthodologie, références',
    icon: FileCheck,
    status: 'current',
    aiAssisted: true,
  },
  {
    id: 'team',
    title: 'Équipe proposée',
    description: 'CV, qualifications, moyens humains',
    icon: Users,
    status: 'pending',
    aiAssisted: true,
  },
  {
    id: 'financial',
    title: 'Offre financière',
    description: 'BPU, DPGF, détail des prix',
    icon: Euro,
    status: 'pending',
    aiAssisted: false,
  },
  {
    id: 'administrative',
    title: 'Documents administratifs',
    description: 'Attestations, KBIS, documents légaux',
    icon: FileText,
    status: 'pending',
    aiAssisted: true,
  },
  {
    id: 'review',
    title: 'Vérification finale',
    description: 'Contrôle et validation du dossier',
    icon: Eye,
    status: 'pending',
  },
  {
    id: 'submit',
    title: 'Téléchargement',
    description: 'Télécharger le dossier complet',
    icon: Download,
    status: 'pending',
  },
];

// Documents par étape
const DOCUMENTS_BY_STEP: Record<string, DocumentItem[]> = {
  administrative: [
    { id: 'dc1', name: 'Formulaire DC1 (Lettre de candidature)', type: 'required', status: 'missing', aiGenerated: true },
    { id: 'dc2', name: 'Formulaire DC2 (Déclaration du candidat)', type: 'required', status: 'missing', aiGenerated: true },
    { id: 'kbis', name: 'Extrait KBIS (moins de 3 mois)', type: 'required', status: 'missing' },
    { id: 'attestation_fiscale', name: 'Attestation fiscale', type: 'required', status: 'missing' },
    { id: 'attestation_sociale', name: 'Attestation URSSAF', type: 'required', status: 'missing' },
    { id: 'assurance_rc', name: 'Attestation d\'assurance RC Pro', type: 'required', status: 'missing' },
    { id: 'assurance_decennale', name: 'Attestation d\'assurance décennale', type: 'optional', status: 'missing' },
    { id: 'acte_engagement', name: 'Acte d\'engagement', type: 'generated', status: 'missing', aiGenerated: true },
  ],
  technical: [
    { id: 'memoire_technique', name: 'Mémoire technique', type: 'generated', status: 'missing', aiGenerated: true },
    { id: 'note_methodologique', name: 'Note méthodologique', type: 'generated', status: 'missing', aiGenerated: true },
    { id: 'planning', name: 'Planning prévisionnel', type: 'generated', status: 'missing', aiGenerated: true },
    { id: 'references', name: 'Liste des références', type: 'generated', status: 'missing', aiGenerated: true },
    { id: 'certifications', name: 'Certificats et qualifications', type: 'required', status: 'missing' },
    { id: 'organigramme', name: 'Organigramme projet', type: 'generated', status: 'missing', aiGenerated: true },
  ],
  team: [
    { id: 'cv_responsable', name: 'CV du responsable de projet', type: 'required', status: 'missing', aiGenerated: true },
    { id: 'cv_equipe', name: 'CV de l\'équipe proposée', type: 'required', status: 'missing', aiGenerated: true },
    { id: 'moyens_humains', name: 'Tableau des moyens humains', type: 'generated', status: 'missing', aiGenerated: true },
    { id: 'qualifications', name: 'Qualifications de l\'équipe', type: 'optional', status: 'missing' },
  ],
  financial: [
    { id: 'dpgf', name: 'DPGF (Décomposition du Prix Global et Forfaitaire)', type: 'required', status: 'missing' },
    { id: 'bpu', name: 'BPU (Bordereau des Prix Unitaires)', type: 'required', status: 'missing' },
    { id: 'detail_estimatif', name: 'Détail estimatif', type: 'optional', status: 'missing' },
    { id: 'sous_traitance', name: 'Déclaration de sous-traitance (DC4)', type: 'optional', status: 'missing', aiGenerated: true },
  ],
};

export function TenderResponseWizard({
  analysis,
  tenderId,
  onComplete,
  onCancel,
}: TenderResponseWizardProps) {
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
      console.log('Brouillon sauvegardé:', savedDraft.id);
    },
    onError: (error) => {
      console.error('Erreur sauvegarde:', error);
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

  // Générer les documents avec l'IA et PDF
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
        // Générer le PDF selon le type de document
        if (doc.name.toLowerCase().includes('dc1')) {
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
            buyer: analysis.buyer?.name || 'Acheteur public',
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
        } else if (doc.name.toLowerCase().includes('mémoire') || doc.name.toLowerCase().includes('technique')) {
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
            buyer: analysis.buyer?.name || 'Acheteur public',
            deadline: analysis.dates.submissionDeadline,
          };

          const analysisData = {
            summary: analysis.summary || 'Résumé de l\'appel d\'offres',
            requirements: [
              ...(analysis.requirements?.technical || []),
              ...(analysis.requirements?.administrative || []),
              ...(analysis.requirements?.financial || []),
              ...(analysis.requirements?.certifications || []),
            ],
            methodology: 'Méthodologie de réponse',
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
          // Pour les autres documents, simuler la génération
          await new Promise(resolve => setTimeout(resolve, 1500));
          setDocuments(prev => ({
            ...prev,
            [currentStep.id]: prev[currentStep.id].map(d => 
              d.id === doc.id ? { ...d, status: 'ready' as const } : d
            ),
          }));
        }
      } catch (error) {
        console.error('Erreur génération document:', error);
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

  // Télécharger un document généré
  const downloadDocument = (doc: DocumentItem) => {
    if (doc.downloadUrl) {
      const link = document.createElement('a');
      link.href = doc.downloadUrl;
      link.download = `${doc.name}.pdf`;
      link.click();
    }
  };

  // Uploader un document
  const handleFileUpload = (docId: string, file: File) => {
    setDocuments(prev => ({
      ...prev,
      [currentStep.id]: prev[currentStep.id].map(d => 
        d.id === docId ? { ...d, status: 'uploaded' as const } : d
      ),
    }));
  };

  // Télécharger le dossier complet
  const downloadCompleteDossier = () => {
    // Simulation du téléchargement
    console.log('Téléchargement du dossier complet');
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
                Réponse à l'appel d'offres
              </h1>
              <p className="text-sm text-surface-500">{analysis.reference} - {analysis.title}</p>
            </div>
            <div className="flex items-center gap-4">
              <SaveIndicator status={saveStatus} lastSaved={lastSaved} />
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-surface-600">
                  Date limite: {new Date(analysis.dates.submissionDeadline).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => { saveNow(); onCancel(); }}>
                Sauvegarder & Quitter
              </Button>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-surface-600">Progression du dossier</span>
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
                              Génération... {generationProgress}%
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Générer avec l'IA
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
                                <Badge variant="danger" size="sm">Obligatoire</Badge>
                              )}
                              {doc.type === 'optional' && (
                                <Badge variant="secondary" size="sm">Optionnel</Badge>
                              )}
                              {doc.aiGenerated && (
                                <Badge variant="warning" size="sm" className="flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  IA
                                </Badge>
                              )}
                            </div>
                            {doc.status === 'generating' && (
                              <p className="text-sm text-yellow-600 mt-1">Génération en cours...</p>
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
                                  Uploader
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
                                  title="Télécharger le document"
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
                      Notes pour cette étape
                    </h3>
                    <Textarea
                      value={notes[currentStep.id] || ''}
                      onChange={(e) => handleNotesChange(currentStep.id, e.target.value)}
                      placeholder="Ajoutez vos notes, remarques ou points d'attention..."
                      rows={4}
                    />
                  </Card>
                </div>

                {/* Sidebar - Aide et conseils */}
                <div className="space-y-4">
                  <Card className="p-6 bg-primary-50 border-primary-200">
                    <h3 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary-600" />
                      Conseils IA
                    </h3>
                    <div className="space-y-3 text-sm text-primary-800">
                      <p>
                        Pour cette étape, notre IA peut générer automatiquement les documents marqués avec <Badge variant="warning" size="sm"><Sparkles className="w-3 h-3" /></Badge>
                      </p>
                      <p>
                        Les documents générés sont personnalisés selon votre profil d'entreprise et les exigences de l'appel d'offres.
                      </p>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold text-surface-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      Points d'attention
                    </h3>
                    <ul className="space-y-2 text-sm text-surface-600">
                      {currentStep.id === 'administrative' && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            Vérifiez que le KBIS date de moins de 3 mois
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            L'attestation fiscale doit être à jour
                          </li>
                        </>
                      )}
                      {currentStep.id === 'technical' && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            Le mémoire technique pèse 40% de la note finale
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            Incluez des références similaires récentes
                          </li>
                        </>
                      )}
                      {currentStep.id === 'team' && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            Mettez en avant les certifications pertinentes
                          </li>
                        </>
                      )}
                      {currentStep.id === 'financial' && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            Le prix représente 60% de la note finale
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            Vérifiez que tous les postes sont chiffrés
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
                    <h2 className="text-2xl font-bold text-surface-900">Vérification finale</h2>
                    <p className="text-surface-500 mt-2">
                      Contrôlez que votre dossier est complet avant de le finaliser
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
                                  {completedRequired}/{requiredDocs.length} documents obligatoires
                                </p>
                              </div>
                            </div>
                            {!allComplete && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentStepIndex(WIZARD_STEPS.findIndex(s => s.id === stepId))}
                              >
                                Compléter
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Checklist finale */}
                  <div className="mt-8 pt-6 border-t border-surface-200">
                    <h3 className="font-semibold text-surface-900 mb-4">Checklist finale</h3>
                    <div className="space-y-3">
                      {[
                        'J\'ai vérifié que tous les documents sont signés',
                        'Les montants financiers sont corrects',
                        'Le dossier respecte le format demandé',
                        'J\'ai relu le mémoire technique',
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
                      Votre dossier est prêt !
                    </h2>
                    <p className="text-surface-500 mt-2 max-w-md mx-auto">
                      Tous les documents ont été générés et assemblés. Vous pouvez télécharger le dossier complet.
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="p-4 bg-surface-50 rounded-xl">
                      <FileText className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                      <p className="font-semibold text-surface-900">
                        {Object.values(documents).flat().filter(d => d.status === 'ready' || d.status === 'uploaded').length}
                      </p>
                      <p className="text-sm text-surface-500">Documents</p>
                    </div>
                    <div className="p-4 bg-surface-50 rounded-xl">
                      <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <p className="font-semibold text-surface-900">
                        {analysis.matchScore || 0}%
                      </p>
                      <p className="text-sm text-surface-500">Compatibilité</p>
                    </div>
                    <div className="p-4 bg-surface-50 rounded-xl">
                      <CalendarCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="font-semibold text-surface-900">
                        Dans les temps
                      </p>
                      <p className="text-sm text-surface-500">Statut</p>
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
                      Télécharger le dossier complet
                    </Button>
                    
                    <div className="flex items-center gap-2 text-sm text-surface-500">
                      <Lock className="w-4 h-4" />
                      <span>Fichier ZIP sécurisé • Prêt pour dépôt</span>
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
            Précédent
          </Button>
          
          {currentStep.id !== 'submit' && (
            <Button
              variant="primary"
              onClick={nextStep}
              disabled={['administrative', 'technical', 'team', 'financial'].includes(currentStep.id) && !canProceed()}
            >
              {currentStep.id === 'review' ? 'Finaliser' : 'Suivant'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TenderResponseWizard;
