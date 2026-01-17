'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, Clock, Check, X } from 'lucide-react';
import { Button, Card } from '@/components/ui';

interface Preferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  deadline_7d: boolean;
  deadline_3d: boolean;
  deadline_24h: boolean;
  tender_status_change: boolean;
  team_activity: boolean;
  marketing: boolean;
  created_at: string;
  updated_at: string;
}

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications/preferences');
      const data = await res.json();

      if (res.ok) {
        setPreferences(data);
      } else {
        throw new Error(data.error || 'Erreur de chargement');
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des préférences' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      const res = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      const data = await res.json();

      if (res.ok) {
        setPreferences(data);
        setMessage({ type: 'success', text: 'Préférences enregistrées avec succès' });
      } else {
        throw new Error(data.error || 'Erreur de sauvegarde');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const togglePreference = (key: keyof Preferences) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  if (loading) {
    return (
      <Card>
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <div className="p-8 text-center text-surface-500">
          Erreur de chargement des préférences
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-2xl font-display font-bold text-surface-900 dark:text-white mb-6">
          Préférences de notifications
        </h2>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="space-y-8">
          {/* Channel Settings */}
          <div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Canaux de notification
            </h3>

            <div className="space-y-3">
              <PreferenceToggle
                label="Notifications email"
                description="Recevoir les notifications par email"
                icon={Mail}
                checked={preferences.email_enabled}
                onChange={() => togglePreference('email_enabled')}
              />

              <PreferenceToggle
                label="Notifications push"
                description="Recevoir les notifications dans l'application"
                icon={Bell}
                checked={preferences.push_enabled}
                onChange={() => togglePreference('push_enabled')}
              />
            </div>
          </div>

          {/* Deadline Alerts */}
          <div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Alertes de deadline
            </h3>

            <div className="space-y-3">
              <PreferenceToggle
                label="7 jours avant"
                description="Alerte 7 jours avant la date limite"
                checked={preferences.deadline_7d}
                onChange={() => togglePreference('deadline_7d')}
              />

              <PreferenceToggle
                label="3 jours avant"
                description="Alerte 3 jours avant la date limite"
                checked={preferences.deadline_3d}
                onChange={() => togglePreference('deadline_3d')}
              />

              <PreferenceToggle
                label="24 heures avant"
                description="Alerte 24 heures avant la date limite"
                checked={preferences.deadline_24h}
                onChange={() => togglePreference('deadline_24h')}
              />
            </div>
          </div>

          {/* Activity Notifications */}
          <div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
              Activité
            </h3>

            <div className="space-y-3">
              <PreferenceToggle
                label="Changement de statut d'appel d'offres"
                description="Notifications quand un AO change de statut"
                checked={preferences.tender_status_change}
                onChange={() => togglePreference('tender_status_change')}
              />

              <PreferenceToggle
                label="Activité de l'équipe"
                description="Notifications sur les invitations et activités d'équipe"
                checked={preferences.team_activity}
                onChange={() => togglePreference('team_activity')}
              />

              <PreferenceToggle
                label="Communications marketing"
                description="Nouvelles fonctionnalités, tips, et offres"
                checked={preferences.marketing}
                onChange={() => togglePreference('marketing')}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les préférences'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Helper component for preference toggle
function PreferenceToggle({
  label,
  description,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  icon?: React.ElementType;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 text-primary-600 dark:text-primary-400">
          <Icon className="w-5 h-5" />
        </div>
      )}

      <div className="flex-1">
        <h4 className="font-medium text-surface-900 dark:text-white">{label}</h4>
        <p className="text-sm text-surface-600 dark:text-surface-400">{description}</p>
      </div>

      <button
        onClick={onChange}
        className={`
          relative w-12 h-6 rounded-full transition-colors flex-shrink-0
          ${checked ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-700'}
        `}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`
            absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-0.5'}
          `}
        />
      </button>
    </div>
  );
}
