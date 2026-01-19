import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// GET /api/search/suggestions - Get search auto-complete suggestions
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const prefix = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!prefix || prefix.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Use RPC function for suggestions
    const { data: suggestions, error } = await (supabase as any)
      .rpc('get_search_suggestions', {
        p_prefix: prefix.toLowerCase(),
        p_limit: limit
      });

    if (error) {
      console.error('Suggestions error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ suggestions: suggestions || [] });

  } catch (error: any) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}
