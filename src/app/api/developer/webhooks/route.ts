import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Récupérer les webhooks de l'utilisateur
  const { data: webhooks, error } = await supabase
    .from('webhooks')
    .select(`
      id,
      name,
      description,
      url,
      events,
      is_active,
      retry_count,
      timeout_seconds,
      filters,
      total_deliveries,
      successful_deliveries,
      failed_deliveries,
      last_delivery_at,
      last_success_at,
      last_failure_at,
      created_at
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ webhooks });
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
    name,
    description,
    url,
    events,
    retry_count,
    timeout_seconds,
    filters,
  } = body;

  // Validation
  if (!name || !url || !events || events.length === 0) {
    return NextResponse.json(
      { error: 'name, url, and events are required' },
      { status: 400 }
    );
  }

  // Valider l'URL
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Générer un secret pour la signature HMAC
  const secret = crypto.randomBytes(32).toString('hex');
  const secretHash = crypto.createHash('sha256').update(secret).digest('hex');

  // Créer le webhook
  const { data: webhook, error } = await supabase
    .from('webhooks')
    .insert({
      user_id: user.id,
      name,
      description,
      url,
      events,
      secret_hash: secretHash,
      retry_count: retry_count || 3,
      timeout_seconds: timeout_seconds || 30,
      filters: filters || {},
    })
    .select('id, name, description, url, events, is_active, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Retourner le webhook avec le secret (visible une seule fois)
  return NextResponse.json({
    webhook: {
      ...webhook,
      secret, // Le secret complet, visible une seule fois
    },
    message: 'Sauvegardez ce secret, il ne sera plus affiché.',
  }, { status: 201 });
}
