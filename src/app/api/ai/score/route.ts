import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withErrorHandler } from '@/lib/errors';
import { cache, cacheKeys, cacheTTL } from '@/lib/cache';
import { z } from 'zod';

// Validation schemas
const ScoreRequestSchema = z.object({
  tender_id: z.string().uuid(),
});

const ScoreQuerySchema = z.object({
  tender_id: z.string().uuid(),
});

// Scoring weights for different criteria
const SCORING_WEIGHTS = {
  documents: 0.25,        // 25% - Document completeness
  experience: 0.20,       // 20% - Relevant experience
  budget: 0.15,           // 15% - Budget alignment
  timeline: 0.15,         // 15% - Timeline feasibility
  compliance: 0.15,       // 15% - Regulatory compliance
  competition: 0.10,      // 10% - Competitive positioning
};

// AI Provider configuration
const AI_PROVIDERS = {
  openai: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4-turbo-preview',
  },
  anthropic: {
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-opus-20240229',
  },
};

interface ScoringCriteria {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  details: string;
  improvements: string[];
}

interface ScoringResult {
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  criteria: ScoringCriteria[];
  summary: string;
  topRecommendations: string[];
  estimatedWinProbability: number;
}

// Calculate document completeness score
function scoreDocuments(tender: any, company: any, requiredDocs: string[]): ScoringCriteria {
  const uploadedDocs = tender.documents?.length || 0;
  const requiredCount = requiredDocs.length;
  const completeness = requiredCount > 0 ? (uploadedDocs / requiredCount) : 0;
  
  const score = Math.round(completeness * 25);
  const improvements: string[] = [];
  
  if (completeness < 1) {
    improvements.push(`Téléchargez ${requiredCount - uploadedDocs} documents manquants`);
  }
  if (!tender.documents?.some((d: any) => d.type === 'TECHNICAL')) {
    improvements.push('Ajoutez votre mémoire technique');
  }
  
  return {
    name: 'Complétude documentaire',
    score,
    maxScore: 25,
    weight: SCORING_WEIGHTS.documents,
    details: `${uploadedDocs}/${requiredCount} documents fournis`,
    improvements,
  };
}

// Calculate experience/reference score
function scoreExperience(tender: any, company: any): ScoringCriteria {
  let score = 0;
  const improvements: string[] = [];
  
  // Check if company has relevant sector experience
  const relevantSectors = company?.sectors || [];
  const tenderSector = tender.sector;
  
  if (relevantSectors.includes(tenderSector)) {
    score += 10;
  } else {
    improvements.push(`Ajoutez des références dans le secteur "${tenderSector}"`);
  }
  
  // Check references count
  const references = company?.references_count || 0;
  if (references >= 5) {
    score += 10;
  } else if (references >= 3) {
    score += 6;
    improvements.push('Ajoutez plus de références clients');
  } else {
    score += 3;
    improvements.push('Constituez un dossier de références solide');
  }
  
  return {
    name: 'Expérience & Références',
    score,
    maxScore: 20,
    weight: SCORING_WEIGHTS.experience,
    details: `${references} références, secteur ${relevantSectors.includes(tenderSector) ? 'pertinent' : 'différent'}`,
    improvements,
  };
}

// Calculate budget alignment score
function scoreBudget(tender: any, company: any): ScoringCriteria {
  let score = 0;
  const improvements: string[] = [];
  
  const estimatedValue = tender.estimated_value || 0;
  const avgContractValue = company?.avg_contract_value || 50000;
  
  // Check if tender value is within company's typical range
  const ratio = estimatedValue / avgContractValue;
  
  if (ratio >= 0.5 && ratio <= 2) {
    score = 15;
  } else if (ratio >= 0.25 && ratio <= 4) {
    score = 10;
    if (ratio > 2) {
      improvements.push('Ce marché est plus important que vos contrats habituels');
    }
  } else {
    score = 5;
    improvements.push('La valeur de ce marché est éloignée de vos contrats types');
  }
  
  return {
    name: 'Alignement budgétaire',
    score,
    maxScore: 15,
    weight: SCORING_WEIGHTS.budget,
    details: `Valeur estimée: ${estimatedValue.toLocaleString()}€`,
    improvements,
  };
}

// Calculate timeline feasibility score
function scoreTimeline(tender: any): ScoringCriteria {
  let score = 0;
  const improvements: string[] = [];
  
  const deadline = tender.deadline ? new Date(tender.deadline) : null;
  const now = new Date();
  
  if (!deadline) {
    return {
      name: 'Faisabilité délai',
      score: 8,
      maxScore: 15,
      weight: SCORING_WEIGHTS.timeline,
      details: 'Date limite non spécifiée',
      improvements: ['Vérifiez la date limite de dépôt'],
    };
  }
  
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysRemaining > 21) {
    score = 15;
  } else if (daysRemaining > 14) {
    score = 12;
    improvements.push('Délai confortable mais commencez rapidement');
  } else if (daysRemaining > 7) {
    score = 8;
    improvements.push('Délai serré - priorisez ce dossier');
  } else if (daysRemaining > 0) {
    score = 4;
    improvements.push('URGENT: Moins de 7 jours pour finaliser');
  } else {
    score = 0;
    improvements.push('Date limite dépassée');
  }
  
  return {
    name: 'Faisabilité délai',
    score,
    maxScore: 15,
    weight: SCORING_WEIGHTS.timeline,
    details: daysRemaining > 0 ? `${daysRemaining} jours restants` : 'Délai dépassé',
    improvements,
  };
}

// Calculate compliance score
function scoreCompliance(tender: any, company: any): ScoringCriteria {
  let score = 0;
  const improvements: string[] = [];
  
  // Check certifications
  const hasCertifications = company?.certifications?.length > 0;
  if (hasCertifications) {
    score += 5;
  } else {
    improvements.push('Obtenez des certifications (ISO, Qualibat, etc.)');
  }
  
  // Check insurance
  const hasInsurance = company?.has_rc_insurance;
  if (hasInsurance) {
    score += 5;
  } else {
    improvements.push('Assurez-vous d\'avoir une RC Pro à jour');
  }
  
  // Check fiscal compliance
  const hasFiscalAttestation = company?.has_fiscal_attestation;
  if (hasFiscalAttestation) {
    score += 5;
  } else {
    improvements.push('Mettez à jour votre attestation fiscale');
  }
  
  return {
    name: 'Conformité réglementaire',
    score,
    maxScore: 15,
    weight: SCORING_WEIGHTS.compliance,
    details: `${score}/15 critères de conformité`,
    improvements,
  };
}

// Calculate competitive positioning score
function scoreCompetition(tender: any): ScoringCriteria {
  let score = 0;
  const improvements: string[] = [];
  
  // This would ideally be based on market data
  // For now, use simplified heuristics
  
  const tenderType = tender.type;
  const estimatedValue = tender.estimated_value || 0;
  
  if (tenderType === 'PRIVATE') {
    score = 8; // Less competition typically
    improvements.push('Personnalisez votre approche pour le client');
  } else {
    // Public tenders typically have more competition
    if (estimatedValue < 40000) {
      score = 7; // MAPA - moderate competition
    } else if (estimatedValue < 200000) {
      score = 5; // More competition
      improvements.push('Marché concurrentiel - démarquez-vous');
    } else {
      score = 3; // High competition
      improvements.push('Forte concurrence - excellez sur tous les critères');
    }
  }
  
  return {
    name: 'Positionnement concurrentiel',
    score,
    maxScore: 10,
    weight: SCORING_WEIGHTS.competition,
    details: tenderType === 'PRIVATE' ? 'Marché privé' : 'Marché public',
    improvements,
  };
}

// Get grade from percentage
function getGrade(percentage: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (percentage >= 85) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 55) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

// Calculate win probability
function calculateWinProbability(percentage: number, tenderType: string): number {
  const baseProb = percentage / 100;
  const typeMultiplier = tenderType === 'PRIVATE' ? 1.2 : 0.8;
  return Math.min(Math.round(baseProb * typeMultiplier * 100), 95);
}

// Main scoring function
async function calculateScore(tender: any, company: any, requiredDocs: string[]): Promise<ScoringResult> {
  const criteria: ScoringCriteria[] = [
    scoreDocuments(tender, company, requiredDocs),
    scoreExperience(tender, company),
    scoreBudget(tender, company),
    scoreTimeline(tender),
    scoreCompliance(tender, company),
    scoreCompetition(tender),
  ];
  
  const totalScore = criteria.reduce((sum, c) => sum + c.score, 0);
  const maxPossibleScore = criteria.reduce((sum, c) => sum + c.maxScore, 0);
  const percentage = Math.round((totalScore / maxPossibleScore) * 100);
  
  // Get top recommendations (max 5)
  const allImprovements = criteria
    .flatMap(c => c.improvements)
    .slice(0, 5);
  
  return {
    totalScore,
    maxPossibleScore,
    percentage,
    grade: getGrade(percentage),
    criteria,
    summary: generateSummary(percentage, criteria),
    topRecommendations: allImprovements,
    estimatedWinProbability: calculateWinProbability(percentage, tender.type),
  };
}

function generateSummary(percentage: number, criteria: ScoringCriteria[]): string {
  const weakPoints = criteria
    .filter(c => c.score / c.maxScore < 0.6)
    .map(c => c.name.toLowerCase());
  
  if (percentage >= 85) {
    return 'Excellent dossier ! Vous êtes très bien positionné pour remporter ce marché.';
  } else if (percentage >= 70) {
    return `Bon dossier avec quelques points à améliorer : ${weakPoints.join(', ')}.`;
  } else if (percentage >= 55) {
    return `Dossier correct mais nécessite des améliorations sur : ${weakPoints.join(', ')}.`;
  } else {
    return `Dossier à renforcer significativement. Concentrez-vous sur : ${weakPoints.join(', ')}.`;
  }
}

// POST /api/ai/score - Calculate AI score for a tender
async function postHandler(request: NextRequest) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const body = await request.json();
  const { tender_id } = ScoreRequestSchema.parse(body);

    // Get user's profile and company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 });
    }

    // ✅ CACHE: Check if score already calculated recently (10 min TTL)
    const cacheKey = cacheKeys.tenderScore(tender_id, profile.company_id);
    const cachedScore = await cache.get<ScoringResult>(cacheKey);
    if (cachedScore) {
      return NextResponse.json(cachedScore);
    }

    // Get company details
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single();

    // Get tender with documents
    const { data: tender, error: tenderError } = await supabase
      .from('tenders')
      .select('*, documents:tender_documents(*)')
      .eq('id', tender_id)
      .eq('company_id', profile.company_id)
      .single();

    if (tenderError || !tender) {
      return NextResponse.json({ error: 'Tender not found' }, { status: 404 });
    }

    // Get required documents for this country/type
    // This would come from countries.ts in a real implementation
    const requiredDocs = tender.type === 'PUBLIC' 
      ? ['DC1', 'DC2', 'KBIS', 'Attestation fiscale', 'Attestation URSSAF', 'RC Pro', 'Mémoire technique']
      : ['Devis', 'Présentation', 'Références'];

    // Calculate score
    const result = await calculateScore(tender, company, requiredDocs);

    // Save score to database
    const { error: updateError } = await supabase
      .from('tenders')
      .update({
        ai_score: result.percentage,
        ai_score_details: result,
        ai_score_updated_at: new Date().toISOString(),
      })
      .eq('id', tender_id);

    if (updateError) {
      console.error('Error saving score:', updateError);
    }

    // ✅ CACHE: Store result for 10 minutes
    await cache.set(cacheKey, result, cacheTTL.MEDIUM * 2); // 10 minutes

    return NextResponse.json(result);
}

// GET /api/ai/score?tender_id=xxx - Get cached score
async function getHandler(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate query params
  const { searchParams } = new URL(request.url);
  const { tender_id } = ScoreQuerySchema.parse({
    tender_id: searchParams.get('tender_id'),
  });

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    const { data: tender } = await supabase
      .from('tenders')
      .select('ai_score, ai_score_details, ai_score_updated_at')
      .eq('id', tender_id)
      .eq('company_id', profile?.company_id)
      .single();

    if (!tender) {
      return NextResponse.json({ error: 'Tender not found' }, { status: 404 });
    }

  return NextResponse.json({
    score: tender.ai_score,
    details: tender.ai_score_details,
    updatedAt: tender.ai_score_updated_at,
  });
}

// Export wrapped handlers
export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
