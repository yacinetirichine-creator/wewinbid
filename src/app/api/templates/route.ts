import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const CreateTemplateSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  content: z.string().min(10),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sector: z.string().optional(),
  tender_type: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  language: z.string().default('fr'),
  is_favorite: z.boolean().optional(),
});

const UpdateTemplateSchema = CreateTemplateSchema.partial();

const SearchTemplatesSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  sector: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_favorite: z.boolean().optional(),
  sort_by: z.enum(['usage', 'recent', 'alphabetical']).default('recent'),
  limit: z.number().min(1).max(100).default(50),
});

// ============================================================
// GET - Fetch templates with search and filters
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
    const params = {
      query: searchParams.get('query') || undefined,
      category: searchParams.get('category') || undefined,
      sector: searchParams.get('sector') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      is_favorite: searchParams.get('is_favorite') === 'true' ? true : undefined,
      sort_by: (searchParams.get('sort_by') as any) || 'recent',
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const validated = SearchTemplatesSchema.parse(params);

    // Build query
    let query = supabase
      .from('templates')
      .select(
        `
        id,
        title,
        description,
        content,
        category,
        tags,
        sector,
        tender_type,
        language,
        usage_count,
        last_used_at,
        is_active,
        is_favorite,
        created_at,
        updated_at,
        created_by,
        creator:profiles!templates_created_by_fkey (
          full_name,
          avatar_url
        )
      `
      )
      .eq('company_id', teamMember.company_id)
      .eq('is_active', true);

    // Apply filters
    if (validated.category) {
      query = query.eq('category', validated.category);
    }

    if (validated.sector) {
      query = query.eq('sector', validated.sector);
    }

    if (validated.is_favorite !== undefined) {
      query = query.eq('is_favorite', validated.is_favorite);
    }

    if (validated.tags && validated.tags.length > 0) {
      query = query.contains('tags', validated.tags);
    }

    // Text search
    if (validated.query) {
      query = query.or(
        `title.ilike.%${validated.query}%,description.ilike.%${validated.query}%,content.ilike.%${validated.query}%`
      );
    }

    // Sorting
    if (validated.sort_by === 'usage') {
      query = query.order('usage_count', { ascending: false });
    } else if (validated.sort_by === 'alphabetical') {
      query = query.order('title', { ascending: true });
    } else {
      query = query.order('updated_at', { ascending: false });
    }

    query = query.limit(validated.limit);

    const { data: templates, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      templates,
      total: templates?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching templates:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des templates' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Create new template
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

    // Check permissions (editor or admin)
    if (!['editor', 'admin'].includes(teamMember.role)) {
      return NextResponse.json(
        { error: 'Permission insuffisante pour créer un template' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = CreateTemplateSchema.parse(body);

    // Create template
    const { data: template, error } = await (supabase as any)
      .from('templates')
      .insert({
        company_id: teamMember.company_id,
        created_by: user.id,
        ...validated,
      })
      .select(
        `
        id,
        title,
        description,
        content,
        category,
        tags,
        sector,
        tender_type,
        language,
        usage_count,
        is_favorite,
        created_at,
        updated_at
      `
      )
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: 'Template créé avec succès',
      template,
    });
  } catch (error: any) {
    console.error('Error creating template:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du template' },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH - Update template
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
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ error: 'ID du template requis' }, { status: 400 });
    }

    const body = await request.json();
    const validated = UpdateTemplateSchema.parse(body);

    // Update template (RLS handles permissions)
    const { data: template, error } = await (supabase as any)
      .from('templates')
      .update(validated)
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Template non trouvé ou permission refusée' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      message: 'Template mis à jour avec succès',
      template,
    });
  } catch (error: any) {
    console.error('Error updating template:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour du template' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - Delete template
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
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ error: 'ID du template requis' }, { status: 400 });
    }

    // Soft delete (set is_active to false)
    const { error } = await (supabase as any)
      .from('templates')
      .update({ is_active: false })
      .eq('id', templateId);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Template non trouvé ou permission refusée' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      message: 'Template supprimé avec succès',
    });
  } catch (error: any) {
    console.error('Error deleting template:', error);

    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression du template' },
      { status: 500 }
    );
  }
}
