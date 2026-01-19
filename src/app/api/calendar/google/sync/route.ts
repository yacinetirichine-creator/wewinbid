import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// POST /api/calendar/google/sync - Sync events with Google Calendar
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { direction = 'bidirectional', syncId } = body;

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get sync connection
    let query = supabase
      .from('calendar_syncs')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .eq('is_active', true);

    if (syncId) {
      query = query.eq('id', syncId);
    }

    const { data: sync, error: syncError } = await query.single();

    const syncData = sync as any;
    if (syncError || !sync) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 404 }
      );
    }

    // Setup OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`
    );

    oauth2Client.setCredentials({
      access_token: (sync as any).access_token,
      refresh_token: (sync as any).refresh_token,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    let importedCount = 0;
    let exportedCount = 0;
    let errors: string[] = [];

    // Import from Google Calendar
    if (direction === 'import' || direction === 'bidirectional') {
      try {
        const { data: googleEvents } = await calendar.events.list({
          calendarId: syncData.default_calendar_id,
          timeMin: new Date().toISOString(),
          maxResults: 100,
          singleEvents: true,
          orderBy: 'startTime',
        });

        if (googleEvents.items) {
          for (const googleEvent of googleEvents.items) {
            // Check if event already exists
            const { data: existingEvent } = await (supabase as any)
              .from('calendar_events' as any)
              .select('id')
              .eq('external_event_id', googleEvent.id)
              .eq('sync_provider', 'google')
              .single();

            if (existingEvent) continue;

            // Import event
            const { error: insertError } = await (supabase as any)
              .from('calendar_events' as any)
              .insert({
                user_id: user.id,
                title: googleEvent.summary || 'Untitled Event',
                description: googleEvent.description,
                location: googleEvent.location,
                event_type: 'custom',
                start_date: googleEvent.start?.dateTime || googleEvent.start?.date,
                end_date: googleEvent.end?.dateTime || googleEvent.end?.date,
                all_day: !googleEvent.start?.dateTime,
                external_event_id: googleEvent.id,
                external_calendar_id: syncData.default_calendar_id,
                sync_provider: 'google',
                last_synced_at: new Date().toISOString(),
              });

            if (!insertError) {
              importedCount++;
            } else {
              errors.push(`Failed to import: ${googleEvent.summary}`);
            }
          }
        }
      } catch (error: any) {
        errors.push(`Import error: ${error.message}`);
      }
    }

    // Export to Google Calendar
    if (direction === 'export' || direction === 'bidirectional') {
      try {
        // Get events to export
        const { data: localEvents } = await (supabase as any)
          .from('calendar_events' as any)
          .select('*')
          .eq('user_id', user.id)
          .is('external_event_id', null)
          .gte('start_date', new Date().toISOString());

        if (localEvents) {
          for (const event of localEvents) {
            try {
              const googleEvent = {
                summary: event.title,
                description: event.description,
                location: event.location,
                start: event.all_day
                  ? { date: event.start_date.split('T')[0] }
                  : { dateTime: event.start_date, timeZone: event.timezone || 'UTC' },
                end: event.end_date
                  ? event.all_day
                    ? { date: event.end_date.split('T')[0] }
                    : { dateTime: event.end_date, timeZone: event.timezone || 'UTC' }
                  : event.all_day
                  ? { date: event.start_date.split('T')[0] }
                  : { dateTime: new Date(new Date(event.start_date).getTime() + 3600000).toISOString(), timeZone: event.timezone || 'UTC' },
                reminders: event.reminder_minutes
                  ? {
                      useDefault: false,
                      overrides: event.reminder_minutes.map((minutes: number) => ({
                        method: 'popup',
                        minutes,
                      })),
                    }
                  : { useDefault: true },
              };

              const { data: createdEvent } = await calendar.events.insert({
                calendarId: syncData.default_calendar_id,
                requestBody: googleEvent,
              });

              if (createdEvent) {
                // Update local event with external ID
                await (supabase as any)
                  .from('calendar_events' as any)
                  .update({
                    external_event_id: createdEvent.id,
                    external_calendar_id: syncData.default_calendar_id,
                    sync_provider: 'google',
                    last_synced_at: new Date().toISOString(),
                  })
                  .eq('id', event.id);

                exportedCount++;
              }
            } catch (error: any) {
              errors.push(`Failed to export: ${event.title} - ${error.message}`);
            }
          }
        }
      } catch (error: any) {
        errors.push(`Export error: ${error.message}`);
      }
    }

    // Update sync status
    await (supabase as any)
      .from('calendar_syncs')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: errors.length > 0 ? 'error' : 'success',
        last_sync_error: errors.length > 0 ? errors.join('; ') : null,
        sync_count: syncData.sync_count + 1,
      })
      .eq('id', syncData.id);

    return NextResponse.json({
      success: true,
      imported: importedCount,
      exported: exportedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Google sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/google/sync - Disconnect Google Calendar
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await (supabase as any)
      .from('calendar_syncs')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'google');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google disconnect error:', error);
    return NextResponse.json({ error: 'Disconnect failed' }, { status: 500 });
  }
}
