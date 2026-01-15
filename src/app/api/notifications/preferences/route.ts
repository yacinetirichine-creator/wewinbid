import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const preferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  deadline7d: z.boolean().optional(),
  deadline3d: z.boolean().optional(),
  deadline24h: z.boolean().optional(),
  tenderStatusChange: z.boolean().optional(),
  teamActivity: z.boolean().optional(),
  marketing: z.boolean().optional(),
});

/**
 * GET /api/notifications/preferences
 * Récupère les préférences de notifications
 */
export async function GET() {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data, error } = (await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()) as { data: any | null; error: any };

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Si pas de préférences, créer par défaut
    if (!data) {
      const { data: newPrefs, error: insertError } = await supabase
        .from('notification_preferences')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (insertError) throw insertError;

      return NextResponse.json({ preferences: newPrefs });
    }

    return NextResponse.json({ preferences: data });
  } catch (error) {
    console.error('Erreur récupération préférences:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/preferences
 * Met à jour les préférences de notifications
 */
export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const validated = preferencesSchema.parse(body);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Convertir camelCase en snake_case pour Postgres
    const updateData: any = { updated_at: new Date().toISOString() };
    if (validated.emailEnabled !== undefined) updateData.email_enabled = validated.emailEnabled;
    if (validated.pushEnabled !== undefined) updateData.push_enabled = validated.pushEnabled;
    if (validated.deadline7d !== undefined) updateData.deadline_7d = validated.deadline7d;
    if (validated.deadline3d !== undefined) updateData.deadline_3d = validated.deadline3d;
    if (validated.deadline24h !== undefined) updateData.deadline_24h = validated.deadline24h;
    if (validated.tenderStatusChange !== undefined) updateData.tender_status_change = validated.tenderStatusChange;
    if (validated.teamActivity !== undefined) updateData.team_activity = validated.teamActivity;
    if (validated.marketing !== undefined) updateData.marketing = validated.marketing;

    const { data, error } = await supabase
      .from('notification_preferences')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ preferences: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Erreur mise à jour préférences:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
