'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter, Download, Settings } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

type ViewMode = 'month' | 'week' | 'day' | 'agenda';

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

type CalendarViewProps = {
  onEventClick?: (event: CalendarEvent) => void;
  onCreateEvent?: (date: Date) => void;
  onExport?: () => void;
  onSettings?: () => void;
};

type UiT = (key: string, vars?: Record<string, any>) => string;

export default function CalendarView({
  onEventClick,
  onCreateEvent,
  onExport,
  onSettings,
}: CalendarViewProps) {
  const { locale } = useLocale();
  const entries = useMemo(
    () => ({
      'calendarView.header.title': 'Calendar',
      'calendarView.header.today': 'Today',

      'calendarView.mode.month': 'Month',
      'calendarView.mode.week': 'Week',
      'calendarView.mode.day': 'Day',
      'calendarView.mode.agenda': 'Agenda',

      'calendarView.filter.all': 'All events',
      'calendarView.filter.deadline': 'Deadlines',
      'calendarView.filter.meeting': 'Meetings',
      'calendarView.filter.reminder': 'Reminders',
      'calendarView.filter.milestone': 'Milestones',
      'calendarView.filter.custom': 'Custom',

      'calendarView.toggle.team': 'Team',

      'calendarView.action.export': 'Export',
      'calendarView.action.settings': 'Settings',
      'calendarView.action.newEvent': 'New event',

      'calendarView.title.agendaRange': 'Agenda - Next 30 days',

      'calendarView.month.more': '+{count} more',
      'calendarView.agenda.empty': 'No upcoming events',
    }),
    []
  );
  const { t } = useUiTranslations(locale, entries);

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [showTeamEvents, setShowTeamEvents] = useState(true);

  const getDateRange = useCallback(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week': {
        const day = start.getDay();
        start.setDate(start.getDate() - day + 1); // Monday
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'agenda':
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() + 30); // Next 30 days
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }, [currentDate, viewMode]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
        includeTeam: showTeamEvents.toString(),
      });
      
      if (filterType !== 'all') {
        params.append('type', filterType);
      }

      const response = await fetch(`/api/calendar?${params}`);
      const data = await response.json();
      
      if (data.events) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setLoading(false);
    }
  }, [filterType, getDateRange, showTeamEvents]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);

    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }

    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDateTitle = () => {
    const options: Intl.DateTimeFormatOptions = {};

    switch (viewMode) {
      case 'month':
        options.month = 'long';
        options.year = 'numeric';
        break;
      case 'week':
        const weekStart = new Date(currentDate);
        const day = weekStart.getDay();
        weekStart.setDate(weekStart.getDate() - day + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${weekStart.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}`;
      case 'day':
        options.weekday = 'long';
        options.day = 'numeric';
        options.month = 'long';
        options.year = 'numeric';
        break;
      case 'agenda':
        return t('calendarView.title.agendaRange');
    }

    return currentDate.toLocaleDateString(locale, options);
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.color) return event.color;

    const colorMap = {
      deadline: '#ef4444',
      meeting: '#3b82f6',
      reminder: '#f59e0b',
      milestone: '#10b981',
      custom: '#8b5cf6',
    };

    return colorMap[event.event_type] || '#6b7280';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">{t('calendarView.header.title')}</h2>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {t('calendarView.header.today')}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['month', 'week', 'day', 'agenda'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode === 'month' && t('calendarView.mode.month')}
                {mode === 'week' && t('calendarView.mode.week')}
                {mode === 'day' && t('calendarView.mode.day')}
                {mode === 'agenda' && t('calendarView.mode.agenda')}
              </button>
            ))}
          </div>

          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('calendarView.filter.all')}</option>
            <option value="deadline">{t('calendarView.filter.deadline')}</option>
            <option value="meeting">{t('calendarView.filter.meeting')}</option>
            <option value="reminder">{t('calendarView.filter.reminder')}</option>
            <option value="milestone">{t('calendarView.filter.milestone')}</option>
            <option value="custom">{t('calendarView.filter.custom')}</option>
          </select>

          {/* Team events toggle */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showTeamEvents}
              onChange={(e) => setShowTeamEvents(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">{t('calendarView.toggle.team')}</span>
          </label>

          {/* Actions */}
          <div className="flex gap-2 ml-4">
            {onExport && (
              <button
                onClick={onExport}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                title={t('calendarView.action.export')}
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            {onSettings && (
              <button
                onClick={onSettings}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                title={t('calendarView.action.settings')}
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            {onCreateEvent && (
              <button
                onClick={() => onCreateEvent(new Date())}
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                <span>{t('calendarView.action.newEvent')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={() => navigateDate('prev')}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold text-gray-900 capitalize">
          {getDateTitle()}
        </h3>

        <button
          onClick={() => navigateDate('next')}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : viewMode === 'month' ? (
          <MonthView
            currentDate={currentDate}
            events={events}
            onEventClick={onEventClick}
            onDateClick={onCreateEvent}
            getEventColor={getEventColor}
            locale={locale}
            t={t}
          />
        ) : viewMode === 'week' ? (
          <WeekView
            currentDate={currentDate}
            events={events}
            onEventClick={onEventClick}
            onDateClick={onCreateEvent}
            getEventColor={getEventColor}
            locale={locale}
          />
        ) : viewMode === 'day' ? (
          <DayView
            currentDate={currentDate}
            events={events}
            onEventClick={onEventClick}
            getEventColor={getEventColor}
            locale={locale}
          />
        ) : (
          <AgendaView
            events={events}
            onEventClick={onEventClick}
            getEventColor={getEventColor}
            locale={locale}
            t={t}
          />
        )}
      </div>
    </div>
  );
}

// Month View Component
function MonthView({ currentDate, events, onEventClick, onDateClick, getEventColor, locale, t }: any) {
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    const prevMonthDays = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    for (let i = prevMonthDays; i > 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i + 1),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event: CalendarEvent) => {
      const eventDate = new Date(event.start_date);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const days = getDaysInMonth();
  const weekDays = useMemo(() => {
    // Use a known Monday to generate weekday names
    const monday = new Date(Date.UTC(2021, 0, 4));
    return Array.from({ length: 7 }, (_, i) =>
      new Date(monday.getTime() + i * 24 * 60 * 60 * 1000).toLocaleDateString(locale, { weekday: 'short' })
    );
  }, [locale]);

  return (
    <div className="h-full">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 mb-px">
        {weekDays.map((day) => (
          <div key={day} className="bg-gray-50 py-2 text-center text-sm font-semibold text-gray-700">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 h-[calc(100%-3rem)]">
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day.date);
          const isToday =
            day.date.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`bg-white p-2 min-h-[120px] ${
                !day.isCurrentMonth ? 'bg-gray-50' : ''
              }`}
              onClick={() => onDateClick?.(day.date)}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  !day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                } ${
                  isToday
                    ? 'w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 text-white'
                    : ''
                }`}
              >
                {day.date.getDate()}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event: CalendarEvent) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    className="text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 truncate"
                    style={{ backgroundColor: getEventColor(event) + '20', color: getEventColor(event) }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 px-2">
                    {t('calendarView.month.more', { count: dayEvents.length - 3 })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Week View Component
function WeekView({ currentDate, events, onEventClick, onDateClick, getEventColor, locale }: any) {
  const getWeekDays = () => {
    const days = [];
    const weekStart = new Date(currentDate);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - day + 1);

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }

    return days;
  };

  const days = getWeekDays();

  return (
    <div className="grid grid-cols-7 gap-2 h-full">
      {days.map((day) => {
        const dayEvents = events.filter((event: CalendarEvent) => {
          const eventDate = new Date(event.start_date);
          return eventDate.toDateString() === day.toDateString();
        });

        const isToday = day.toDateString() === new Date().toDateString();

        return (
          <div key={day.toISOString()} className="border rounded-lg p-3">
            <div
              className={`text-sm font-semibold mb-3 pb-2 border-b ${
                isToday ? 'text-blue-600' : 'text-gray-900'
              }`}
            >
              <div>{day.toLocaleDateString(locale, { weekday: 'short' })}</div>
              <div
                className={`text-2xl ${
                  isToday
                    ? 'w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white'
                    : ''
                }`}
              >
                {day.getDate()}
              </div>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[calc(100%-5rem)]">
              {dayEvents.map((event: CalendarEvent) => (
                <div
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  className="text-sm p-2 rounded cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: getEventColor(event) + '20', borderLeft: `3px solid ${getEventColor(event)}` }}
                >
                  <div className="font-medium" style={{ color: getEventColor(event) }}>
                    {event.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(event.start_date).toLocaleTimeString(locale, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Day View Component
function DayView({ currentDate, events, onEventClick, getEventColor, locale }: any) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const dayEvents = events.filter((event: CalendarEvent) => {
    const eventDate = new Date(event.start_date);
    return eventDate.toDateString() === currentDate.toDateString();
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="relative">
        {hours.map((hour) => (
          <div key={hour} className="flex border-b border-gray-200 h-16">
            <div className="w-20 pr-4 text-sm text-gray-500 text-right">
              {hour.toString().padStart(2, '0')}:00
            </div>
            <div className="flex-1 relative">
              {dayEvents
                .filter((event: CalendarEvent) => {
                  const eventHour = new Date(event.start_date).getHours();
                  return eventHour === hour;
                })
                .map((event: CalendarEvent) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className="absolute left-0 right-0 mx-2 p-2 rounded cursor-pointer hover:opacity-80"
                    style={{
                      backgroundColor: getEventColor(event) + '20',
                      borderLeft: `3px solid ${getEventColor(event)}`,
                      top: `${(new Date(event.start_date).getMinutes() / 60) * 4}rem`,
                    }}
                  >
                    <div className="font-medium text-sm" style={{ color: getEventColor(event) }}>
                      {event.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(event.start_date).toLocaleTimeString(locale, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Agenda View Component
function AgendaView({ events, onEventClick, getEventColor, locale, t }: any) {
  const groupEventsByDate = () => {
    const grouped: { [key: string]: CalendarEvent[] } = {};

    events.forEach((event: CalendarEvent) => {
      const dateKey = new Date(event.start_date).toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return grouped;
  };

  const groupedEvents = groupEventsByDate();

  return (
    <div className="space-y-6">
      {Object.keys(groupedEvents).length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {t('calendarView.agenda.empty')}
        </div>
      ) : (
        Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <div key={date}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
              {date}
            </h3>
            <div className="space-y-2">
              {dateEvents.map((event: CalendarEvent) => (
                <div
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  className="flex items-start gap-4 p-4 bg-white border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  style={{ borderLeftColor: getEventColor(event), borderLeftWidth: '4px' }}
                >
                  <div className="flex-shrink-0 text-center w-16">
                    <div className="text-2xl font-bold text-gray-900">
                      {new Date(event.start_date).getDate()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(event.start_date).toLocaleTimeString(locale, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{event.title}</h4>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    )}
                    {event.tender && (
                      <div className="text-xs text-gray-500 mt-2">
                        Tender: {event.tender.title}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: getEventColor(event) + '20', color: getEventColor(event) }}
                      >
                        {event.event_type}
                      </span>
                      {event.is_team_event && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {t('calendarView.toggle.team')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
