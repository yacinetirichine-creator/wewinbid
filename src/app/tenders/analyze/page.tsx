'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Badge } from '@/components/ui';
import { NewAppLayout } from '@/components/layout/NewAppLayout';
import { TenderDocumentsUpload } from '@/components/tenders/TenderDocumentsUpload';
import { TenderAIAnalysis, TenderAnalysisResult } from '@/components/tenders/TenderAIAnalysis';
import { TenderResponseWizard } from '@/components/tenders/TenderResponseWizard';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

// États du workflow
type WorkflowStep = 'upload' | 'analyzing' | 'analysis' | 'responding';

// Données de démo pour l'analyse
const DEMO_ANALYSIS: TenderAnalysisResult = {
  title: "Maintenance et entretien des espaces verts - Commune de Lyon",
  reference: "AO-2024-EVL-0042",
  buyer: {
    name: "Métropole de Lyon",
    type: "Collectivité territoriale",
    address: "20 Rue du Lac, 69003 Lyon",
    contact: "service.marches@grandlyon.com",
  },
  summary: `Cet appel d'offres porte sur l'entretien et la maintenance des espaces verts publics de la ville de Lyon pour une durée de 4 ans. Le marché comprend la tonte régulière, la taille des arbustes et haies, le désherbage écologique, la gestion des déchets verts, ainsi que le fleurissement saisonnier des jardinières et parterres.

Le prestataire devra garantir une prestation de qualité respectant les normes environnementales en vigueur, notamment l'interdiction des produits phytosanitaires conformément à la loi Labbé. Une attention particulière sera portée sur les pratiques de gestion différenciée et la préservation de la biodiversité.

Le marché est divisé en 3 lots géographiques correspondant aux différents arrondissements de la ville. Les candidats peuvent répondre à un ou plusieurs lots.`,
  dates: {
    publicationDate: "2024-11-15",
    submissionDeadline: "2024-12-20T17:00:00",
    visitDate: "2024-12-05T10:00:00",
    questionsDeadline: "2024-12-10",
    startDate: "2025-02-01",
    endDate: "2029-01-31",
    duration: "4 ans (reconductible 1 fois)",
  },
  financials: {
    estimatedValue: "2 400 000 € HT",
    budgetRange: "600 000 € - 800 000 € HT/an",
    paymentTerms: "Paiement à 30 jours",
    guarantees: ["Garantie de parfait achèvement", "Retenue de garantie de 5%"],
  },
  keywords: [
    "Espaces verts",
    "Entretien paysager",
    "Tonte",
    "Élagage",
    "Désherbage écologique",
    "Gestion différenciée",
    "Biodiversité",
    "Fleurissement",
  ],
  sectors: ["Environnement", "Services aux collectivités", "Paysagisme"],
  requirements: {
    technical: [
      "Certification Qualipaysage ou équivalent",
      "Expérience minimum de 3 ans en gestion d'espaces verts publics",
      "Matériel adapté à l'entretien de grandes surfaces",
      "Équipe dédiée d'au moins 10 personnes",
      "Véhicules et engins conformes aux normes EURO 6",
    ],
    administrative: [
      "Attestation d'assurance RC Professionnelle",
      "Extrait KBIS de moins de 3 mois",
      "Attestations fiscales et sociales à jour",
      "Références de marchés similaires",
    ],
    financial: [
      "Chiffre d'affaires minimum de 1 M€ sur les 3 dernières années",
      "Capacité d'avance de trésorerie sur 60 jours",
    ],
    certifications: ["Qualipaysage", "ISO 14001", "Éco-jardin"],
  },
  lots: [
    {
      number: "1",
      title: "Arrondissements 1 à 4",
      description: "Entretien des espaces verts du centre historique et de la Croix-Rousse",
      estimatedValue: "800 000 € HT",
    },
    {
      number: "2",
      title: "Arrondissements 5 à 7",
      description: "Entretien des espaces verts de la Presqu'île et de la rive gauche",
      estimatedValue: "900 000 € HT",
    },
    {
      number: "3",
      title: "Arrondissements 8 et 9",
      description: "Entretien des espaces verts des quartiers Est",
      estimatedValue: "700 000 € HT",
    },
  ],
  awardCriteria: [
    { name: "Valeur technique", weight: 40, description: "Méthodologie, moyens, organisation" },
    { name: "Prix", weight: 35, description: "Coût global sur la durée du marché" },
    { name: "Performances environnementales", weight: 15, description: "Démarche développement durable" },
    { name: "Insertion sociale", weight: 10, description: "Heures d'insertion" },
  ],
  risks: {
    level: "medium",
    items: [
      "Forte concurrence sur ce type de marché",
      "Exigences environnementales élevées",
      "Délai de réponse serré",
      "Visite obligatoire des sites",
    ],
  },
  opportunities: [
    "Marché pluriannuel garantissant une visibilité sur 4 ans",
    "Possibilité de reconduction",
    "Acheteur reconnu pour ses paiements réguliers",
    "Valorisation de l'expertise en gestion écologique",
    "Proximité géographique avantageuse",
  ],
  matchScore: 78,
  matchDetails: [
    "Votre entreprise possède la certification Qualipaysage demandée",
    "Vos références incluent 3 marchés similaires avec des collectivités",
    "Votre chiffre d'affaires répond aux exigences financières",
    "Vous disposez de l'équipe et du matériel nécessaires",
  ],
  analyzedDocuments: [
    "AAPC.pdf",
    "RC.pdf",
    "CCAP.pdf",
    "CCTP.pdf",
    "BPU.pdf",
    "Annexe_technique.pdf",
  ],
  confidence: 94,
};

export default function TenderAnalyzePage() {
  const router = useRouter();
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [analysisResult, setAnalysisResult] = useState<TenderAnalysisResult | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [savedTenderId, setSavedTenderId] = useState<string | null>(null);

  // Gestionnaire de changement de fichiers
  const handleFilesChange = useCallback((files: any[]) => {
    setUploadedFiles(files);
  }, []);

  // Sauvegarder l'AO analysé dans la base de données
  const saveTenderToDatabase = useCallback(async (analysis: TenderAnalysisResult) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Utilisateur non connecté');
        return null;
      }

      // Récupérer le company_id de l'utilisateur
      const { data: memberData } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!memberData?.company_id) {
        console.error('Utilisateur sans entreprise associée');
        return null;
      }

      const tenderData = {
        company_id: memberData.company_id, // ⚠️ CLÉ D'ISOLATION
        created_by: user.id,
        title: analysis.title,
        reference: analysis.reference || `AO-${Date.now()}`,
        buyer_name: analysis.buyer?.name,
        buyer_type: analysis.buyer?.type,
        estimated_value: analysis.financials?.estimatedValue ? 
          parseFloat(analysis.financials.estimatedValue.replace(/[^\d]/g, '')) : null,
        deadline: analysis.dates?.submissionDeadline,
        publication_date: analysis.dates?.publicationDate,
        description: analysis.summary,
        status: 'ANALYSIS' as const,
        type: 'PUBLIC' as const,
        compatibility_score: analysis.matchScore,
        sectors: analysis.sectors,
        keywords: analysis.keywords,
        requirements: analysis.requirements,
        ai_analysis: analysis,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await (supabase as any)
        .from('tenders')
        .insert(tenderData)
        .select('id')
        .single();

      if (error) {
        console.error('Erreur sauvegarde AO:', error);
        return null;
      }

      console.log('AO sauvegardé avec ID:', data.id);
      return data.id;
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      return null;
    }
  }, []);

  // Lancer l'analyse IA
  const handleAnalyzeRequest = useCallback(async (files: any[]) => {
    setWorkflowStep('analyzing');
    setAnalysisProgress(0);

    // Simuler l'analyse progressive
    const steps = [
      { progress: 10, label: 'Lecture des documents...' },
      { progress: 25, label: 'Extraction du texte...' },
      { progress: 40, label: 'Identification des informations clés...' },
      { progress: 55, label: 'Analyse des exigences...' },
      { progress: 70, label: 'Évaluation de la compatibilité...' },
      { progress: 85, label: 'Génération du résumé...' },
      { progress: 100, label: 'Analyse terminée !' },
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnalysisProgress(step.progress);
    }

    // Définir le résultat de l'analyse
    setAnalysisResult(DEMO_ANALYSIS);
    
    // Sauvegarder automatiquement l'AO analysé
    const tenderId = await saveTenderToDatabase(DEMO_ANALYSIS);
    if (tenderId) {
      setSavedTenderId(tenderId);
    }
    
    setWorkflowStep('analysis');
  }, [saveTenderToDatabase]);

  // Commencer la réponse
  const handleRespond = useCallback(() => {
    setWorkflowStep('responding');
  }, []);

  // Décliner
  const handleDecline = useCallback(() => {
    router.push('/tenders');
  }, [router]);

  // Terminer la réponse
  const handleResponseComplete = useCallback((response: any) => {
    console.log('Réponse terminée:', response);
    router.push('/tenders');
  }, [router]);

  // Annuler et sauvegarder
  const handleCancel = useCallback(() => {
    router.push('/tenders');
  }, [router]);

  // Si on est dans le wizard de réponse, afficher en pleine page
  if (workflowStep === 'responding' && analysisResult) {
    return (
      <TenderResponseWizard
        analysis={analysisResult}
        tenderId={savedTenderId || "new"}
        onComplete={handleResponseComplete}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <NewAppLayout>
      <div className="max-w-5xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <Link 
            href="/tenders"
            className="inline-flex items-center text-sm text-surface-500 hover:text-surface-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux appels d'offres
          </Link>
          
          <h1 className="text-2xl font-bold text-surface-900">
            Analyser un appel d'offres
          </h1>
          <p className="text-surface-500 mt-1">
            Uploadez les documents du DCE et notre IA analysera l'appel d'offres pour vous
          </p>
        </div>

        {/* Indicateur d'étape */}
        <div className="flex items-center gap-4 mb-8">
          {[
            { id: 'upload', label: 'Upload', icon: FileText },
            { id: 'analysis', label: 'Analyse', icon: Sparkles },
            { id: 'responding', label: 'Réponse', icon: CheckCircle2 },
          ].map((step, idx) => {
            const isActive = workflowStep === step.id || 
              (workflowStep === 'analyzing' && step.id === 'analysis');
            const isCompleted = 
              (step.id === 'upload' && ['analyzing', 'analysis', 'responding'].includes(workflowStep)) ||
              (step.id === 'analysis' && workflowStep === 'responding');
            
            const StepIcon = step.icon;

            return (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full',
                  isActive && 'bg-primary-100 text-primary-700',
                  isCompleted && 'bg-green-100 text-green-700',
                  !isActive && !isCompleted && 'bg-surface-100 text-surface-400'
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <StepIcon className={cn(
                      'w-5 h-5',
                      isActive && 'text-primary-600'
                    )} />
                  )}
                  <span className="font-medium">{step.label}</span>
                </div>
                {idx < 2 && (
                  <div className={cn(
                    'w-16 h-0.5 mx-2',
                    isCompleted ? 'bg-green-300' : 'bg-surface-200'
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Contenu selon l'étape */}
        <AnimatePresence mode="wait">
          {workflowStep === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-bold text-surface-900">
                    Documents de l'appel d'offres
                  </h2>
                  <p className="text-surface-500 mt-2 max-w-md mx-auto">
                    Importez le DCE complet (AAPC, RC, CCAP, CCTP, BPU, etc.) pour une analyse optimale
                  </p>
                </div>

                <TenderDocumentsUpload
                  onFilesChange={handleFilesChange}
                  onAnalyzeRequest={handleAnalyzeRequest}
                  maxFiles={20}
                  maxFileSize={50}
                />
              </Card>
            </motion.div>
          )}

          {workflowStep === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-12 text-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'loop',
                  }}
                  className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/30"
                >
                  <Sparkles className="w-10 h-10 text-white" />
                </motion.div>

                <h2 className="text-xl font-bold text-surface-900 mb-2">
                  Analyse en cours...
                </h2>
                <p className="text-surface-500 mb-8">
                  Notre IA analyse vos documents pour extraire les informations clés
                </p>

                <div className="max-w-md mx-auto mb-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-surface-600">Progression</span>
                    <span className="font-semibold text-primary-600">{analysisProgress}%</span>
                  </div>
                  <div className="h-3 bg-surface-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${analysisProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-surface-500">
                  <Clock className="w-4 h-4" />
                  <span>Temps estimé: ~30 secondes</span>
                </div>

                {/* Documents en cours d'analyse */}
                <div className="mt-8 pt-8 border-t border-surface-200">
                  <p className="text-sm text-surface-400 mb-4">Documents analysés</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {uploadedFiles.map((file, idx) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {file.name}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {workflowStep === 'analysis' && analysisResult && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-6">
                <TenderAIAnalysis
                  analysis={analysisResult}
                  onRespond={handleRespond}
                  onDecline={handleDecline}
                />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </NewAppLayout>
  );
}
