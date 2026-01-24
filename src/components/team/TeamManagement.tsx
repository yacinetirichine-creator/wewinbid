'use client';

import { useState, useEffect, useCallback } from 'react';
import { type TeamRole, DEFAULT_PERMISSIONS } from '@/lib/services/team-service';

interface TeamMember {
  id: string;
  user_id: string;
  role: TeamRole;
  status: 'active' | 'suspended' | 'pending';
  is_billable: boolean;
  created_at: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface TeamInvitation {
  id: string;
  email: string;
  role: TeamRole;
  status: string;
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

const ROLE_LABELS: Record<TeamRole, string> = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  member: 'Membre',
  viewer: 'Lecteur'
};

const ROLE_COLORS: Record<TeamRole, string> = {
  owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  member: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  viewer: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
};

export function TeamManagement() {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('member');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ success: boolean; message: string; billing_info?: any } | null>(null);

  // Create team state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchTeamData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/team');
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setTeam(data.team);
      setMembers(data.members || []);
      setBilling(data.billing);
      setIsOwner(data.is_owner);

      if (data.team) {
        const invRes = await fetch('/api/team/invitations');
        const invData = await invRes.json();
        setInvitations(invData.invitations || []);
      }
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName.trim() })
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      setShowCreateModal(false);
      setTeamName('');
      await fetchTeamData();
    } catch {
      setError('Erreur lors de la création de l\'équipe');
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setInviteResult(null);

    try {
      const res = await fetch('/api/team/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          message: inviteMessage.trim() || undefined
        })
      });

      const data = await res.json();
      if (data.error) {
        setInviteResult({ success: false, message: data.error });
        return;
      }

      setInviteResult({
        success: true,
        message: 'Invitation envoyée avec succès !',
        billing_info: data.billing_info
      });

      setInviteEmail('');
      setInviteMessage('');
      await fetchTeamData();
    } catch {
      setInviteResult({ success: false, message: 'Erreur lors de l\'envoi de l\'invitation' });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre de l\'équipe ?')) return;

    try {
      const res = await fetch(`/api/team/members?memberId=${memberId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      await fetchTeamData();
    } catch {
      setError('Erreur lors de la suppression du membre');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/team/invitations?id=${invitationId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      await fetchTeamData();
    } catch {
      setError('Erreur lors de l\'annulation de l\'invitation');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: TeamRole) => {
    try {
      const res = await fetch('/api/team/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole })
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      await fetchTeamData();
    } catch {
      setError('Erreur lors de la mise à jour du rôle');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // No team yet - show create option
  if (!team) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Créez votre équipe
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Invitez jusqu&apos;à 2 collaborateurs gratuitement avec votre abonnement.
            <br />
            Membres supplémentaires : 10€/mois par personne.
          </p>

          {showCreateModal ? (
            <div className="space-y-4">
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Nom de votre équipe"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateTeam}
                  disabled={creating || !teamName.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Création...' : 'Créer l\'équipe'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Créer mon équipe
            </button>
          )}

          {error && (
            <p className="mt-4 text-red-600 dark:text-red-400 text-sm">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {team.name}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Gérez votre équipe et invitez des collaborateurs
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Inviter un membre
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="float-right">&times;</button>
        </div>
      )}

      {/* Billing Info Card */}
      {billing && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                Utilisation de l&apos;équipe
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {billing.billable_members} / {billing.free_members} membres gratuits utilisés
              </p>
            </div>
            <div className="text-right">
              {billing.extra_members > 0 ? (
                <>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {billing.monthly_cost.toFixed(2)}€<span className="text-sm font-normal">/mois</span>
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {billing.extra_members} membre(s) supplémentaire(s) × {billing.per_member_cost}€
                  </p>
                </>
              ) : (
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  Inclus dans votre abonnement
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  billing.billable_members > billing.free_members
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
                style={{
                  width: `${Math.min(100, (billing.billable_members / billing.free_members) * 100)}%`
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Membres ({members.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {members.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {member.user?.avatar_url ? (
                  <img
                    src={member.user.avatar_url}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 font-medium">
                    {(member.user?.full_name || member.user?.email || '?')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {member.user?.full_name || member.user?.email || 'Utilisateur'}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {member.user?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[member.role]}`}>
                  {ROLE_LABELS[member.role]}
                </span>

                {member.is_billable && member.role !== 'owner' && (
                  <span className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs">
                    Facturé
                  </span>
                )}

                {isOwner && member.role !== 'owner' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value as TeamRole)}
                      className="text-sm border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-900"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Membre</option>
                      <option value="viewer">Lecteur</option>
                    </select>

                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Retirer de l'équipe"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Invitations en attente ({invitations.length})
            </h3>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {invitation.email}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Expire le {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[invitation.role]}`}>
                    {ROLE_LABELS[invitation.role]}
                  </span>

                  {isOwner && (
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Annuler l'invitation"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Inviter un collaborateur
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborateur@entreprise.com"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Rôle
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900"
                >
                  <option value="admin">Administrateur - Peut gérer l&apos;équipe</option>
                  <option value="member">Membre - Peut créer et modifier</option>
                  <option value="viewer">Lecteur - Consultation uniquement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Message personnalisé (optionnel)
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Rejoins notre équipe pour collaborer sur les appels d'offres !"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 resize-none"
                />
              </div>

              {/* Billing warning */}
              {billing && billing.billable_members >= billing.free_members && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-400">
                  <strong>Note :</strong> Ce membre sera facturé {billing.per_member_cost}€/mois
                  car vous avez atteint la limite de {billing.free_members} membres gratuits.
                </div>
              )}

              {inviteResult && (
                <div className={`p-3 rounded-lg text-sm ${
                  inviteResult.success
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                }`}>
                  {inviteResult.message}
                  {inviteResult.billing_info && (
                    <p className="mt-1 text-xs">
                      {inviteResult.billing_info.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteMessage('');
                  setInviteResult(null);
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                Fermer
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {inviting ? 'Envoi...' : 'Envoyer l\'invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamManagement;
