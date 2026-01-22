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

  const { data: comments, error } = await (supabase
    .from('approval_comments') as any)
    .select(`
      *,
      author:profiles!author_id(id, full_name, avatar_url)
    `)
    .eq('request_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
  const { content, parent_id, mentions } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  // Vérifier que la demande existe
  const { data: approvalRequest } = await (supabase
    .from('approval_requests') as any)
    .select('id')
    .eq('id', id)
    .single();

  if (!approvalRequest) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  // Créer le commentaire
  const { data: comment, error } = await (supabase
    .from('approval_comments') as any)
    .insert({
      request_id: id,
      author_id: user.id,
      content: content.trim(),
      parent_id,
      mentions: mentions || [],
    })
    .select(`
      *,
      author:profiles!author_id(id, full_name, avatar_url)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment }, { status: 201 });
}
