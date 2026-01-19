import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// GET /api/search/presets - Get filter presets
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    let query = supabase
      .from('search_filter_presets')
      .select('*')
      .eq('is_active', true)
      .order('use_count', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: presets, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Separate system and user presets
    const systemPresets = presets?.filter((p: any) => p.is_system) || [];
    const userPresets = presets?.filter((p: any) => !p.is_system && p.user_id === user.id) || [];

    return NextResponse.json({
      systemPresets,
      userPresets,
      allPresets: presets || []
    });

  } catch (error: any) {
    console.error('Error fetching presets:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}
