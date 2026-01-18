/**
 * @fileoverview App Layout Component
 * Main application layout wrapper with sidebar, navigation, etc.
 */

'use client';

import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-surface-50">
      {children}
    </div>
  );
}
