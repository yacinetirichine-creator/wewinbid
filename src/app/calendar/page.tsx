'use client';

import { useMemo, useState } from 'react';
import CalendarView from '@/components/CalendarView';
import { NewAppLayout as AppLayout } from '@/components/layout/NewAppLayout';
import { Download, Settings, Calendar, X } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  event_type: 'deadline' | 'meeting' | 'reminder' | 'milestone' | 'custom';
  start_date: string;
  end_date?: string;
  all_day: boolean;
  color?: string;
  tender?: {
    id: string;
    title: string;
    reference: string;
  };
  is_team_event: boolean;
};

type UiT = (key: string, vars?: Record<string, any>) => string;

export default function CalendarPage() {
  const { locale } = useLocale();
  const entries = useMemo(
    () => ({
      'calendar.pageTitle': 'Calendar',
      'calendar.header.title': 'Calendar',
      'calendar.header.subtitle': 'Manage your deadlines, meetings and reminders',

      'calendar.export.error': 'Error exporting calendar',

      'calendar.event.teamBadge': 'Team event',
      'calendar.event.descriptionLabel': 'Description',
      'calendar.event.dateTimeLabel': 'Date & time',
      'calendar.event.associatedTenderLabel': 'Associated tender',
      'calendar.event.deleteConfirm': 'Are you sure you want to delete this event?',
      'calendar.event.deleteError': 'Error while deleting',
      'calendar.event.deleting': 'Deleting…',
      'calendar.event.delete': 'Delete',

      'calendar.create.title': 'New event',
      'calendar.create.field.title': 'Title *',
      'calendar.create.field.description': 'Description',
      'calendar.create.field.type': 'Event type *',
      'calendar.create.field.start': 'Start date *',
      'calendar.create.field.end': 'End date',
      'calendar.create.field.allDay': 'All-day event',
      'calendar.create.field.teamEvent': 'Team event',
      'calendar.create.field.color': 'Color',
      'calendar.create.cancel': 'Cancel',
      'calendar.create.creating': 'Creating…',
      'calendar.create.create': 'Create',
      'calendar.create.error': 'Error while creating',

      'calendar.eventType.deadline': 'Deadline',
      'calendar.eventType.meeting': 'Meeting',
      'calendar.eventType.reminder': 'Reminder',
      'calendar.eventType.milestone': 'Milestone',
      'calendar.eventType.custom': 'Custom',

      'calendar.settings.title': 'Calendar settings',
      'calendar.settings.google.title': 'Google Calendar',
      'calendar.settings.google.subtitle': 'Sync your events with Google Calendar',
      'calendar.settings.google.connect': 'Connect Google Calendar',
      'calendar.settings.google.connectError': 'Error connecting to Google Calendar',
      'calendar.settings.google.syncing': 'Syncing…',
      'calendar.settings.google.syncNow': 'Sync now',
      'calendar.settings.google.syncError': 'Error while syncing',
      'calendar.settings.google.syncSuccess': 'Sync successful!\nImported: {imported}\nExported: {exported}',

      'calendar.common.close': 'Close',
    }),
    []
  );
  const { t } = useUiTranslations(locale, entries);

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [createDate, setCreateDate] = useState<Date | null>(null);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleCreateEvent = (date: Date) => {
    setCreateDate(date);
    setShowCreateModal(true);
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/calendar/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'calendar-events.ics';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert(t('calendar.export.error'));
    }
  };

  const handleSettings = () => {
    setShowSettingsModal(true);
  };

  return (
    <AppLayout pageTitle={t('calendar.pageTitle')}>
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b rounded-xl mb-6">
        <div className="px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('calendar.header.title')}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {t('calendar.header.subtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="py-4">
        <CalendarView
          onEventClick={handleEventClick}
          onCreateEvent={handleCreateEvent}
          onExport={handleExport}
          onSettings={handleSettings}
        />
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          locale={locale}
          t={t}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
          }}
        />
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          initialDate={createDate || new Date()}
          t={t}
          onClose={() => {
            setShowCreateModal(false);
            setCreateDate(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setCreateDate(null);
            window.location.reload();
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          t={t}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
    </AppLayout>
  );
}

// Event Details Modal
function EventDetailsModal({
  event,
  locale,
  t,
  onClose,
}: {
  event: CalendarEvent;
  locale: string;
  t: UiT;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(t('calendar.event.deleteConfirm'))) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/calendar/${event.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert(t('calendar.event.deleteError'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(t('calendar.event.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Event Type Badge */}
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: event.color ? event.color + '20' : '#e5e7eb',
                color: event.color || '#374151',
              }}
            >
              {event.event_type}
            </span>
            {event.is_team_event && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                {t('calendar.event.teamBadge')}
              </span>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">{t('calendar.event.descriptionLabel')}</h3>
              <p className="text-gray-600">{event.description}</p>
            </div>
          )}

          {/* Date & Time */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">{t('calendar.event.dateTimeLabel')}</h3>
            <p className="text-gray-600">
              {new Date(event.start_date).toLocaleString(locale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: event.all_day ? undefined : '2-digit',
                minute: event.all_day ? undefined : '2-digit',
              })}
              {event.end_date && (
                <>
                  {' → '}
                  {new Date(event.end_date).toLocaleString(locale, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: event.all_day ? undefined : '2-digit',
                    minute: event.all_day ? undefined : '2-digit',
                  })}
                </>
              )}
            </p>
          </div>

          {/* Tender Link */}
          {event.tender && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">{t('calendar.event.associatedTenderLabel')}</h3>
              <a
                href={`/tenders/${event.tender.id}`}
                className="text-blue-600 hover:underline"
              >
                {event.tender.title} ({event.tender.reference})
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t flex justify-end gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50"
          >
            {deleting ? t('calendar.event.deleting') : t('calendar.event.delete')}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            {t('calendar.common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Create Event Modal
function CreateEventModal({
  initialDate,
  t,
  onClose,
  onSuccess,
}: {
  initialDate: Date;
  t: UiT;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'custom' as const,
    startDate: initialDate.toISOString().slice(0, 16),
    endDate: '',
    allDay: false,
    reminderMinutes: [15, 60],
    isTeamEvent: false,
    color: '#8b5cf6',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          eventType: formData.eventType,
          startDate: formData.startDate,
          endDate: formData.endDate || undefined,
          allDay: formData.allDay,
          reminderMinutes: formData.reminderMinutes,
          isTeamEvent: formData.isTeamEvent,
          color: formData.color,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        alert(data.error || t('calendar.create.error'));
      }
    } catch (error) {
      console.error('Create error:', error);
      alert(t('calendar.create.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{t('calendar.create.title')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('calendar.create.field.title')}
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('calendar.create.field.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('calendar.create.field.type')}
            </label>
            <select
              required
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="deadline">{t('calendar.eventType.deadline')}</option>
              <option value="meeting">{t('calendar.eventType.meeting')}</option>
              <option value="reminder">{t('calendar.eventType.reminder')}</option>
              <option value="milestone">{t('calendar.eventType.milestone')}</option>
              <option value="custom">{t('calendar.eventType.custom')}</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('calendar.create.field.start')}
            </label>
            <input
              type="datetime-local"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('calendar.create.field.end')}
            </label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* All Day */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.allDay}
              onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="allDay" className="text-sm text-gray-700">
              {t('calendar.create.field.allDay')}
            </label>
          </div>

          {/* Team Event */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="teamEvent"
              checked={formData.isTeamEvent}
              onChange={(e) => setFormData({ ...formData, isTeamEvent: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="teamEvent" className="text-sm text-gray-700">
              {t('calendar.create.field.teamEvent')}
            </label>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('calendar.create.field.color')}
            </label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="h-10 w-20"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              {t('calendar.create.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {submitting ? t('calendar.create.creating') : t('calendar.create.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Settings Modal
function SettingsModal({ t, onClose }: { t: UiT; onClose: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  const handleConnectGoogle = async () => {
    try {
      const response = await fetch('/api/calendar/google/auth-url');
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Google connect error:', error);
      alert(t('calendar.settings.google.connectError'));
    }
  };

  const handleSyncGoogle = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/calendar/google/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: 'bidirectional' }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(t('calendar.settings.google.syncSuccess', { imported: data.imported, exported: data.exported }));
        window.location.reload();
      } else {
        alert(data.error || t('calendar.settings.google.syncError'));
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert(t('calendar.settings.google.syncError'));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{t('calendar.settings.title')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Google Calendar */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {t('calendar.settings.google.title')}
            </h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {t('calendar.settings.google.subtitle')}
              </p>
              {!googleConnected ? (
                <button
                  onClick={handleConnectGoogle}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {t('calendar.settings.google.connect')}
                </button>
              ) : (
                <button
                  onClick={handleSyncGoogle}
                  disabled={syncing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {syncing ? t('calendar.settings.google.syncing') : t('calendar.settings.google.syncNow')}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            {t('calendar.common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
