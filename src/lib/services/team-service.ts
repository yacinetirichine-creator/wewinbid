/**
 * Team Management Service
 *
 * Handles all team-related operations:
 * - Creating and managing teams
 * - Inviting and managing team members
 * - Role-based permissions
 * - Billing for extra members (€10/month per member beyond 2 free)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface TeamPermissions {
  can_view_tenders: boolean;
  can_edit_tenders: boolean;
  can_create_tenders: boolean;
  can_delete_tenders: boolean;
  can_view_documents: boolean;
  can_edit_documents: boolean;
  can_export_documents: boolean;
  can_view_analytics: boolean;
  can_manage_team: boolean;
}

export interface TeamSettings {
  allow_member_invites: boolean;
  require_approval: boolean;
  share_tenders: boolean;
  share_documents: boolean;
  share_templates: boolean;
}

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  max_free_members: number;
  extra_member_price: number;
  settings: TeamSettings;
  stripe_subscription_item_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  permissions: TeamPermissions;
  status: 'active' | 'suspended' | 'pending';
  is_billable: boolean;
  invited_by?: string;
  invited_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: TeamRole;
  permissions: TeamPermissions;
  token: string;
  invited_by: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  // Joined data
  team?: Team;
  inviter?: {
    full_name?: string;
    email: string;
  };
}

export interface AddMemberResult {
  allowed: boolean;
  is_paid: boolean;
  extra_cost?: number;
  current_extra_members?: number;
  new_total_extra_cost?: number;
  remaining_free?: number;
  reason?: string;
}

// Default permissions by role
export const DEFAULT_PERMISSIONS: Record<TeamRole, TeamPermissions> = {
  owner: {
    can_view_tenders: true,
    can_edit_tenders: true,
    can_create_tenders: true,
    can_delete_tenders: true,
    can_view_documents: true,
    can_edit_documents: true,
    can_export_documents: true,
    can_view_analytics: true,
    can_manage_team: true
  },
  admin: {
    can_view_tenders: true,
    can_edit_tenders: true,
    can_create_tenders: true,
    can_delete_tenders: false,
    can_view_documents: true,
    can_edit_documents: true,
    can_export_documents: true,
    can_view_analytics: true,
    can_manage_team: true
  },
  member: {
    can_view_tenders: true,
    can_edit_tenders: true,
    can_create_tenders: true,
    can_delete_tenders: false,
    can_view_documents: true,
    can_edit_documents: true,
    can_export_documents: false,
    can_view_analytics: false,
    can_manage_team: false
  },
  viewer: {
    can_view_tenders: true,
    can_edit_tenders: false,
    can_create_tenders: false,
    can_delete_tenders: false,
    can_view_documents: true,
    can_edit_documents: false,
    can_export_documents: false,
    can_view_analytics: false,
    can_manage_team: false
  }
};

// =============================================================================
// TEAM SERVICE CLASS
// =============================================================================

export class TeamService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // ---------------------------------------------------------------------------
  // TEAM MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Create a new team
   */
  async createTeam(ownerId: string, name: string): Promise<Team> {
    const { data, error } = await this.supabase
      .from('teams')
      .insert({
        name,
        owner_id: ownerId
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create team: ${error.message}`);

    // Add owner as team member
    await this.supabase.from('team_members').insert({
      team_id: data.id,
      user_id: ownerId,
      role: 'owner',
      permissions: DEFAULT_PERMISSIONS.owner,
      status: 'active',
      is_billable: false, // Owner doesn't count towards billing
      accepted_at: new Date().toISOString()
    });

    // Log activity
    await this.logActivity(data.id, ownerId, 'team_created', null, { team_name: name });

    return data;
  }

  /**
   * Get user's team (as owner or member)
   */
  async getUserTeam(userId: string): Promise<Team | null> {
    // First check if user is an owner
    const { data: ownedTeam } = await this.supabase
      .from('teams')
      .select('*')
      .eq('owner_id', userId)
      .single();

    if (ownedTeam) return ownedTeam;

    // Then check if user is a member
    const { data: membership } = await this.supabase
      .from('team_members')
      .select('team_id, teams(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (membership?.teams) {
      return membership.teams as unknown as Team;
    }

    return null;
  }

  /**
   * Get team by ID
   */
  async getTeam(teamId: string): Promise<Team | null> {
    const { data, error } = await this.supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Update team settings
   */
  async updateTeam(
    teamId: string,
    updates: Partial<Pick<Team, 'name' | 'settings'>>
  ): Promise<Team> {
    const { data, error } = await this.supabase
      .from('teams')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update team: ${error.message}`);
    return data;
  }

  // ---------------------------------------------------------------------------
  // MEMBER MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Get all team members
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const { data, error } = await this.supabase
      .from('team_members')
      .select(`
        *,
        user:profiles!team_members_user_id_fkey (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to get team members: ${error.message}`);
    return data || [];
  }

  /**
   * Check if team can add a new member (and billing info)
   */
  async canAddMember(teamId: string): Promise<AddMemberResult> {
    const { data, error } = await this.supabase.rpc('can_add_team_member', {
      p_team_id: teamId,
      p_check_billing: true
    });

    if (error) {
      return { allowed: false, is_paid: false, reason: error.message };
    }

    return data as AddMemberResult;
  }

  /**
   * Invite a new team member
   */
  async inviteMember(
    teamId: string,
    inviterId: string,
    email: string,
    role: TeamRole = 'member',
    permissions?: Partial<TeamPermissions>,
    message?: string
  ): Promise<TeamInvitation> {
    // Check if can add member
    const canAdd = await this.canAddMember(teamId);
    if (!canAdd.allowed) {
      throw new Error(canAdd.reason || 'Cannot add more members');
    }

    // Check if user is already a member
    const { data: existingMember } = await this.supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', (
        await this.supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single()
      ).data?.id)
      .single();

    if (existingMember) {
      throw new Error('User is already a team member');
    }

    // Check if there's already a pending invitation
    const { data: existingInvite } = await this.supabase
      .from('team_invitations')
      .select('id')
      .eq('team_id', teamId)
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      throw new Error('An invitation has already been sent to this email');
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invitation
    const { data, error } = await this.supabase
      .from('team_invitations')
      .insert({
        team_id: teamId,
        email,
        role,
        permissions: { ...DEFAULT_PERMISSIONS[role], ...permissions },
        token,
        invited_by: inviterId,
        message,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create invitation: ${error.message}`);

    // Log activity
    await this.logActivity(teamId, inviterId, 'member_invited', null, {
      email,
      role,
      will_be_billed: canAdd.is_paid
    });

    return data;
  }

  /**
   * Get pending invitations for a team
   */
  async getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
    const { data, error } = await this.supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get invitations: ${error.message}`);
    return data || [];
  }

  /**
   * Get invitations for a user by email
   */
  async getUserInvitations(email: string): Promise<TeamInvitation[]> {
    const { data, error } = await this.supabase
      .from('team_invitations')
      .select(`
        *,
        team:teams(*),
        inviter:profiles!team_invitations_invited_by_fkey(full_name, email)
      `)
      .eq('email', email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (error) throw new Error(`Failed to get invitations: ${error.message}`);
    return data || [];
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(token: string, userId: string): Promise<TeamMember> {
    // Get invitation
    const { data: invitation, error: invError } = await this.supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (invError || !invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Verify email matches
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (profile?.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new Error('This invitation was sent to a different email address');
    }

    // Add as team member
    const { data: member, error: memberError } = await this.supabase
      .from('team_members')
      .insert({
        team_id: invitation.team_id,
        user_id: userId,
        role: invitation.role,
        permissions: invitation.permissions,
        status: 'active',
        is_billable: true,
        invited_by: invitation.invited_by,
        invited_at: invitation.created_at,
        accepted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (memberError) throw new Error(`Failed to add team member: ${memberError.message}`);

    // Update invitation status
    await this.supabase
      .from('team_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    // Update user profile with team_id
    await this.supabase
      .from('profiles')
      .update({ team_id: invitation.team_id })
      .eq('id', userId);

    // Log activity
    await this.logActivity(invitation.team_id, userId, 'member_joined', userId, {
      role: invitation.role
    });

    return member;
  }

  /**
   * Decline an invitation
   */
  async declineInvitation(token: string): Promise<void> {
    const { error } = await this.supabase
      .from('team_invitations')
      .update({ status: 'declined' })
      .eq('token', token)
      .eq('status', 'pending');

    if (error) throw new Error(`Failed to decline invitation: ${error.message}`);
  }

  /**
   * Cancel an invitation
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) throw new Error(`Failed to cancel invitation: ${error.message}`);
  }

  /**
   * Update a member's role
   */
  async updateMemberRole(
    teamId: string,
    memberId: string,
    role: TeamRole,
    permissions?: Partial<TeamPermissions>
  ): Promise<TeamMember> {
    const { data, error } = await this.supabase
      .from('team_members')
      .update({
        role,
        permissions: { ...DEFAULT_PERMISSIONS[role], ...permissions },
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .eq('team_id', teamId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update member role: ${error.message}`);

    // Log activity
    await this.logActivity(teamId, null, 'role_changed', data.user_id, {
      new_role: role
    });

    return data;
  }

  /**
   * Remove a member from the team
   */
  async removeMember(teamId: string, memberId: string, removedBy: string): Promise<void> {
    // Get member info for logging
    const { data: member } = await this.supabase
      .from('team_members')
      .select('user_id, role')
      .eq('id', memberId)
      .single();

    if (member?.role === 'owner') {
      throw new Error('Cannot remove the team owner');
    }

    const { error } = await this.supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)
      .eq('team_id', teamId);

    if (error) throw new Error(`Failed to remove member: ${error.message}`);

    // Clear team_id from user profile
    if (member) {
      await this.supabase
        .from('profiles')
        .update({ team_id: null })
        .eq('id', member.user_id);
    }

    // Log activity
    await this.logActivity(teamId, removedBy, 'member_removed', member?.user_id, {});
  }

  /**
   * Leave a team (for members)
   */
  async leaveTeam(teamId: string, userId: string): Promise<void> {
    // Check if user is owner
    const { data: team } = await this.supabase
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .single();

    if (team?.owner_id === userId) {
      throw new Error('Team owner cannot leave. Transfer ownership first or delete the team.');
    }

    await this.removeMember(teamId, userId, userId);
  }

  // ---------------------------------------------------------------------------
  // BILLING
  // ---------------------------------------------------------------------------

  /**
   * Get billing info for a team
   */
  async getTeamBillingInfo(teamId: string): Promise<{
    total_members: number;
    free_members: number;
    billable_members: number;
    extra_members: number;
    monthly_cost: number;
    per_member_cost: number;
  }> {
    const team = await this.getTeam(teamId);
    if (!team) throw new Error('Team not found');

    const { data: members } = await this.supabase
      .from('team_members')
      .select('id, is_billable, role')
      .eq('team_id', teamId)
      .eq('status', 'active');

    const totalMembers = members?.length || 0;
    const billableMembers = members?.filter(m => m.is_billable && m.role !== 'owner').length || 0;
    const extraMembers = Math.max(0, billableMembers - team.max_free_members);
    const monthlyCost = extraMembers * team.extra_member_price;

    return {
      total_members: totalMembers,
      free_members: team.max_free_members,
      billable_members: billableMembers,
      extra_members: extraMembers,
      monthly_cost: monthlyCost,
      per_member_cost: team.extra_member_price
    };
  }

  // ---------------------------------------------------------------------------
  // ACTIVITY LOG
  // ---------------------------------------------------------------------------

  private async logActivity(
    teamId: string,
    userId: string | null,
    action: string,
    targetUserId: string | null | undefined,
    details: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.supabase.from('team_activity_log').insert({
        team_id: teamId,
        user_id: userId,
        action,
        target_user_id: targetUserId,
        details
      });
    } catch (e) {
      console.error('Failed to log team activity:', e);
    }
  }

  /**
   * Get team activity log
   */
  async getActivityLog(teamId: string, limit = 50): Promise<Array<{
    id: string;
    action: string;
    user_id: string | null;
    target_user_id: string | null;
    details: Record<string, unknown>;
    created_at: string;
  }>> {
    const { data, error } = await this.supabase
      .from('team_activity_log')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to get activity log: ${error.message}`);
    return data || [];
  }

  // ---------------------------------------------------------------------------
  // PERMISSIONS CHECK
  // ---------------------------------------------------------------------------

  /**
   * Check if user has a specific permission
   */
  async hasPermission(
    userId: string,
    teamId: string,
    permission: keyof TeamPermissions
  ): Promise<boolean> {
    // Check if owner
    const { data: team } = await this.supabase
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .single();

    if (team?.owner_id === userId) return true;

    // Check member permissions
    const { data: member } = await this.supabase
      .from('team_members')
      .select('permissions')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!member) return false;

    const permissions = member.permissions as TeamPermissions;
    return permissions[permission] === true;
  }
}

// =============================================================================
// SINGLETON FACTORY
// =============================================================================

let teamServiceInstance: TeamService | null = null;

export function getTeamService(supabase: SupabaseClient): TeamService {
  if (!teamServiceInstance) {
    teamServiceInstance = new TeamService(supabase);
  }
  return teamServiceInstance;
}

export default TeamService;
