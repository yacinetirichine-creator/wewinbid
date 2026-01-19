import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/calendar/settings - Get user's calendar settings
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: settings, error } = await (supabase as any)
      .from('calendar_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching calendar settings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // If no settings exist, return defaults
    if (!settings) {
      return NextResponse.json({
        settings: {
          default_view: 'month',
          week_start_day: 1,
          time_format: '24h',
          timezone: 'UTC',
          deadline_color: '#ef4444',
          meeting_color: '#3b82f6',
          reminder_color: '#f59e0b',
          milestone_color: '#10b981',
          custom_color: '#8b5cf6',
          enable_browser_notifications: true,
          enable_email_notifications: true,
          default_reminder_minutes: [15, 60],
          auto_create_deadline_events: true,
          auto_create_submission_reminders: true,
          submission_reminder_days: [7, 3, 1],
          show_team_events: true,
          show_teammates_events: false,
        }
      });
    }
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Calendar settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/calendar/settings - Update calendar settings
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const updateData: any = {};
    
    // Only update provided fields
    if (body.defaultView !== undefined) updateData.default_view = body.defaultView;
    if (body.weekStartDay !== undefined) updateData.week_start_day = body.weekStartDay;
    if (body.timeFormat !== undefined) updateData.time_format = body.timeFormat;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.deadlineColor !== undefined) updateData.deadline_color = body.deadlineColor;
    if (body.meetingColor !== undefined) updateData.meeting_color = body.meetingColor;
    if (body.reminderColor !== undefined) updateData.reminder_color = body.reminderColor;
    if (body.milestoneColor !== undefined) updateData.milestone_color = body.milestoneColor;
    if (body.customColor !== undefined) updateData.custom_color = body.customColor;
    if (body.enableBrowserNotifications !== undefined) updateData.enable_browser_notifications = body.enableBrowserNotifications;
    if (body.enableEmailNotifications !== undefined) updateData.enable_email_notifications = body.enableEmailNotifications;
    if (body.defaultReminderMinutes !== undefined) updateData.default_reminder_minutes = body.defaultReminderMinutes;
    if (body.autoCreateDeadlineEvents !== undefined) updateData.auto_create_deadline_events = body.autoCreateDeadlineEvents;
    if (body.autoCreateSubmissionReminders !== undefined) updateData.auto_create_submission_reminders = body.autoCreateSubmissionReminders;
    if (body.submissionReminderDays !== undefined) updateData.submission_reminder_days = body.submissionReminderDays;
    if (body.showTeamEvents !== undefined) updateData.show_team_events = body.showTeamEvents;
    if (body.showTeammatesEvents !== undefined) updateData.show_teammates_events = body.showTeammatesEvents;
    
    const { data: settings, error } = await (supabase as any)
      .from('calendar_settings')
      .upsert({
        user_id: user.id,
        ...updateData,
      })
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating calendar settings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Calendar settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
