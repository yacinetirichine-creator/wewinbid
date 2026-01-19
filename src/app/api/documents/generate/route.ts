import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import jsPDF from 'jspdf';

// ============================================================
// SCHEMAS
// ============================================================

const GenerateDocumentSchema = z.object({
  title: z.string().min(2).max(255),
  category: z.enum(['proposal', 'cover_letter', 'technical_response', 'cv', 'other']),
  template_id: z.string().uuid().optional(),
  tender_id: z.string().uuid().optional(),
  content: z.object({
    sections: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      order: z.number(),
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
  variables_data: z.record(z.string()).optional(),
  ai_generated: z.boolean().default(false),
  ai_prompt: z.string().optional(),
  ai_model: z.string().optional(),
});

const UpdateDocumentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(2).max(255).optional(),
  content: z.any().optional(),
  status: z.enum(['draft', 'final', 'sent', 'signed']).optional(),
  signature_requested: z.boolean().optional(),
});

const GeneratePDFSchema = z.object({
  document_id: z.string().uuid(),
});

// ============================================================
// GET - List generated documents
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
    const { data: profile, error: profileError } = await (supabase as any)
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
    const tender_id = url.searchParams.get('tender_id');
    const status = url.searchParams.get('status');

    // Get documents
    let query = supabase
      .from('generated_documents')
      .select(`
        *,
        creator:profiles!created_by(id, full_name, email),
        tender:tenders(id, title, reference),
        template:document_templates(id, name)
      `)
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }
    if (tender_id) {
      query = query.eq('tender_id', tender_id);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: documents, error: documentsError } = await query;

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Documents GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Generate document
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

    // Get user's company
    const { data: member, error: memberError } = await (supabase as any)
      .from('team_members')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Not a team member' },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await req.json();
    const validation = GenerateDocumentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Increment template usage if template_id provided
    if (data.template_id) {
      await (supabase as any).rpc('increment_template_usage', {
        p_template_id: data.template_id,
      });
    }

    // Create document
    const { data: document, error: createError } = await (supabase as any)
      .from('generated_documents')
      .insert({
        company_id: member.company_id,
        tender_id: data.tender_id,
        template_id: data.template_id,
        created_by: user.id,
        title: data.title,
        category: data.category,
        content: data.content,
        variables_data: data.variables_data,
        ai_generated: data.ai_generated,
        ai_prompt: data.ai_prompt,
        ai_model: data.ai_model,
        status: 'draft',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating document:', createError);
      return NextResponse.json(
        { error: 'Failed to create document' },
        { status: 500 }
      );
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Document POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH - Update document
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
    const validation = UpdateDocumentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { id, ...updates } = validation.data;

    // Check permissions
    const { data: document, error: documentError } = await (supabase as any)
      .from('generated_documents')
      .select('created_by, company_id, version, content')
      .eq('id', id)
      .single();

    if (documentError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if user can update
    const { data: member } = await (supabase as any)
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', document.company_id)
      .single();

    const canUpdate =
      document.created_by === user.id ||
      ['editor', 'admin'].includes(member?.role || '');

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // If content changed, increment version
    if (updates.content && updates.content !== document.content) {
      (updates as any).version = (document as any).version + 1;
    }

    // Update document
    const { data: updated, error: updateError } = await (supabase as any)
      .from('generated_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating document:', updateError);
      return NextResponse.json(
        { error: 'Failed to update document' },
        { status: 500 }
      );
    }

    return NextResponse.json({ document: updated });
  } catch (error) {
    console.error('Document PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - Remove document
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

    // Get document ID
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Check permissions
    const { data: document, error: documentError } = await (supabase as any)
      .from('generated_documents')
      .select('created_by, company_id')
      .eq('id', id)
      .single();

    if (documentError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const { data: member } = await (supabase as any)
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', document.company_id)
      .single();

    const canDelete = document.created_by === user.id || member?.role === 'admin';

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Delete document
    const { error: deleteError } = await (supabase as any)
      .from('generated_documents')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting document:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Document DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
