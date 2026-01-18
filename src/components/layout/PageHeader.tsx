/**
 * @fileoverview Page Header Component
 * Reusable header for internal pages
 */

'use client';

import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-surface-900 font-display">{title}</h1>
        {description && (
          <p className="text-surface-600 mt-2">{description}</p>
        )}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}
