'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { PageHeader } from '@/components/layout/Sidebar';
import { Card, Button, Badge } from '@/components/ui';

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

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        fetch('/api/team/members'),
        fetch('/api/team/invitations'),
      ]);

      const membersData = await membersRes.json();
      const invitationsData = await invitationsRes.json();

      setMembers(membersData.members || []);
      setInvitations(invitationsData.invitations || []);
    } catch (error) {
      console.error('Erreur fetch team:', error);
    } finally {
      setLoading(false);
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
      <PageHeader
        title="Gestion de l'équipe"
        description="Gérez les membres et les invitations"
        action={{
          label: 'Inviter un membre',
          href: '#',
        }}
      />

      <div className="p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{members.length}</div>
                <div className="text-sm text-gray-600">Membres actifs</div>
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
                <div className="text-sm text-gray-600">Invitations en attente</div>
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
                <div className="text-sm text-gray-600">Administrateurs</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Membres actifs */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Membres de l'équipe
          </h3>

          {members.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun membre pour le moment</p>
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
                    <button className="p-2 hover:bg-gray-200 rounded transition-colors">
                      <MoreVertical className="h-4 w-4 text-gray-600" />
                    </button>
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
              Invitations en attente
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
                        Invité le {new Date(invitation.created_at).toLocaleDateString('fr-FR')} • Expire
                        le {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={getRoleBadge(invitation.role)}>
                      {invitation.role}
                    </Badge>
                    <button className="p-2 hover:bg-yellow-200 rounded transition-colors">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
