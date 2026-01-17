import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================
// GET /api/teams - List user's teams
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Get user's teams using the helper function
    const { data: teams, error } = await supabase.rpc('get_user_teams', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error fetching teams:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des équipes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ teams: teams || [] });
  } catch (error) {
    console.error('Error in GET /api/teams:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/teams - Create new team
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, description, slug, avatar_url, color } = body;

    // Validate required fields
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Le nom de l\'équipe est requis (min 2 caractères)' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const teamSlug = slug || name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug already exists
    if (teamSlug) {
      const { data: existing } = await supabase
        .from('teams')
        .select('id')
        .eq('slug', teamSlug)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Ce slug est déjà utilisé' },
          { status: 409 }
        );
      }
    }

    // Create team
    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        slug: teamSlug,
        avatar_url: avatar_url || null,
        color: color || '#4F46E5',
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating team:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'équipe' },
        { status: 500 }
      );
    }

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/teams:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
