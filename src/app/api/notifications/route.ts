import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const notificationSchema = z.object({
  type: z.enum(['DEADLINE_7D', 'DEADLINE_3D', 'DEADLINE_24H', 'TENDER_WON', 'TENDER_LOST', 'COMMENT', 'TEAM_INVITE', 'SYSTEM']),
  title: z.string().min(1),
  message: z.string().min(1),
  link: z.string().optional(),
  tenderId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/notifications
 * Récupère les notifications de l'utilisateur connecté
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = (await query) as {
      data: any[] | null;
      error: any;
    };

    if (error) throw error;

    // Compter les non lues
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Crée une nouvelle notification
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const validated = notificationSchema.parse(body);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: validated.type,
        title: validated.title,
        message: validated.message,
        link: validated.link,
        tender_id: validated.tenderId,
        metadata: validated.metadata,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ notification: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Erreur création notification:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Marque des notifications comme lues
 */
export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    const { notificationIds, markAllRead } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (markAllRead) {
      // Marquer toutes comme lues
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      return NextResponse.json({ success: true, markedAll: true });
    }

    // Marquer spécifiques comme lues
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'notificationIds requis' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .in('id', notificationIds)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, count: notificationIds.length });
  } catch (error) {
    console.error('Erreur mise à jour notifications:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Supprime des notifications
 */
export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    const { notificationIds } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'notificationIds requis' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', notificationIds)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, count: notificationIds.length });
  } catch (error) {
    console.error('Erreur suppression notifications:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
