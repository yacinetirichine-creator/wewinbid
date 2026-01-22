'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TenderAnalysisResult } from '@/components/tenders/TenderAIAnalysis';

interface UseAnalysisState {
  isAnalyzing: boolean;
  progress: number;
  currentStep: string;
  analysis: TenderAnalysisResult | null;
  error: string | null;
}

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
}

export function useTenderAnalysis() {
  const [state, setState] = useState<UseAnalysisState>({
    isAnalyzing: false,
    progress: 0,
    currentStep: '',
    analysis: null,
    error: null,
  });

  // Extraire le texte d'un fichier PDF (simplifié - en production utiliser pdf.js)
  const extractTextFromFile = async (file: File): Promise<string> => {
    // Pour les fichiers texte
    if (file.type === 'text/plain') {
      return await file.text();
    }
    
    // Pour les autres types, on retourne le nom comme placeholder
    // En production, utiliser une API d'extraction (pdf.js, mammoth pour docx, etc.)
    return `[Contenu du fichier: ${file.name}]`;
  };

  // Analyser les documents
  const analyzeDocuments = useCallback(async (files: UploadedFile[]) => {
    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      progress: 0,
      currentStep: 'Préparation des documents...',
      error: null,
    }));

    try {
      // Étape 1: Extraire le contenu des fichiers
      setState(prev => ({ ...prev, progress: 10, currentStep: 'Lecture des documents...' }));
      
      const documents = await Promise.all(
        files.map(async (f) => ({
          name: f.name,
          content: await extractTextFromFile(f.file),
          type: f.type,
        }))
      );

      setState(prev => ({ ...prev, progress: 30, currentStep: 'Envoi à l\'IA...' }));

      // Étape 2: Appeler l'API d'analyse
      const response = await fetch('/api/tenders/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents }),
      });

      setState(prev => ({ ...prev, progress: 60, currentStep: 'Analyse en cours...' }));

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'analyse');
      }

      const result = await response.json();

      setState(prev => ({ ...prev, progress: 90, currentStep: 'Finalisation...' }));

      // Petite pause pour l'UX
      await new Promise(resolve => setTimeout(resolve, 500));

      setState({
        isAnalyzing: false,
        progress: 100,
        currentStep: 'Analyse terminée !',
        analysis: result.analysis,
        error: null,
      });

      return result.analysis;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  // Sauvegarder l'analyse comme nouveau tender
  const saveAsTender = useCallback(async (analysis: TenderAnalysisResult) => {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data, error } = await supabase
      .from('tenders')
      .insert({
        user_id: user.id,
        title: analysis.title,
        reference: analysis.reference,
        type: analysis.buyer.type.includes('public') ? 'PUBLIC' : 'PRIVATE',
        status: 'ANALYSIS',
        buyer_name: analysis.buyer.name,
        buyer_type: analysis.buyer.type,
        sector: analysis.sectors[0] || 'OTHER',
        estimated_value: parseFloat(analysis.financials.estimatedValue?.replace(/[^\d]/g, '') || '0'),
        deadline: analysis.dates.submissionDeadline,
        description: analysis.summary,
        ai_score: analysis.matchScore,
        metadata: {
          keywords: analysis.keywords,
          requirements: analysis.requirements,
          awardCriteria: analysis.awardCriteria,
          lots: analysis.lots,
          risks: analysis.risks,
          opportunities: analysis.opportunities,
        },
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }, []);

  // Réinitialiser l'état
  const reset = useCallback(() => {
    setState({
      isAnalyzing: false,
      progress: 0,
      currentStep: '',
      analysis: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    analyzeDocuments,
    saveAsTender,
    reset,
  };
}

export default useTenderAnalysis;
