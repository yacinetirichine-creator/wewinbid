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

  // Récupérer les clés API de l'utilisateur (sans les hashs)
  const { data: apiKeys, error } = await supabase
    .from('api_keys')
    .select('id, name, description, key_prefix, scopes, rate_limit_per_minute, rate_limit_per_day, expires_at, last_used_at, is_active, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ api_keys: apiKeys });
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
  const { name, description, scopes, expires_in_days } = body;

  // Validation
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  // Générer la clé
  const rawKey = 'ww_' + crypto.randomBytes(32).toString('hex');
  const keyPrefix = 'ww_' + rawKey.substring(3, 7) + '...';
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  // Calculer la date d'expiration
  let expiresAt = null;
  if (expires_in_days) {
    expiresAt = new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString();
  }

  // Créer la clé
  const { data: apiKey, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: user.id,
      name,
      description,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      scopes: scopes || ['read:tenders'],
      expires_at: expiresAt,
    })
    .select('id, name, description, key_prefix, scopes, expires_at, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Retourner la clé complète UNE SEULE FOIS
  return NextResponse.json({
    api_key: {
      ...apiKey,
      key: rawKey, // La clé complète, visible une seule fois
    },
    message: 'Sauvegardez cette clé, elle ne sera plus affichée.',
  }, { status: 201 });
}
