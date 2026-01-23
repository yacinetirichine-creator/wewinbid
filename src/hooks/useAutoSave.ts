'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

// Types
export interface TenderDraft {
  id?: string;
  tender_id: string;
  analysis_id?: string;
  user_id?: string;
  current_step: number;
  documents_status: Record<string, DocumentStatus[]>;
  notes: Record<string, string>;
  checklist: Record<string, boolean>;
  form_data: Record<string, any>;
  last_saved_at: string;
  is_complete: boolean;
}

export interface DocumentStatus {
  id: string;
  name: string;
  status: 'missing' | 'uploaded' | 'generating' | 'ready' | 'error';
  uploadedAt?: string;
  fileUrl?: string;
}

export interface AutoSaveOptions {
  debounceMs?: number;
  onSave?: (draft: TenderDraft) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

// États de sauvegarde
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave(
  tenderId: string,
  options: AutoSaveOptions = {}
) {
  const {
    debounceMs = 2000,
    onSave,
    onError,
    enabled = true,
  } = options;

  const [draft, setDraft] = useState<TenderDraft | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // Charger le brouillon existant
  useEffect(() => {
    async function loadDraft() {
      if (!tenderId) {
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Charger depuis tender_responses
            const { data, error } = await (supabase
              .from('tender_responses') as any)
          .select('*')
          .eq('tender_id', tenderId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data && !error) {
          setDraft({
            id: data.id,
            tender_id: data.tender_id,
            analysis_id: data.analysis_id,
            user_id: data.user_id,
            current_step: data.current_step || 0,
            documents_status: data.documents_status || {},
            notes: data.notes || {},
            checklist: data.checklist || {},
            form_data: data.form_data || {},
            last_saved_at: data.updated_at,
            is_complete: data.status === 'completed',
          });
          setLastSaved(new Date(data.updated_at));
        } else {
          // Créer un nouveau brouillon
          setDraft({
            tender_id: tenderId,
            user_id: user.id,
            current_step: 0,
            documents_status: {},
            notes: {},
            checklist: {},
            form_data: {},
            last_saved_at: new Date().toISOString(),
            is_complete: false,
          });
        }
      } catch (err) {
        console.error('Erreur chargement brouillon:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDraft();
  }, [tenderId]);

  // Sauvegarder le brouillon
  const saveDraft = useCallback(async (updatedDraft: Partial<TenderDraft>) => {
    if (!enabled || !draft) return;

    setSaveStatus('saving');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const draftToSave = {
        ...draft,
        ...updatedDraft,
        user_id: user.id,
        last_saved_at: new Date().toISOString(),
      };

      // Upsert dans tender_responses
        const { data, error } = await (supabase
          .from('tender_responses') as any)
        .upsert({
          id: draft.id,
          tender_id: draftToSave.tender_id,
          analysis_id: draftToSave.analysis_id,
          user_id: user.id,
          current_step: draftToSave.current_step,
          documents_status: draftToSave.documents_status,
          notes: draftToSave.notes,
          checklist: draftToSave.checklist,
          form_data: draftToSave.form_data,
          status: draftToSave.is_complete ? 'completed' : 'draft',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: draft.id ? 'id' : 'tender_id,user_id',
        })
        .select()
        .single();

      if (error) throw error;

      const savedDraft = { ...draftToSave, id: data?.id };
      setDraft(savedDraft);
      setLastSaved(new Date());
      setSaveStatus('saved');
      
      // Réinitialiser le statut après 2s
      setTimeout(() => setSaveStatus('idle'), 2000);

      onSave?.(savedDraft);
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setSaveStatus('error');
      onError?.(err instanceof Error ? err : new Error('Erreur de sauvegarde'));
      
      // Réinitialiser après 3s
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [draft, enabled, onSave, onError]);

  // Sauvegarde avec debounce
  const debouncedSave = useCallback((updates: Partial<TenderDraft>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDraft(updates);
    }, debounceMs);
  }, [debounceMs, saveDraft]);

  // Mettre à jour le brouillon (avec auto-save)
  const updateDraft = useCallback((updates: Partial<TenderDraft>) => {
    setDraft(prev => prev ? { ...prev, ...updates } : null);
    debouncedSave(updates);
  }, [debouncedSave]);

  // Mettre à jour l'étape courante
  const setCurrentStep = useCallback((step: number) => {
    updateDraft({ current_step: step });
  }, [updateDraft]);

  // Mettre à jour le statut des documents
  const updateDocumentStatus = useCallback((
    stepId: string,
    docId: string,
    status: Partial<DocumentStatus>
  ) => {
    if (!draft) return;

    const currentDocs = draft.documents_status[stepId] || [];
    const docIndex = currentDocs.findIndex(d => d.id === docId);
    
    let newDocs: DocumentStatus[];
    if (docIndex >= 0) {
      newDocs = currentDocs.map((d, i) => 
        i === docIndex ? { ...d, ...status } : d
      );
    } else {
      newDocs = [...currentDocs, { id: docId, name: '', status: 'missing', ...status }];
    }

    updateDraft({
      documents_status: {
        ...draft.documents_status,
        [stepId]: newDocs,
      },
    });
  }, [draft, updateDraft]);

  // Mettre à jour les notes
  const updateNotes = useCallback((stepId: string, note: string) => {
    if (!draft) return;
    updateDraft({
      notes: {
        ...draft.notes,
        [stepId]: note,
      },
    });
  }, [draft, updateDraft]);

  // Mettre à jour la checklist
  const updateChecklist = useCallback((itemId: string, checked: boolean) => {
    if (!draft) return;
    updateDraft({
      checklist: {
        ...draft.checklist,
        [itemId]: checked,
      },
    });
  }, [draft, updateDraft]);

  // Mettre à jour les données du formulaire
  const updateFormData = useCallback((key: string, value: any) => {
    if (!draft) return;
    updateDraft({
      form_data: {
        ...draft.form_data,
        [key]: value,
      },
    });
  }, [draft, updateDraft]);

  // Marquer comme complet
  const markAsComplete = useCallback(() => {
    saveDraft({ is_complete: true });
  }, [saveDraft]);

  // Forcer la sauvegarde immédiate
  const saveNow = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (draft) {
      saveDraft(draft);
    }
  }, [draft, saveDraft]);

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    draft,
    loading,
    saveStatus,
    lastSaved,
    updateDraft,
    setCurrentStep,
    updateDocumentStatus,
    updateNotes,
    updateChecklist,
    updateFormData,
    markAsComplete,
    saveNow,
  };
}

// Hook pour afficher le statut de sauvegarde
export function useSaveStatusIndicator(saveStatus: SaveStatus, lastSaved: Date | null) {
  const getMessage = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Sauvegarde en cours...';
      case 'saved':
        return 'Sauvegardé';
      case 'error':
        return 'Erreur de sauvegarde';
      default:
        if (lastSaved) {
          const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
          if (seconds < 60) return 'Sauvegardé à l\'instant';
          const minutes = Math.floor(seconds / 60);
          if (minutes < 60) return `Sauvegardé il y a ${minutes}min`;
          return `Dernière sauvegarde: ${lastSaved.toLocaleTimeString()}`;
        }
        return '';
    }
  };

  const getIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return 'spinner';
      case 'saved':
        return 'check';
      case 'error':
        return 'alert';
      default:
        return 'cloud';
    }
  };

  const getColor = () => {
    switch (saveStatus) {
      case 'saving':
        return 'text-blue-500';
      case 'saved':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-surface-400';
    }
  };

  return {
    message: getMessage(),
    icon: getIcon(),
    color: getColor(),
  };
}
