import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ============================================================
// SCHEMAS
// ============================================================

const GetRecommendationsSchema = z.object({
  limit: z.number().min(1).max(50).default(10),
  min_score: z.number().min(0).max(100).optional(),
});

const UpdateRecommendationSchema = z.object({
  id: z.string().uuid(),
  clicked: z.boolean().optional(),
  dismissed: z.boolean().optional(),
  feedback: z.enum(['helpful', 'not_relevant', 'already_seen']).optional(),
});

// ============================================================
// GET - Get recommendations for user
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const min_score = url.searchParams.get('min_score')
      ? parseFloat(url.searchParams.get('min_score')!)
      : undefined;

    // Get recommendations using the database function
    const { data: recommendations, error: recsError } = await supabase.rpc(
      'get_recommended_tenders',
      {
        p_user_id: user.id,
        p_limit: limit,
      }
    );

    if (recsError) {
      console.error('Error fetching recommendations:', recsError);
      return NextResponse.json(
        { error: 'Failed to fetch recommendations' },
        { status: 500 }
      );
    }

    // Filter by min_score if provided
    let filtered = recommendations || [];
    if (min_score !== undefined) {
      filtered = filtered.filter((r: any) => r.match_score >= min_score);
    }

    return NextResponse.json({ recommendations: filtered });
  } catch (error) {
    console.error('Recommendations GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Generate AI recommendations (mock implementation)
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile and company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get user's sector preferences (from past tenders)
    const { data: pastTenders } = await supabase
      .from('tenders')
      .select('sector')
      .eq('company_id', profile.company_id)
      .limit(10);

    const preferredSectors = [
      ...new Set(pastTenders?.map((t) => t.sector).filter(Boolean)),
    ];

    // Get recent marketplace tenders
    const { data: recentTenders } = await supabase
      .from('tenders')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!recentTenders || recentTenders.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Mock AI scoring algorithm
    // In production, this would call OpenAI API or custom ML model
    const recommendations = recentTenders.map((tender: any) => {
      let score = 50; // Base score
      const reasons: string[] = [];

      // Sector match
      if (preferredSectors.includes(tender.sector)) {
        score += 20;
        reasons.push('sector_match');
      }

      // Budget fit (mock logic)
      if (tender.estimated_value && tender.estimated_value > 10000) {
        score += 15;
        reasons.push('budget_fit');
      }

      // Deadline proximity (prefer not too close, not too far)
      if (tender.deadline) {
        const daysUntil = Math.floor(
          (new Date(tender.deadline).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        );
        if (daysUntil >= 14 && daysUntil <= 60) {
          score += 10;
          reasons.push('optimal_timeline');
        }
      }

      // Country preference (mock)
      if (['FR', 'BE', 'CH'].includes(tender.country)) {
        score += 5;
        reasons.push('location_proximity');
      }

      // Random variation to simulate AI uncertainty
      score += Math.random() * 10 - 5;
      score = Math.max(0, Math.min(100, score)); // Clamp to 0-100

      const confidence =
        score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low';

      return {
        tender_id: tender.id,
        match_score: parseFloat(score.toFixed(2)),
        confidence_level: confidence,
        reasons,
        explanation: `Ce marché correspond à vos critères : ${reasons.join(', ')}. Score de compatibilité : ${score.toFixed(0)}%.`,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };
    });

    // Sort by score
    recommendations.sort((a, b) => b.match_score - a.match_score);

    // Take top 10
    const topRecommendations = recommendations.slice(0, 10);

    // Insert into database (upsert to avoid duplicates)
    const inserts = topRecommendations.map((rec) => ({
      user_id: user.id,
      tender_id: rec.tender_id,
      match_score: rec.match_score,
      confidence_level: rec.confidence_level,
      reasons: rec.reasons,
      explanation: rec.explanation,
      expires_at: rec.expires_at,
    }));

    const { error: insertError } = await supabase
      .from('tender_recommendations')
      .upsert(inserts, {
        onConflict: 'user_id,tender_id',
        ignoreDuplicates: false,
      });

    if (insertError) {
      console.error('Error inserting recommendations:', insertError);
      return NextResponse.json(
        { error: 'Failed to save recommendations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      recommendations: topRecommendations,
      generated: topRecommendations.length,
    });
  } catch (error) {
    console.error('Recommendations POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH - Update recommendation interaction
// ============================================================

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await req.json();
    const validation = UpdateRecommendationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { id, clicked, dismissed, feedback } = validation.data;

    // Build update object
    const updates: any = {};
    if (clicked !== undefined) {
      updates.clicked = clicked;
      if (clicked) {
        updates.clicked_at = new Date().toISOString();
      }
    }
    if (dismissed !== undefined) {
      updates.dismissed = dismissed;
      if (dismissed) {
        updates.dismissed_at = new Date().toISOString();
      }
    }
    if (feedback) {
      updates.feedback = feedback;
    }

    // Mark as shown if first interaction
    updates.shown_to_user = true;
    if (!updates.shown_at) {
      updates.shown_at = new Date().toISOString();
    }

    // Update recommendation
    const { data: recommendation, error: updateError } = await supabase
      .from('tender_recommendations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating recommendation:', updateError);
      return NextResponse.json(
        { error: 'Failed to update recommendation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error('Recommendation PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
