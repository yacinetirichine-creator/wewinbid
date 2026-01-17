import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

// ============================================================
// GET /api/teams/[id]/invitations - List team invitations
// ============================================================

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const teamId = params.id;

    // Check if user is team member
    const { data: isMember } = await supabase.rpc('is_team_member', {
      p_team_id: teamId,
      p_user_id: user.id,
    });

    if (!isMember) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Get pending invitations
    const { data: invitations, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ invitations: invitations || [] });
  } catch (error) {
    console.error('Error in GET /api/teams/[id]/invitations:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/teams/[id]/invitations - Send invitation
// ============================================================

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const teamId = params.id;
    const body = await req.json();
    const { email, role = 'MEMBER', message } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    // Check if requester is owner or admin
    const { data: requester } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (!requester || !['OWNER', 'ADMIN'].includes(requester.role)) {
      return NextResponse.json(
        { error: 'Permission refusée' },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'Cet utilisateur est déjà membre' },
        { status: 409 }
      );
    }

    // Check for pending invitation
    const { data: pendingInvitation } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('team_id', teamId)
      .eq('email', email.toLowerCase())
      .eq('status', 'PENDING')
      .single();

    if (pendingInvitation) {
      return NextResponse.json(
        { error: 'Une invitation est déjà en attente pour cet email' },
        { status: 409 }
      );
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('team_invitations')
      .insert({
        team_id: teamId,
        email: email.toLowerCase(),
        role,
        invited_by: user.id,
        token,
        message: message || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'invitation' },
        { status: 500 }
      );
    }

    // TODO: Send invitation email
    // await sendInvitationEmail(email, team.name, invitation.token);

    // Log activity
    await supabase.rpc('log_team_activity', {
      p_team_id: teamId,
      p_action: 'INVITATION_SENT',
      p_entity_type: 'invitation',
      p_entity_id: invitation.id,
      p_description: `Invitation sent to ${email}`,
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/teams/[id]/invitations:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE /api/teams/[id]/invitations - Cancel invitation
// ============================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const teamId = params.id;
    const { searchParams } = new URL(req.url);
    const invitationId = searchParams.get('invitation_id');

    if (!invitationId) {
      return NextResponse.json(
        { error: 'invitation_id requis' },
        { status: 400 }
      );
    }

    // Check if requester is owner or admin
    const { data: requester } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (!requester || !['OWNER', 'ADMIN'].includes(requester.role)) {
      return NextResponse.json(
        { error: 'Permission refusée' },
        { status: 403 }
      );
    }

    // Delete invitation
    const { error } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId)
      .eq('team_id', teamId);

    if (error) {
      console.error('Error deleting invitation:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.rpc('log_team_activity', {
      p_team_id: teamId,
      p_action: 'INVITATION_CANCELLED',
      p_entity_type: 'invitation',
      p_entity_id: invitationId,
      p_description: 'Invitation cancelled',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/teams/[id]/invitations:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
