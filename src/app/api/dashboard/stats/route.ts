import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the database function to get stats
    const { data, error } = await (supabase as any).rpc('get_dashboard_stats', {
      p_user_id: user.id
    });

    if (error) {
      console.error('Error fetching dashboard stats:', error);
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    // The function returns an array with one row
    const stats = data && data.length > 0 ? data[0] : null;

    return NextResponse.json({
      stats: {
        total_matched_tenders: stats?.total_matched_tenders || 0,
        upcoming_deadlines: stats?.upcoming_deadlines || 0,
        active_searches: stats?.active_searches || 0,
        win_rate: stats?.win_rate || 0,
      }
    });
  } catch (error) {
    console.error('Error in GET /api/dashboard/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
