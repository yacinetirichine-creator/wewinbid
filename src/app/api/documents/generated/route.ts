import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema de validation
const GeneratedDocumentSchema = z.object({
  tender_id: z.string().uuid(),
  document_type: z.string(),
  title: z.string(),
  content: z.string(),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    order: z.number(),
    isEdited: z.boolean(),
  })),
  status: z.enum(['draft', 'approved', 'rejected']).default('draft'),
  version: z.number().default(1),
  provider: z.enum(['openai', 'anthropic', 'template']).optional(),
});

/**
 * POST - Save a new generated document
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Get user profile with company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = GeneratedDocumentSchema.parse(body);

    // Save to database
    const { data: document, error: insertError } = await supabase
      .from('generated_documents')
      .insert({
        tender_id: validatedData.tender_id,
        company_id: profile.company_id,
        user_id: user.id,
        document_type: validatedData.document_type,
        title: validatedData.title,
        content: validatedData.content,
        sections: validatedData.sections,
        status: validatedData.status,
        version: validatedData.version,
        provider: validatedData.provider,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    // Log analytics (non-blocking)
    try {
      await supabase.from('ai_generations').insert({
        user_id: user.id,
        company_id: profile.company_id,
        tender_id: validatedData.tender_id,
        document_type: validatedData.document_type,
        provider: validatedData.provider || 'openai',
        status: 'completed',
        created_at: new Date().toISOString(),
      });
    } catch {
      // Ignore analytics errors
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error saving generated document:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde du document' },
      { status: 500 }
    );
  }
}

/**
 * GET - List generated documents for a tender
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenderId = searchParams.get('tender_id');
    const documentType = searchParams.get('document_type');
    const status = searchParams.get('status');

    // Build query
    let query = supabase
      .from('generated_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (tenderId) {
      query = query.eq('tender_id', tenderId);
    }

    if (documentType) {
      query = query.eq('document_type', documentType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: documents, error } = await query;

    if (error) throw error;

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching generated documents:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des documents' },
      { status: 500 }
    );
  }
}
