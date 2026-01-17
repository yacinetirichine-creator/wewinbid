import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// GET /api/calendar/google/callback - Handle Google OAuth callback
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Redirect URL
    const error = searchParams.get('error');

    if (error || !code) {
      const redirectUrl = state || '/calendar';
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}${redirectUrl}?error=auth_failed`
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=unauthorized`
      );
    }

    // Exchange code for tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Get primary calendar
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const { data: calendarList } = await calendar.calendarList.list();
    const primaryCalendar = calendarList.items?.find(cal => cal.primary);

    // Store sync connection
    const { error: syncError } = await supabase
      .from('calendar_syncs')
      .upsert({
        user_id: user.id,
        provider: 'google',
        provider_account_id: userInfo.email || '',
        provider_account_name: userInfo.name || userInfo.email || '',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        default_calendar_id: primaryCalendar?.id || 'primary',
        is_active: true,
        last_sync_status: 'pending',
      }, {
        onConflict: 'user_id,provider,provider_account_id',
      });

    if (syncError) {
      console.error('Error storing Google sync:', syncError);
    }

    const redirectUrl = state || '/calendar';
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${redirectUrl}?success=google_connected`
    );
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/calendar?error=google_connection_failed`
    );
  }
}
