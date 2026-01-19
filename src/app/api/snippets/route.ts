import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const CreateSnippetSchema = z.object({
  title: z.string().min(3).max(255),
  content: z.string().min(5),
  category_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  shortcut: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Le raccourci doit contenir uniquement des lettres minuscules, chiffres et tirets')
    .optional(),
  is_favorite: z.boolean().optional(),
});

const UpdateSnippetSchema = CreateSnippetSchema.partial();

// ============================================================
// GET - Fetch snippets with filters
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Get user's company
    const { data: teamMember } = await (supabase as any)
      .from('team_members')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Utilisateur non membre d\'une équipe' },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    const isFavorite = searchParams.get('is_favorite') === 'true';
    const query = searchParams.get('query');
    const tags = searchParams.get('tags')?.split(',');

    // Build query
    let snippetsQuery = supabase
      .from('snippets')
      .select(
        `
        id,
        title,
        content,
        category_id,
        tags,
        shortcut,
        usage_count,
        last_used_at,
        is_favorite,
        created_at,
        updated_at,
        creator:profiles!snippets_created_by_fkey (
          full_name
        ),
        category:snippet_categories (
          id,
          name,
          color,
          icon
        )
      `
      )
      .eq('company_id', teamMember.company_id)
      .eq('is_active', true);

    // Apply filters
    if (categoryId) {
      snippetsQuery = snippetsQuery.eq('category_id', categoryId);
    }

    if (isFavorite) {
      snippetsQuery = snippetsQuery.eq('is_favorite', true);
    }

    if (query) {
      snippetsQuery = snippetsQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
    }

    if (tags && tags.length > 0) {
      snippetsQuery = snippetsQuery.contains('tags', tags);
    }

    snippetsQuery = snippetsQuery.order('usage_count', { ascending: false });

    const { data: snippets, error } = await snippetsQuery;

    if (error) throw error;

    return NextResponse.json({
      snippets,
      total: snippets?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching snippets:', error);

    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des snippets' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Create new snippet
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Get user's company
    const { data: teamMember } = await (supabase as any)
      .from('team_members')
      .select('company_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Utilisateur non membre d\'une équipe' },
        { status: 403 }
      );
    }

    // Check permissions
    if (!['editor', 'admin'].includes(teamMember.role)) {
      return NextResponse.json(
        { error: 'Permission insuffisante pour créer un snippet' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = CreateSnippetSchema.parse(body);

    // Check if shortcut is unique
    if (validated.shortcut) {
      const { data: existing } = await (supabase as any)
        .from('snippets')
        .select('id')
        .eq('company_id', teamMember.company_id)
        .eq('shortcut', validated.shortcut)
        .eq('is_active', true)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Ce raccourci est déjà utilisé' },
          { status: 400 }
        );
      }
    }

    // Create snippet
    const { data: snippet, error } = await (supabase as any)
      .from('snippets')
      .insert({
        company_id: teamMember.company_id,
        created_by: user.id,
        ...validated,
      })
      .select(
        `
        id,
        title,
        content,
        category_id,
        tags,
        shortcut,
        usage_count,
        is_favorite,
        created_at
      `
      )
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: 'Snippet créé avec succès',
      snippet,
    });
  } catch (error: any) {
    console.error('Error creating snippet:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du snippet' },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH - Update snippet
// ============================================================

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const snippetId = searchParams.get('id');

    if (!snippetId) {
      return NextResponse.json({ error: 'ID du snippet requis' }, { status: 400 });
    }

    const body = await request.json();
    const validated = UpdateSnippetSchema.parse(body);

    // Check shortcut uniqueness if changing it
    if (validated.shortcut) {
      const { data: existing } = await (supabase as any)
        .from('snippets')
        .select('id, company_id')
        .eq('shortcut', validated.shortcut)
        .eq('is_active', true)
        .neq('id', snippetId)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Ce raccourci est déjà utilisé' },
          { status: 400 }
        );
      }
    }

    // Update snippet (RLS handles permissions)
    const { data: snippet, error } = await (supabase as any)
      .from('snippets')
      .update(validated)
      .eq('id', snippetId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Snippet non trouvé ou permission refusée' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      message: 'Snippet mis à jour avec succès',
      snippet,
    });
  } catch (error: any) {
    console.error('Error updating snippet:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour du snippet' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - Delete snippet
// ============================================================

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const snippetId = searchParams.get('id');

    if (!snippetId) {
      return NextResponse.json({ error: 'ID du snippet requis' }, { status: 400 });
    }

    // Soft delete
    const { error } = await (supabase as any)
      .from('snippets')
      .update({ is_active: false })
      .eq('id', snippetId);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Snippet non trouvé ou permission refusée' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      message: 'Snippet supprimé avec succès',
    });
  } catch (error: any) {
    console.error('Error deleting snippet:', error);

    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression du snippet' },
      { status: 500 }
    );
  }
}
