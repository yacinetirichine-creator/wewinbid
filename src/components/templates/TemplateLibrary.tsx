'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useDebounce } from '@/hooks';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';
import {
  FileText,
  Plus,
  Search,
  Star,
  StarOff,
  Copy,
  Edit,
  Trash2,
  Tag,
  FolderOpen,
  Clock,
  TrendingUp,
  ChevronRight,
  Variable,
  Eye,
  Download,
} from 'lucide-react';

interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select';
  default?: string;
  options?: string[];
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  content: string;
  variables: TemplateVariable[];
  tags: string[];
  is_public: boolean;
  is_favorite?: boolean;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
}

interface TemplateCategory {
  id: string;
  nameKey: string;
  color: string;
  icon: string;
  count?: number;
}

const defaultCategories: TemplateCategory[] = [
  { id: 'all', nameKey: 'templates.library.categories.all', color: '#64748b', icon: 'folder' },
  { id: 'technique', nameKey: 'templates.library.categories.technique', color: '#3b82f6', icon: 'cog' },
  { id: 'financier', nameKey: 'templates.library.categories.financier', color: '#10b981', icon: 'currency' },
  {
    id: 'administratif',
    nameKey: 'templates.library.categories.administratif',
    color: '#8b5cf6',
    icon: 'document',
  },
  { id: 'commercial', nameKey: 'templates.library.categories.commercial', color: '#f59e0b', icon: 'shopping' },
  { id: 'références', nameKey: 'templates.library.categories.references', color: '#ec4899', icon: 'star' },
];

interface TemplateLibraryProps {
  onSelectTemplate?: (template: Template, variables: Record<string, string>) => void;
  onInsertTemplate?: (content: string) => void;
  selectionMode?: boolean;
}

export function TemplateLibrary({
  onSelectTemplate,
  onInsertTemplate,
  selectionMode = false,
}: TemplateLibraryProps) {
  const { locale } = useLocale();

  const entries = useMemo(
    () => ({
      'templates.library.title': 'Template library',
      'templates.library.new': 'New',
      'templates.library.search.placeholder': 'Search for a template…',
      'templates.library.favorites': 'Favorites',

      'templates.library.categories.all': 'All',
      'templates.library.categories.technique': 'Technical',
      'templates.library.categories.financier': 'Financial',
      'templates.library.categories.administratif': 'Administrative',
      'templates.library.categories.commercial': 'Commercial',
      'templates.library.categories.references': 'References',

      'templates.library.empty.search': 'No template found',
      'templates.library.empty.noTemplates': 'No template available',
      'templates.library.empty.createFirst': 'Create your first template',

      'templates.library.preview.fallbackTitle': 'Preview',
      'templates.library.preview.copy': 'Copy',
      'templates.library.preview.use': 'Use this template',
      'templates.library.preview.variablesToFill': '{count, plural, one {# variable to fill} other {# variables to fill}}',

      'templates.library.variables.title': 'Customize template',
      'templates.library.variables.subtitle': 'Fill in the variables to customize your template:',
      'templates.library.variables.selectPlaceholder': 'Select…',
      'templates.library.variables.preview': 'Preview',
      'templates.library.variables.cancel': 'Cancel',
      'templates.library.variables.insert': 'Insert template',

      'templates.library.never': 'Never',
      'templates.library.ellipsis': '…',

      'templates.card.usageCount': '{count, plural, one {# use} other {# uses}}',
      'templates.card.tooltip.removeFavorite': 'Remove from favorites',
      'templates.card.tooltip.addFavorite': 'Add to favorites',
      'templates.card.tooltip.preview': 'Preview',
      'templates.card.tooltip.copy': 'Copy',
      'templates.card.action.select': 'Select',
      'templates.card.action.use': 'Use',

      'templates.create.title': 'Create a template',
      'templates.create.name.label': 'Template name',
      'templates.create.name.placeholder': 'e.g. Company overview',
      'templates.create.category.label': 'Category',
      'templates.create.description.label': 'Description',
      'templates.create.description.placeholder': 'Short template description',
      'templates.create.content.label': 'Content',
      'templates.create.content.help': '(Use {{variable}} for dynamic fields)',
      'templates.create.content.placeholder':
        'Your content here…\n\nExample with a variable:\nOur company {{company_name}} specializes in {{domain}}.',
      'templates.create.variablesDetected': 'Detected variables ({count})',
      'templates.create.variable.labelPlaceholder': 'Label',
      'templates.create.variable.type.text': 'Text',
      'templates.create.variable.type.textarea': 'Text area',
      'templates.create.variable.type.number': 'Number',
      'templates.create.variable.type.date': 'Date',
      'templates.create.tags.label': 'Tags (comma-separated)',
      'templates.create.tags.placeholder': 'overview, company, introduction',
      'templates.create.shareTeam': 'Share with the whole team',
      'templates.create.cancel': 'Cancel',
      'templates.create.submit': 'Create template',
    }),
    []
  );

  const { t } = useUiTranslations(locale, entries);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showVariablesModal, setShowVariablesModal] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (debouncedSearch) params.append('query', debouncedSearch);
      if (showFavoritesOnly) params.append('is_favorite', 'true');

      const response = await fetch(`/api/templates?${params.toString()}`);
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      setTemplates(data.templates || data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, showFavoritesOnly]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const toggleFavorite = async (templateId: string, isFavorite: boolean) => {
    try {
      await fetch(`/api/templates/${templateId}/favorite`, {
        method: isFavorite ? 'DELETE' : 'POST',
      });
      setTemplates(prev =>
        prev.map(t =>
          t.id === templateId ? { ...t, is_favorite: !isFavorite } : t
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleUseTemplate = (template: Template) => {
    if (template.variables && template.variables.length > 0) {
      setSelectedTemplate(template);
      // Initialiser les valeurs avec les défauts
      const defaults: Record<string, string> = {};
      template.variables.forEach(v => {
        defaults[v.name] = v.default || '';
      });
      setVariableValues(defaults);
      setShowVariablesModal(true);
    } else {
      if (onInsertTemplate) {
        onInsertTemplate(template.content);
      }
      if (onSelectTemplate) {
        onSelectTemplate(template, {});
      }
    }
  };

  const applyVariables = (content: string, variables: Record<string, string>): string => {
    let result = content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  };

  const confirmUseTemplate = () => {
    if (!selectedTemplate) return;

    const processedContent = applyVariables(selectedTemplate.content, variableValues);
    
    if (onInsertTemplate) {
      onInsertTemplate(processedContent);
    }
    if (onSelectTemplate) {
      onSelectTemplate(selectedTemplate, variableValues);
    }
    
    setShowVariablesModal(false);
    setSelectedTemplate(null);
    setVariableValues({});
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Toast de succès pourrait être ajouté ici
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('templates.library.never');
    return new Date(dateString).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none p-4 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-500" />
            {t('templates.library.title')}
          </h2>
          {!selectionMode && (
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              {t('templates.library.new')}
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <Input
            placeholder={t('templates.library.search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-none p-4 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {defaultCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                whitespace-nowrap transition-all
                ${selectedCategory === cat.id
                  ? 'text-white shadow-sm'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                }
              `}
              style={selectedCategory === cat.id ? { backgroundColor: cat.color } : undefined}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              {t(cat.nameKey)}
            </button>
          ))}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              whitespace-nowrap transition-all
              ${showFavoritesOnly
                ? 'bg-amber-500 text-white'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
              }
            `}
          >
            <Star className="h-3.5 w-3.5" />
            {t('templates.library.favorites')}
          </button>
        </div>
      </div>

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-surface-200 dark:bg-surface-700 rounded-lg" />
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-surface-300 dark:text-surface-600 mb-4" />
            <p className="text-surface-500 dark:text-surface-400">
              {searchQuery ? t('templates.library.empty.search') : t('templates.library.empty.noTemplates')}
            </p>
            {!selectionMode && !searchQuery && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowCreateModal(true)}
              >
                {t('templates.library.empty.createFirst')}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onPreview={() => {
                  setSelectedTemplate(template);
                  setShowPreviewModal(true);
                }}
                onUse={() => handleUseTemplate(template)}
                onToggleFavorite={() => toggleFavorite(template.id, !!template.is_favorite)}
                onCopy={() => copyToClipboard(template.content)}
                selectionMode={selectionMode}
                t={t}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedTemplate(null);
        }}
        title={selectedTemplate?.name || t('templates.library.preview.fallbackTitle')}
        size="lg"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            {selectedTemplate.description && (
              <p className="text-surface-600 dark:text-surface-400">
                {selectedTemplate.description}
              </p>
            )}
            
            {selectedTemplate.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.tags.map((tag) => (
                  <Badge key={tag} variant="default" size="sm">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <Variable className="h-4 w-4" />
                  {t('templates.library.preview.variablesToFill', { count: selectedTemplate.variables.length })}
                </p>
              </div>
            )}

            <div className="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg max-h-96 overflow-y-auto">
              <pre className="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap font-mono">
                {selectedTemplate.content}
              </pre>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => copyToClipboard(selectedTemplate.content)}
              >
                <Copy className="h-4 w-4 mr-2" />
                {t('templates.library.preview.copy')}
              </Button>
              <Button onClick={() => handleUseTemplate(selectedTemplate)}>
                {t('templates.library.preview.use')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Variables Modal */}
      <Modal
        isOpen={showVariablesModal}
        onClose={() => {
          setShowVariablesModal(false);
          setSelectedTemplate(null);
          setVariableValues({});
        }}
        title={t('templates.library.variables.title')}
        size="lg"
      >
        {selectedTemplate && (
          <div className="space-y-6">
            <p className="text-surface-600 dark:text-surface-400">
              {t('templates.library.variables.subtitle')}
            </p>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {selectedTemplate.variables.map((variable) => (
                <div key={variable.name}>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
                    {variable.label}
                  </label>
                  {variable.type === 'textarea' ? (
                    <textarea
                      value={variableValues[variable.name] || ''}
                      onChange={(e) =>
                        setVariableValues(prev => ({
                          ...prev,
                          [variable.name]: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 resize-none focus:ring-2 focus:ring-primary-500"
                      placeholder={variable.default}
                    />
                  ) : variable.type === 'select' && variable.options ? (
                    <select
                      value={variableValues[variable.name] || ''}
                      onChange={(e) =>
                        setVariableValues(prev => ({
                          ...prev,
                          [variable.name]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100"
                    >
                      <option value="">{t('templates.library.variables.selectPlaceholder')}</option>
                      {variable.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={variable.type === 'number' ? 'number' : variable.type === 'date' ? 'date' : 'text'}
                      value={variableValues[variable.name] || ''}
                      onChange={(e) =>
                        setVariableValues(prev => ({
                          ...prev,
                          [variable.name]: e.target.value,
                        }))
                      }
                      placeholder={variable.default}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Preview du résultat */}
            <div className="border-t border-surface-200 dark:border-surface-700 pt-4">
              <h4 className="text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
                {t('templates.library.variables.preview')}
              </h4>
              <div className="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg max-h-40 overflow-y-auto">
                <pre className="text-xs text-surface-600 dark:text-surface-400 whitespace-pre-wrap">
                  {applyVariables(selectedTemplate.content, variableValues).slice(0, 500)}
                  {applyVariables(selectedTemplate.content, variableValues).length > 500 && t('templates.library.ellipsis')}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowVariablesModal(false);
                  setSelectedTemplate(null);
                  setVariableValues({});
                }}
              >
                {t('templates.library.variables.cancel')}
              </Button>
              <Button onClick={confirmUseTemplate}>
                {t('templates.library.variables.insert')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <TemplateCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setShowCreateModal(false);
          fetchTemplates();
        }}
        t={t}
      />
    </div>
  );
}

// Template Card Component
interface TemplateCardProps {
  template: Template;
  onPreview: () => void;
  onUse: () => void;
  onToggleFavorite: () => void;
  onCopy: () => void;
  selectionMode?: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
}

function TemplateCard({
  template,
  onPreview,
  onUse,
  onToggleFavorite,
  onCopy,
  selectionMode,
  t,
  locale,
}: TemplateCardProps) {
  const categoryColors: Record<string, string> = {
    technique: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    financier: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    administratif: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    commercial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    références: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
  };

  return (
    <div className="group bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg p-4 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-surface-900 dark:text-surface-100 truncate">
              {template.name}
            </h3>
            {template.variables && template.variables.length > 0 && (
              <Badge variant="info" size="sm" className="flex-shrink-0">
                <Variable className="h-3 w-3 mr-1" />
                {template.variables.length}
              </Badge>
            )}
          </div>
          
          {template.description && (
            <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-1 mb-2">
              {template.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-surface-400 dark:text-surface-500">
            {template.category && (
              <span className={`px-2 py-0.5 rounded-full ${categoryColors[template.category.toLowerCase()] || 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300'}`}>
                {template.category}
              </span>
            )}
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {t('templates.card.usageCount', { count: template.usage_count })}
            </span>
            {template.last_used_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(template.last_used_at).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            title={
              template.is_favorite
                ? t('templates.card.tooltip.removeFavorite')
                : t('templates.card.tooltip.addFavorite')
            }
          >
            {template.is_favorite ? (
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            ) : (
              <StarOff className="h-4 w-4 text-surface-400 hover:text-amber-500" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors opacity-0 group-hover:opacity-100"
            title={t('templates.card.tooltip.preview')}
          >
            <Eye className="h-4 w-4 text-surface-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors opacity-0 group-hover:opacity-100"
            title={t('templates.card.tooltip.copy')}
          >
            <Copy className="h-4 w-4 text-surface-400" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
        <Button size="sm" onClick={onUse}>
          {selectionMode ? t('templates.card.action.select') : t('templates.card.action.use')}
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// Create Template Modal
interface TemplateCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function TemplateCreateModal({ isOpen, onClose, onCreated, t }: TemplateCreateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'technique',
    content: '',
    tags: '',
    is_public: false,
  });
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [saving, setSaving] = useState(false);

  const detectVariables = (content: string): string[] => {
    const regex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      matches.add(match[1]);
    }
    return Array.from(matches);
  };

  useEffect(() => {
    const detectedVars = detectVariables(formData.content);
    setVariables(prev => {
      const existingNames = new Set(prev.map(v => v.name));
      const newVars = detectedVars
        .filter(name => !existingNames.has(name))
        .map(name => ({
          name,
          label: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          type: 'text' as const,
          default: '',
        }));
      
      // Garder les variables existantes qui sont encore dans le contenu
      const keptVars = prev.filter(v => detectedVars.includes(v.name));
      return [...keptVars, ...newVars];
    });
  }, [formData.content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.content) return;

    setSaving(true);
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.name,
          description: formData.description,
          category: formData.category,
          content: formData.content,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          variables,
          is_public: formData.is_public,
        }),
      });

      if (!response.ok) throw new Error('Failed to create template');

      onCreated();
      setFormData({
        name: '',
        description: '',
        category: 'technique',
        content: '',
        tags: '',
        is_public: false,
      });
      setVariables([]);
    } catch (error) {
      console.error('Error creating template:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('templates.create.title')} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('templates.create.name.label')}
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={t('templates.create.name.placeholder')}
            required
          />
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
              {t('templates.create.category.label')}
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100"
            >
              <option value="technique">{t('templates.library.categories.technique')}</option>
              <option value="financier">{t('templates.library.categories.financier')}</option>
              <option value="administratif">{t('templates.library.categories.administratif')}</option>
              <option value="commercial">{t('templates.library.categories.commercial')}</option>
              <option value="références">{t('templates.library.categories.references')}</option>
            </select>
          </div>
        </div>

        <Input
          label={t('templates.create.description.label')}
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder={t('templates.create.description.placeholder')}
        />

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
            {t('templates.create.content.label')}
            <span className="text-surface-400 dark:text-surface-500 font-normal ml-2">
              {t('templates.create.content.help')}
            </span>
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={10}
            className="w-full px-3 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 font-mono text-sm"
            placeholder={t('templates.create.content.placeholder')}
            required
          />
        </div>

        {/* Variables détectées */}
        {variables.length > 0 && (
          <div className="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
            <h4 className="text-sm font-medium text-surface-700 dark:text-surface-200 mb-3 flex items-center gap-2">
              <Variable className="h-4 w-4" />
              {t('templates.create.variablesDetected', { count: variables.length })}
            </h4>
            <div className="space-y-3">
              {variables.map((variable, index) => (
                <div key={variable.name} className="flex items-center gap-3">
                  <code className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded">
                    {`{{${variable.name}}}`}
                  </code>
                  <Input
                    value={variable.label}
                    onChange={(e) => {
                      const newVars = [...variables];
                      newVars[index].label = e.target.value;
                      setVariables(newVars);
                    }}
                    placeholder={t('templates.create.variable.labelPlaceholder')}
                    className="flex-1"
                  />
                  <select
                    value={variable.type}
                    onChange={(e) => {
                      const newVars = [...variables];
                      newVars[index].type = e.target.value as TemplateVariable['type'];
                      setVariables(newVars);
                    }}
                    className="px-2 py-1.5 rounded border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm"
                  >
                    <option value="text">{t('templates.create.variable.type.text')}</option>
                    <option value="textarea">{t('templates.create.variable.type.textarea')}</option>
                    <option value="number">{t('templates.create.variable.type.number')}</option>
                    <option value="date">{t('templates.create.variable.type.date')}</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <Input
          label={t('templates.create.tags.label')}
          value={formData.tags}
          onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
          placeholder={t('templates.create.tags.placeholder')}
        />

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_public}
            onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
            className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-surface-700 dark:text-surface-200">
            {t('templates.create.shareTeam')}
          </span>
        </label>

        <div className="flex justify-end gap-2 pt-4 border-t border-surface-200 dark:border-surface-700">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('templates.create.cancel')}
          </Button>
          <Button type="submit" isLoading={saving}>
            {t('templates.create.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default TemplateLibrary;
