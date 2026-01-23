import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');
  const eventType = searchParams.get('type');

  // Construire la requête
  let query = supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('start_date', { ascending: true });

  // Filtrer par dates
  if (startDate) {
    query = query.gte('start_date', startDate);
  }
  if (endDate) {
    query = query.lte('start_date', endDate);
  }

  // Filtrer par type
  if (eventType) {
    query = query.eq('event_type', eventType);
  }

  const { data: events, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    description,
    event_type,
    start_date,
    end_date,
    all_day,
    is_recurring,
    recurrence_rule,
    color,
    category,
    entity_type,
    entity_id,
    metadata,
    reminders,
  } = body;

  // Validation
  if (!title || !start_date) {
    return NextResponse.json(
      { error: 'title and start_date are required' },
      { status: 400 }
    );
  }

  // Créer l'événement
  const { data: event, error: eventError } = await supabase
    .from('calendar_events')
    .insert({
      user_id: user.id,
      title,
      description,
      event_type: event_type || 'reminder',
      start_date,
      end_date,
      all_day: all_day || false,
      is_recurring: is_recurring || false,
      recurrence_rule,
      color: color || '#3B82F6',
      category,
      entity_type,
      entity_id,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  // Créer les rappels si fournis
  if (reminders && Array.isArray(reminders) && reminders.length > 0) {
    const reminderInserts = reminders.map((reminder: { type: string; minutes_before: number }) => ({
      event_id: event.id,
      user_id: user.id,
      reminder_type: reminder.type || 'notification',
      minutes_before: reminder.minutes_before || 30,
      scheduled_for: new Date(
        new Date(start_date).getTime() - reminder.minutes_before * 60 * 1000
      ).toISOString(),
    }));

    await (supabase as any).from('event_reminders').insert(reminderInserts);
  }

  return NextResponse.json({ event }, { status: 201 });
}
