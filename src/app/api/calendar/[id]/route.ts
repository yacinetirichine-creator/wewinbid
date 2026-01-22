import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/calendar/[id] - Get single event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: event, error } = await (supabase
      .from('calendar_events') as any)
      .select(`
        *,
        tender:tenders(id, title, reference, status),
        team:teams(id, name)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching calendar event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    return NextResponse.json({ event });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/calendar/[id] - Update event
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const updateData: any = {};
    
    // Only update provided fields
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.eventType !== undefined) updateData.event_type = body.eventType;
    if (body.startDate !== undefined) updateData.start_date = body.startDate;
    if (body.endDate !== undefined) updateData.end_date = body.endDate;
    if (body.allDay !== undefined) updateData.all_day = body.allDay;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.recurrenceRule !== undefined) updateData.recurrence_rule = body.recurrenceRule;
    if (body.recurrenceEndDate !== undefined) updateData.recurrence_end_date = body.recurrenceEndDate;
    if (body.reminderMinutes !== undefined) updateData.reminder_minutes = body.reminderMinutes;
    if (body.isTeamEvent !== undefined) updateData.is_team_event = body.isTeamEvent;
    if (body.teamId !== undefined) updateData.team_id = body.teamId;
    if (body.visibility !== undefined) updateData.visibility = body.visibility;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.attendees !== undefined) updateData.attendees = body.attendees;
    
    const { data: event, error } = await (supabase
      .from('calendar_events') as any)
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating calendar event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    return NextResponse.json({ event });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/calendar/[id] - Delete event
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { error } = await (supabase
      .from('calendar_events') as any)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error deleting calendar event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
