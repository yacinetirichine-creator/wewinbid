import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// GET /api/search/saved/[id] - Get specific saved search
// ============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: savedSearch, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!savedSearch) {
      return NextResponse.json({ error: 'Recherche non trouvée' }, { status: 404 });
    }

    // Update last_used_at and increment use_count
    await supabase
      .from('saved_searches')
      .update({
        last_used_at: new Date().toISOString(),
        use_count: (savedSearch.use_count || 0) + 1
      })
      .eq('id', params.id);

    return NextResponse.json({ savedSearch });

  } catch (error: any) {
    console.error('Error fetching saved search:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH /api/search/saved/[id] - Update saved search
// ============================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      is_public,
      is_favorite,
      notify_new_results,
      notification_frequency
    } = body;

    // Check ownership
    const { data: existing, error: fetchError } = await supabase
      .from('saved_searches')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Recherche non trouvée' }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Build update object
    const updates: Record<string, any> = {};
    
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (query_text !== undefined) updates.query_text = query_text?.trim() || null;
    if (filters !== undefined) updates.filters = filters;
    if (is_public !== undefined) updates.is_public = is_public;
    if (is_favorite !== undefined) updates.is_favorite = is_favorite;
    if (notify_new_results !== undefined) updates.notify_new_results = notify_new_results;
    if (notification_frequency !== undefined) updates.notification_frequency = notification_frequency;

    // Update
    const { data: savedSearch, error: updateError } = await supabase
      .from('saved_searches')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ savedSearch });

  } catch (error: any) {
    console.error('Error updating saved search:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE /api/search/saved/[id] - Delete saved search
// ============================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Check ownership
    const { data: existing, error: fetchError } = await supabase
      .from('saved_searches')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Recherche non trouvée' }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Delete
    const { error: deleteError } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Recherche supprimée avec succès' });

  } catch (error: any) {
    console.error('Error deleting saved search:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
