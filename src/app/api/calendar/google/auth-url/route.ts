import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// GET /api/calendar/google/auth-url - Get Google OAuth URL
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectUri = searchParams.get('redirect') || `${process.env.NEXT_PUBLIC_APP_URL}/calendar`;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`
    );

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: redirectUri,
    });

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Google auth URL error:', error);
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
  }
}
