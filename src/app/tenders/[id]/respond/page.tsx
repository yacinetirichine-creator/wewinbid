'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { NewAppLayout } from '@/components/layout/NewAppLayout';
import { TenderResponseWizard } from '@/components/tenders/TenderResponseWizard';
import { TenderAnalysisResult } from '@/components/tenders/TenderAIAnalysis';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function TenderRespondPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tender, setTender] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<TenderAnalysisResult | null>(null);

  const tenderId = params.id as string;

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }, []);

  useEffect(() => {
    async function fetchTender() {
      try {
        const supabase = getSupabase();
        
        // Vérifier l'utilisateur
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Vous devez être connecté');
          setLoading(false);
          return;
        }

        // Récupérer le company_id
        const { data: memberData } = await (supabase
          .from('company_members') as any)
          .select('company_id')
          .eq('user_id', user.id)
          .single();

        if (!memberData?.company_id) {
          setError('Entreprise non trouvée');
          setLoading(false);
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
            setError('Appel d\'offres non trouvé ou accès refusé');
            setLoading(false);
            return;
          }
          throw error;
        }
        if (!data) throw new Error('AO non trouvé');

        const tenderData = data as any;
        setTender(tenderData);

        // Construire l'analyse à partir des données du tender
        const analysis: TenderAnalysisResult = tenderData.ai_analysis || {
          title: tenderData.title,
          reference: tenderData.reference,
          buyer: {
            name: tenderData.buyer_name,
            type: tenderData.buyer_type,
            address: '',
            contact: '',
          },
          summary: tenderData.description || '',
          dates: {
            publicationDate: tenderData.publication_date,
            submissionDeadline: tenderData.deadline,
          },
          financials: {
            estimatedValue: tenderData.estimated_value ? `${tenderData.estimated_value} €` : '',
          },
          keywords: tenderData.keywords || [],
          sectors: tenderData.sectors || [],
          requirements: tenderData.requirements || {},
          matchScore: tenderData.compatibility_score || tenderData.ai_score || 0,
          matchDetails: [],
          analyzedDocuments: [],
          confidence: 80,
        };

        setAnalysisResult(analysis);
      } catch (err) {
        console.error('Erreur chargement AO:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    }

    fetchTender();
  }, [tenderId, getSupabase]);

  const handleResponseComplete = useCallback((response: any) => {
    console.log('Réponse terminée:', response);
    router.push(`/tenders/${tenderId}`);
  }, [router, tenderId]);

  const handleCancel = useCallback(() => {
    router.push(`/tenders/${tenderId}`);
  }, [router, tenderId]);

  if (loading) {
    return (
      <NewAppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </NewAppLayout>
    );
  }

  if (error || !analysisResult) {
    return (
      <NewAppLayout>
        <div className="max-w-2xl mx-auto py-12">
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-surface-900 mb-2">Erreur</h2>
            <p className="text-surface-500 mb-6">{error || 'Impossible de charger les données de l\'AO'}</p>
            <Link href="/tenders">
              <Button>Retour aux AO</Button>
            </Link>
          </Card>
        </div>
      </NewAppLayout>
    );
  }

  return (
    <TenderResponseWizard
      analysis={analysisResult}
      tenderId={tenderId}
      onComplete={handleResponseComplete}
      onCancel={handleCancel}
    />
  );
}
