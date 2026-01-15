import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================
// GET - Fetch template versions
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

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json({ error: 'ID du template requis' }, { status: 400 });
    }

    // Verify user has access to the template
    const { data: template } = await supabase
      .from('templates')
      .select('id')
      .eq('id', templateId)
      .single();

    if (!template) {
      return NextResponse.json({ error: 'Template non trouvé' }, { status: 404 });
    }

    // Fetch versions
    const { data: versions, error } = await supabase
      .from('template_versions')
      .select(
        `
        id,
        version_number,
        content,
        change_summary,
        created_at,
        created_by,
        creator:profiles!template_versions_created_by_fkey (
          full_name,
          avatar_url
        )
      `
      )
      .eq('template_id', templateId)
      .order('version_number', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      versions,
      total: versions?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching template versions:', error);

    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des versions' },
      { status: 500 }
    );
  }
}
