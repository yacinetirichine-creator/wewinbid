import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { google } from 'googleapis';

// Configuration OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/sync/google/callback`
);

// GET - Initiate OAuth flow or get sync status
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // Get current sync status
    if (action === 'status') {
      const { data: integration } = await (supabase
        .from('calendar_integrations') as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      return NextResponse.json({
        connected: !!integration?.access_token,
        lastSync: integration?.last_synced_at,
        email: integration?.provider_email,
      });
    }

    // Generate OAuth URL
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: user.id, // Pass user ID for callback
      prompt: 'consent',
    });

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Sync events to Google Calendar
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Get stored tokens
    const { data: integration } = await (supabase
      .from('calendar_integrations') as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (!integration?.access_token) {
      return NextResponse.json({ error: 'Google Calendar non connecté' }, { status: 400 });
    }

    // Set credentials
    oauth2Client.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
    });

    // Refresh token if needed
    if (integration.expires_at && new Date(integration.expires_at) < new Date()) {
      const { credentials } = await oauth2Client.refreshAccessToken();

      await (supabase
        .from('calendar_integrations') as any)
        .update({
          access_token: credentials.access_token,
          expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
        })
        .eq('id', integration.id);

      oauth2Client.setCredentials(credentials);
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const body = await req.json();
    const { events, calendarId = 'primary' } = body;

    const results = [];

    for (const event of events) {
      try {
        // Create or update event
        const googleEvent = {
          summary: event.title,
          description: event.description || '',
          start: {
            dateTime: event.start_date,
            timeZone: 'Europe/Paris',
          },
          end: {
            dateTime: event.end_date || new Date(new Date(event.start_date).getTime() + 60 * 60 * 1000).toISOString(),
            timeZone: 'Europe/Paris',
          },
          reminders: {
            useDefault: false,
            overrides: event.reminder_minutes?.map((minutes: number) => ({
              method: 'popup',
              minutes,
            })) || [{ method: 'popup', minutes: 30 }],
          },
          colorId: getGoogleColorId(event.color),
        };

        if (event.google_event_id) {
          // Update existing event
          await calendar.events.update({
            calendarId,
            eventId: event.google_event_id,
            requestBody: googleEvent,
          });
          results.push({ id: event.id, status: 'updated' });
        } else {
          // Create new event
          const response = await calendar.events.insert({
            calendarId,
            requestBody: googleEvent,
          });

          // Store Google event ID
          await (supabase
            .from('calendar_events') as any)
            .update({ google_event_id: response.data.id })
            .eq('id', event.id);

          results.push({ id: event.id, googleEventId: response.data.id, status: 'created' });
        }
      } catch (eventError) {
        console.error('Error syncing event:', eventError);
        results.push({ id: event.id, status: 'error', error: 'Échec de synchronisation' });
      }
    }

    // Update last synced timestamp
    await (supabase
      .from('calendar_integrations') as any)
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', integration.id);

    return NextResponse.json({
      success: true,
      results,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return NextResponse.json({ error: 'Erreur de synchronisation' }, { status: 500 });
  }
}

// DELETE - Disconnect Google Calendar
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await (supabase
      .from('calendar_integrations') as any)
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'google');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google Calendar disconnect error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Helper function to map colors to Google Calendar color IDs
function getGoogleColorId(color?: string): string {
  const colorMap: Record<string, string> = {
    '#4F46E5': '9',  // Indigo -> Blueberry
    '#10B981': '10', // Green -> Basil
    '#F59E0B': '5',  // Orange -> Banana
    '#EF4444': '11', // Red -> Tomato
    '#8B5CF6': '3',  // Purple -> Grape
    '#EC4899': '4',  // Pink -> Flamingo
    '#06B6D4': '7',  // Cyan -> Peacock
  };
  return colorMap[color || ''] || '1'; // Default: Lavender
}
