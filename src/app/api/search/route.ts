import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// GET /api/search - Advanced tender search with filters
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const country = searchParams.get('country');
    const sector = searchParams.get('sector');
    const minBudget = searchParams.get('min_budget');
    const maxBudget = searchParams.get('max_budget');
    const deadlineFrom = searchParams.get('deadline_from');
    const deadlineTo = searchParams.get('deadline_to');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build filters object
    const filters: Record<string, any> = {};
    
    if (country) {
      filters.country = country.split(',');
    }
    
    if (sector) {
      filters.sector = sector.split(',');
    }
    
    if (minBudget) {
      filters.min_budget = parseFloat(minBudget);
    }
    
    if (maxBudget) {
      filters.max_budget = parseFloat(maxBudget);
    }
    
    if (deadlineFrom) {
      filters.deadline_from = deadlineFrom;
    }
    
    if (deadlineTo) {
      filters.deadline_to = deadlineTo;
    }
    
    if (status) {
      filters.status = status.split(',');
    }

    // Use RPC function for advanced search
    const { data: results, error: searchError } = await (supabase as any)
      .rpc('search_tenders', {
        p_query: query || null,
        p_filters: filters,
        p_limit: limit,
        p_offset: offset
      });

    if (searchError) {
      console.error('Search error:', searchError);
      return NextResponse.json({ error: searchError.message }, { status: 500 });
    }

    // Log search to history
    await (supabase as any).rpc('log_search', {
      p_query: query || null,
      p_filters: filters,
      p_results_count: results?.length || 0
    });

    // Get total count (approximate for performance)
    const { count } = await (supabase as any)
      .from('tenders')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      results: results || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      filters: filters,
      query: query
    });

  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la recherche' },
      { status: 500 }
    );
  }
}
