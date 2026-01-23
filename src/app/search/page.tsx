'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { AppLayout } from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/layout/Sidebar';
import SearchBar from '@/components/search/SearchBar';
import FilterPanel, { SearchFilters } from '@/components/search/FilterPanel';
import SearchResults from '@/components/search/SearchResults';
import SavedSearches from '@/components/search/SavedSearches';
import { Search, Save, History, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';
import { trackEvent } from '@/lib/analytics';

interface SearchResult {
  tender_id: string;
  title: string;
  organization: string;
  country: string;
  budget: number;
  deadline: string;
  rank?: number;
}

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

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();

  const entries = {
    'search.page.title': 'Recherche Avancée',
    'search.page.description': "Trouvez les appels d'offres qui correspondent à vos critères",
    'search.tabs.search': 'Recherche',
    'search.tabs.saved': 'Recherches sauvegardées',
    'search.tabs.history': 'Historique',
    'search.search.placeholder': 'Rechercher par mots-clés, organisation, secteur...',
    'search.history.title': 'Historique de recherche',
    'search.history.soon': 'Cette fonctionnalité sera bientôt disponible',
    'search.save.modalTitle': 'Sauvegarder la recherche',
    'search.save.nameLabel': 'Nom de la recherche *',
    'search.save.namePlaceholder': 'Ex: Projets IT en France',
    'search.save.descriptionLabel': 'Description (optionnelle)',
    'search.save.descriptionPlaceholder': 'Ajoutez une description...',
    'search.save.summary.query': 'Requête :',
    'search.save.summary.none': 'Aucune',
    'search.save.summary.filters': 'Filtres :',
    'search.save.summary.filtersActive': '{count} actifs',
    'search.save.summary.filtersNone': 'Aucun',
    'search.save.cancel': 'Annuler',
    'search.save.save': 'Sauvegarder',
    'search.save.error.missingName': 'Veuillez donner un nom à votre recherche',
    'search.save.success': 'Recherche sauvegardée avec succès !',
    'search.save.error.generic': 'Erreur lors de la sauvegarde',
  } as const;

  const { t } = useUiTranslations(locale, entries);
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'history'>('search');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [isSavingSearch, setIsSavingSearch] = useState(false);

  const formatTemplate = (template: string, values: Record<string, string | number>) => {
    return Object.entries(values).reduce((acc, [key, value]) => {
      return acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }, template);
  };

  const performSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters, page: number = 1) => {
    setIsLoading(true);
    setQuery(searchQuery);
    setFilters(searchFilters);
    setCurrentPage(page);

    trackEvent('search_performed', {
      page,
      has_query: Boolean(searchQuery),
      query_length: searchQuery?.length || 0,
      filters_count: Object.keys(searchFilters || {}).length,
    });

    try {
      // Build query params
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (searchFilters.country?.length) params.set('country', searchFilters.country.join(','));
      if (searchFilters.sector?.length) params.set('sector', searchFilters.sector.join(','));
      if (searchFilters.min_budget) params.set('min_budget', searchFilters.min_budget.toString());
      if (searchFilters.max_budget) params.set('max_budget', searchFilters.max_budget.toString());
      if (searchFilters.deadline_from) params.set('deadline_from', searchFilters.deadline_from);
      if (searchFilters.deadline_to) params.set('deadline_to', searchFilters.deadline_to);
      if (searchFilters.status?.length) params.set('status', searchFilters.status.join(','));
      params.set('page', page.toString());

      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();

      if (data.error) {
        console.error('Search error:', data.error);
        return;
      }

      setResults(data.results || []);
      setTotalResults(data.pagination?.total || 0);

      // Update URL
      const newParams = new URLSearchParams();
      if (searchQuery) newParams.set('q', searchQuery);
      router.push(`/search?${newParams.toString()}`, { scroll: false });

    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Execute search on mount if URL has params
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery) {
      performSearch(urlQuery, {});
    }
  }, [performSearch, searchParams]);

  const handleSearch = (searchQuery: string) => {
    performSearch(searchQuery, filters, 1);
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    performSearch(query, newFilters, 1);
  };

  const handleExecuteSavedSearch = async (savedSearch: SavedSearch) => {
    trackEvent('search_saved_executed', { has_query: Boolean(savedSearch.query_text) });
    // Fetch the saved search to update usage stats
    await fetch(`/api/search/saved/${savedSearch.id}`);
    
    // Execute the search
    performSearch(savedSearch.query_text || '', savedSearch.filters, 1);
    setActiveTab('search');
  };

  const handleSaveSearch = async () => {
    if (!saveName.trim()) return toast.error(t('search.save.error.missingName'));

    try {
      setIsSavingSearch(true);
      const response = await fetch('/api/search/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName.trim(),
          description: saveDescription.trim() || null,
          query_text: query || null,
          filters: filters,
          notify_new_results: false
        })
      });

      if (response.ok) {
        setShowSaveModal(false);
        setSaveName('');
        setSaveDescription('');
        toast.success(t('search.save.success'));
        trackEvent('search_saved_created', {
          has_query: Boolean(query),
          query_length: query?.length || 0,
          filters_count: Object.keys(filters || {}).length,
        });
        setActiveTab('saved');
      } else {
        const data = await response.json();
        toast.error(data.error || t('search.save.error.generic'));
      }
    } catch (error) {
      console.error('Error saving search:', error);
      toast.error(t('search.save.error.generic'));
    } finally {
      setIsSavingSearch(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title={t('search.page.title')}
        description={t('search.page.description')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" role="tablist" aria-label={t('search.page.title')}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'search'}
              aria-controls="search-tab-panel"
              onClick={() => {
                setActiveTab('search');
                trackEvent('search_tab_clicked', { tab: 'search' });
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'search'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                {t('search.tabs.search')}
              </div>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'saved'}
              aria-controls="saved-tab-panel"
              onClick={() => {
                setActiveTab('saved');
                trackEvent('search_tab_clicked', { tab: 'saved' });
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'saved'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4" />
                {t('search.tabs.saved')}
              </div>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'history'}
              aria-controls="history-tab-panel"
              onClick={() => {
                setActiveTab('history');
                trackEvent('search_tab_clicked', { tab: 'history' });
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" />
                {t('search.tabs.history')}
              </div>
            </button>
          </nav>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div id="search-tab-panel" role="tabpanel" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <FilterPanel
                onFilterChange={handleFilterChange}
                initialFilters={filters}
              />
            </div>

            {/* Results */}
            <div className="lg:col-span-3 space-y-6">
              {/* Search Bar */}
              <SearchBar
                onSearch={handleSearch}
                initialValue={query}
                placeholder={t('search.search.placeholder')}
              />

              {/* Results */}
              <SearchResults
                results={results}
                isLoading={isLoading}
                query={query}
                totalResults={totalResults}
                onSaveSearch={() => {
                  setShowSaveModal(true);
                  trackEvent('search_save_modal_opened', { has_query: Boolean(query) });
                }}
              />
            </div>
          </div>
        )}

        {/* Saved Searches Tab */}
        {activeTab === 'saved' && (
          <div id="saved-tab-panel" role="tabpanel" className="max-w-4xl mx-auto">
            <SavedSearches onExecuteSearch={handleExecuteSavedSearch} />
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div id="history-tab-panel" role="tabpanel" className="max-w-4xl mx-auto bg-white rounded-lg border border-gray-200 p-8 text-center">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('search.history.title')}
            </h3>
            <p className="text-gray-600">
              {t('search.history.soon')}
            </p>
          </div>
        )}
      </div>

      {/* Save Search Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('search.save.modalTitle')}
              </h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('search.save.nameLabel')}
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder={t('search.save.namePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('search.save.descriptionLabel')}
                </label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder={t('search.save.descriptionPlaceholder')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{t('search.save.summary.query')}</span>{' '}
                  {query || <span className="italic">{t('search.save.summary.none')}</span>}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">{t('search.save.summary.filters')}</span>{' '}
                  {Object.keys(filters).length > 0
                    ? formatTemplate(t('search.save.summary.filtersActive'), {
                        count: Object.keys(filters).length,
                      })
                    : t('search.save.summary.filtersNone')}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => setShowSaveModal(false)}
              >
                {t('search.save.cancel')}
              </Button>
              <Button
                type="button"
                fullWidth
                isLoading={isSavingSearch}
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleSaveSearch}
              >
                {t('search.save.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Search className="h-8 w-8 animate-pulse text-gray-400" />
        </div>
      </AppLayout>
    }>
      <SearchContent />
    </Suspense>
  );
}
