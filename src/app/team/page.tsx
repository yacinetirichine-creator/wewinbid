'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Edit,
  Eye,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  CreditCard,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/Sidebar';
import { Card, Button, Badge } from '@/components/ui';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

const entries = {
  'teamPage.title': 'Team management',
  'teamPage.description': 'Manage members and invitations',
  'teamPage.actions.invite': 'Invite a member',
  'teamPage.stats.activeMembers': 'Active members',
  'teamPage.stats.pendingInvites': 'Pending invitations',
  'teamPage.stats.admins': 'Administrators',
  'teamPage.members.title': 'Team members',
  'teamPage.members.empty': 'No members yet',
  'teamPage.invites.title': 'Pending invitations',
  'teamPage.invites.invitedOn': 'Invited on {date}',
  'teamPage.invites.expiresOn': 'Expires on {date}',
} as const;

interface TeamMember {
  id: string;
  role: 'viewer' | 'editor' | 'admin';
  status: 'pending' | 'active' | 'suspended';
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
  invited_at: string;
  accepted_at?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
}

interface Team {
  id: string;
  name: string;
  owner_id: string;
  max_free_members: number;
  extra_member_price: number;
}

interface BillingInfo {
  total_members: number;
  free_members: number;
  billable_members: number;
  extra_members: number;
  monthly_cost: number;
  per_member_cost: number;
}

export default function TeamPage() {
  const { locale } = useLocale();
  const { t } = useUiTranslations(locale, entries);

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const fetchTeamData = useCallback(async () => {
    try {
      // Fetch team data (includes members and billing)
      const teamRes = await fetch('/api/team');
      const teamData = await teamRes.json();

      if (teamData.team) {
        setTeam(teamData.team);
        setMembers(teamData.members || []);
        setBilling(teamData.billing);
        setIsOwner(teamData.is_owner);

        // Fetch invitations
        const invitationsRes = await fetch('/api/team/invitations');
        const invitationsData = await invitationsRes.json();
        setInvitations(invitationsData.invitations || []);
      }
    } catch (error) {
      console.error('Erreur fetch team:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || inviting) return;

    setInviting(true);
    setInviteError(null);

    try {
      const res = await fetch('/api/team/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole })
      });

      const data = await res.json();
      if (data.error) {
        setInviteError(data.error);
        return;
      }

      setShowInviteModal(false);
      setInviteEmail('');
      await fetchTeamData();
    } catch {
      setInviteError('Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await fetch(`/api/team/invitations?id=${invitationId}`, { method: 'DELETE' });
      await fetchTeamData();
    } catch (error) {
      console.error('Erreur annulation invitation:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre ?')) return;

    try {
      await fetch(`/api/team/members?memberId=${memberId}`, { method: 'DELETE' });
      await fetchTeamData();
    } catch (error) {
      console.error('Erreur suppression membre:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-purple-600" />;
      case 'editor':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-600" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      admin: 'purple',
      editor: 'blue',
      viewer: 'gray',
    };
    return variants[role] || 'gray';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: 'green',
      pending: 'yellow',
      suspended: 'red',
    };
    return variants[status] || 'gray';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between p-6 border-b bg-white">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{team?.name || t('teamPage.title')}</h1>
          <p className="text-gray-600">{t('teamPage.description')}</p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="h-5 w-5" />
            {t('teamPage.actions.invite')}
          </button>
        )}
      </div>

      <div className="p-8 space-y-6">
        {/* Billing Info Banner */}
        {billing && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Utilisation de l&apos;équipe
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {billing.billable_members} / {billing.free_members} membres gratuits
                  </p>
                </div>
              </div>
              <div className="text-right">
                {billing.extra_members > 0 ? (
                  <>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {billing.monthly_cost.toFixed(2)}€<span className="text-sm font-normal">/mois</span>
                    </p>
                    <p className="text-sm text-amber-600">
                      {billing.extra_members} membre(s) supplémentaire(s) × {billing.per_member_cost}€
                    </p>
                  </>
                ) : (
                  <p className="text-lg font-semibold text-green-600">
                    Inclus dans votre abonnement
                  </p>
                )}
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-2 bg-blue-200 dark:bg-blue-900/50 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    billing.billable_members > billing.free_members
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (billing.billable_members / Math.max(1, billing.free_members)) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{members.length}</div>
                <div className="text-sm text-gray-600">{t('teamPage.stats.activeMembers')}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{invitations.length}</div>
                <div className="text-sm text-gray-600">{t('teamPage.stats.pendingInvites')}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {members.filter((m) => m.role === 'admin').length}
                </div>
                <div className="text-sm text-gray-600">{t('teamPage.stats.admins')}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Membres actifs */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            {t('teamPage.members.title')}
          </h3>

          {members.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>{t('teamPage.members.empty')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {member.user.full_name?.[0] || member.user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{member.user.full_name || member.user.email}</div>
                      <div className="text-sm text-gray-600">{member.user.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={getRoleBadge(member.role)}>
                      <div className="flex items-center gap-1">
                        {getRoleIcon(member.role)}
                        <span className="capitalize">{member.role}</span>
                      </div>
                    </Badge>
                    <Badge variant={getStatusBadge(member.status)}>
                      {member.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {member.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {member.status === 'suspended' && <XCircle className="h-3 w-3 mr-1" />}
                      {member.status}
                    </Badge>
                    {isOwner && member.role !== 'admin' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 hover:bg-red-100 rounded transition-colors"
                        title="Retirer de l'équipe"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Invitations en attente */}
        {invitations.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-yellow-600" />
              {t('teamPage.invites.title')}
            </h3>

            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Mail className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-medium">{invitation.email}</div>
                      <div className="text-sm text-gray-600">
                        {t('teamPage.invites.invitedOn', { date: new Date(invitation.created_at).toLocaleDateString(locale) })}
                        {' • '}
                        {t('teamPage.invites.expiresOn', { date: new Date(invitation.expires_at).toLocaleDateString(locale) })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={getRoleBadge(invitation.role)}>
                      {invitation.role}
                    </Badge>
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="p-2 hover:bg-yellow-200 rounded transition-colors"
                      title="Annuler l'invitation"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                Inviter un collaborateur
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="collaborateur@entreprise.com"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rôle
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                  >
                    <option value="admin">Administrateur</option>
                    <option value="member">Membre</option>
                    <option value="viewer">Lecteur</option>
                  </select>
                </div>

                {/* Billing warning */}
                {billing && billing.billable_members >= billing.free_members && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-400">
                    <strong>Note :</strong> Ce membre sera facturé {billing.per_member_cost}€/mois
                    car vous avez atteint la limite de {billing.free_members} membres gratuits.
                  </div>
                )}

                {inviteError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
                    {inviteError}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInviteError(null);
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {inviting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {inviting ? 'Envoi...' : 'Envoyer l\'invitation'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
