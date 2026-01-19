'use client';

import { useState, useEffect } from 'react';
import { AppLayout, PageHeader } from '@/components/layout/Sidebar';
import { Button, Card } from '@/components/ui';
import TeamCard from '@/components/teams/TeamCard';
import { Plus, Users, Loader2 } from 'lucide-react';

interface Team {
  team_id: string;
  team_name: string;
  team_slug: string;
  team_avatar_url?: string;
  member_role: string;
  member_count: number;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/teams');
      const data = await res.json();

      if (res.ok) {
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTeamName.trim()) return;

    try {
      setCreating(true);
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowCreateModal(false);
        setNewTeamName('');
        setNewTeamDescription('');
        fetchTeams();
      } else {
        alert(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Erreur serveur');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette équipe ?')) return;

    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchTeams();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Erreur serveur');
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Équipes"
        description="Collaborez avec votre équipe sur les appels d'offres"
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Créer une équipe
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : teams.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-surface-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
              Aucune équipe
            </h3>
            <p className="text-surface-600 dark:text-surface-400 mb-6">
              Créez votre première équipe pour collaborer avec vos collègues
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer une équipe
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard
              key={team.team_id}
              team={team}
              onDelete={handleDeleteTeam}
            />
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-6">
              Créer une équipe
            </h2>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Nom de l'équipe *
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Ex: Équipe Commerciale"
                  className="w-full px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  placeholder="Décrivez votre équipe..."
                  rows={3}
                  className="w-full px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={creating || !newTeamName.trim()}
                  className="flex-1"
                >
                  {creating ? 'Création...' : 'Créer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
