'use client';

import { useEffect } from 'react';
import { DEFAULT_LOCALE, isRTL, LOCALES, type Locale } from '@/lib/i18n';

const normalizeLocale = (value?: string | null): Locale => {
  if (!value) return DEFAULT_LOCALE;
  const normalized = value.toLowerCase();
  if (normalized === 'ar-ma' || normalized.startsWith('ar')) return 'ar-MA';
  const base = normalized.split('-')[0];
  if (LOCALES.includes(base as Locale)) return base as Locale;
  if (LOCALES.includes(normalized as Locale)) return normalized as Locale;
  return DEFAULT_LOCALE;
};

export function LocaleHtmlUpdater() {
  useEffect(() => {
    const saved = window.localStorage.getItem('locale') || window.localStorage.getItem('language');
    const browser = navigator.language;
    const locale = normalizeLocale(saved || browser);

    document.documentElement.lang = locale;
    document.documentElement.dir = isRTL(locale) ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('data-locale', locale);
    window.localStorage.setItem('locale', locale);
  }, []);

  return null;
}
