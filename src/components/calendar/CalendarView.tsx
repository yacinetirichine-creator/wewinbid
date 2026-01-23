'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Bell,
  X,
  Trash2,
  Edit2,
  FileText,
  AlertTriangle,
  Loader2,
  List,
  Grid,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: 'deadline' | 'meeting' | 'reminder' | 'milestone' | 'task';
  start_date: string;
  end_date?: string;
  all_day: boolean;
  color: string;
  category?: string;
  entity_type?: string;
  entity_id?: string;
  status: string;
}

interface CalendarViewProps {
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  entityFilter?: { type: string; id: string };
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  deadline: '#EF4444',
  meeting: '#3B82F6',
  reminder: '#F59E0B',
  milestone: '#10B981',
  task: '#8B5CF6',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  deadline: 'Échéance',
  meeting: 'Réunion',
  reminder: 'Rappel',
  milestone: 'Jalon',
  task: 'Tâche',
};

export function CalendarView({
  onEventClick,
  onDateClick,
  entityFilter,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state pour création
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'reminder' as CalendarEvent['event_type'],
    start_date: '',
    end_date: '',
    all_day: false,
    color: '#3B82F6',
  });
  const [creating, setCreating] = useState(false);

  // Calculer les dates du mois affiché
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Trouver le premier lundi (ou dimanche selon config) avant le premier jour du mois
    const startDay = new Date(firstDay);
    const dayOfWeek = startDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Pour commencer un lundi
    startDay.setDate(startDay.getDate() - daysToSubtract);
    
    // Générer 6 semaines de jours
    const days: Date[] = [];
    const current = new Date(startDay);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Ajouter quelques jours avant/après pour les chevauchements
      startOfMonth.setDate(startOfMonth.getDate() - 7);
      endOfMonth.setDate(endOfMonth.getDate() + 7);

      const params = new URLSearchParams({
        start: startOfMonth.toISOString(),
        end: endOfMonth.toISOString(),
      });

      const response = await fetch(`/api/calendar/events?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.start_date) return;

    setCreating(true);
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newEvent,
          reminders: [
            { type: 'notification', minutes_before: 30 },
            { type: 'notification', minutes_before: 1440 },
          ],
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewEvent({
          title: '',
          description: '',
          event_type: 'reminder',
          start_date: '',
          end_date: '',
          all_day: false,
          color: '#3B82F6',
        });
        await fetchEvents();
      }
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSelectedEvent(null);
        setShowEventModal(false);
        await fetchEvents();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_date);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Upcoming events for list view
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => new Date(e.start_date) >= now)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 10);
  }, [events]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100 capitalize">
            {formatMonthYear(currentDate)}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Aujourd'hui
            </Button>
            <Button variant="ghost" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border border-surface-200 dark:border-surface-700 rounded-lg">
            <Button
              variant={view === 'month' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel événement
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : view === 'month' ? (
        <Card>
          <div className="p-4">
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-surface-500 dark:text-surface-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isInCurrentMonth = isCurrentMonth(date);
                const isTodayDate = isToday(date);

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-1 border border-surface-100 dark:border-surface-800 rounded-lg cursor-pointer transition-colors ${
                      isInCurrentMonth
                        ? 'bg-white dark:bg-surface-900'
                        : 'bg-surface-50 dark:bg-surface-950'
                    } ${isTodayDate ? 'ring-2 ring-primary-500' : ''} hover:bg-surface-50 dark:hover:bg-surface-800`}
                    onClick={() => {
                      if (onDateClick) onDateClick(date);
                    }}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isTodayDate
                          ? 'bg-primary-500 text-white w-7 h-7 rounded-full flex items-center justify-center'
                          : isInCurrentMonth
                          ? 'text-surface-900 dark:text-surface-100'
                          : 'text-surface-400 dark:text-surface-600'
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer"
                          style={{
                            backgroundColor: `${event.color}20`,
                            color: event.color,
                            borderLeft: `2px solid ${event.color}`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                            setShowEventModal(true);
                            if (onEventClick) onEventClick(event);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-surface-500 dark:text-surface-400 px-1">
                          +{dayEvents.length - 3} autres
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      ) : (
        // List View
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
              Événements à venir
            </h3>

            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
                <p className="text-surface-500 dark:text-surface-400">
                  Aucun événement à venir
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => {
                  const eventDate = new Date(event.start_date);
                  const isUpcoming =
                    eventDate.getTime() - Date.now() < 24 * 60 * 60 * 1000;

                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 p-3 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEventModal(true);
                      }}
                    >
                      <div
                        className="w-1 h-12 rounded-full flex-shrink-0"
                        style={{ backgroundColor: event.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-surface-900 dark:text-surface-100 truncate">
                            {event.title}
                          </h4>
                          {isUpcoming && (
                            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
                          <Clock className="h-3 w-3" />
                          <span>
                            {eventDate.toLocaleDateString('fr-FR', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                            {!event.all_day && (
                              <> à {eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</>
                            )}
                          </span>
                        </div>
                      </div>
                      <Badge
                        style={{
                          backgroundColor: `${EVENT_TYPE_COLORS[event.event_type]}20`,
                          color: EVENT_TYPE_COLORS[event.event_type],
                        }}
                      >
                        {EVENT_TYPE_LABELS[event.event_type]}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-900 rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-1 h-8 rounded-full"
                  style={{ backgroundColor: selectedEvent.color }}
                />
                <div className="flex-1 ml-3">
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                    {selectedEvent.title}
                  </h3>
                  <Badge
                    className="mt-1"
                    style={{
                      backgroundColor: `${EVENT_TYPE_COLORS[selectedEvent.event_type]}20`,
                      color: EVENT_TYPE_COLORS[selectedEvent.event_type],
                    }}
                  >
                    {EVENT_TYPE_LABELS[selectedEvent.event_type]}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowEventModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {selectedEvent.description && (
                <p className="text-sm text-surface-600 dark:text-surface-300 mb-4">
                  {selectedEvent.description}
                </p>
              )}

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-surface-400" />
                  <span className="text-surface-600 dark:text-surface-300">
                    {new Date(selectedEvent.start_date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {!selectedEvent.all_day && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-surface-400" />
                    <span className="text-surface-600 dark:text-surface-300">
                      {new Date(selectedEvent.start_date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {selectedEvent.end_date && (
                        <>
                          {' - '}
                          {new Date(selectedEvent.end_date).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="danger"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
                <Button variant="outline" onClick={() => setShowEventModal(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                  Nouvel événement
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1">
                    Titre *
                  </label>
                  <Input
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Titre de l'événement"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Description (optionnel)"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1">
                    Type
                  </label>
                  <select
                    value={newEvent.event_type}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        event_type: e.target.value as CalendarEvent['event_type'],
                        color: EVENT_TYPE_COLORS[e.target.value],
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100"
                  >
                    {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1">
                      Date de début *
                    </label>
                    <Input
                      type="datetime-local"
                      value={newEvent.start_date}
                      onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1">
                      Date de fin
                    </label>
                    <Input
                      type="datetime-local"
                      value={newEvent.end_date}
                      onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newEvent.all_day}
                    onChange={(e) => setNewEvent({ ...newEvent, all_day: e.target.checked })}
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-surface-700 dark:text-surface-200">
                    Toute la journée
                  </span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1">
                    Couleur
                  </label>
                  <div className="flex gap-2">
                    {Object.values(EVENT_TYPE_COLORS).map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          newEvent.color === color
                            ? 'border-surface-900 dark:border-surface-100'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewEvent({ ...newEvent, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateEvent}
                  disabled={!newEvent.title || !newEvent.start_date || creating}
                  isLoading={creating}
                >
                  Créer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarView;
