'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Card, 
  CardContent,
  Button, 
  Input, 
  Badge 
} from '@/components/ui';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Search,
  Filter,
  Star,
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  Heart,
  Bell,
  Save,
  Sparkles,
  Grid,
  List,
  X,
  Plus,
  TrendingUp,
  Target,
  Briefcase,
  Clock,
} from 'lucide-react';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types
interface Tender {
  id: string;
  title: string;
  description: string;
  sector: string;
  country: string;
  estimated_value: number;
  currency: string;
  deadline: string;
  type: string;
  buyer_name: string;
  status: string;
  created_at: string;
  company_id: string;
}

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  filters: SearchFilters;
  notification_enabled: boolean;
  results_count: number;
  last_run_at?: string;
}

interface SearchFilters {
  query?: string;
  sectors?: string[];
  countries?: string[];
  min_value?: number;
  max_value?: number;
  deadline_from?: string;
  deadline_to?: string;
  tender_type?: string;
  status?: string[];
}

interface Recommendation {
  tender_id: string;
  title: string;
  match_score: number;
  reasons: string[];
  explanation: string;
}

// Constants
const SECTORS = [
  'IT', 'Construction', 'Services', 'Manufacturing', 'Healthcare',
  'Education', 'Transportation', 'Energy', 'Telecommunications',
];

const COUNTRIES = [
  'FR', 'BE', 'DE', 'ES', 'IT', 'PT', 'NL', 'CH', 'LU',
];

const TENDER_TYPES = ['PUBLIC', 'PRIVATE', 'EUROPEAN'];

// Main component
export default function EnhancedMarketplacePage() {
  const supabase = createClientComponentClient();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filters state
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    sectors: [],
    countries: [],
    min_value: undefined,
    max_value: undefined,
    deadline_from: undefined,
    deadline_to: undefined,
    tender_type: undefined,
    status: [],
  });

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [selectedSavedSearch, setSelectedSavedSearch] = useState<string | null>(null);

  // Fetch tenders with filters
  const fetchTenders = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Apply filters
      if (filters.query) {
        query = query.or(
          `title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`
        );
      }
      if (filters.sectors && filters.sectors.length > 0) {
        query = query.in('sector', filters.sectors);
      }
      if (filters.countries && filters.countries.length > 0) {
        query = query.in('country', filters.countries);
      }
      if (filters.min_value) {
        query = query.gte('estimated_value', filters.min_value);
      }
      if (filters.max_value) {
        query = query.lte('estimated_value', filters.max_value);
      }
      if (filters.deadline_from) {
        query = query.gte('deadline', filters.deadline_from);
      }
      if (filters.deadline_to) {
        query = query.lte('deadline', filters.deadline_to);
      }
      if (filters.tender_type) {
        query = query.eq('type', filters.tender_type);
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTenders(data || []);
    } catch (error) {
      console.error('Error fetching tenders:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, supabase]);

  // Fetch saved searches
  const fetchSavedSearches = useCallback(async () => {
    try {
      const { data, error } = await fetch('/api/saved-searches').then((r) =>
        r.json()
      );
      if (!error) setSavedSearches(data.searches || []);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    }
  }, []);

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    try {
      const { data, error } = await fetch('/api/favorites').then((r) =>
        r.json()
      );
      if (!error) {
        const favSet = new Set<string>(data.favorites?.map((f: any) => f.tender_id as string) || []);
        setFavorites(favSet);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  }, []);

  // Fetch AI recommendations
  const fetchRecommendations = useCallback(async () => {
    try {
      const { data, error } = await fetch('/api/recommendations?limit=5').then(
        (r) => r.json()
      );
      if (!error) setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchTenders();
    fetchSavedSearches();
    fetchFavorites();
    fetchRecommendations();
  }, [fetchTenders, fetchSavedSearches, fetchFavorites, fetchRecommendations]);

  // Generate new AI recommendations
  const generateRecommendations = async () => {
    try {
      const { data, error } = await fetch('/api/recommendations', {
        method: 'POST',
      }).then((r) => r.json());
      if (!error) {
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (tenderId: string) => {
    const isFavorited = favorites.has(tenderId);

    if (isFavorited) {
      // Remove
      await fetch(`/api/favorites?tender_id=${tenderId}`, {
        method: 'DELETE',
      });
      setFavorites((prev) => {
        const newSet = new Set(prev);
        newSet.delete(tenderId);
        return newSet;
      });
    } else {
      // Add
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tender_id: tenderId }),
      });
      setFavorites((prev) => new Set(prev).add(tenderId));
    }
  };

  // Save current search
  const saveCurrentSearch = async (name: string, description?: string) => {
    try {
      await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          filters,
          notification_enabled: false,
        }),
      });
      fetchSavedSearches();
      setShowSaveSearch(false);
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  // Load saved search
  const loadSavedSearch = (search: SavedSearch) => {
    setFilters(search.filters);
    setSelectedSavedSearch(search.id);
  };

  // Create alert from current filters
  const createAlert = async (name: string, frequency: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          criteria: filters,
          frequency,
          notification_channels: { email: true, in_app: true },
        }),
      });
      setShowCreateAlert(false);
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      query: '',
      sectors: [],
      countries: [],
      min_value: undefined,
      max_value: undefined,
      deadline_from: undefined,
      deadline_to: undefined,
      tender_type: undefined,
      status: [],
    });
    setSelectedSavedSearch(null);
  };

  // Apply filters
  useEffect(() => {
    fetchTenders();
  }, [filters, fetchTenders]);

  // Count active filters
  const activeFilterCount = [
    filters.query,
    filters.sectors?.length,
    filters.countries?.length,
    filters.min_value,
    filters.max_value,
    filters.deadline_from,
    filters.deadline_to,
    filters.tender_type,
    filters.status?.length,
  ].filter(Boolean).length;

  return (
    <AppLayout>
      <PageHeader
        title="Marketplace"
        description="Recherchez et trouvez les meilleurs appels d'offres"
        actions={
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4 mr-2" />
              Filtres {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
            <Button variant="outline" onClick={generateRecommendations}>
              <Sparkles className="w-4 h-4 mr-2" />
              Recommandations AI
            </Button>
          </div>
        }
      />

      <div className="px-4 sm:px-6 pb-6">
        {/* AI Recommendations Section */}
        {recommendations.length > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Recommandations AI</h3>
                    <p className="text-sm text-gray-600">
                      {recommendations.length} appels d'offres sélectionnés pour vous
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={generateRecommendations}>
                  Actualiser
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {recommendations.map((rec) => (
                  <div
                    key={rec.tender_id}
                    className="bg-white rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{rec.title}</h4>
                        <Badge variant="success" className="text-xs">
                          {rec.match_score}% match
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.explanation}</p>
                      <div className="flex flex-wrap gap-2">
                        {rec.reasons.map((reason) => (
                          <span
                            key={reason}
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded"
                          >
                            {reason.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleFavorite(rec.tender_id)}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            favorites.has(rec.tender_id) ? 'fill-red-500 text-red-500' : ''
                          }`}
                        />
                      </Button>
                      <Button variant="primary" size="sm">
                        Voir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Search input */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Rechercher par titre, description, secteur..."
                    className="pl-10"
                    value={filters.query || ''}
                    onChange={(e) =>
                      setFilters({ ...filters, query: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Saved searches dropdown */}
              {savedSearches.length > 0 && (
                <select
                  className="px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500"
                  value={selectedSavedSearch || ''}
                  onChange={(e) => {
                    const search = savedSearches.find((s) => s.id === e.target.value);
                    if (search) loadSavedSearch(search);
                  }}
                >
                  <option value="">Recherches sauvegardées</option>
                  {savedSearches.map((search) => (
                    <option key={search.id} value={search.id}>
                      {search.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Actions */}
              <Button
                variant="outline"
                onClick={() => setShowSaveSearch(true)}
                title="Sauvegarder cette recherche"
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateAlert(true)}
                title="Créer une alerte"
              >
                <Bell className="w-4 h-4" />
              </Button>

              {/* View mode toggle */}
              <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 ${
                    viewMode === 'grid'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 ${
                    viewMode === 'list'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Advanced filters panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Sectors */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secteurs
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {SECTORS.map((sector) => (
                        <label key={sector} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={filters.sectors?.includes(sector)}
                            onChange={(e) => {
                              const newSectors = e.target.checked
                                ? [...(filters.sectors || []), sector]
                                : (filters.sectors || []).filter((s) => s !== sector);
                              setFilters({ ...filters, sectors: newSectors });
                            }}
                            className="rounded border-gray-300 text-primary-600"
                          />
                          <span className="text-sm text-gray-700">{sector}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Countries */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pays
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {COUNTRIES.map((country) => (
                        <label key={country} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={filters.countries?.includes(country)}
                            onChange={(e) => {
                              const newCountries = e.target.checked
                                ? [...(filters.countries || []), country]
                                : (filters.countries || []).filter((c) => c !== country);
                              setFilters({ ...filters, countries: newCountries });
                            }}
                            className="rounded border-gray-300 text-primary-600"
                          />
                          <span className="text-sm text-gray-700">{country}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Budget range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget
                    </label>
                    <div className="space-y-2">
                      <Input
                        type="number"
                        placeholder="Minimum"
                        value={filters.min_value || ''}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            min_value: e.target.value ? parseInt(e.target.value) : undefined,
                          })
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Maximum"
                        value={filters.max_value || ''}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            max_value: e.target.value ? parseInt(e.target.value) : undefined,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Deadline range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Échéance
                    </label>
                    <div className="space-y-2">
                      <Input
                        type="date"
                        value={filters.deadline_from || ''}
                        onChange={(e) =>
                          setFilters({ ...filters, deadline_from: e.target.value })
                        }
                      />
                      <Input
                        type="date"
                        value={filters.deadline_to || ''}
                        onChange={(e) =>
                          setFilters({ ...filters, deadline_to: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Clear filters */}
                {activeFilterCount > 0 && (
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" onClick={clearFilters}>
                      <X className="w-4 h-4 mr-2" />
                      Effacer les filtres
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Active filter chips */}
            {activeFilterCount > 0 && !showFilters && (
              <div className="mt-4 flex flex-wrap gap-2">
                {filters.query && (
                  <Badge variant="default">Recherche: {filters.query}</Badge>
                )}
                {filters.sectors?.map((s) => (
                  <Badge key={s} variant="default">
                    {s}
                  </Badge>
                ))}
                {filters.countries?.map((c) => (
                  <Badge key={c} variant="default">
                    {c}
                  </Badge>
                ))}
                {filters.min_value && (
                  <Badge variant="default">Min: {filters.min_value}€</Badge>
                )}
                {filters.max_value && (
                  <Badge variant="default">Max: {filters.max_value}€</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Chargement...</p>
          </div>
        ) : tenders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun appel d'offres trouvé
              </h3>
              <p className="text-gray-500 mb-4">
                Essayez de modifier vos critères de recherche
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Réinitialiser les filtres
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {tenders.length} résultat{tenders.length > 1 ? 's' : ''}
            </div>
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {tenders.map((tender) => (
                <TenderCard
                  key={tender.id}
                  tender={tender}
                  isFavorite={favorites.has(tender.id)}
                  onToggleFavorite={() => toggleFavorite(tender.id)}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Save Search Modal */}
      {showSaveSearch && (
        <SaveSearchModal
          onSave={saveCurrentSearch}
          onClose={() => setShowSaveSearch(false)}
        />
      )}

      {/* Create Alert Modal */}
      {showCreateAlert && (
        <CreateAlertModal
          onSave={createAlert}
          onClose={() => setShowCreateAlert(false)}
        />
      )}
    </AppLayout>
  );
}

// Tender card component
function TenderCard({
  tender,
  isFavorite,
  onToggleFavorite,
  viewMode,
}: {
  tender: Tender;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  viewMode: 'grid' | 'list';
}) {
  const daysUntilDeadline = Math.floor(
    (new Date(tender.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-gray-900">{tender.title}</h3>
                <Badge variant={tender.status === 'OPEN' ? 'success' : 'default'}>
                  {tender.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                {tender.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {tender.buyer_name}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {tender.country}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {tender.estimated_value?.toLocaleString()} {tender.currency}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {daysUntilDeadline} jours restants
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button variant="outline" size="sm" onClick={onToggleFavorite}>
                <Heart
                  className={`w-4 h-4 ${
                    isFavorite ? 'fill-red-500 text-red-500' : ''
                  }`}
                />
              </Button>
              <Button variant="primary" size="sm">
                Voir détails
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
              {tender.title}
            </h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
              {tender.description}
            </p>
          </div>
          <button onClick={onToggleFavorite} className="ml-2">
            <Heart
              className={`w-5 h-5 ${
                isFavorite
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-400 hover:text-red-500'
              }`}
            />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="w-4 h-4" />
            {tender.buyer_name}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            {tender.country} - {tender.sector}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="w-4 h-4" />
            {tender.estimated_value?.toLocaleString()} {tender.currency}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{daysUntilDeadline} jours</span>
            <Badge
              variant={daysUntilDeadline < 7 ? 'danger' : 'success'}
              className="text-xs"
            >
              {tender.status}
            </Badge>
          </div>
          <Button variant="primary" size="sm">
            Voir détails
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Save Search Modal
function SaveSearchModal({
  onSave,
  onClose,
}: {
  onSave: (name: string, description?: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            Sauvegarder la recherche
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: AO IT France"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optionnel)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la recherche"
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => onSave(name, description)}
            disabled={!name.trim()}
          >
            Sauvegarder
          </Button>
        </div>
      </div>
    </div>
  );
}

// Create Alert Modal
function CreateAlertModal({
  onSave,
  onClose,
}: {
  onSave: (name: string, frequency: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('daily');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Créer une alerte</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'alerte
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Nouveaux AO IT"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fréquence
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <option value="instant">Instantané</option>
              <option value="daily">Quotidien</option>
              <option value="weekly">Hebdomadaire</option>
            </select>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => onSave(name, frequency)}
            disabled={!name.trim()}
          >
            Créer
          </Button>
        </div>
      </div>
    </div>
  );
}
