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

  // Récupérer le webhook avec les dernières livraisons
  const { data: webhook, error } = await supabase
    .from('webhooks')
    .select(`
      *,
      deliveries:webhook_deliveries(
        id,
        event_type,
        status,
        status_code,
        response_time_ms,
        error_message,
        attempt_number,
        created_at,
        delivered_at
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  }

  // Trier les livraisons et limiter à 20
  if (webhook.deliveries) {
    webhook.deliveries = webhook.deliveries
      .sort((a: { created_at: string }, b: { created_at: string }) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 20);
  }

  return NextResponse.json({ webhook });
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
  const {
    name,
    description,
    url,
    events,
    is_active,
    retry_count,
    timeout_seconds,
    filters,
  } = body;

  // Construire l'objet de mise à jour
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (url !== undefined) {
    // Valider l'URL
    try {
      new URL(url);
      updates.url = url;
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
  }
  if (events !== undefined) updates.events = events;
  if (is_active !== undefined) updates.is_active = is_active;
  if (retry_count !== undefined) updates.retry_count = retry_count;
  if (timeout_seconds !== undefined) updates.timeout_seconds = timeout_seconds;
  if (filters !== undefined) updates.filters = filters;

  const { data: webhook, error } = await supabase
    .from('webhooks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, name, description, url, events, is_active, retry_count, timeout_seconds, filters')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ webhook });
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
    .from('webhooks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
