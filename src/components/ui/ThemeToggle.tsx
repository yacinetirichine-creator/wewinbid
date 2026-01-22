'use client';

import React from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

// Icons
function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({
  variant = 'dropdown',
  size = 'md',
  showLabel = false,
  className = '',
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }[size];

  const buttonSize = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }[size];

  // Simple toggle button
  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={`
          ${buttonSize}
          inline-flex items-center justify-center
          rounded-lg
          bg-surface-100 dark:bg-surface-800
          hover:bg-surface-200 dark:hover:bg-surface-700
          text-surface-600 dark:text-surface-300
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          dark:focus:ring-offset-surface-900
          ${className}
        `}
        title={resolvedTheme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        aria-label={resolvedTheme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      >
        {resolvedTheme === 'dark' ? (
          <SunIcon className={`${iconSize} transition-transform hover:rotate-45`} />
        ) : (
          <MoonIcon className={`${iconSize} transition-transform hover:-rotate-12`} />
        )}
      </button>
    );
  }

  // Dropdown with all options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`${buttonSize} ${className}`}
          title="Changer le thème"
        >
          {resolvedTheme === 'dark' ? (
            <MoonIcon className={iconSize} />
          ) : (
            <SunIcon className={iconSize} />
          )}
          <span className="sr-only">Changer le thème</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={theme === 'light' ? 'bg-surface-100 dark:bg-surface-800' : ''}
        >
          <SunIcon className="h-4 w-4 mr-2" />
          <span>Clair</span>
          {theme === 'light' && (
            <span className="ml-auto text-primary-500">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={theme === 'dark' ? 'bg-surface-100 dark:bg-surface-800' : ''}
        >
          <MoonIcon className="h-4 w-4 mr-2" />
          <span>Sombre</span>
          {theme === 'dark' && (
            <span className="ml-auto text-primary-500">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={theme === 'system' ? 'bg-surface-100 dark:bg-surface-800' : ''}
        >
          <MonitorIcon className="h-4 w-4 mr-2" />
          <span>Système</span>
          {theme === 'system' && (
            <span className="ml-auto text-primary-500">✓</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact toggle for mobile or small spaces
export function ThemeToggleCompact({ className = '' }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full
        bg-surface-200 dark:bg-surface-700
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${className}
      `}
      role="switch"
      aria-checked={resolvedTheme === 'dark'}
      aria-label="Basculer le mode sombre"
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full
          bg-white shadow-lg
          transition-transform duration-200
          ${resolvedTheme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
        `}
      >
        {resolvedTheme === 'dark' ? (
          <MoonIcon className="h-4 w-4 text-primary-600" />
        ) : (
          <SunIcon className="h-4 w-4 text-amber-500" />
        )}
      </span>
    </button>
  );
}
