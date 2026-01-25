'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Types pour les mises à jour temps réel
interface RealtimeUpdate<T = any> {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  old: T | null;
  new: T | null;
  timestamp: Date;
}

interface UseRealtimeUpdatesOptions {
  tables?: string[];
  userId?: string;
  companyId?: string;
  onUpdate?: (update: RealtimeUpdate) => void;
  enabled?: boolean;
}

interface UseRealtimeUpdatesReturn {
  isConnected: boolean;
  lastUpdate: RealtimeUpdate | null;
  connectionError: string | null;
  reconnect: () => void;
}

export function useRealtimeUpdates({
  tables = ['notifications', 'tenders', 'tender_responses'],
  userId,
  companyId,
  onUpdate,
  enabled = true,
}: UseRealtimeUpdatesOptions = {}): UseRealtimeUpdatesReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<RealtimeUpdate | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  // Handle incoming changes
  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<any>, table: string) => {
      const update: RealtimeUpdate = {
        type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        table,
        old: payload.old as any,
        new: payload.new as any,
        timestamp: new Date(),
      };

      setLastUpdate(update);
      onUpdate?.(update);

      // Play notification sound for new notifications
      if (table === 'notifications' && payload.eventType === 'INSERT') {
        playNotificationSound();
      }
    },
    [onUpdate]
  );

  // Subscribe to tables
  const subscribe = useCallback(() => {
    if (!enabled) return;

    const supabase = createClient();
    supabaseRef.current = supabase;

    // Clean up existing channels
    channelsRef.current.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    // Subscribe to each table
    tables.forEach((table) => {
      let filter: string | undefined;

      // Add filters based on table
      if (userId) {
        if (table === 'notifications') {
          filter = `user_id=eq.${userId}`;
        }
      }
      if (companyId) {
        if (table === 'tenders' || table === 'tender_responses') {
          filter = `company_id=eq.${companyId}`;
        }
      }

      const channel = supabase
        .channel(`realtime:${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter,
          },
          (payload) => handleChange(payload, table)
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setConnectionError(null);
          } else if (status === 'CHANNEL_ERROR') {
            setConnectionError(`Erreur de connexion au canal ${table}`);
          } else if (status === 'CLOSED') {
            setIsConnected(false);
          }
        });

      channelsRef.current.push(channel);
    });
  }, [enabled, tables, userId, companyId, handleChange]);

  // Reconnect function
  const reconnect = useCallback(() => {
    setConnectionError(null);
    subscribe();
  }, [subscribe]);

  // Setup subscriptions
  useEffect(() => {
    subscribe();

    return () => {
      // Cleanup
      if (supabaseRef.current) {
        channelsRef.current.forEach((channel) => {
          supabaseRef.current?.removeChannel(channel);
        });
        channelsRef.current = [];
      }
    };
  }, [subscribe]);

  return {
    isConnected,
    lastUpdate,
    connectionError,
    reconnect,
  };
}

// Hook spécifique pour les notifications
interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  created_at: string;
}

interface UseRealtimeNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export function useRealtimeNotifications(
  userId: string | undefined
): UseRealtimeNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial notifications
  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications?limit=20');
        const data = await res.json();
        if (res.ok) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [userId]);

  // Listen for real-time updates
  const { isConnected } = useRealtimeUpdates({
    tables: ['notifications'],
    userId,
    enabled: !!userId,
    onUpdate: (update) => {
      if (update.table !== 'notifications') return;

      if (update.type === 'INSERT' && update.new) {
        setNotifications((prev) => [update.new as Notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Show browser notification if permitted
        showBrowserNotification(update.new as Notification);
      } else if (update.type === 'UPDATE' && update.new) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === update.new!.id ? (update.new as Notification) : n))
        );
        // Update unread count if read status changed
        if (update.old && !update.old.read && update.new.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } else if (update.type === 'DELETE' && update.old) {
        setNotifications((prev) => prev.filter((n) => n.id !== update.old!.id));
        if (!update.old.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    },
  });

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      const notification = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

// Helper functions
function playNotificationSound() {
  if (typeof window === 'undefined') return;

  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  } catch {
    // Ignore errors
  }
}

async function showBrowserNotification(notification: Notification) {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/icons/icon-192x192.png',
      tag: notification.id,
    });
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/icon-192x192.png',
        tag: notification.id,
      });
    }
  }
}
