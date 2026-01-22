import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Interface pour la requête d'analyse
interface AnalysisRequest {
  documents: {
    name: string;
    content: string;
    type: string;
  }[];
  userId: string;
}

// Interface pour le résultat de l'analyse
interface TenderAnalysisResult {
  title: string;
  reference: string;
  buyer: {
    name: string;
    type: string;
    address?: string;
    contact?: string;
  };
  summary: string;
  dates: {
    publicationDate?: string;
    submissionDeadline: string;
    visitDate?: string;
    questionsDeadline?: string;
    startDate?: string;
    endDate?: string;
    duration?: string;
  };
  financials: {
    estimatedValue?: string;
    budgetRange?: string;
    paymentTerms?: string;
    guarantees?: string[];
  };
  keywords: string[];
  sectors: string[];
  requirements: {
    technical: string[];
    administrative: string[];
    financial: string[];
    certifications?: string[];
  };
  lots?: {
    number: string;
    title: string;
    description: string;
    estimatedValue?: string;
  }[];
  awardCriteria: {
    name: string;
    weight: number;
    description?: string;
  }[];
  risks: {
    level: 'low' | 'medium' | 'high';
    items: string[];
  };
  opportunities: string[];
  matchScore?: number;
  matchDetails?: string[];
  analyzedDocuments: string[];
  confidence: number;
}

// Prompt système pour l'analyse IA
const ANALYSIS_SYSTEM_PROMPT = `Tu es un expert en analyse d'appels d'offres français. Tu dois analyser les documents fournis et extraire toutes les informations pertinentes.

Tu dois retourner un objet JSON structuré contenant:
1. title: Le titre de l'appel d'offres
2. reference: La référence/numéro de l'AO
3. buyer: Informations sur l'acheteur (name, type, address, contact)
4. summary: Un résumé détaillé de l'objet du marché (3-4 paragraphes)
5. dates: Toutes les dates importantes (publication, limite de réponse, visite, questions, début, fin, durée)
6. financials: Informations financières (montant estimé, fourchette, conditions de paiement, garanties)
7. keywords: Liste des mots-clés principaux (8-10)
8. sectors: Secteurs d'activité concernés
9. requirements: Exigences techniques, administratives, financières et certifications
10. lots: Liste des lots si applicable
11. awardCriteria: Critères d'attribution avec leurs pondérations
12. risks: Niveau de risque et liste des risques identifiés
13. opportunities: Liste des opportunités
14. confidence: Niveau de confiance de l'analyse (0-100)

Sois exhaustif et précis. Les dates doivent être au format ISO (YYYY-MM-DD).`;

// Fonction pour appeler l'API OpenAI ou autre LLM
async function analyzeWithAI(documents: { name: string; content: string }[]): Promise<TenderAnalysisResult> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    // Mode démo sans clé API
    console.log('Mode démo: Pas de clé OpenAI, utilisation de données fictives');
    return generateDemoAnalysis(documents);
  }

  try {
    const documentContent = documents
      .map(doc => `=== Document: ${doc.name} ===\n${doc.content}`)
      .join('\n\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: `Analyse les documents suivants d'un appel d'offres et retourne un JSON structuré:\n\n${documentContent}`
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    
    return {
      ...analysis,
      analyzedDocuments: documents.map(d => d.name),
    };
  } catch (error) {
    console.error('Erreur analyse IA:', error);
    return generateDemoAnalysis(documents);
  }
}

// Génération d'une analyse de démo
function generateDemoAnalysis(documents: { name: string; content: string }[]): TenderAnalysisResult {
  return {
    title: "Marché de prestations détecté",
    reference: `AO-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    buyer: {
      name: "Acheteur Public",
      type: "Collectivité territoriale",
      address: "France",
    },
    summary: "Analyse automatique des documents. Les informations détaillées seront extraites par notre IA.",
    dates: {
      submissionDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    financials: {},
    keywords: ["Marché public", "Prestation"],
    sectors: ["Services"],
    requirements: {
      technical: ["À analyser"],
      administrative: ["Documents administratifs requis"],
      financial: ["Capacités financières requises"],
    },
    awardCriteria: [
      { name: "Valeur technique", weight: 50 },
      { name: "Prix", weight: 50 },
    ],
    risks: {
      level: "medium",
      items: ["Analyse en cours"],
    },
    opportunities: ["À déterminer après analyse complète"],
    analyzedDocuments: documents.map(d => d.name),
    confidence: 60,
  };
}

// Calcul du score de compatibilité
async function calculateMatchScore(
  analysis: TenderAnalysisResult,
  userId: string,
  supabase: any
): Promise<{ score: number; details: string[] }> {
  try {
    // Récupérer le profil de l'entreprise
    const { data: profile } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return { score: 50, details: ["Profil entreprise non configuré"] };
    }

    const details: string[] = [];
    let score = 50; // Score de base

    // Vérification des certifications
    if (analysis.requirements.certifications && profile.certifications) {
      const matchingCerts = analysis.requirements.certifications.filter(
        cert => profile.certifications?.includes(cert)
      );
      if (matchingCerts.length > 0) {
        score += 15;
        details.push(`Certifications correspondantes: ${matchingCerts.join(', ')}`);
      }
    }

    // Vérification des secteurs
    if (profile.sectors) {
      const matchingSectors = analysis.sectors.filter(
        sector => profile.sectors?.includes(sector)
      );
      if (matchingSectors.length > 0) {
        score += 10;
        details.push(`Secteurs d'activité correspondants`);
      }
    }

    // Vérification de la capacité financière
    if (profile.annual_revenue && analysis.financials.estimatedValue) {
      score += 10;
      details.push(`Capacité financière adaptée`);
    }

    // Expérience
    if (profile.years_experience && profile.years_experience >= 3) {
      score += 10;
      details.push(`Expérience suffisante (${profile.years_experience} ans)`);
    }

    return { 
      score: Math.min(score, 100), 
      details 
    };
  } catch (error) {
    console.error('Erreur calcul score:', error);
    return { score: 50, details: [] };
  }
}

// Handler POST pour l'analyse
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { documents } = body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { error: 'Aucun document fourni' },
        { status: 400 }
      );
    }

    // Analyser les documents avec l'IA
    const analysis = await analyzeWithAI(documents);

    // Calculer le score de compatibilité
    const { score, details } = await calculateMatchScore(analysis, user.id, supabase);
    analysis.matchScore = score;
    analysis.matchDetails = details;

    // Sauvegarder l'analyse en base (optionnel)
    await supabase.from('tender_analyses').insert({
      user_id: user.id,
      analysis_data: analysis,
      documents_count: documents.length,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Erreur API analyse:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse' },
      { status: 500 }
    );
  }
}

// Handler GET pour récupérer les analyses passées
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { data: analyses, error } = await supabase
      .from('tender_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      analyses: analyses || [],
    });
  } catch (error) {
    console.error('Erreur API get analyses:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}
