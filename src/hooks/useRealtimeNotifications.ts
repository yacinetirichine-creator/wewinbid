'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Types pour les notifications temps réel
export interface RealtimeNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
  link?: string;
  priority: 'low' | 'medium' | 'high';
}

export type NotificationType = 
  | 'tender_new'           // Nouveau AO correspondant aux critères
  | 'tender_deadline'      // Échéance proche
  | 'tender_update'        // Mise à jour d'un AO suivi
  | 'analysis_complete'    // Analyse IA terminée
  | 'document_ready'       // Document généré prêt
  | 'team_mention'         // Mention dans un commentaire
  | 'team_assignment'      // Assignation d'une tâche
  | 'response_submitted'   // Réponse soumise
  | 'system';              // Notification système

export interface NotificationSettings {
  email_enabled: boolean;
  push_enabled: boolean;
  tender_alerts: boolean;
  deadline_reminders: boolean;
  deadline_days_before: number[];
  team_notifications: boolean;
  ai_notifications: boolean;
}

// Hook pour la connexion temps réel Supabase
export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  // Charger les notifications existantes
  useEffect(() => {
    async function loadNotifications() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        const notifs = (data || []).map(n => ({
          ...n,
          priority: n.priority || 'medium',
        }));
        
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      } catch (err) {
        console.error('Erreur chargement notifications:', err);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  // S'abonner aux notifications en temps réel
  useEffect(() => {
    async function subscribeToNotifications() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // S'abonner aux changements de la table notifications
        channelRef.current = supabase
          .channel('notifications-realtime')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload: RealtimePostgresChangesPayload<RealtimeNotification>) => {
              const newNotification = payload.new as RealtimeNotification;
              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);
              
              // Jouer un son si notification haute priorité
              if (newNotification.priority === 'high') {
                playNotificationSound();
              }
              
              // Afficher une notification navigateur
              showBrowserNotification(newNotification);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload: RealtimePostgresChangesPayload<RealtimeNotification>) => {
              const updatedNotification = payload.new as RealtimeNotification;
              setNotifications(prev => 
                prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
              );
              // Recalculer le compteur
              setNotifications(prev => {
                setUnreadCount(prev.filter(n => !n.read).length);
                return prev;
              });
            }
          )
          .subscribe((status) => {
            setConnected(status === 'SUBSCRIBED');
          });
      } catch (err) {
        console.error('Erreur souscription realtime:', err);
      }
    }

    subscribeToNotifications();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erreur marquage notification:', err);
    }
  }, []);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Erreur marquage notifications:', err);
    }
  }, []);

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Erreur suppression notification:', err);
    }
  }, [notifications]);

  // Supprimer toutes les notifications lues
  const clearReadNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('read', true);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => !n.read));
    } catch (err) {
      console.error('Erreur suppression notifications:', err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    connected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
  };
}

// Hook pour les paramètres de notifications
export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email_enabled: true,
    push_enabled: true,
    tender_alerts: true,
    deadline_reminders: true,
    deadline_days_before: [1, 3, 7],
    team_notifications: true,
    ai_notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const supabase = createClient();

  // Charger les paramètres
  useEffect(() => {
    async function loadSettings() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_preferences')
          .select('notification_settings')
          .eq('user_id', user.id)
          .single();

        if (data?.notification_settings) {
          setSettings(data.notification_settings);
        }
      } catch (err) {
        console.error('Erreur chargement paramètres:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  // Sauvegarder les paramètres
  const saveSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const updatedSettings = { ...settings, ...newSettings };

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          notification_settings: updatedSettings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setSettings(updatedSettings);
    } catch (err) {
      console.error('Erreur sauvegarde paramètres:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [settings]);

  return {
    settings,
    loading,
    saving,
    saveSettings,
  };
}

// Demander la permission pour les notifications push
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Notifications non supportées');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Afficher une notification navigateur
export function showBrowserNotification(notification: RealtimeNotification) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const options: NotificationOptions = {
    body: notification.message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: notification.id,
    data: {
      url: notification.link || '/',
    },
  };

  const browserNotif = new Notification(notification.title, options);

  browserNotif.onclick = () => {
    window.focus();
    if (notification.link) {
      window.location.href = notification.link;
    }
    browserNotif.close();
  };

  // Fermer automatiquement après 5 secondes
  setTimeout(() => browserNotif.close(), 5000);
}

// Jouer un son de notification
export function playNotificationSound() {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignorer les erreurs (autoplay bloqué)
    });
  } catch (err) {
    // Ignorer les erreurs
  }
}

// Types d'icônes pour chaque type de notification
export function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'tender_new':
      return 'FileText';
    case 'tender_deadline':
      return 'Clock';
    case 'tender_update':
      return 'RefreshCw';
    case 'analysis_complete':
      return 'Sparkles';
    case 'document_ready':
      return 'FileCheck';
    case 'team_mention':
      return 'AtSign';
    case 'team_assignment':
      return 'UserPlus';
    case 'response_submitted':
      return 'Send';
    case 'system':
    default:
      return 'Bell';
  }
}

// Couleurs pour chaque priorité
export function getNotificationColor(priority: 'low' | 'medium' | 'high') {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-100';
    case 'medium':
      return 'text-yellow-600 bg-yellow-100';
    case 'low':
    default:
      return 'text-blue-600 bg-blue-100';
  }
}
