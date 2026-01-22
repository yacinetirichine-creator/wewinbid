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
  Store,
  Command,
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'page' | 'tender' | 'partner' | 'document' | 'action';
  title: string;
  description?: string;
  href: string;
  icon: React.ElementType;
  category: string;
}

// Pages et actions rapides disponibles
const quickActions: SearchResult[] = [
  {
    id: 'dashboard',
    type: 'page',
    title: 'Tableau de bord',
    description: 'Vue d\'ensemble de votre activité',
    href: '/dashboard',
    icon: BarChart3,
    category: 'Navigation',
  },
  {
    id: 'tenders',
    type: 'page',
    title: 'Appels d\'offres',
    description: 'Gérer vos appels d\'offres',
    href: '/tenders',
    icon: FileText,
    category: 'Navigation',
  },
  {
    id: 'new-tender',
    type: 'action',
    title: 'Nouvel appel d\'offre',
    description: 'Créer un nouvel AO',
    href: '/tenders/new',
    icon: FileText,
    category: 'Actions rapides',
  },
  {
    id: 'marketplace',
    type: 'page',
    title: 'Marketplace',
    description: 'Trouver des partenaires',
    href: '/marketplace',
    icon: Store,
    category: 'Navigation',
  },
  {
    id: 'calendar',
    type: 'page',
    title: 'Calendrier',
    description: 'Échéances et planning',
    href: '/calendar',
    icon: Calendar,
    category: 'Navigation',
  },
  {
    id: 'documents',
    type: 'page',
    title: 'Documents',
    description: 'Bibliothèque de documents',
    href: '/documents',
    icon: FolderOpen,
    category: 'Navigation',
  },
  {
    id: 'studio',
    type: 'page',
    title: 'Studio IA',
    description: 'Génération de documents IA',
    href: '/studio',
    icon: Sparkles,
    category: 'Navigation',
  },
  {
    id: 'chat',
    type: 'page',
    title: 'Assistant IA',
    description: 'Chat avec l\'IA',
    href: '/chat',
    icon: MessageSquare,
    category: 'Navigation',
  },
  {
    id: 'alerts',
    type: 'page',
    title: 'Alertes',
    description: 'Configurer les alertes',
    href: '/alerts',
    icon: Bell,
    category: 'Navigation',
  },
  {
    id: 'analytics',
    type: 'page',
    title: 'Analytics',
    description: 'Statistiques et rapports',
    href: '/analytics',
    icon: BarChart3,
    category: 'Navigation',
  },
  {
    id: 'teams',
    type: 'page',
    title: 'Équipes',
    description: 'Gérer vos équipes',
    href: '/teams',
    icon: Users,
    category: 'Navigation',
  },
  {
    id: 'settings',
    type: 'page',
    title: 'Paramètres',
    description: 'Configuration du compte',
    href: '/settings',
    icon: Settings,
    category: 'Navigation',
  },
];

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

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
  }, [query]);

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
  }, [isOpen, results, selectedIndex, onClose]);

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

  const handleSelect = useCallback((result: SearchResult) => {
    // Sauvegarder dans les recherches récentes
    const newRecent = [result.title, ...recentSearches.filter(s => s !== result.title)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    
    router.push(result.href);
    onClose();
  }, [router, onClose, recentSearches]);

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
              placeholder="Rechercher une page, un appel d'offre, une action..."
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
                <p className="text-surface-500">Aucun résultat pour "{query}"</p>
                <p className="text-sm text-surface-400 mt-1">
                  Essayez avec d'autres mots-clés
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
                naviguer
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border">↵</kbd>
                sélectionner
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Command className="w-3 h-3" />
              <span>K pour ouvrir</span>
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default GlobalSearch;
