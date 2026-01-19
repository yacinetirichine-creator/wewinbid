import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/calendar - Get calendar events
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const eventType = searchParams.get('type');
    const includeTeam = searchParams.get('includeTeam') !== 'false';
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Build query
    let query = supabase
      .from('calendar_events' as any)
      .select(`
        *,
        tender:tenders(id, title, reference, status),
        team:teams(id, name)
      `)
      .eq('user_id', user.id);
    
    // Add filters
    if (startDate) {
      query = query.gte('start_date', startDate);
    }
    if (endDate) {
      query = query.lte('start_date', endDate);
    }
    if (eventType) {
      query = query.eq('event_type', eventType);
    }
    
    query = query.order('start_date', { ascending: true });
    
    const { data: events, error } = await query;
    
    if (error) {
      console.error('Error fetching calendar events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Optionally include team events
    let teamEvents = [];
    if (includeTeam) {
      const { data: teamEventsData } = await (supabase as any)
        .from('calendar_events' as any)
        .select(`
          *,
          tender:tenders(id, title, reference, status),
          team:teams(id, name)
        `)
        .eq('is_team_event', true)
        .in('team_id', 
          supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)
        );
      
      teamEvents = teamEventsData || [];
    }
    
    const allEvents = [...events, ...teamEvents];
    
    return NextResponse.json({ events: allEvents, count: allEvents.length });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/calendar - Create calendar event
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const {
      title,
      description,
      location,
      eventType,
      startDate,
      endDate,
      allDay,
      timezone,
      recurrenceRule,
      recurrenceEndDate,
      reminderMinutes,
      isTeamEvent,
      teamId,
      visibility,
      color,
      attendees,
      tenderId,
    } = body;
    
    // Validate required fields
    if (!title || !startDate || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: title, startDate, eventType' },
        { status: 400 }
      );
    }
    
    // Validate event type
    const validTypes = ['deadline', 'meeting', 'reminder', 'milestone', 'custom'];
    if (!validTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid event type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    const { data: event, error } = await (supabase as any)
      .from('calendar_events' as any)
      .insert({
        user_id: user.id,
        tender_id: tenderId,
        title,
        description,
        location,
        event_type: eventType,
        start_date: startDate,
        end_date: endDate,
        all_day: allDay || false,
        timezone: timezone || 'UTC',
        recurrence_rule: recurrenceRule,
        recurrence_end_date: recurrenceEndDate,
        reminder_minutes: reminderMinutes,
        is_team_event: isTeamEvent || false,
        team_id: teamId,
        visibility: visibility || 'private',
        color,
        attendees: attendees || [],
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating calendar event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
