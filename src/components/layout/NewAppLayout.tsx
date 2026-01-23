'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { NewSidebar } from './NewSidebar';
import { NewTopBar } from './NewTopBar';
import { createClient } from '@/lib/supabase/client';

interface User {
  name: string;
  email: string;
  avatar?: string;
}

interface Company {
  name: string;
  plan: string;
}

interface NewAppLayoutProps {
  children: React.ReactNode;
  /** Titre de la page (optionnel, sera déduit du pathname si non fourni) */
  pageTitle?: string;
  /** Afficher la barre de recherche dans le topbar */
  showSearch?: boolean;
  /** Actions personnalisées dans le header */
  headerActions?: React.ReactNode;
  /** Padding personnalisé pour le contenu */
  noPadding?: boolean;
}

export function NewAppLayout({ 
  children, 
  pageTitle,
  showSearch = true,
  headerActions,
  noPadding = false 
}: NewAppLayoutProps) {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les données utilisateur
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const supabase = getSupabase();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          // Charger le profil
          const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('first_name, last_name, avatar_url, company_id')
            .eq('id', authUser.id)
            .single();

          const displayName = profile?.first_name && profile?.last_name 
            ? `${profile.first_name} ${profile.last_name}`
            : profile?.first_name || authUser.email?.split('@')[0] || 'Utilisateur';

          setUser({
            name: displayName,
            email: authUser.email || '',
            avatar: profile?.avatar_url,
          });

          // Charger l'entreprise si elle existe
          if (profile?.company_id) {
            const { data: companyData } = await (supabase as any)
              .from('companies')
              .select('name')
              .eq('id', profile.company_id)
              .single();

            if (companyData) {
              setCompany({
                name: companyData.name,
                plan: 'Pro',
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [getSupabase]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <NewSidebar user={user || undefined} company={company || undefined} />
      
      {/* Main Content */}
      <main className="lg:pl-[280px] min-h-screen transition-all duration-300 flex flex-col">
        {/* Top Bar avec breadcrumbs */}
        <NewTopBar showSearch={showSearch} title={pageTitle} />
        
        {/* Header avec actions (optionnel) */}
        {headerActions && (
          <div className="px-4 lg:px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-16 z-10">
            <div className="flex items-center justify-end gap-3">
              {headerActions}
            </div>
          </div>
        )}
        
        {/* Page Content */}
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={noPadding ? '' : 'p-4 lg:p-6'}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Footer simple */}
      <footer className="lg:pl-[280px] mt-auto py-6 px-6 border-t border-slate-200/50 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
             <span>© {new Date().getFullYear()} WeWinBid</span>
             <span className="w-1 h-1 rounded-full bg-slate-300" />
             <span>Product of JARVIS SAS</span>
          </div>
          <div className="flex gap-4 text-xs font-medium text-slate-500">
             <a href="#" className="hover:text-primary-600 transition-colors">Support</a>
             <a href="#" className="hover:text-primary-600 transition-colors">Privacy</a>
             <a href="#" className="hover:text-primary-600 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * PageHeader component for consistent page headers
 */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: React.ReactNode;
  action?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
  };
}

export function PageHeader({ title, subtitle, description, actions, action }: PageHeaderProps) {
  const displaySubtitle = subtitle || description;
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
        {displaySubtitle && (
          <p className="text-slate-500 mt-1.5 text-sm lg:text-base max-w-2xl">{displaySubtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-all shadow-sm shadow-primary-500/20 hover:shadow-md hover:shadow-primary-500/30 active:scale-95"
          >
            {action.icon}
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}

export default NewAppLayout;
