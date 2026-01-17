import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/calendar/export - Export events as ICS file
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('start') || new Date().toISOString();
    const endDate = searchParams.get('end') || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch events
    const { data: events, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_date', startDate)
      .lte('start_date', endDate)
      .order('start_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching events for export:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Generate ICS file content
    const icsContent = generateICS(events || []);
    
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="calendar-events.ics"',
      },
    });
  } catch (error) {
    console.error('Calendar export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateICS(events: any[]): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WeWinBid//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:WeWinBid Events',
    'X-WR-TIMEZONE:UTC',
  ];
  
  events.forEach(event => {
    const startDate = new Date(event.start_date);
    const endDate = event.end_date ? new Date(event.end_date) : new Date(startDate.getTime() + 60 * 60 * 1000);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    ics.push('BEGIN:VEVENT');
    ics.push(`UID:${event.id}@wewinbid.com`);
    ics.push(`DTSTAMP:${timestamp}`);
    ics.push(`DTSTART:${formatDate(startDate)}`);
    ics.push(`DTEND:${formatDate(endDate)}`);
    ics.push(`SUMMARY:${escapeICSText(event.title)}`);
    
    if (event.description) {
      ics.push(`DESCRIPTION:${escapeICSText(event.description)}`);
    }
    
    if (event.location) {
      ics.push(`LOCATION:${escapeICSText(event.location)}`);
    }
    
    if (event.color) {
      ics.push(`COLOR:${event.color}`);
    }
    
    // Add reminders/alarms
    if (event.reminder_minutes && Array.isArray(event.reminder_minutes)) {
      event.reminder_minutes.forEach((minutes: number) => {
        ics.push('BEGIN:VALARM');
        ics.push('ACTION:DISPLAY');
        ics.push(`DESCRIPTION:Reminder: ${escapeICSText(event.title)}`);
        ics.push(`TRIGGER:-PT${minutes}M`);
        ics.push('END:VALARM');
      });
    }
    
    // Recurrence rule
    if (event.recurrence_rule) {
      ics.push(`RRULE:${event.recurrence_rule}`);
    }
    
    // Status based on event type
    const status = event.event_type === 'deadline' ? 'CONFIRMED' : 'TENTATIVE';
    ics.push(`STATUS:${status}`);
    
    ics.push('END:VEVENT');
  });
  
  ics.push('END:VCALENDAR');
  
  return ics.join('\r\n');
}

function escapeICSText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
