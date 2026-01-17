import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================
// GET /api/teams/[id]/members - List team members
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

    // Get team members
    const { data: members, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des membres' },
        { status: 500 }
      );
    }

    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error('Error in GET /api/teams/[id]/members:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/teams/[id]/members - Add member (from invitation)
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
    const { user_id, role = 'MEMBER' } = body;

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

    // Check team member limit
    const { data: team } = await supabase
      .from('teams')
      .select('max_members')
      .eq('id', teamId)
      .single();

    const { count: currentMembers } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('is_active', true);

    if (team && currentMembers && currentMembers >= team.max_members) {
      return NextResponse.json(
        { error: 'Limite de membres atteinte' },
        { status: 400 }
      );
    }

    // Add member
    const { data: member, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id,
        role,
        invited_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ce membre fait déjà partie de l\'équipe' },
          { status: 409 }
        );
      }
      console.error('Error adding member:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'ajout du membre' },
        { status: 500 }
      );
    }

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/teams/[id]/members:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH /api/teams/[id]/members - Update member role
// ============================================================

export async function PATCH(
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
    const { member_id, role, is_active } = body;

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

    // Update member
    const { data: member, error } = await supabase
      .from('team_members')
      .update({
        ...(role && { role }),
        ...(typeof is_active === 'boolean' && { is_active }),
      })
      .eq('id', member_id)
      .eq('team_id', teamId)
      .select()
      .single();

    if (error) {
      console.error('Error updating member:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.rpc('log_team_activity', {
      p_team_id: teamId,
      p_action: 'MEMBER_UPDATED',
      p_entity_type: 'member',
      p_entity_id: member_id,
      p_description: `Member role changed to ${role || 'updated'}`,
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error in PATCH /api/teams/[id]/members:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE /api/teams/[id]/members - Remove member
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
    const memberId = searchParams.get('member_id');

    if (!memberId) {
      return NextResponse.json(
        { error: 'member_id requis' },
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

    // Cannot remove team owner
    const { data: memberToRemove } = await supabase
      .from('team_members')
      .select('role')
      .eq('id', memberId)
      .eq('team_id', teamId)
      .single();

    if (memberToRemove?.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Impossible de retirer le propriétaire' },
        { status: 400 }
      );
    }

    // Remove member
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)
      .eq('team_id', teamId);

    if (error) {
      console.error('Error removing member:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.rpc('log_team_activity', {
      p_team_id: teamId,
      p_action: 'MEMBER_REMOVED',
      p_entity_type: 'member',
      p_entity_id: memberId,
      p_description: 'Member removed from team',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/teams/[id]/members:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
