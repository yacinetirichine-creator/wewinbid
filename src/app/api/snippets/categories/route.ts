import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const CreateCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hex invalide').optional(),
  icon: z.string().optional(),
  display_order: z.number().int().min(0).optional(),
});

const UpdateCategorySchema = CreateCategorySchema.partial();

// ============================================================
// GET - Fetch categories
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

    // Fetch categories
    const { data: categories, error } = await (supabase as any)
      .from('snippet_categories')
      .select(
        `
        id,
        name,
        description,
        color,
        icon,
        display_order,
        created_at,
        updated_at
      `
      )
      .eq('company_id', teamMember.company_id)
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Get snippet count for each category
    const categoriesWithCount = await Promise.all(
      (categories || []).map(async (category: any) => {
        const { count } = await (supabase as any)
          .from('snippets')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', category.id)
          .eq('is_active', true);

        return {
          ...category,
          snippet_count: count || 0,
        };
      })
    );

    return NextResponse.json({
      categories: categoriesWithCount,
      total: categoriesWithCount.length,
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);

    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des catégories' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Create category
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
        { error: 'Permission insuffisante pour créer une catégorie' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = CreateCategorySchema.parse(body);

    // Check if name is unique for this company
    const { data: existing } = await (supabase as any)
      .from('snippet_categories')
      .select('id')
      .eq('company_id', teamMember.company_id)
      .eq('name', validated.name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Une catégorie avec ce nom existe déjà' },
        { status: 400 }
      );
    }

    // Create category
    const { data: category, error } = await (supabase as any)
      .from('snippet_categories')
      .insert({
        company_id: teamMember.company_id,
        ...validated,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: 'Catégorie créée avec succès',
      category,
    });
  } catch (error: any) {
    console.error('Error creating category:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la catégorie' },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH - Update category
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
    const categoryId = searchParams.get('id');

    if (!categoryId) {
      return NextResponse.json({ error: 'ID de la catégorie requis' }, { status: 400 });
    }

    const body = await request.json();
    const validated = UpdateCategorySchema.parse(body);

    // Check name uniqueness if changing it
    if (validated.name) {
      const { data: existing } = await (supabase as any)
        .from('snippet_categories')
        .select('id, company_id')
        .eq('name', validated.name)
        .neq('id', categoryId)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Une catégorie avec ce nom existe déjà' },
          { status: 400 }
        );
      }
    }

    // Update category (RLS handles permissions)
    const { data: category, error } = await (supabase as any)
      .from('snippet_categories')
      .update(validated)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Catégorie non trouvée ou permission refusée' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      message: 'Catégorie mise à jour avec succès',
      category,
    });
  } catch (error: any) {
    console.error('Error updating category:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour de la catégorie' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - Delete category
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
    const categoryId = searchParams.get('id');

    if (!categoryId) {
      return NextResponse.json({ error: 'ID de la catégorie requis' }, { status: 400 });
    }

    // Check if category has snippets
    const { count } = await (supabase as any)
      .from('snippets')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('is_active', true);

    if (count && count > 0) {
      return NextResponse.json(
        {
          error: 'Impossible de supprimer une catégorie contenant des snippets',
          snippet_count: count,
        },
        { status: 400 }
      );
    }

    // Delete category
    const { error } = await (supabase as any)
      .from('snippet_categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Catégorie non trouvée ou permission refusée' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      message: 'Catégorie supprimée avec succès',
    });
  } catch (error: any) {
    console.error('Error deleting category:', error);

    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression de la catégorie' },
      { status: 500 }
    );
  }
}
