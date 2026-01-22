'use client';

import React from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Card } from '@/components/ui/Card';

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

interface ThemeOption {
  value: 'light' | 'dark' | 'system';
  label: string;
  description: string;
  icon: React.ReactNode;
}

const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    label: 'Mode clair',
    description: 'Interface claire pour une utilisation en journée',
    icon: <SunIcon className="h-6 w-6" />,
  },
  {
    value: 'dark',
    label: 'Mode sombre',
    description: 'Interface sombre pour réduire la fatigue oculaire',
    icon: <MoonIcon className="h-6 w-6" />,
  },
  {
    value: 'system',
    label: 'Automatique',
    description: 'Suit les préférences de votre système',
    icon: <MonitorIcon className="h-6 w-6" />,
  },
];

export function ThemeSettings() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
        Apparence
      </h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
        Personnalisez l&apos;apparence de l&apos;interface selon vos préférences
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themeOptions.map((option) => {
          const isSelected = theme === option.value;
          const isActive = option.value === 'system' 
            ? theme === 'system'
            : theme === option.value || (theme === 'system' && resolvedTheme === option.value);

          return (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`
                relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200
                ${isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                }
                ${isSelected ? 'ring-2 ring-primary-500/20' : ''}
              `}
            >
              {/* Theme Preview */}
              <div
                className={`
                  w-full h-20 rounded-lg mb-3 overflow-hidden border
                  ${option.value === 'dark' || (option.value === 'system' && resolvedTheme === 'dark')
                    ? 'bg-surface-800 border-surface-700'
                    : 'bg-white border-surface-200'
                  }
                `}
              >
                <div
                  className={`
                    h-3 flex items-center px-2 gap-1
                    ${option.value === 'dark' || (option.value === 'system' && resolvedTheme === 'dark')
                      ? 'bg-surface-900'
                      : 'bg-surface-100'
                    }
                  `}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                </div>
                <div className="p-2 flex gap-2">
                  <div
                    className={`
                      w-8 h-full rounded
                      ${option.value === 'dark' || (option.value === 'system' && resolvedTheme === 'dark')
                        ? 'bg-surface-700'
                        : 'bg-surface-100'
                      }
                    `}
                  />
                  <div className="flex-1 space-y-1.5">
                    <div
                      className={`
                        h-2 rounded w-3/4
                        ${option.value === 'dark' || (option.value === 'system' && resolvedTheme === 'dark')
                          ? 'bg-surface-600'
                          : 'bg-surface-200'
                        }
                      `}
                    />
                    <div
                      className={`
                        h-2 rounded w-1/2
                        ${option.value === 'dark' || (option.value === 'system' && resolvedTheme === 'dark')
                          ? 'bg-surface-600'
                          : 'bg-surface-200'
                        }
                      `}
                    />
                  </div>
                </div>
              </div>

              {/* Icon */}
              <div
                className={`
                  p-2 rounded-full mb-2
                  ${isSelected
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-surface-400 dark:text-surface-500'
                  }
                `}
              >
                {option.icon}
              </div>

              {/* Label */}
              <span
                className={`
                  font-medium text-sm
                  ${isSelected
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-surface-700 dark:text-surface-300'
                  }
                `}
              >
                {option.label}
              </span>

              {/* Description */}
              <span className="text-xs text-surface-500 dark:text-surface-400 text-center mt-1">
                {option.description}
              </span>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Current theme info */}
      <div className="mt-6 p-4 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-surface-200 dark:bg-surface-700">
            {resolvedTheme === 'dark' ? (
              <MoonIcon className="h-5 w-5 text-primary-500" />
            ) : (
              <SunIcon className="h-5 w-5 text-amber-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
              Thème actif : {resolvedTheme === 'dark' ? 'Mode sombre' : 'Mode clair'}
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {theme === 'system' 
                ? 'Basé sur les préférences de votre système'
                : `Défini manuellement sur ${theme === 'dark' ? 'sombre' : 'clair'}`
              }
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
