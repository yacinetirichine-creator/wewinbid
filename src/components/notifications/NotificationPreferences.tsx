'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, Mail, Clock, Check, X } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

const entries = {
  'notificationPreferences.loadError': 'Failed to load preferences',
  'notificationPreferences.loadErrorMessage': 'An error occurred while loading your preferences',
  'notificationPreferences.saveError': 'Failed to save',
  'notificationPreferences.saveErrorMessage': 'An error occurred while saving',
  'notificationPreferences.saveSuccess': 'Preferences saved successfully',
  'notificationPreferences.title': 'Notification preferences',
  'notificationPreferences.channels.title': 'Notification channels',
  'notificationPreferences.channels.email.label': 'Email notifications',
  'notificationPreferences.channels.email.description': 'Receive notifications by email',
  'notificationPreferences.channels.push.label': 'Push notifications',
  'notificationPreferences.channels.push.description': 'Receive notifications in the app',
  'notificationPreferences.deadlines.title': 'Deadline alerts',
  'notificationPreferences.deadlines.7d.label': '7 days before',
  'notificationPreferences.deadlines.7d.description': 'Alert 7 days before the deadline',
  'notificationPreferences.deadlines.3d.label': '3 days before',
  'notificationPreferences.deadlines.3d.description': 'Alert 3 days before the deadline',
  'notificationPreferences.deadlines.24h.label': '24 hours before',
  'notificationPreferences.deadlines.24h.description': 'Alert 24 hours before the deadline',
  'notificationPreferences.activity.title': 'Activity',
  'notificationPreferences.activity.tenderStatus.label': 'Tender status change',
  'notificationPreferences.activity.tenderStatus.description': 'Get notified when a tender changes status',
  'notificationPreferences.activity.team.label': 'Team activity',
  'notificationPreferences.activity.team.description': 'Notifications about invitations and team activity',
  'notificationPreferences.activity.marketing.label': 'Marketing communications',
  'notificationPreferences.activity.marketing.description': 'New features, tips, and offers',
  'notificationPreferences.actions.saving': 'Saving...',
  'notificationPreferences.actions.save': 'Save preferences',
} as const;

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
  const { locale } = useLocale();
  const { t } = useUiTranslations(locale, entries);

  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications/preferences');
      const data = await res.json();

      if (res.ok) {
        setPreferences(data);
      } else {
        throw new Error(data.error || t('notificationPreferences.loadError'));
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setMessage({ type: 'error', text: t('notificationPreferences.loadErrorMessage') });
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

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
        setMessage({ type: 'success', text: t('notificationPreferences.saveSuccess') });
      } else {
        throw new Error(data.error || t('notificationPreferences.saveError'));
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: t('notificationPreferences.saveErrorMessage') });
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
          {t('notificationPreferences.loadError')}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-2xl font-display font-bold text-surface-900 dark:text-white mb-6">
          {t('notificationPreferences.title')}
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
              {t('notificationPreferences.channels.title')}
            </h3>

            <div className="space-y-3">
              <PreferenceToggle
                label={t('notificationPreferences.channels.email.label')}
                description={t('notificationPreferences.channels.email.description')}
                icon={Mail}
                checked={preferences.email_enabled}
                onChange={() => togglePreference('email_enabled')}
              />

              <PreferenceToggle
                label={t('notificationPreferences.channels.push.label')}
                description={t('notificationPreferences.channels.push.description')}
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
              {t('notificationPreferences.deadlines.title')}
            </h3>

            <div className="space-y-3">
              <PreferenceToggle
                label={t('notificationPreferences.deadlines.7d.label')}
                description={t('notificationPreferences.deadlines.7d.description')}
                checked={preferences.deadline_7d}
                onChange={() => togglePreference('deadline_7d')}
              />

              <PreferenceToggle
                label={t('notificationPreferences.deadlines.3d.label')}
                description={t('notificationPreferences.deadlines.3d.description')}
                checked={preferences.deadline_3d}
                onChange={() => togglePreference('deadline_3d')}
              />

              <PreferenceToggle
                label={t('notificationPreferences.deadlines.24h.label')}
                description={t('notificationPreferences.deadlines.24h.description')}
                checked={preferences.deadline_24h}
                onChange={() => togglePreference('deadline_24h')}
              />
            </div>
          </div>

          {/* Activity Notifications */}
          <div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
              {t('notificationPreferences.activity.title')}
            </h3>

            <div className="space-y-3">
              <PreferenceToggle
                label={t('notificationPreferences.activity.tenderStatus.label')}
                description={t('notificationPreferences.activity.tenderStatus.description')}
                checked={preferences.tender_status_change}
                onChange={() => togglePreference('tender_status_change')}
              />

              <PreferenceToggle
                label={t('notificationPreferences.activity.team.label')}
                description={t('notificationPreferences.activity.team.description')}
                checked={preferences.team_activity}
                onChange={() => togglePreference('team_activity')}
              />

              <PreferenceToggle
                label={t('notificationPreferences.activity.marketing.label')}
                description={t('notificationPreferences.activity.marketing.description')}
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
              {saving ? t('notificationPreferences.actions.saving') : t('notificationPreferences.actions.save')}
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
