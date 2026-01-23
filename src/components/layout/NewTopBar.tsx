'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChevronRight, 
  Search, 
  Bell, 
  Settings, 
  Command,
  Home
} from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import { GlobalSearch } from './GlobalSearch';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

interface NewTopBarProps {
  showSearch?: boolean;
  title?: string;
}

export function NewTopBar({ showSearch = true, title }: NewTopBarProps) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Raccourci clavier global (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const entries = useMemo(
    () => ({
      'topbar.search.placeholder': "Rechercher un appel d'offres, partenaire...",
      'topbar.search.shortcut': '⌘K',
      'topbar.settings.label': 'Paramètres',

      'topbar.breadcrumb.dashboard': 'Tableau de bord',
      'topbar.breadcrumb.tenders': "Appels d'offres",
      'topbar.breadcrumb.marketplace': 'Marketplace',
      'topbar.breadcrumb.analytics': 'Analytics',
      'topbar.breadcrumb.calendar': 'Calendrier',
      'topbar.breadcrumb.chat': 'Assistant IA',
      'topbar.breadcrumb.studio': 'Studio IA',
      'topbar.breadcrumb.alerts': 'Alertes',
      'topbar.breadcrumb.documents': 'Documents',
      'topbar.breadcrumb.settings': 'Paramètres',
      'topbar.breadcrumb.help': 'Aide',
      'topbar.breadcrumb.search': 'Recherche',
      'topbar.breadcrumb.library': 'Bibliothèque',
      'topbar.breadcrumb.teams': 'Équipes',
      'topbar.breadcrumb.notifications': 'Notifications',
      'topbar.breadcrumb.pricing': 'Tarifs',
      'topbar.breadcrumb.onboarding': 'Configuration',
      'topbar.breadcrumb.documents-generator': 'Générateur',
      'topbar.breadcrumb.dashboard-admin': 'Administration',
      'topbar.breadcrumb.dashboard-client': 'Espace Client',
    }),
    []
  );

  const { t } = useUiTranslations(locale, entries);

  // Générer le breadcrumb à partir du pathname
  const breadcrumbs = useMemo(() => {
    const paths = pathname.split('/').filter(Boolean);
    return paths.map((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      const translated = t(`topbar.breadcrumb.${path}` as keyof typeof entries);
      const fallback = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      const name = translated || fallback;
      return { name, href, isLast: index === paths.length - 1 };
    });
  }, [pathname, t]);

  return (
    <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-surface-200">
      <div className="px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-sm min-w-0 flex-1">
            <Link 
              href="/dashboard" 
              className="text-surface-400 hover:text-primary-500 transition-colors flex-shrink-0"
            >
              <Home className="w-4 h-4" />
            </Link>
            
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center gap-1.5 min-w-0">
                <ChevronRight className="w-4 h-4 text-surface-300 flex-shrink-0" />
                {crumb.isLast ? (
                  <span className="font-semibold text-surface-900 truncate">
                    {title || crumb.name}
                  </span>
                ) : (
                  <Link 
                    href={crumb.href}
                    className="text-surface-500 hover:text-primary-500 transition-colors truncate"
                  >
                    {crumb.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Barre de recherche globale */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-md">
              <button 
                className="w-full flex items-center gap-3 px-4 py-2 bg-surface-100 hover:bg-surface-200 rounded-xl transition-colors group"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="w-4 h-4 text-surface-400 group-hover:text-surface-600" />
                <span className="text-sm text-surface-500 flex-1 text-left">
                  {t('topbar.search.placeholder')}
                </span>
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-surface-400 bg-white rounded border border-surface-200">
                  <Command className="w-3 h-3" />
                  <span>K</span>
                </kbd>
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile search button */}
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-surface-100 transition-colors"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="w-5 h-5 text-surface-600" />
            </button>
            
            {/* Notifications */}
            <NotificationBell />
            
            {/* Settings */}
            <Link
              href="/settings"
              className="p-2 rounded-lg hover:bg-surface-100 transition-colors"
              aria-label={t('topbar.settings.label')}
            >
              <Settings className="w-5 h-5 text-surface-600" />
            </Link>
          </div>
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}

export default NewTopBar;
