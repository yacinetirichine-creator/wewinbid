import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ============================================================
// SCHEMAS
// ============================================================

const CreateTemplateSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().optional(),
  category: z.enum(['proposal', 'cover_letter', 'technical_response', 'cv', 'other']),
  content: z.object({
    sections: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      order: z.number(),
      variables: z.array(z.string()).optional(),
    })),
    styles: z.object({
      fontSize: z.number().default(12),
      fontFamily: z.string().default('Arial'),
      lineHeight: z.number().default(1.5),
    }).optional(),
    header: z.object({
      enabled: z.boolean(),
      content: z.string(),
    }).optional(),
    footer: z.object({
      enabled: z.boolean(),
      content: z.string(),
    }).optional(),
  }),
  variables: z.array(z.object({
    name: z.string(),
    type: z.string(),
    default: z.string().optional(),
    required: z.boolean().default(false),
  })).default([]),
  is_default: z.boolean().default(false),
  is_public: z.boolean().default(false),
});

const UpdateTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(255).optional(),
  description: z.string().optional(),
  content: z.any().optional(),
  variables: z.array(z.any()).optional(),
  is_default: z.boolean().optional(),
  is_public: z.boolean().optional(),
});

// ============================================================
// GET - List document templates
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Query parameters
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const publicOnly = url.searchParams.get('public_only') === 'true';

    // Get templates
    let query = supabase
      .from('document_templates')
      .select(`
        *,
        creator:profiles!created_by(id, full_name, email)
      `)
      .eq('company_id', profile.company_id)
      .order('usage_count', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }
    if (publicOnly) {
      query = query.eq('is_public', true);
    }

    const { data: templates, error: templatesError } = await query;

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Templates GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Create document template
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company and role
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('company_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Not a team member' },
        { status: 403 }
      );
    }

    // Check role (editor or admin)
    if (!['editor', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await req.json();
    const validation = CreateTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // If setting as default, unset other defaults in same category
    if (data.is_default) {
      await supabase
        .from('document_templates')
        .update({ is_default: false })
        .eq('company_id', member.company_id)
        .eq('category', data.category);
    }

    // Create template
    const { data: template, error: createError } = await supabase
      .from('document_templates')
      .insert({
        company_id: member.company_id,
        created_by: user.id,
        name: data.name,
        description: data.description,
        category: data.category,
        content: data.content,
        variables: data.variables,
        is_default: data.is_default,
        is_public: data.is_public,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating template:', createError);
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Template POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH - Update template
// ============================================================

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await req.json();
    const validation = UpdateTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { id, ...updates } = validation.data;

    // Check if user can update (creator or admin)
    const { data: template, error: templateError } = await supabase
      .from('document_templates')
      .select('created_by, company_id, category')
      .eq('id', id)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', template.company_id)
      .single();

    const canUpdate = template.created_by === user.id || member?.role === 'admin';

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // If setting as default, unset other defaults
    if (updates.is_default) {
      await supabase
        .from('document_templates')
        .update({ is_default: false })
        .eq('company_id', template.company_id)
        .eq('category', template.category)
        .neq('id', id);
    }

    // Update template
    const { data: updated, error: updateError } = await supabase
      .from('document_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating template:', updateError);
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: updated });
  } catch (error) {
    console.error('Template PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - Remove template
// ============================================================

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get template ID
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Check permissions (creator or admin)
    const { data: template, error: templateError } = await supabase
      .from('document_templates')
      .select('created_by, company_id')
      .eq('id', id)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', template.company_id)
      .single();

    const canDelete = template.created_by === user.id || member?.role === 'admin';

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Delete template
    const { error: deleteError } = await supabase
      .from('document_templates')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting template:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Template DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
