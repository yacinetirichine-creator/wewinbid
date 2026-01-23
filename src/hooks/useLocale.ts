'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/lib/i18n';

const normalizeLocale = (value?: string | null): Locale => {
  if (!value) return DEFAULT_LOCALE;
  const normalized = value.toLowerCase();
  if (normalized === 'ar-ma' || normalized.startsWith('ar')) return 'ar-MA';
  const base = normalized.split('-')[0];
  if (LOCALES.includes(base as Locale)) return base as Locale;
  if (LOCALES.includes(normalized as Locale)) return normalized as Locale;
  return DEFAULT_LOCALE;
};

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const saved = window.localStorage.getItem('locale') || window.localStorage.getItem('language');
    const browser = navigator.language;
    setLocaleState(normalizeLocale(saved || browser));
  }, []);

  const setLocale = (next: Locale, reload = true) => {
    setLocaleState(next);
    window.localStorage.setItem('locale', next);
    // Recharger la page pour appliquer la nouvelle langue partout
    if (reload) {
      window.location.reload();
    }
  };

  return { locale, setLocale };
}
