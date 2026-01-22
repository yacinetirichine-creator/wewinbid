'use client';

import { useState } from 'react';
import CalendarView from '@/components/CalendarView';
import { NewAppLayout as AppLayout } from '@/components/layout/NewAppLayout';
import { Download, Settings, Calendar, X } from 'lucide-react';

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

export default function CalendarPage() {
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
      alert('Erreur lors de l\'exportation du calendrier');
    }
  };

  const handleSettings = () => {
    setShowSettingsModal(true);
  };

  return (
    <AppLayout pageTitle="Calendrier">
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b rounded-xl mb-6">
        <div className="px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Gérez vos deadlines, réunions et rappels
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
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
    </AppLayout>
  );
}

// Event Details Modal
function EventDetailsModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/calendar/${event.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Erreur lors de la suppression');
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
                Événement d'équipe
              </span>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
              <p className="text-gray-600">{event.description}</p>
            </div>
          )}

          {/* Date & Time */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Date et heure</h3>
            <p className="text-gray-600">
              {new Date(event.start_date).toLocaleString('fr-FR', {
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
                  {new Date(event.end_date).toLocaleString('fr-FR', {
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
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Tender associé</h3>
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
            {deleting ? 'Suppression...' : 'Supprimer'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// Create Event Modal
function CreateEventModal({
  initialDate,
  onClose,
  onSuccess,
}: {
  initialDate: Date;
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
        alert(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Create error:', error);
      alert('Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Nouvel événement</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre *
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
              Description
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
              Type d'événement *
            </label>
            <select
              required
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="deadline">Deadline</option>
              <option value="meeting">Réunion</option>
              <option value="reminder">Rappel</option>
              <option value="milestone">Jalon</option>
              <option value="custom">Personnalisé</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de début *
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
              Date de fin
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
              Événement toute la journée
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
              Événement d'équipe
            </label>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Couleur
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
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {submitting ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Settings Modal
function SettingsModal({ onClose }: { onClose: () => void }) {
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
      alert('Erreur lors de la connexion à Google Calendar');
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
        alert(`Synchronisation réussie !\nImportés: ${data.imported}\nExportés: ${data.exported}`);
        window.location.reload();
      } else {
        alert(data.error || 'Erreur lors de la synchronisation');
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Paramètres du calendrier</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Google Calendar */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Google Calendar
            </h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Synchronisez vos événements avec Google Calendar
              </p>
              {!googleConnected ? (
                <button
                  onClick={handleConnectGoogle}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Connecter Google Calendar
                </button>
              ) : (
                <button
                  onClick={handleSyncGoogle}
                  disabled={syncing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {syncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
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
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
