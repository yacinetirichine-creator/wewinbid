'use client';

/**
 * @fileoverview Toggle switch for monthly/yearly pricing.
 */

import React from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

interface PricingToggleProps {
  interval: 'monthly' | 'yearly';
  onChange: (interval: 'monthly' | 'yearly') => void;
}

export function PricingToggle({ interval, onChange }: PricingToggleProps) {
  const { locale } = useLocale();
  const entries = {
    'pricing.toggle.monthly': 'Mensuel',
    'pricing.toggle.yearly': 'Annuel',
    'pricing.toggle.discount': '-17%',
  } as const;
  const { t } = useUiTranslations(locale, entries);

  return (
    <div className="flex items-center justify-center gap-4">
      <span
        className={`cursor-pointer font-medium transition-colors ${
          interval === 'monthly' ? 'text-gray-900' : 'text-gray-500'
        }`}
        onClick={() => onChange('monthly')}
      >
        {t('pricing.toggle.monthly')}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={interval === 'yearly'}
        onClick={() => onChange(interval === 'monthly' ? 'yearly' : 'monthly')}
        className={`
          relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
          ${interval === 'yearly' ? 'bg-blue-600' : 'bg-gray-300'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0
            transition duration-200 ease-in-out
            ${interval === 'yearly' ? 'translate-x-7' : 'translate-x-0'}
          `}
        />
      </button>

      <span
        className={`cursor-pointer font-medium transition-colors ${
          interval === 'yearly' ? 'text-gray-900' : 'text-gray-500'
        }`}
        onClick={() => onChange('yearly')}
      >
        {t('pricing.toggle.yearly')}
        <span className="ml-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
          {t('pricing.toggle.discount')}
        </span>
      </span>
    </div>
  );
}
