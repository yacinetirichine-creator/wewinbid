'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  FileText,
  Star,
  Clock,
  TrendingUp,
  Filter,
  Grid,
  List,
  Edit,
  Trash2,
  Copy,
  Eye,
  Tag,
  Folder,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Template {
  id: string;
  title: string;
  description?: string;
  content: string;
  category?: string;
  tags?: string[];
  sector?: string;
  tender_type?: 'PUBLIC' | 'PRIVATE';
  usage_count: number;
  last_used_at?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  creator: {
    full_name: string;
  };
}

export default function LibraryPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'usage' | 'alphabetical'>('recent');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [searchQuery, filterCategory, filterFavorite, sortBy]);

  const fetchTemplates = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('query', searchQuery);
      if (filterCategory !== 'all') params.set('category', filterCategory);
      if (filterFavorite) params.set('is_favorite', 'true');
      params.set('sort_by', sortBy);

      const response = await fetch(`/api/templates?${params}`);
      if (!response.ok) throw new Error('Erreur fetch');

      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      console.error('Erreur fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (templateId: string, currentState: boolean) => {
    try {
      const response = await fetch(`/api/templates?id=${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: !currentState }),
      });

      if (!response.ok) throw new Error('Erreur mise à jour');

      await fetchTemplates();
    } catch (error) {
      console.error('Erreur toggle favorite:', error);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Supprimer ce template ?')) return;

    try {
      const response = await fetch(`/api/templates?id=${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur suppression');

      await fetchTemplates();
    } catch (error) {
      console.error('Erreur delete template:', error);
    }
  };

  const categories = Array.from(new Set(templates.map((t) => t.category).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bibliothèque de Réponses</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos templates et snippets réutilisables
          </p>
        </div>
        <button
          onClick={() => setShowTemplateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nouveau Template
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
              <p className="text-sm text-gray-600">Templates</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {templates.filter((t) => t.is_favorite).length}
              </p>
              <p className="text-sm text-gray-600">Favoris</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {templates.reduce((sum, t) => sum + t.usage_count, 0)}
              </p>
              <p className="text-sm text-gray-600">Utilisations</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Folder className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              <p className="text-sm text-gray-600">Catégories</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans les templates..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Toutes catégories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">Plus récent</option>
            <option value="usage">Plus utilisé</option>
            <option value="alphabetical">Alphabétique</option>
          </select>

          {/* Favorite filter */}
          <button
            onClick={() => setFilterFavorite(!filterFavorite)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              filterFavorite
                ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Star className={`h-5 w-5 ${filterFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* View mode */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Templates Grid/List */}
      {templates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">Aucun template trouvé</p>
          <p className="text-gray-400 mb-6">Créez votre premier template pour commencer</p>
          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Créer un template
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onToggleFavorite={toggleFavorite}
              onDelete={deleteTemplate}
              onView={(t) => {
                setSelectedTemplate(t);
                setShowTemplateModal(true);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <TemplateListItem
              key={template.id}
              template={template}
              onToggleFavorite={toggleFavorite}
              onDelete={deleteTemplate}
              onView={(t) => {
                setSelectedTemplate(t);
                setShowTemplateModal(true);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Template Card Component
function TemplateCard({
  template,
  onToggleFavorite,
  onDelete,
  onView,
}: {
  template: Template;
  onToggleFavorite: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onView: (template: Template) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{template.title}</h3>
          {template.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
          )}
        </div>
        <button
          onClick={() => onToggleFavorite(template.id, template.is_favorite)}
          className="flex-shrink-0 ml-2"
        >
          <Star
            className={`h-5 w-5 ${
              template.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'
            }`}
          />
        </button>
      </div>

      {template.tags && template.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <TrendingUp className="h-4 w-4" />
          <span>{template.usage_count}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>
            {formatDistanceToNow(new Date(template.updated_at), {
              addSuffix: true,
              locale: fr,
            })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onView(template)}
          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Voir
        </button>
        <button
          onClick={() => onDelete(template.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Template List Item Component
function TemplateListItem({
  template,
  onToggleFavorite,
  onDelete,
  onView,
}: {
  template: Template;
  onToggleFavorite: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onView: (template: Template) => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-gray-900">{template.title}</h3>
            {template.category && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                {template.category}
              </span>
            )}
          </div>
          {template.description && (
            <p className="text-sm text-gray-600 mb-2">{template.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{template.usage_count} utilisations</span>
            <span>•</span>
            <span>
              {formatDistanceToNow(new Date(template.updated_at), {
                addSuffix: true,
                locale: fr,
              })}
            </span>
            <span>•</span>
            <span>Par {template.creator.full_name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFavorite(template.id, template.is_favorite)}
          >
            <Star
              className={`h-5 w-5 ${
                template.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'
              }`}
            />
          </button>
          <button
            onClick={() => onView(template)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Voir
          </button>
          <button
            onClick={() => onDelete(template.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
