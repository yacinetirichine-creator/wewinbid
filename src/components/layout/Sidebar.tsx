'use client';

import React, { useState } from 'react';
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
  LogOut,
  Building2,
  Crown,
  Menu,
  X,
} from 'lucide-react';
import { Avatar } from '@/components/ui';
import { TopBar } from '@/components/layout/TopBar';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const mainNav: NavItem[] = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Appels d\'offres', href: '/tenders', icon: FileText, badge: 3 },
  { name: 'Marketplace', href: '/marketplace', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Studio créatif', href: '/studio', icon: Sparkles },
  { name: 'Alertes', href: '/alerts', icon: Bell, badge: 5 },
  { name: 'Documents', href: '/documents', icon: FolderOpen },
];

const secondaryNav: NavItem[] = [
  { name: 'Paramètres', href: '/settings', icon: Settings },
  { name: 'Aide', href: '/help', icon: HelpCircle },
];

interface SidebarProps {
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

export function Sidebar({ user, company }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
          'group relative',
          isActive
            ? 'bg-primary-50 text-primary-600'
            : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
        )}
      >
        <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-600')} />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-medium truncate"
            >
              {item.name}
            </motion.span>
          )}
        </AnimatePresence>
        {item.badge && !collapsed && (
          <span className="ml-auto bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
        {item.badge && collapsed && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white text-2xs font-medium rounded-full flex items-center justify-center">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-200">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
          W
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
            >
              <span className="font-display font-bold text-xl text-surface-900">WeWinBid</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Company */}
      {company && !collapsed && (
        <div className="px-4 py-3 border-b border-surface-200">
          <div className="flex items-center gap-3 p-2 bg-surface-50 rounded-lg">
            <Building2 className="w-5 h-5 text-surface-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-900 truncate">{company.name}</p>
              <div className="flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-500" />
                <span className="text-xs text-surface-500">{company.plan}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Secondary Nav */}
      <div className="px-3 py-4 border-t border-surface-200 space-y-1">
        {secondaryNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>

      {/* User */}
      {user && (
        <div className="px-3 py-4 border-t border-surface-200">
          <div className={cn(
            'flex items-center gap-3 p-2 rounded-lg',
            'hover:bg-surface-100 transition-colors cursor-pointer'
          )}>
            <Avatar src={user.avatar} name={user.name} size="sm" />
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-surface-900 truncate">{user.name}</p>
                  <p className="text-xs text-surface-500 truncate">{user.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {!collapsed && (
              <button className="p-1.5 text-surface-400 hover:text-surface-600 hover:bg-surface-200 rounded-lg">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Collapse Button (Desktop) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-surface-200 rounded-full items-center justify-center text-surface-400 hover:text-surface-600 shadow-sm"
      >
        <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
      </button>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-white z-50 flex flex-col"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 text-surface-400 hover:text-surface-600"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 280 }}
        className={cn(
          'hidden lg:flex fixed left-0 top-0 bottom-0 bg-white border-r border-surface-200',
          'flex-col z-30'
        )}
      >
        <SidebarContent />
      </motion.aside>
    </>
  );
}

// Header pour les pages internes
interface HeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: React.ReactNode;
  action?: {
    label: string;
    href: string;
  };
}

export function PageHeader({ title, subtitle, description, actions, action }: HeaderProps) {
  const displaySubtitle = subtitle || description;
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-surface-900">{title}</h1>
        {displaySubtitle && <p className="text-surface-500 mt-1">{displaySubtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

// Layout wrapper
interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // Ces données viendraient normalement de l'authentification
  const user = {
    name: 'Jean Dupont',
    email: 'jean@entreprise.fr',
  };

  const company = {
    name: 'Sécurité Plus SARL',
    plan: 'Pro',
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar user={user} company={company} />
      <main className="lg:pl-[280px] min-h-screen">
        <TopBar />
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
