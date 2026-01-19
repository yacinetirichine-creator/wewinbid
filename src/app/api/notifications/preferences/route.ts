import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================
// GET /api/notifications/preferences - Get user preferences
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Get user preferences
    const { data: preferences, error } = await (supabase as any)
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching preferences:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des préférences' },
        { status: 500 }
      );
    }

    // If no preferences exist, create default ones
    if (!preferences) {
      const { data: newPreferences, error: createError } = await (supabase as any)
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          email_enabled: true,
          push_enabled: true,
          deadline_7d: true,
          deadline_3d: true,
          deadline_24h: true,
          tender_status_change: true,
          team_activity: true,
          marketing: false,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating default preferences:', createError);
        return NextResponse.json(
          { error: 'Erreur lors de la création des préférences' },
          { status: 500 }
        );
      }

      return NextResponse.json(newPreferences);
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error in GET /api/notifications/preferences:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/notifications/preferences - Update preferences
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      email_enabled,
      push_enabled,
      deadline_7d,
      deadline_3d,
      deadline_24h,
      tender_status_change,
      team_activity,
      marketing,
    } = body;

    // Update preferences (upsert)
    const { data: preferences, error } = await (supabase as any)
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        email_enabled,
        push_enabled,
        deadline_7d,
        deadline_3d,
        deadline_24h,
        tender_status_change,
        team_activity,
        marketing,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour des préférences' },
        { status: 500 }
      );
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error in POST /api/notifications/preferences:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
