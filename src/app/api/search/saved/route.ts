import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// GET /api/search/saved - List user's saved searches
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('team_id');
    const favoritesOnly = searchParams.get('favorites') === 'true';

    let query = supabase
      .from('saved_searches')
      .select('*')
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    if (favoritesOnly) {
      query = query.eq('is_favorite', true);
    }

    const { data: searches, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ searches });

  } catch (error: any) {
    console.error('Error fetching saved searches:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/search/saved - Create new saved search
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      query_text,
      filters,
      team_id,
      is_public,
      notify_new_results,
      notification_frequency
    } = body;

    // Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Le nom doit contenir au moins 2 caractères' },
        { status: 400 }
      );
    }

    if (!filters || typeof filters !== 'object') {
      return NextResponse.json(
        { error: 'Les filtres sont requis' },
        { status: 400 }
      );
    }

    // Create saved search
    const { data: savedSearch, error: insertError } = await (supabase as any)
      .from('saved_searches')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        query_text: query_text?.trim() || null,
        filters,
        team_id: team_id || null,
        is_public: is_public || false,
        notify_new_results: notify_new_results || false,
        notification_frequency: notification_frequency || 'DAILY'
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ savedSearch }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating saved search:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création' },
      { status: 500 }
    );
  }
}
