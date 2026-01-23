'use client';

import { useState, useEffect } from 'react';
import { Star, Trash2, Play, Bell, BellOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';
import { trackEvent } from '@/lib/analytics';

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
  const { locale } = useLocale();
  const entries = {
    'search.saved.empty.title': 'Aucune recherche sauvegardée',
    'search.saved.empty.hint': 'Utilisez le bouton "Sauvegarder" après une recherche',
    'search.saved.meta.filters': '{count} filtres',
    'search.saved.meta.uses': '{count} utilisations',
    'search.saved.meta.used': 'Utilisé {relative}',
    'search.saved.actions.run': 'Exécuter la recherche',
    'search.saved.actions.addFavorite': 'Ajouter aux favoris',
    'search.saved.actions.removeFavorite': 'Retirer des favoris',
    'search.saved.actions.enableNotifications': 'Activer les notifications',
    'search.saved.actions.disableNotifications': 'Désactiver les notifications',
    'search.saved.actions.delete': 'Supprimer',
    'search.saved.confirmDelete': 'Supprimer cette recherche sauvegardée ?'
  } as const;
  const { t } = useUiTranslations(locale, entries);

  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [pendingFavoriteId, setPendingFavoriteId] = useState<string | null>(null);
  const [pendingNotifyId, setPendingNotifyId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const formatTemplate = (template: string, values: Record<string, string | number>) => {
    return Object.entries(values).reduce((acc, [key, value]) => {
      return acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }, template);
  };

  const dateLocale = locale === 'en' ? enUS : fr;

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
      setPendingFavoriteId(id);
      trackEvent('search_saved_favorite_toggled', { to: !currentValue });
      await fetch(`/api/search/saved/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: !currentValue })
      });
      fetchSavedSearches();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setPendingFavoriteId(null);
    }
  };

  const toggleNotifications = async (id: string, currentValue: boolean) => {
    try {
      setPendingNotifyId(id);
      trackEvent('search_saved_notifications_toggled', { to: !currentValue });
      await fetch(`/api/search/saved/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notify_new_results: !currentValue })
      });
      fetchSavedSearches();
    } catch (error) {
      console.error('Error toggling notifications:', error);
    } finally {
      setPendingNotifyId(null);
    }
  };

  const deleteSearch = async (id: string) => {
    if (!confirm(t('search.saved.confirmDelete'))) return;

    try {
      setPendingDeleteId(id);
      trackEvent('search_saved_deleted');
      await fetch(`/api/search/saved/${id}`, {
        method: 'DELETE'
      });
      fetchSavedSearches();
    } catch (error) {
      console.error('Error deleting search:', error);
    } finally {
      setPendingDeleteId(null);
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
        <p className="text-gray-500">{t('search.saved.empty.title')}</p>
        <p className="text-sm text-gray-400 mt-1">
          {t('search.saved.empty.hint')}
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
                  <span>
                    {formatTemplate(t('search.saved.meta.filters'), {
                      count: Object.keys(search.filters).length,
                    })}
                  </span>
                )}
                <span>
                  {formatTemplate(t('search.saved.meta.uses'), { count: search.use_count })}
                </span>
                {search.last_used_at && (
                  <span>
                    {formatTemplate(t('search.saved.meta.used'), {
                      relative: formatDistanceToNow(new Date(search.last_used_at), {
                        addSuffix: true,
                        locale: dateLocale,
                      }),
                    })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={async () => {
                  if (executingId) return;
                  setExecutingId(search.id);
                  try {
                    trackEvent('search_saved_executed', { has_query: Boolean(search.query_text) });
                    onExecuteSearch(search);
                  } finally {
                    setExecutingId(null);
                  }
                }}
                disabled={Boolean(executingId) || pendingDeleteId === search.id}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('search.saved.actions.run')}
              >
                {executingId === search.id ? (
                  <span className="block w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={() => toggleFavorite(search.id, search.is_favorite)}
                type="button"
                disabled={pendingFavoriteId === search.id || pendingDeleteId === search.id}
                className={`p-2 rounded-lg transition-colors ${
                  search.is_favorite
                    ? 'text-amber-500 hover:bg-amber-50'
                    : 'text-gray-400 hover:bg-gray-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={search.is_favorite ? t('search.saved.actions.removeFavorite') : t('search.saved.actions.addFavorite')}
              >
                {pendingFavoriteId === search.id ? (
                  <span className="block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                  <Star className={`w-4 h-4 ${search.is_favorite ? 'fill-amber-500' : ''}`} />
                )}
              </button>

              <button
                onClick={() => toggleNotifications(search.id, search.notify_new_results)}
                type="button"
                disabled={pendingNotifyId === search.id || pendingDeleteId === search.id}
                className={`p-2 rounded-lg transition-colors ${
                  search.notify_new_results
                    ? 'text-green-600 hover:bg-green-50'
                    : 'text-gray-400 hover:bg-gray-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={
                  search.notify_new_results
                    ? t('search.saved.actions.disableNotifications')
                    : t('search.saved.actions.enableNotifications')
                }
              >
                {pendingNotifyId === search.id ? (
                  <span className="block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : search.notify_new_results ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <BellOff className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={() => deleteSearch(search.id)}
                type="button"
                disabled={pendingDeleteId === search.id}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('search.saved.actions.delete')}
              >
                {pendingDeleteId === search.id ? (
                  <span className="block w-4 h-4 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
