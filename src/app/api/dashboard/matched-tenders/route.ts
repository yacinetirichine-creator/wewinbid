import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/dashboard/matched-tenders - Get matched tenders for user
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const minScore = parseInt(searchParams.get('min_score') || '70');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Call the database function to get matched tenders
    const { data, error } = await (supabase as any).rpc('get_user_matched_tenders', {
      p_user_id: user.id,
      p_min_score: minScore,
      p_limit: limit
    });

    if (error) {
      console.error('Error fetching matched tenders:', error);
      return NextResponse.json({ error: 'Failed to fetch matched tenders' }, { status: 500 });
    }

    return NextResponse.json({
      tenders: data || [],
      count: data?.length || 0,
      min_score: minScore,
    });
  } catch (error) {
    console.error('Error in GET /api/dashboard/matched-tenders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
