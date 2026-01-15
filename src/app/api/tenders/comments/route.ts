import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const commentSchema = z.object({
  tenderId: z.string().uuid(),
  content: z.string().min(1),
  parentId: z.string().uuid().optional(),
  mentions: z.array(z.string().uuid()).optional(),
});

/**
 * GET /api/tenders/comments
 * Récupère les commentaires d'un tender
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient();
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

    // Récupérer les commentaires avec les infos utilisateur
    const { data: comments, error } = (await supabase
      .from('tender_comments')
      .select(`
        *,
        user:profiles!user_id(
          id,
          email,
          full_name,
          avatar_url
        ),
        replies:tender_comments!parent_id(
          *,
          user:profiles!user_id(
            id,
            email,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('tender_id', tenderId)
      .is('parent_id', null)
      .order('created_at', { ascending: true })) as { data: any[] | null; error: any };

    if (error) throw error;

    return NextResponse.json({ comments: comments || [] });
  } catch (error) {
    console.error('Erreur récupération commentaires:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/tenders/comments
 * Créer un commentaire
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const validated = commentSchema.parse(body);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Créer le commentaire
    const { data: comment, error } = await supabase
      .from('tender_comments')
      .insert({
        tender_id: validated.tenderId,
        user_id: user.id,
        content: validated.content,
        parent_id: validated.parentId,
        mentions: validated.mentions || [],
      })
      .select(`
        *,
        user:profiles!user_id(
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Erreur création commentaire:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * PATCH /api/tenders/comments
 * Modifier un commentaire
 */
export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');
    const { content } = await request.json();

    if (!commentId || !content) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Mettre à jour le commentaire
    const { data, error } = await supabase
      .from('tender_comments')
      .update({
        content,
        edited: true,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ comment: data });
  } catch (error) {
    console.error('Erreur mise à jour commentaire:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/tenders/comments
 * Supprimer un commentaire
 */
export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Supprimer le commentaire
    const { error } = await supabase
      .from('tender_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression commentaire:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
