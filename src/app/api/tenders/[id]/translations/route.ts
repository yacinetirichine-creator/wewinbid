import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const CreateTranslationSchema = z.object({
  source_language: z.string().length(2).or(z.string().max(10)),
  target_language: z.string().length(2).or(z.string().max(10)),
  ai_model: z.enum(['gpt-4', 'deepl', 'google-translate']).optional().default('gpt-4'),
});

// GET /api/tenders/[id]/translations - Get translations for a tender
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenderId = params.id;

    // Get all translations for this tender
    const { data: translations, error } = await supabase
      .from('tender_translations')
      .select('*')
      .eq('tender_id', tenderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching translations:', error);
      return NextResponse.json({ error: 'Failed to fetch translations' }, { status: 500 });
    }

    return NextResponse.json({
      translations: translations || [],
      count: translations?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/tenders/[id]/translations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tenders/[id]/translations - Create a new translation
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenderId = params.id;
    const body = await req.json();
    const validation = CreateTranslationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { source_language, target_language, ai_model } = validation.data;

    // Check if tender exists and user has access
    const { data: tender, error: tenderError } = await supabase
      .from('tenders')
      .select('id, title, description, created_by')
      .eq('id', tenderId)
      .single();

    if (tenderError || !tender) {
      return NextResponse.json({ error: 'Tender not found' }, { status: 404 });
    }

    // Call the database function to initiate translation
    const { data: translationId, error: translateError } = await supabase.rpc('translate_tender', {
      p_tender_id: tenderId,
      p_source_lang: source_language,
      p_target_lang: target_language,
      p_ai_model: ai_model,
    });

    if (translateError) {
      console.error('Error creating translation:', translateError);
      return NextResponse.json({ error: 'Failed to create translation' }, { status: 500 });
    }

    // Get the created translation
    const { data: translation } = await supabase
      .from('tender_translations')
      .select('*')
      .eq('id', translationId)
      .single();

    return NextResponse.json({
      success: true,
      translation,
      message: 'Translation initiated. AI processing will complete shortly.'
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/tenders/[id]/translations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/tenders/[id]/translations - Update translation (for manual review)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { translation_id, title_translated, description_translated, status, quality_score } = body;

    if (!translation_id) {
      return NextResponse.json({ error: 'translation_id required' }, { status: 400 });
    }

    const updates: any = {
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };

    if (title_translated) updates.title_translated = title_translated;
    if (description_translated) updates.description_translated = description_translated;
    if (status) updates.status = status;
    if (quality_score !== undefined) updates.quality_score = quality_score;
    if (title_translated || description_translated) updates.translation_method = 'HYBRID';

    const { data, error } = await supabase
      .from('tender_translations')
      .update(updates)
      .eq('id', translation_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating translation:', error);
      return NextResponse.json({ error: 'Failed to update translation' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      translation: data,
      message: 'Translation updated successfully'
    });
  } catch (error) {
    console.error('Error in PATCH /api/tenders/[id]/translations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
