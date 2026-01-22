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

  const status = searchParams.get('status');
  const role = searchParams.get('role'); // 'requester' | 'approver'
  const entityType = searchParams.get('entity_type');

  // Construire la requête
  let query = (supabase.from('approval_requests') as any)
    .select(`
      *,
      workflow:approval_workflows(id, name),
      current_step:approval_workflow_steps(id, name, step_order, approval_type),
      decisions:approval_decisions(
        id,
        step_id,
        approver_id,
        decision,
        comment,
        decided_at
      ),
      requester:profiles!requested_by(id, full_name, avatar_url)
    `)
    .order('created_at', { ascending: false });

  // Filtrer par statut
  if (status) {
    query = query.eq('status', status);
  }

  // Filtrer par rôle
  if (role === 'requester') {
    query = query.eq('requested_by', user.id);
  }

  // Filtrer par type d'entité
  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data });
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
    workflow_id,
    entity_type,
    entity_id,
    title,
    description,
    metadata,
    is_urgent,
    due_date,
  } = body;

  // Validation
  if (!workflow_id || !entity_type || !entity_id || !title) {
    return NextResponse.json(
      { error: 'workflow_id, entity_type, entity_id, and title are required' },
      { status: 400 }
    );
  }

  // Trouver la première étape du workflow
  const { data: firstStep, error: stepError } = await (supabase
    .from('approval_workflow_steps') as any)
    .select('id, name')
    .eq('workflow_id', workflow_id)
    .order('step_order', { ascending: true })
    .limit(1)
    .single();

  if (stepError || !firstStep) {
    return NextResponse.json(
      { error: 'Workflow has no steps configured' },
      { status: 400 }
    );
  }

  // Créer la demande d'approbation
  const { data: newRequest, error: createError } = await (supabase
    .from('approval_requests') as any)
    .insert({
      workflow_id,
      entity_type,
      entity_id,
      title,
      description,
      metadata: metadata || {},
      is_urgent: is_urgent || false,
      due_date,
      requested_by: user.id,
      status: 'in_progress',
      current_step_id: firstStep.id,
    })
    .select()
    .single();

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  // Créer l'entrée d'audit
  await (supabase.from('approval_audit_log') as any).insert([
    {
      request_id: newRequest.id,
      action: 'created',
      actor_id: user.id,
      details: { workflow_id, title },
    },
    {
      request_id: newRequest.id,
      action: 'step_started',
      actor_id: null,
      details: { step_id: firstStep.id, step_name: firstStep.name },
    },
  ]);

  return NextResponse.json({ request: newRequest }, { status: 201 });
}
