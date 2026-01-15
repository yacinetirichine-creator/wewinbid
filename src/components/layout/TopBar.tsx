'use client';

import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Search, Settings } from 'lucide-react';

interface TopBarProps {
  showSearch?: boolean;
}

export function TopBar({ showSearch = true }: TopBarProps) {
  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Barre de recherche */}
        {showSearch && (
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un appel d'offres, client..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Actions du header */}
        <div className="flex items-center gap-3">
          {/* Centre de notifications */}
          <NotificationCenter />

          {/* Bouton paramètres */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Paramètres"
          >
            <Settings className="h-6 w-6 text-gray-700" />
          </button>
        </div>
      </div>
    </div>
  );
}
