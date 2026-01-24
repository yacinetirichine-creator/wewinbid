'use client';

import { useState } from 'react';
import {
  type CollaborationUser,
  formatUserInitials
} from '@/lib/collaboration/real-time-collaboration';

interface PresenceIndicatorProps {
  users: CollaborationUser[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PresenceIndicator({
  users,
  maxVisible = 5,
  size = 'md'
}: PresenceIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const visibleUsers = users.slice(0, maxVisible);
  const hiddenCount = users.length - maxVisible;

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const borderClasses = {
    sm: 'border-2',
    md: 'border-2',
    lg: 'border-3'
  };

  return (
    <div className="flex items-center">
      {/* User avatars */}
      <div className="flex -space-x-2">
        {visibleUsers.map((user, index) => (
          <div
            key={user.id}
            className="relative"
            style={{ zIndex: visibleUsers.length - index }}
            onMouseEnter={() => setShowTooltip(user.id)}
            onMouseLeave={() => setShowTooltip(null)}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className={`${sizeClasses[size]} rounded-full ${borderClasses[size]} border-white dark:border-slate-800 object-cover`}
              />
            ) : (
              <div
                className={`${sizeClasses[size]} rounded-full ${borderClasses[size]} border-white dark:border-slate-800 flex items-center justify-center font-medium text-white`}
                style={{ backgroundColor: user.color }}
              >
                {formatUserInitials(user.name)}
              </div>
            )}

            {/* Online indicator */}
            {user.isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full" />
            )}

            {/* Tooltip */}
            {showTooltip === user.id && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded whitespace-nowrap z-50">
                {user.name}
                <span className="text-slate-400 ml-1">
                  {user.isOnline ? '(en ligne)' : '(hors ligne)'}
                </span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
              </div>
            )}
          </div>
        ))}

        {/* Hidden count */}
        {hiddenCount > 0 && (
          <div
            className={`${sizeClasses[size]} rounded-full ${borderClasses[size]} border-white dark:border-slate-800 flex items-center justify-center font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300`}
          >
            +{hiddenCount}
          </div>
        )}
      </div>

      {/* Status text */}
      {users.length > 0 && (
        <span className="ml-3 text-sm text-slate-600 dark:text-slate-400">
          {users.length === 1
            ? '1 personne consulte ce document'
            : `${users.length} personnes consultent ce document`}
        </span>
      )}
    </div>
  );
}

// Cursor component for showing other users' cursors in the editor
interface UserCursorProps {
  user: CollaborationUser;
  position: { x: number; y: number };
}

export function UserCursor({ user, position }: UserCursorProps) {
  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-75"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-1px, -1px)'
      }}
    >
      {/* Cursor */}
      <svg
        className="w-4 h-5"
        viewBox="0 0 16 20"
        fill="none"
        style={{ color: user.color }}
      >
        <path
          d="M0 0L16 12L6.4 12L0 20V0Z"
          fill="currentColor"
        />
      </svg>

      {/* Name label */}
      <div
        className="absolute top-4 left-2 px-1.5 py-0.5 rounded text-xs text-white whitespace-nowrap"
        style={{ backgroundColor: user.color }}
      >
        {user.name}
      </div>
    </div>
  );
}

// Selection highlight component
interface UserSelectionProps {
  user: CollaborationUser;
  rects: DOMRect[];
}

export function UserSelection({ user, rects }: UserSelectionProps) {
  return (
    <>
      {rects.map((rect, index) => (
        <div
          key={index}
          className="absolute pointer-events-none"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            backgroundColor: `${user.color}30`,
            borderLeft: index === 0 ? `2px solid ${user.color}` : undefined,
            borderRight: index === rects.length - 1 ? `2px solid ${user.color}` : undefined
          }}
        />
      ))}
    </>
  );
}

// Typing indicator
interface TypingIndicatorProps {
  users: CollaborationUser[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const names = users.map(u => u.name.split(' ')[0]);
  let message = '';

  if (names.length === 1) {
    message = `${names[0]} est en train d'écrire...`;
  } else if (names.length === 2) {
    message = `${names[0]} et ${names[1]} sont en train d'écrire...`;
  } else {
    message = `${names[0]} et ${names.length - 1} autres sont en train d'écrire...`;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{message}</span>
    </div>
  );
}

export default PresenceIndicator;
