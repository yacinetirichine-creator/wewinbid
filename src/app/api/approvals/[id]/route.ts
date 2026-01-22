import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Type pour les données d'approbation (tables non générées dans Supabase types)
type ApprovalRequestData = any;

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

  // Récupérer la demande avec toutes les relations
  const { data, error } = await (supabase
    .from('approval_requests') as any)
    .select(`
      *,
      workflow:approval_workflows(
        id, 
        name, 
        description,
        steps:approval_workflow_steps(
          id,
          step_order,
          name,
          description,
          approval_type,
          threshold_count,
          approvers:approval_step_approvers(
            id,
            approver_type,
            user_id,
            role_name
          )
        )
      ),
      current_step:approval_workflow_steps(id, name, step_order, approval_type),
      decisions:approval_decisions(
        id,
        step_id,
        approver_id,
        delegated_from,
        decision,
        comment,
        attachments,
        decided_at,
        approver:profiles!approver_id(id, full_name, avatar_url)
      ),
      comments:approval_comments(
        id,
        author_id,
        content,
        parent_id,
        created_at,
        author:profiles!author_id(id, full_name, avatar_url)
      ),
      audit_log:approval_audit_log(
        id,
        action,
        actor_id,
        details,
        created_at
      ),
      requester:profiles!requested_by(id, full_name, avatar_url, email)
    `)
    .eq('id', id)
    .single();

  const approvalRequest = data as ApprovalRequestData;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!approvalRequest) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  // Vérifier si l'utilisateur peut approuver l'étape courante
  let canApprove = false;
  if (approvalRequest.current_step_id && approvalRequest.status === 'in_progress') {
    const { data: approvers } = await (supabase
      .from('approval_step_approvers') as any)
      .select('*')
      .eq('step_id', approvalRequest.current_step_id);

    if (approvers) {
      canApprove = approvers.some(
        (a: any) =>
          (a.approver_type === 'user' && a.user_id === user.id) ||
          a.approver_type === 'role' // Pour les rôles, vérifier via profiles
      );
    }

    // Vérifier si l'utilisateur a déjà voté
    const { data: existingDecision } = await (supabase
      .from('approval_decisions') as any)
      .select('id')
      .eq('request_id', id)
      .eq('step_id', approvalRequest.current_step_id)
      .eq('approver_id', user.id)
      .single();

    if (existingDecision) {
      canApprove = false;
    }
  }

  return NextResponse.json({
    request: approvalRequest,
    can_approve: canApprove,
    is_requester: approvalRequest.requested_by === user.id,
  });
}

// Prendre une décision
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
  const { decision, comment, attachments } = body;

  // Validation
  if (!decision || !['approved', 'rejected', 'request_changes'].includes(decision)) {
    return NextResponse.json(
      { error: 'Invalid decision. Must be: approved, rejected, or request_changes' },
      { status: 400 }
    );
  }

  // Récupérer la demande
  const { data: approvalRequestData, error: fetchError } = await (supabase
    .from('approval_requests') as any)
    .select('*, current_step:approval_workflow_steps(id, name)')
    .eq('id', id)
    .single();

  const approvalRequest = approvalRequestData as any;

  if (fetchError || !approvalRequest) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (approvalRequest.status !== 'in_progress') {
    return NextResponse.json(
      { error: 'Request is not pending approval' },
      { status: 400 }
    );
  }

  // Vérifier que l'utilisateur est un approbateur de l'étape courante
  const { data: approvers } = await (supabase
    .from('approval_step_approvers') as any)
    .select('*')
    .eq('step_id', approvalRequest.current_step_id);

  const isApprover = approvers?.some(
    (a: any) =>
      (a.approver_type === 'user' && a.user_id === user.id) ||
      a.approver_type === 'role'
  );

  if (!isApprover) {
    return NextResponse.json(
      { error: 'You are not authorized to approve this step' },
      { status: 403 }
    );
  }

  // Vérifier si l'utilisateur a déjà voté
  const { data: existingDecision } = await (supabase
    .from('approval_decisions') as any)
    .select('id')
    .eq('request_id', id)
    .eq('step_id', approvalRequest.current_step_id)
    .eq('approver_id', user.id)
    .single();

  if (existingDecision) {
    return NextResponse.json(
      { error: 'You have already made a decision for this step' },
      { status: 400 }
    );
  }

  // Créer la décision
  const { data: newDecision, error: decisionError } = await (supabase
    .from('approval_decisions') as any)
    .insert({
      request_id: id,
      step_id: approvalRequest.current_step_id,
      approver_id: user.id,
      decision,
      comment,
      attachments: attachments || [],
    })
    .select()
    .single();

  if (decisionError) {
    return NextResponse.json({ error: decisionError.message }, { status: 500 });
  }

  // Log de la décision
  await (supabase.from('approval_audit_log') as any).insert({
    request_id: id,
    action: 'decision_made',
    actor_id: user.id,
    details: {
      step_id: approvalRequest.current_step_id,
      step_name: approvalRequest.current_step?.name,
      decision,
      comment,
    },
  });

  // Récupérer l'état mis à jour (le trigger aura peut-être avancé l'étape)
  const { data: updatedRequest } = await (supabase
    .from('approval_requests') as any)
    .select('*, current_step:approval_workflow_steps(id, name)')
    .eq('id', id)
    .single();

  return NextResponse.json({
    decision: newDecision,
    request: updatedRequest,
  });
}

// Annuler une demande
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

  // Vérifier que l'utilisateur est le demandeur
  const { data: approvalRequestData, error: fetchError } = await (supabase
    .from('approval_requests') as any)
    .select('*')
    .eq('id', id)
    .eq('requested_by', user.id)
    .single();

  const approvalRequest = approvalRequestData as any;

  if (fetchError || !approvalRequest) {
    return NextResponse.json(
      { error: 'Request not found or you are not the requester' },
      { status: 404 }
    );
  }

  if (['approved', 'rejected', 'cancelled'].includes(approvalRequest.status)) {
    return NextResponse.json(
      { error: 'Cannot cancel a completed request' },
      { status: 400 }
    );
  }

  // Annuler la demande
  const { error: updateError } = await (supabase
    .from('approval_requests') as any)
    .update({
      status: 'cancelled',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Log
  await (supabase.from('approval_audit_log') as any).insert({
    request_id: id,
    action: 'cancelled',
    actor_id: user.id,
    details: { reason: 'Cancelled by requester' },
  });

  return NextResponse.json({ success: true });
}
