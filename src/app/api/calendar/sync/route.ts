import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/calendar/sync - Get user's calendar syncs
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: syncs, error } = await supabase
      .from('calendar_syncs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching calendar syncs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Remove sensitive tokens from response
    const sanitizedSyncs = (syncs || []).map(sync => ({
      ...sync,
      access_token: sync.access_token ? '***' : null,
      refresh_token: sync.refresh_token ? '***' : null,
    }));
    
    return NextResponse.json({ syncs: sanitizedSyncs });
  } catch (error) {
    console.error('Calendar sync API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/calendar/sync - Create new sync connection
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const {
      provider,
      providerAccountId,
      providerAccountName,
      accessToken,
      refreshToken,
      tokenExpiresAt,
      defaultCalendarId,
      syncDirection,
    } = body;
    
    // Validate required fields
    if (!provider || !providerAccountId) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, providerAccountId' },
        { status: 400 }
      );
    }
    
    // Validate provider
    const validProviders = ['google', 'outlook'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }
    
    const { data: sync, error } = await supabase
      .from('calendar_syncs')
      .insert({
        user_id: user.id,
        provider,
        provider_account_id: providerAccountId,
        provider_account_name: providerAccountName,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: tokenExpiresAt,
        default_calendar_id: defaultCalendarId,
        sync_direction: syncDirection || 'bidirectional',
        is_active: true,
        last_sync_status: 'pending',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating calendar sync:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Remove sensitive tokens from response
    const sanitizedSync = {
      ...sync,
      access_token: sync.access_token ? '***' : null,
      refresh_token: sync.refresh_token ? '***' : null,
    };
    
    return NextResponse.json({ sync: sanitizedSync }, { status: 201 });
  } catch (error) {
    console.error('Calendar sync API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/calendar/sync - Delete sync connection
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const syncId = searchParams.get('id');
    
    if (!syncId) {
      return NextResponse.json({ error: 'Sync ID required' }, { status: 400 });
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { error } = await supabase
      .from('calendar_syncs')
      .delete()
      .eq('id', syncId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error deleting calendar sync:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Sync connection deleted successfully' });
  } catch (error) {
    console.error('Calendar sync API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
