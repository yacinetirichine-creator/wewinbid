import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/tenders/history
 * Récupère l'historique d'un tender
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const tenderId = searchParams.get('tenderId');

    if (!tenderId) {
      return NextResponse.json({ error: 'tenderId requis' }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer l'historique
    const { data: history, error } = (await (supabase as any)
      .from('tender_history')
      .select(`
        *,
        user:profiles!user_id(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('tender_id', tenderId)
      .order('created_at', { ascending: false })
      .limit(100)) as { data: any[] | null; error: any };

    if (error) throw error;

    return NextResponse.json({ history: history || [] });
  } catch (error) {
    console.error('Erreur récupération historique:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
