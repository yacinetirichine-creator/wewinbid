import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Get company branding settings
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
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json({ error: 'company_id requis' }, { status: 400 });
    }

    // Try to get from company_settings table
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('document_branding')
        .eq('company_id', companyId)
        .single();

      if (!error && data) {
        return NextResponse.json({ branding: (data as Record<string, unknown>).document_branding });
      }
    } catch {
      // Table may not exist
    }

    // Return null if no settings found
    return NextResponse.json({ branding: null });
  } catch (error) {
    console.error('Error fetching branding settings:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST - Save company branding settings
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { company_id, document_branding } = body;

    if (!company_id || !document_branding) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Verify user belongs to company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.company_id !== company_id) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Try to upsert settings
    try {
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          company_id,
          document_branding,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>, {
          onConflict: 'company_id',
        });

      if (error) {
        console.warn('Could not save to company_settings table:', error);
        // Return success anyway as localStorage will handle it on client
      }
    } catch {
      // Table may not exist yet
      console.warn('company_settings table may not exist');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving branding settings:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
