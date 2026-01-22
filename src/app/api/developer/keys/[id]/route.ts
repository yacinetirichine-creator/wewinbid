import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: apiKey, error } = await supabase
    .from('api_keys')
    .select('id, name, description, key_prefix, scopes, rate_limit_per_minute, rate_limit_per_day, allowed_ips, expires_at, last_used_at, is_active, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !apiKey) {
    return NextResponse.json({ error: 'API key not found' }, { status: 404 });
  }

  return NextResponse.json({ api_key: apiKey });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, scopes, is_active, rate_limit_per_minute, rate_limit_per_day, allowed_ips } = body;

  // Construire l'objet de mise à jour
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (scopes !== undefined) updates.scopes = scopes;
  if (is_active !== undefined) updates.is_active = is_active;
  if (rate_limit_per_minute !== undefined) updates.rate_limit_per_minute = rate_limit_per_minute;
  if (rate_limit_per_day !== undefined) updates.rate_limit_per_day = rate_limit_per_day;
  if (allowed_ips !== undefined) updates.allowed_ips = allowed_ips;

  const { data: apiKey, error } = await supabase
    .from('api_keys')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, name, description, key_prefix, scopes, rate_limit_per_minute, rate_limit_per_day, allowed_ips, expires_at, is_active')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ api_key: apiKey });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
