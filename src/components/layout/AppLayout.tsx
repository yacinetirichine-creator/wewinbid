/**
 * @fileoverview App Layout Component
 * Main application layout wrapper with sidebar, navigation, etc.
 */

'use client';

import React from 'react';
import Link from 'next/link';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <div className="flex-1">
        {children}
      </div>
      
      {/* Footer avec liens légaux */}
      <footer className="mt-auto py-6 px-4 border-t border-surface-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-surface-500">
            <p>
              © {new Date().getFullYear()} WeWinBid · Commercialisé par JARVIS SAS
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/legal/privacy" className="hover:text-primary-600 transition-colors">
                Confidentialité
              </Link>
              <span className="text-surface-300">·</span>
              <Link href="/legal/terms" className="hover:text-primary-600 transition-colors">
                CGU
              </Link>
              <span className="text-surface-300">·</span>
              <Link href="/legal/cgv" className="hover:text-primary-600 transition-colors">
                CGV
              </Link>
              <span className="text-surface-300">·</span>
              <Link href="/legal/cookies" className="hover:text-primary-600 transition-colors">
                Cookies
              </Link>
              <span className="text-surface-300">·</span>
              <Link href="/legal/mentions" className="hover:text-primary-600 transition-colors">
                Mentions légales
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
