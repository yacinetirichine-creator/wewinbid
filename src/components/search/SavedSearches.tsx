'use client';

import { useState, useEffect } from 'react';
import { Star, Trash2, Play, Bell, BellOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SavedSearch {
  id: string;
  name: string;
  description: string | null;
  query_text: string | null;
  filters: Record<string, any>;
  is_favorite: boolean;
  notify_new_results: boolean;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
}

interface SavedSearchesProps {
  onExecuteSearch: (search: SavedSearch) => void;
}

export default function SavedSearches({ onExecuteSearch }: SavedSearchesProps) {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSavedSearches();
  }, []);

  const fetchSavedSearches = async () => {
    try {
      const response = await fetch('/api/search/saved');
      const data = await response.json();
      setSearches(data.searches || []);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (id: string, currentValue: boolean) => {
    try {
      await fetch(`/api/search/saved/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: !currentValue })
      });
      fetchSavedSearches();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const toggleNotifications = async (id: string, currentValue: boolean) => {
    try {
      await fetch(`/api/search/saved/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notify_new_results: !currentValue })
      });
      fetchSavedSearches();
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  const deleteSearch = async (id: string) => {
    if (!confirm('Supprimer cette recherche sauvegardée ?')) return;

    try {
      await fetch(`/api/search/saved/${id}`, {
        method: 'DELETE'
      });
      fetchSavedSearches();
    } catch (error) {
      console.error('Error deleting search:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (searches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucune recherche sauvegardée</p>
        <p className="text-sm text-gray-400 mt-1">
          Utilisez le bouton "Sauvegarder" après une recherche
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {searches.map((search) => (
        <div
          key={search.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">{search.name}</h3>
                {search.is_favorite && (
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                )}
              </div>

              {search.description && (
                <p className="text-sm text-gray-600 mb-2">{search.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                {search.query_text && (
                  <span className="truncate">"{search.query_text}"</span>
                )}
                {Object.keys(search.filters).length > 0 && (
                  <span>{Object.keys(search.filters).length} filtres</span>
                )}
                <span>{search.use_count} utilisations</span>
                {search.last_used_at && (
                  <span>
                    Utilisé {formatDistanceToNow(new Date(search.last_used_at), { addSuffix: true, locale: fr })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onExecuteSearch(search)}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Exécuter la recherche"
              >
                <Play className="w-4 h-4" />
              </button>

              <button
                onClick={() => toggleFavorite(search.id, search.is_favorite)}
                className={`p-2 rounded-lg transition-colors ${
                  search.is_favorite
                    ? 'text-amber-500 hover:bg-amber-50'
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
                title={search.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Star className={`w-4 h-4 ${search.is_favorite ? 'fill-amber-500' : ''}`} />
              </button>

              <button
                onClick={() => toggleNotifications(search.id, search.notify_new_results)}
                className={`p-2 rounded-lg transition-colors ${
                  search.notify_new_results
                    ? 'text-green-600 hover:bg-green-50'
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
                title={search.notify_new_results ? 'Désactiver les notifications' : 'Activer les notifications'}
              >
                {search.notify_new_results ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <BellOff className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={() => deleteSearch(search.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
