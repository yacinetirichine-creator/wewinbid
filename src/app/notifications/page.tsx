'use client';

import { useState, useEffect } from 'react';
import { AppLayout, PageHeader } from '@/components/layout/Sidebar';
import { Card, Badge, Button } from '@/components/ui';
import NotificationList from '@/components/notifications/NotificationList';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import { Bell, Settings, Trash2, Check } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  created_at: string;
  tender_id?: string;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const unreadParam = filter === 'unread' ? '?unread=true' : '';
      const res = await fetch(`/api/notifications${unreadParam}`);
      const data = await res.json();

      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  // Mark notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        const wasUnread = notifications.find((n) => n.id === id && !n.read);
        if (wasUnread) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Clear all read notifications
  const handleClearRead = async () => {
    if (!confirm('Supprimer toutes les notifications lues ?')) return;

    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
      });

      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => !n.read));
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Notifications"
        subtitle="Gérez vos notifications et préférences"
      />

      <div className="max-w-5xl">
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6 border-b border-surface-200 dark:border-surface-700">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`
              px-4 py-3 font-medium border-b-2 transition-colors
              ${
                activeTab === 'notifications'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-surface-600 hover:text-surface-900'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="primary" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`
              px-4 py-3 font-medium border-b-2 transition-colors
              ${
                activeTab === 'preferences'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-surface-600 hover:text-surface-900'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              <span>Préférences</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'notifications' ? (
          <div className="space-y-4">
            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={filter === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  Toutes
                </Button>
                <Button
                  variant={filter === 'unread' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Non lues
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Tout marquer lu
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearRead}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer les lues
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <Card>
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-4 text-surface-600">Chargement...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="w-12 h-12 text-surface-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                    {filter === 'unread'
                      ? 'Aucune notification non lue'
                      : 'Aucune notification'}
                  </h3>
                  <p className="text-surface-600 dark:text-surface-400">
                    {filter === 'unread'
                      ? 'Toutes vos notifications sont lues'
                      : 'Vous recevrez ici vos notifications importantes'}
                  </p>
                </div>
              ) : (
                <NotificationList
                  notifications={notifications}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              )}
            </Card>
          </div>
        ) : (
          <NotificationPreferences />
        )}
      </div>
    </AppLayout>
  );
}
