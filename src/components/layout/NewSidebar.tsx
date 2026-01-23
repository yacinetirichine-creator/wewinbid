'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Sparkles,
  Bell,
  FolderOpen,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Building2,
  Crown,
  Menu,
  X,
  Calendar,
  MessageSquare,
  Search,
  Store,
  FileSignature,
  Library,
  UserPlus,
  Shield,
  Zap,
  Target,
  Megaphone,
  PieChart,
  BookOpen,
  Briefcase,
  Globe,
  Home,
  Layers,
} from 'lucide-react';
import { Avatar } from '@/components/ui';
import Logo, { LogoSidebar, LogoIcon } from '@/components/ui/Logo';
import { OnboardingReminder } from '@/components/onboarding/OnboardingReminder';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';
import { createClient } from '@/lib/supabase/client';

// Types
interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  description?: string;
}

interface NavCategory {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  items: NavItem[];
  defaultOpen?: boolean;
}

// Configuration de la navigation par catégories
const navigationConfig: NavCategory[] = [
  {
    id: 'main',
    labelKey: 'nav.category.main',
    icon: Home,
    defaultOpen: true,
    items: [
      { 
        labelKey: 'nav.dashboard', 
        href: '/dashboard', 
        icon: LayoutDashboard,
        description: 'Vue d\'ensemble de votre activité'
      },
      { 
        labelKey: 'nav.analytics', 
        href: '/analytics', 
        icon: BarChart3,
        description: 'Statistiques et performances'
      },
    ],
  },
  {
    id: 'tenders',
    labelKey: 'nav.category.tenders',
    icon: FileText,
    defaultOpen: true,
    items: [
      { 
        labelKey: 'nav.tenders', 
        href: '/tenders', 
        icon: FileText, 
        badge: 3,
        description: 'Gérer vos appels d\'offres'
      },
      { 
        labelKey: 'nav.analyzeAO', 
        href: '/tenders/analyze', 
        icon: Zap,
        description: 'Analyser un DCE avec l\'IA'
      },
      { 
        labelKey: 'nav.search', 
        href: '/search', 
        icon: Search,
        description: 'Rechercher de nouveaux AO'
      },
      { 
        labelKey: 'nav.alerts', 
        href: '/alerts', 
        icon: Bell, 
        badge: 5,
        description: 'Alertes et notifications AO'
      },
      { 
        labelKey: 'nav.calendar', 
        href: '/calendar', 
        icon: Calendar,
        description: 'Échéances et planning'
      },
    ],
  },
  {
    id: 'tools',
    labelKey: 'nav.category.tools',
    icon: Sparkles,
    defaultOpen: true,
    items: [
      { 
        labelKey: 'nav.studio', 
        href: '/studio', 
        icon: Sparkles,
        description: 'Génération de documents IA'
      },
      { 
        labelKey: 'nav.documents', 
        href: '/documents', 
        icon: FolderOpen,
        description: 'Bibliothèque de documents'
      },
      { 
        labelKey: 'nav.library', 
        href: '/library', 
        icon: Library,
        description: 'Réponses types et modèles'
      },
      { 
        labelKey: 'nav.aiChat', 
        href: '/chat', 
        icon: MessageSquare,
        description: 'Assistant IA'
      },
    ],
  },
  {
    id: 'network',
    labelKey: 'nav.category.network',
    icon: Users,
    defaultOpen: false,
    items: [
      { 
        labelKey: 'nav.marketplace', 
        href: '/marketplace', 
        icon: Store,
        description: 'Trouver des partenaires'
      },
      { 
        labelKey: 'nav.teams', 
        href: '/teams', 
        icon: Users,
        description: 'Gérer vos équipes'
      },
    ],
  },
];

const secondaryNav: NavItem[] = [
  { labelKey: 'nav.settings', href: '/settings', icon: Settings },
  { labelKey: 'nav.help', href: '/help', icon: HelpCircle },
];

interface NewSidebarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  company?: {
    name: string;
    plan: string;
  };
}

export function NewSidebar({ user, company }: NewSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navigationConfig.forEach(cat => {
      initial[cat.id] = cat.defaultOpen ?? false;
    });
    return initial;
  });

  // Marquer comme initialisé après le premier rendu
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  const { locale } = useLocale();

  // Traductions
  const entries = useMemo(
    () => ({
      'nav.dashboard': 'Tableau de bord',
      'nav.tenders': "Appels d'offres",
      'nav.analyzeAO': 'Analyser un AO',
      'nav.marketplace': 'Marketplace',
      'nav.analytics': 'Analytics',
      'nav.calendar': 'Calendrier',
      'nav.aiChat': 'Assistant IA',
      'nav.studio': 'Studio IA',
      'nav.alerts': 'Alertes',
      'nav.documents': 'Documents',
      'nav.settings': 'Paramètres',
      'nav.help': 'Aide & Support',
      'nav.search': 'Recherche AO',
      'nav.library': 'Bibliothèque',
      'nav.teams': 'Équipes',
      'nav.category.main': 'Accueil',
      'nav.category.tenders': 'Appels d\'offres',
      'nav.category.tools': 'Outils IA',
      'nav.category.network': 'Réseau',
      'nav.logout': 'Déconnexion',
      'nav.upgrade': 'Passer en Pro',
    }),
    []
  );

  const { t } = useUiTranslations(locale, entries);

  // Ouvrir automatiquement la catégorie active
  useEffect(() => {
    navigationConfig.forEach(category => {
      const isActive = category.items.some(
        item => pathname === item.href || pathname.startsWith(item.href + '/')
      );
      if (isActive) {
        setOpenCategories(prev => ({ ...prev, [category.id]: true }));
      }
    });
  }, [pathname]);

  const toggleCategory = (categoryId: string) => {
    if (!collapsed) {
      setOpenCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
    }
  };

  // Composant lien de navigation
  const NavLink = ({ item, showTooltip = false }: { item: NavItem; showTooltip?: boolean }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative',
          isActive
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25'
            : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
        )}
        title={collapsed ? t(item.labelKey) : undefined}
      >
        <Icon className={cn(
          'w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110',
          isActive ? 'text-white' : 'text-surface-500 group-hover:text-primary-500'
        )} />
        
        {!collapsed && (
          <span className="font-medium text-sm truncate flex-1">
            {t(item.labelKey)}
          </span>
        )}
        
        {item.badge && (
          <span className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full',
            collapsed ? 'absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0' : '',
            isActive 
              ? 'bg-white/20 text-white' 
              : 'bg-primary-100 text-primary-700'
          )}>
            {item.badge}
          </span>
        )}
        
        {/* Tooltip pour mode collapsed */}
        {collapsed && showTooltip && (
          <div className="absolute left-full ml-3 px-3 py-2 bg-surface-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
            {t(item.labelKey)}
            {item.description && (
              <p className="text-xs text-surface-400 mt-1">{item.description}</p>
            )}
          </div>
        )}
      </Link>
    );
  };

  // Composant catégorie
  const NavCategory = ({ category }: { category: NavCategory }) => {
    const isOpen = openCategories[category.id];
    const hasActiveChild = category.items.some(
      item => pathname === item.href || pathname.startsWith(item.href + '/')
    );
    const CategoryIcon = category.icon;

    return (
      <div className="mb-2">
        {/* Header de catégorie - cliquable seulement si non collapsed */}
        <button
          onClick={() => toggleCategory(category.id)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors',
            hasActiveChild ? 'text-primary-600' : 'text-surface-500',
            !collapsed && 'hover:bg-surface-100'
          )}
        >
          <CategoryIcon className="w-4 h-4 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="text-xs font-semibold uppercase tracking-wider flex-1">
                {t(category.labelKey)}
              </span>
              <ChevronDown className={cn(
                'w-4 h-4 transition-transform duration-200',
                isOpen ? 'rotate-0' : '-rotate-90'
              )} />
            </>
          )}
        </button>
        
        {/* Items de la catégorie */}
        {(isOpen || collapsed) && (
          <div className={cn('overflow-hidden', !collapsed && 'ml-2 mt-1')}>
            <div className="space-y-1">
              {category.items.map((item) => (
                <NavLink key={item.href} item={item} showTooltip={collapsed} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Contenu de la sidebar
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center px-4 py-5 border-b border-surface-200">
        <Link href="/dashboard" className="flex items-center">
          <LogoSidebar collapsed={collapsed} />
        </Link>
      </div>

      {/* Company Info */}
      {company && !collapsed && (
        <div className="px-4 py-3 border-b border-surface-200">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-surface-50 to-surface-100 rounded-xl">
            <Building2 className="w-5 h-5 text-surface-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-surface-900 truncate">{company.name}</p>
              <div className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs text-surface-500 font-medium">{company.plan}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation principale */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-surface-200">
        {navigationConfig.map((category) => (
          <NavCategory key={category.id} category={category} />
        ))}
      </nav>

      {/* Rappel d'onboarding - s'affiche si profil incomplet */}
      {!collapsed && <OnboardingReminder variant="sidebar" />}

      {/* Quick Actions */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-surface-200">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-primary-500/25 transition-all">
            <Zap className="w-4 h-4" />
            {t('nav.upgrade')}
          </button>
        </div>
      )}

      {/* Secondary Nav */}
      <div className="px-3 py-3 border-t border-surface-200 space-y-1">
        {secondaryNav.map((item) => (
          <NavLink key={item.href} item={item} showTooltip={collapsed} />
        ))}
      </div>

      {/* User Profile */}
      {user && (
        <div className="px-3 py-4 border-t border-surface-200">
          <div className={cn(
            'flex items-center gap-3 p-2 rounded-xl',
            'hover:bg-surface-100 transition-colors cursor-pointer group'
          )}>
            <Avatar src={user.avatar} name={user.name} size="sm" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-surface-900 truncate">{user.name}</p>
                <p className="text-xs text-surface-500 truncate">{user.email}</p>
              </div>
            )}
            {!collapsed && (
              <button 
                className="p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title={t('nav.logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Collapse Toggle Button (Desktop) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-surface-200 rounded-full items-center justify-center text-surface-400 hover:text-primary-500 hover:border-primary-300 shadow-sm transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5 text-surface-700" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-[300px] bg-white z-50 shadow-2xl"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-lg transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        style={{ width: collapsed ? 80 : 280 }}
        className={cn(
          'hidden lg:flex fixed left-0 top-0 bottom-0 bg-white border-r border-surface-200',
          'flex-col z-30 shadow-sm transition-[width] duration-300 ease-in-out'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}

export default NewSidebar;
