import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const UpdatePreferencesSchema = z.object({
  preferred_sectors: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  target_countries: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  notification_settings: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    frequency: z.enum(['realtime', 'daily', 'weekly']).optional(),
    match_threshold: z.number().min(0).max(100).optional(),
  }).optional(),
});

// GET /api/user/preferences - Get user matching preferences
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with preferences
    const { data: profile, error } = await (supabase as any)
      .from('profiles')
      .select('preferred_sectors, keywords, target_countries, languages, notification_settings')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    // Get dashboard preferences
    const { data: dashboardPrefs } = await (supabase as any)
      .from('user_dashboard_preferences')
      .select('min_match_score, deadline_alert_days, auto_match_enabled, notify_new_matches')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      preferences: {
        preferred_sectors: profile?.preferred_sectors || [],
        keywords: profile?.keywords || [],
        target_countries: profile?.target_countries || [],
        languages: profile?.languages || ['fr'],
        notification_settings: profile?.notification_settings || {},
        min_match_score: dashboardPrefs?.min_match_score || 70,
        deadline_alert_days: dashboardPrefs?.deadline_alert_days || 7,
        auto_match_enabled: dashboardPrefs?.auto_match_enabled ?? true,
        notify_new_matches: dashboardPrefs?.notify_new_matches ?? true,
      }
    });
  } catch (error) {
    console.error('Error in GET /api/user/preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/user/preferences - Update user matching preferences
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = UpdatePreferencesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { preferred_sectors, keywords, target_countries, languages, notification_settings } = validation.data;

    // Update profile preferences
    const profileUpdates: any = {};
    if (preferred_sectors !== undefined) profileUpdates.preferred_sectors = preferred_sectors;
    if (keywords !== undefined) profileUpdates.keywords = keywords;
    if (target_countries !== undefined) profileUpdates.target_countries = target_countries;
    if (languages !== undefined) profileUpdates.languages = languages;
    if (notification_settings !== undefined) profileUpdates.notification_settings = notification_settings;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
      }
    }

    // Update dashboard preferences if needed
    const { min_match_score, deadline_alert_days, auto_match_enabled, notify_new_matches } = body;
    
    if (min_match_score !== undefined || deadline_alert_days !== undefined || 
        auto_match_enabled !== undefined || notify_new_matches !== undefined) {
      
      const dashboardUpdates: any = {};
      if (min_match_score !== undefined) dashboardUpdates.min_match_score = min_match_score;
      if (deadline_alert_days !== undefined) dashboardUpdates.deadline_alert_days = deadline_alert_days;
      if (auto_match_enabled !== undefined) dashboardUpdates.auto_match_enabled = auto_match_enabled;
      if (notify_new_matches !== undefined) dashboardUpdates.notify_new_matches = notify_new_matches;

      // Upsert dashboard preferences
      const { error: dashError } = await (supabase as any)
        .from('user_dashboard_preferences')
        .upsert({
          user_id: user.id,
          ...dashboardUpdates,
        }, {
          onConflict: 'user_id'
        });

      if (dashError) {
        console.error('Error updating dashboard preferences:', dashError);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Error in PATCH /api/user/preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
