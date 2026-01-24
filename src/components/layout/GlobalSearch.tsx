'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FileText,
  Users,
  Calendar,
  BarChart3,
  Settings,
  X,
  ArrowRight,
  Clock,
  Star,
  Sparkles,
  Building2,
  Bell,
  FolderOpen,
  MessageSquare,
  Command,
} from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

interface SearchResult {
  id: string;
  type: 'page' | 'tender' | 'partner' | 'document' | 'action';
  title: string;
  description?: string;
  href: string;
  icon: React.ElementType;
  category: string;
}

type QuickActionConfig = Omit<SearchResult, 'title' | 'description' | 'category'> & {
  titleKey: string;
  descriptionKey?: string;
  categoryKey: string;
};

// Pages et actions rapides disponibles (clés i18n)
const quickActionConfigs: QuickActionConfig[] = [
  {
    id: 'dashboard',
    type: 'page',
    titleKey: 'globalSearch.quick.dashboard.title',
    descriptionKey: 'globalSearch.quick.dashboard.description',
    href: '/dashboard',
    icon: BarChart3,
    categoryKey: 'globalSearch.category.navigation',
  },
  {
    id: 'tenders',
    type: 'page',
    titleKey: 'globalSearch.quick.tenders.title',
    descriptionKey: 'globalSearch.quick.tenders.description',
    href: '/tenders',
    icon: FileText,
    categoryKey: 'globalSearch.category.navigation',
  },
  {
    id: 'new-tender',
    type: 'action',
    titleKey: 'globalSearch.quick.newTender.title',
    descriptionKey: 'globalSearch.quick.newTender.description',
    href: '/tenders/new',
    icon: FileText,
    categoryKey: 'globalSearch.category.quickActions',
  },
  {
    id: 'calendar',
    type: 'page',
    titleKey: 'globalSearch.quick.calendar.title',
    descriptionKey: 'globalSearch.quick.calendar.description',
    href: '/calendar',
    icon: Calendar,
    categoryKey: 'globalSearch.category.navigation',
  },
  {
    id: 'documents',
    type: 'page',
    titleKey: 'globalSearch.quick.documents.title',
    descriptionKey: 'globalSearch.quick.documents.description',
    href: '/documents',
    icon: FolderOpen,
    categoryKey: 'globalSearch.category.navigation',
  },
  {
    id: 'studio',
    type: 'page',
    titleKey: 'globalSearch.quick.studio.title',
    descriptionKey: 'globalSearch.quick.studio.description',
    href: '/studio',
    icon: Sparkles,
    categoryKey: 'globalSearch.category.navigation',
  },
  {
    id: 'chat',
    type: 'page',
    titleKey: 'globalSearch.quick.chat.title',
    descriptionKey: 'globalSearch.quick.chat.description',
    href: '/chat',
    icon: MessageSquare,
    categoryKey: 'globalSearch.category.navigation',
  },
  {
    id: 'alerts',
    type: 'page',
    titleKey: 'globalSearch.quick.alerts.title',
    descriptionKey: 'globalSearch.quick.alerts.description',
    href: '/alerts',
    icon: Bell,
    categoryKey: 'globalSearch.category.navigation',
  },
  {
    id: 'analytics',
    type: 'page',
    titleKey: 'globalSearch.quick.analytics.title',
    descriptionKey: 'globalSearch.quick.analytics.description',
    href: '/analytics',
    icon: BarChart3,
    categoryKey: 'globalSearch.category.navigation',
  },
  {
    id: 'teams',
    type: 'page',
    titleKey: 'globalSearch.quick.teams.title',
    descriptionKey: 'globalSearch.quick.teams.description',
    href: '/teams',
    icon: Users,
    categoryKey: 'globalSearch.category.navigation',
  },
  {
    id: 'settings',
    type: 'page',
    titleKey: 'globalSearch.quick.settings.title',
    descriptionKey: 'globalSearch.quick.settings.description',
    href: '/settings',
    icon: Settings,
    categoryKey: 'globalSearch.category.navigation',
  },
];

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const entries = useMemo(
    () => ({
      'globalSearch.category.navigation': 'Navigation',
      'globalSearch.category.quickActions': 'Actions rapides',

      'globalSearch.quick.dashboard.title': 'Tableau de bord',
      'globalSearch.quick.dashboard.description': "Vue d'ensemble de votre activité",
      'globalSearch.quick.tenders.title': "Appels d'offres",
      'globalSearch.quick.tenders.description': "Gérer vos appels d'offres",
      'globalSearch.quick.newTender.title': "Nouvel appel d'offre",
      'globalSearch.quick.newTender.description': 'Créer un nouvel AO',
      'globalSearch.quick.calendar.title': 'Calendrier',
      'globalSearch.quick.calendar.description': 'Échéances et planning',
      'globalSearch.quick.documents.title': 'Documents',
      'globalSearch.quick.documents.description': 'Bibliothèque de documents',
      'globalSearch.quick.studio.title': 'Studio IA',
      'globalSearch.quick.studio.description': 'Génération de documents IA',
      'globalSearch.quick.chat.title': 'Assistant IA',
      'globalSearch.quick.chat.description': "Chat avec l'IA",
      'globalSearch.quick.alerts.title': 'Alertes',
      'globalSearch.quick.alerts.description': 'Configurer les alertes',
      'globalSearch.quick.analytics.title': 'Analytics',
      'globalSearch.quick.analytics.description': 'Statistiques et rapports',
      'globalSearch.quick.teams.title': 'Équipes',
      'globalSearch.quick.teams.description': 'Gérer vos équipes',
      'globalSearch.quick.settings.title': 'Paramètres',
      'globalSearch.quick.settings.description': 'Configuration du compte',

      'globalSearch.input.placeholder': "Rechercher une page, un appel d'offre, une action...",
      'globalSearch.empty.title': 'Aucun résultat pour "{query}"',
      'globalSearch.empty.subtitle': "Essayez avec d'autres mots-clés",
      'globalSearch.footer.navigate': 'naviguer',
      'globalSearch.footer.select': 'sélectionner',
      'globalSearch.footer.open': 'K pour ouvrir',
    }),
    []
  );

  const { t } = useUiTranslations(locale, entries);

  const quickActions: SearchResult[] = useMemo(() => {
    return quickActionConfigs.map(cfg => ({
      id: cfg.id,
      type: cfg.type,
      href: cfg.href,
      icon: cfg.icon,
      title: t(cfg.titleKey as keyof typeof entries),
      description: cfg.descriptionKey ? t(cfg.descriptionKey as keyof typeof entries) : undefined,
      category: t(cfg.categoryKey as keyof typeof entries),
    }));
  }, [t]);

  // Filtrer les résultats
  const results = useMemo(() => {
    if (!query.trim()) {
      return quickActions.slice(0, 8);
    }
    
    const searchTerms = query.toLowerCase().split(' ');
    return quickActions.filter(action => {
      const searchText = `${action.title} ${action.description} ${action.category}`.toLowerCase();
      return searchTerms.every(term => searchText.includes(term));
    });
  }, [query, quickActions]);

  // Grouper les résultats par catégorie
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach(result => {
      if (!groups[result.category]) {
        groups[result.category] = [];
      }
      groups[result.category].push(result);
    });
    return groups;
  }, [results]);

  // Charger les recherches récentes
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Focus sur l'input à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSelect = useCallback((result: SearchResult) => {
    // Sauvegarder dans les recherches récentes
    const newRecent = [result.title, ...recentSearches.filter(s => s !== result.title)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    
    router.push(result.href);
    onClose();
  }, [router, onClose, recentSearches]);

  // Gestion du clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, handleSelect]);

  // Raccourci clavier global (Cmd/Ctrl + K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-surface-200">
            <Search className="w-5 h-5 text-surface-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder={t('globalSearch.input.placeholder')}
              className="flex-1 text-lg outline-none placeholder:text-surface-400"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-surface-400 bg-surface-100 rounded border border-surface-200">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                  <p className="text-surface-500">{t('globalSearch.empty.title', { query })}</p>
                <p className="text-sm text-surface-400 mt-1">
                    {t('globalSearch.empty.subtitle')}
                </p>
              </div>
            ) : (
              <div className="p-2">
                {Object.entries(groupedResults).map(([category, items]) => (
                  <div key={category} className="mb-4">
                    <div className="px-3 py-2 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      {category}
                    </div>
                    {items.map((result, idx) => {
                      const globalIndex = results.indexOf(result);
                      const Icon = result.icon;
                      const isSelected = globalIndex === selectedIndex;

                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left ${
                            isSelected
                              ? 'bg-primary-50 text-primary-700'
                              : 'hover:bg-surface-100'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${
                            isSelected ? 'bg-primary-100' : 'bg-surface-100'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              isSelected ? 'text-primary-600' : 'text-surface-500'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-surface-900 truncate">
                              {result.title}
                            </div>
                            {result.description && (
                              <div className="text-sm text-surface-500 truncate">
                                {result.description}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <ArrowRight className="w-4 h-4 text-primary-500 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-surface-200 bg-surface-50 flex items-center justify-between text-xs text-surface-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border">↑↓</kbd>
                {t('globalSearch.footer.navigate')}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border">↵</kbd>
                {t('globalSearch.footer.select')}
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Command className="w-3 h-3" />
              <span>{t('globalSearch.footer.open')}</span>
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default GlobalSearch;
