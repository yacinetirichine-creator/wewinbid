'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import SearchBar from '@/components/search/SearchBar';
import FilterPanel, { SearchFilters } from '@/components/search/FilterPanel';
import SearchResults from '@/components/search/SearchResults';
import SavedSearches from '@/components/search/SavedSearches';
import { Search, Save, History, Bookmark } from 'lucide-react';

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

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
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

  // Execute search on mount if URL has params
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery) {
      performSearch(urlQuery, {});
    }
  }, []);

  const performSearch = async (searchQuery: string, searchFilters: SearchFilters, page: number = 1) => {
    setIsLoading(true);
    setQuery(searchQuery);
    setFilters(searchFilters);
    setCurrentPage(page);

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
  };

  const handleSearch = (searchQuery: string) => {
    performSearch(searchQuery, filters, 1);
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    performSearch(query, newFilters, 1);
  };

  const handleExecuteSavedSearch = async (savedSearch: SavedSearch) => {
    // Fetch the saved search to update usage stats
    await fetch(`/api/search/saved/${savedSearch.id}`);
    
    // Execute the search
    performSearch(savedSearch.query_text || '', savedSearch.filters, 1);
    setActiveTab('search');
  };

  const handleSaveSearch = async () => {
    if (!saveName.trim()) {
      alert('Veuillez donner un nom à votre recherche');
      return;
    }

    try {
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
        alert('Recherche sauvegardée avec succès !');
        setActiveTab('saved');
      } else {
        const data = await response.json();
        alert(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving search:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Recherche Avancée"
        subtitle="Trouvez les appels d'offres qui correspondent à vos critères"
        icon={Search}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('search')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'search'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Recherche
              </div>
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'saved'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4" />
                Recherches sauvegardées
              </div>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Historique
              </div>
            </button>
          </nav>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                placeholder="Rechercher par mots-clés, organisation, secteur..."
              />

              {/* Results */}
              <SearchResults
                results={results}
                isLoading={isLoading}
                query={query}
                totalResults={totalResults}
                onSaveSearch={() => setShowSaveModal(true)}
              />
            </div>
          </div>
        )}

        {/* Saved Searches Tab */}
        {activeTab === 'saved' && (
          <div className="max-w-4xl mx-auto">
            <SavedSearches onExecuteSearch={handleExecuteSavedSearch} />
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto bg-white rounded-lg border border-gray-200 p-8 text-center">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Historique de recherche
            </h3>
            <p className="text-gray-600">
              Cette fonctionnalité sera bientôt disponible
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
                Sauvegarder la recherche
              </h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la recherche *
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Ex: Projets IT en France"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnelle)
                </label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Ajoutez une description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Requête :</span>{' '}
                  {query || <span className="italic">Aucune</span>}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Filtres :</span>{' '}
                  {Object.keys(filters).length > 0
                    ? `${Object.keys(filters).length} actifs`
                    : 'Aucun'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveSearch}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
