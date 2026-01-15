'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, Smartphone, Calendar, MessageSquare, Users, TrendingUp, Save } from 'lucide-react';
import { PageHeader } from '@/components/layout/Sidebar';
import { Card, Button } from '@/components/ui';

interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  deadline7d: boolean;
  deadline3d: boolean;
  deadline24h: boolean;
  tenderStatusChange: boolean;
  teamActivity: boolean;
  marketing: boolean;
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    pushEnabled: true,
    deadline7d: true,
    deadline3d: true,
    deadline24h: true,
    tenderStatusChange: true,
    teamActivity: true,
    marketing: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences');
      if (!response.ok) throw new Error('Erreur fetch');

      const data = await response.json();
      if (data.preferences) {
        setPreferences({
          emailEnabled: data.preferences.email_enabled,
          pushEnabled: data.preferences.push_enabled,
          deadline7d: data.preferences.deadline_7d,
          deadline3d: data.preferences.deadline_3d,
          deadline24h: data.preferences.deadline_24h,
          tenderStatusChange: data.preferences.tender_status_change,
          teamActivity: data.preferences.team_activity,
          marketing: data.preferences.marketing,
        });
      }
    } catch (error) {
      console.error('Erreur fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) throw new Error('Erreur sauvegarde');

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erreur save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
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
        title="Paramètres des Notifications"
        description="Gérez vos préférences de notifications email et push"
      />

      <div className="p-8 max-w-4xl mx-auto space-y-6">
        {/* Message de sauvegarde */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3"
          >
            <Save className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">Préférences enregistrées</span>
          </motion.div>
        )}

        {/* Canaux de communication */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Canaux de communication
          </h3>
          <div className="space-y-4">
            <PreferenceToggle
              icon={<Mail className="h-5 w-5" />}
              title="Notifications Email"
              description="Recevoir des emails pour les événements importants"
              checked={preferences.emailEnabled}
              onChange={() => togglePreference('emailEnabled')}
            />
            <PreferenceToggle
              icon={<Smartphone className="h-5 w-5" />}
              title="Notifications Push"
              description="Recevoir des notifications push dans votre navigateur"
              checked={preferences.pushEnabled}
              onChange={() => togglePreference('pushEnabled')}
            />
          </div>
        </Card>

        {/* Échéances */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            Alertes d'échéance
          </h3>
          <div className="space-y-4">
            <PreferenceToggle
              icon={<Calendar className="h-5 w-5" />}
              title="7 jours avant"
              description="Alerte une semaine avant l'échéance"
              checked={preferences.deadline7d}
              onChange={() => togglePreference('deadline7d')}
            />
            <PreferenceToggle
              icon={<Calendar className="h-5 w-5" />}
              title="3 jours avant"
              description="Alerte 3 jours avant l'échéance"
              checked={preferences.deadline3d}
              onChange={() => togglePreference('deadline3d')}
            />
            <PreferenceToggle
              icon={<Calendar className="h-5 w-5" />}
              title="24 heures avant"
              description="Alerte 24h avant l'échéance (recommandé)"
              checked={preferences.deadline24h}
              onChange={() => togglePreference('deadline24h')}
            />
          </div>
        </Card>

        {/* Activité des appels d'offres */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Activité des appels d'offres
          </h3>
          <div className="space-y-4">
            <PreferenceToggle
              icon={<TrendingUp className="h-5 w-5" />}
              title="Changements de statut"
              description="Notification quand un AO change de statut (gagné, perdu, etc.)"
              checked={preferences.tenderStatusChange}
              onChange={() => togglePreference('tenderStatusChange')}
            />
          </div>
        </Card>

        {/* Collaboration */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Collaboration en équipe
          </h3>
          <div className="space-y-4">
            <PreferenceToggle
              icon={<MessageSquare className="h-5 w-5" />}
              title="Activité de l'équipe"
              description="Commentaires, modifications et invitations"
              checked={preferences.teamActivity}
              onChange={() => togglePreference('teamActivity')}
            />
          </div>
        </Card>

        {/* Marketing */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Communications marketing
          </h3>
          <div className="space-y-4">
            <PreferenceToggle
              icon={<Mail className="h-5 w-5" />}
              title="Newsletters et promotions"
              description="Recevoir des actualités produit et offres spéciales"
              checked={preferences.marketing}
              onChange={() => togglePreference('marketing')}
            />
          </div>
        </Card>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer les préférences
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Composant toggle
interface PreferenceToggleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function PreferenceToggle({ icon, title, description, checked, onChange }: PreferenceToggleProps) {
  return (
    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-shrink-0 text-gray-600 mt-0.5">{icon}</div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
