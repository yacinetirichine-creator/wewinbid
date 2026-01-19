'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Mail, Building2, Clock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface InvitationData {
  id: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  expires_at: string;
  company: {
    name: string;
  };
  inviter: {
    full_name: string;
  };
}

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const verifyInvitation = useCallback(async () => {
    if (!token) {
      setError('Token d\'invitation manquant');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Vérifier l'invitation
      const { data, error: fetchError } = await (supabase as any)
        .from('team_invitations')
        .select(
          `
          id,
          email,
          role,
          expires_at,
          company:companies (
            name
          ),
          inviter:profiles!team_invitations_invited_by_fkey (
            full_name
          )
        `
        )
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (fetchError || !data) {
        throw new Error('Invitation non trouvée ou déjà utilisée');
      }

      // Vérifier l'expiration
      if (new Date(data.expires_at) < new Date()) {
        throw new Error('Cette invitation a expiré');
      }

      setInvitation(data as any);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      verifyInvitation();
    } else {
      setError('Lien d\'invitation invalide');
      setLoading(false);
    }
  }, [token, verifyInvitation]);

  const handleAccept = async () => {
    if (!invitation || processing) return;

    setProcessing(true);
    setError(null);

    try {
      const supabase = createClient();

      // Obtenir l'utilisateur actuel
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Vous devez être connecté pour accepter l\'invitation');
      }

      // Vérifier que l'email correspond
      if (user.email !== invitation.email) {
        throw new Error(
          'Cette invitation est destinée à un autre email. Connectez-vous avec ' +
            invitation.email
        );
      }

      // Créer le membre de l'équipe
      const { error: memberError } = await (supabase as any).from('team_members').insert({
        user_id: user.id,
        company_id: (invitation as any).company_id,
        role: invitation.role,
        status: 'active',
      });

      if (memberError) throw memberError;

      // Marquer l'invitation comme acceptée
      const { error: updateError } = await (supabase as any)
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      setSuccess(true);

      // Rediriger après 2 secondes
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation || processing) return;

    if (!confirm('Êtes-vous sûr de vouloir refuser cette invitation ?')) return;

    setProcessing(true);

    try {
      const supabase = createClient();

      const { error } = await (supabase as any)
        .from('team_invitations')
        .update({ status: 'declined' })
        .eq('id', invitation.id);

      if (error) throw error;

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrateur',
      editor: 'Éditeur',
      viewer: 'Lecteur',
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleDescription = (role: string) => {
    const descriptions = {
      admin: 'Accès complet : gérer l\'équipe, modifier tous les appels d\'offres',
      editor: 'Modifier et créer des appels d\'offres',
      viewer: 'Consulter les appels d\'offres uniquement',
    };
    return descriptions[role as keyof typeof descriptions] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invitation invalide
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour au tableau de bord
          </button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invitation acceptée !
          </h1>
          <p className="text-gray-600 mb-6">
            Vous avez rejoint l'équipe avec succès. Redirection...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Invitation à rejoindre une équipe
          </h1>
          <p className="text-gray-600">
            Vous avez été invité à rejoindre une équipe sur WeWinBid
          </p>
        </div>

        {invitation && (
          <div className="space-y-6">
            {/* Détails de l'invitation */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Entreprise
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {(invitation as any).company.name}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Email invité
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {invitation.email}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Rôle</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {getRoleLabel(invitation.role)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {getRoleDescription(invitation.role)}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Expire le
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {new Date(invitation.expires_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-blue-200">
                <p className="text-sm text-gray-600">
                  Invité par{' '}
                  <span className="font-medium text-gray-900">
                    {(invitation as any).inviter.full_name}
                  </span>
                </p>
              </div>
            </div>

            {/* Messages d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleAccept}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
              >
                {processing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Accepter l'invitation
                  </>
                )}
              </button>
              <button
                onClick={handleDecline}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="h-5 w-5" />
                Refuser
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <Clock className="h-12 w-12 text-white animate-pulse" />
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
}
