'use client';

import { Users, Calendar, Crown, Settings, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Card } from '@/components/ui';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

interface Team {
  team_id: string;
  team_name: string;
  team_slug: string;
  team_avatar_url?: string;
  member_role: string;
  member_count: number;
}

interface TeamCardProps {
  team: Team;
  onDelete?: (teamId: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Propriétaire',
  ADMIN: 'Administrateur',
  MEMBER: 'Membre',
  VIEWER: 'Observateur',
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  MEMBER: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  VIEWER: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function TeamCard({ team, onDelete }: TeamCardProps) {
  const isOwner = team.member_role === 'OWNER';

  return (
    <Card hover className="group">
      <Link href={`/teams/${team.team_id}`}>
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Team Avatar */}
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
              {team.team_avatar_url ? (
                <Image
                  src={team.team_avatar_url}
                  alt={team.team_name}
                  width={64}
                  height={64}
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                team.team_name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Team Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                    {team.team_name}
                  </h3>
                  <p className="text-sm text-surface-500 mt-0.5">
                    @{team.team_slug}
                  </p>
                </div>

                {/* Role Badge */}
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                    ROLE_COLORS[team.member_role] || ROLE_COLORS.MEMBER
                  }`}
                >
                  {isOwner && <Crown className="w-3 h-3" />}
                  {ROLE_LABELS[team.member_role] || team.member_role}
                </span>
              </div>

              {/* Team Stats */}
              <div className="flex items-center gap-4 mt-4 text-sm text-surface-600 dark:text-surface-400">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>
                    {team.member_count} membre{team.member_count > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions (show on hover for owners) */}
          {isOwner && (
            <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `/teams/${team.team_id}?tab=settings`;
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Paramètres
              </button>

              {onDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(team.team_id);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              )}
            </div>
          )}
        </div>
      </Link>
    </Card>
  );
}
