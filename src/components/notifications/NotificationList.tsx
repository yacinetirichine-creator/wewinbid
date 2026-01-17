'use client';

import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Users,
  Info,
  AlertTriangle,
  Trash2,
  Check,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

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

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  DEADLINE_7D: Clock,
  DEADLINE_3D: Clock,
  DEADLINE_24H: AlertTriangle,
  TENDER_WON: CheckCircle,
  TENDER_LOST: XCircle,
  COMMENT: MessageSquare,
  TEAM_INVITE: Users,
  SYSTEM: Info,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  DEADLINE_7D: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  DEADLINE_3D: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  DEADLINE_24H: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  TENDER_WON: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  TENDER_LOST: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
  COMMENT: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  TEAM_INVITE: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  SYSTEM: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function NotificationList({
  notifications,
  onMarkAsRead,
  onDelete,
}: NotificationListProps) {
  const router = useRouter();

  const handleClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }

    // Navigate to link if provided
    if (notification.link) {
      router.push(notification.link);
    } else if (notification.tender_id) {
      router.push(`/tenders/${notification.tender_id}`);
    }
  };

  return (
    <div className="divide-y divide-surface-200 dark:divide-surface-700">
      {notifications.map((notification) => {
        const Icon = NOTIFICATION_ICONS[notification.type] || Info;
        const colorClass = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.SYSTEM;

        return (
          <div
            key={notification.id}
            className={`
              px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors relative
              ${!notification.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}
            `}
          >
            <div className="flex gap-3">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div
                className="flex-1 cursor-pointer"
                onClick={() => handleClick(notification)}
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-medium text-sm text-surface-900 dark:text-white">
                    {notification.title}
                  </h4>
                  
                  {/* Unread indicator */}
                  {!notification.read && (
                    <span className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-1"></span>
                  )}
                </div>

                <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
                  {notification.message}
                </p>

                <p className="text-xs text-surface-500 dark:text-surface-500 mt-1">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1">
                {!notification.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead(notification.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400"
                    title="Marquer comme lu"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-surface-600 dark:text-surface-400 hover:text-red-600 dark:hover:text-red-400"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
