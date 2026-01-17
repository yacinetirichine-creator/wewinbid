import { useEffect, useMemo, useState } from 'react';
import type { Locale } from '@/lib/i18n';

interface TranslationEntry {
  key: string;
  source: string;
  context?: string;
}

export function useUiTranslations(locale: Locale, entries: Record<string, string>, context?: Record<string, string>) {
  const [translations, setTranslations] = useState<Record<string, string>>(entries);
  const [loading, setLoading] = useState(false);

  const keys = useMemo(() => Object.keys(entries), [entries]);
  const keysParam = useMemo(() => keys.join(','), [keys]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!keys.length) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/i18n?locale=${locale}&keys=${encodeURIComponent(keysParam)}`);
        const data = await res.json();
        const merged = { ...entries, ...(data.translations || {}) };

        if (mounted) {
          setTranslations(merged);
        }

        if (data.missing?.length) {
          const missingEntries: TranslationEntry[] = data.missing.map((key: string) => ({
            key,
            source: entries[key] || key,
            context: context?.[key],
          }));

          const postRes = await fetch('/api/i18n', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              locale,
              entries: missingEntries,
            }),
          });

          const postData = await postRes.json();
          if (mounted && postData.translations) {
            setTranslations((prev) => ({ ...prev, ...postData.translations }));
          }
        }
      } catch (error) {
        console.error('useUiTranslations error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [locale, keysParam, keys.length, entries, context]);

  const t = (key: string) => translations[key] || entries[key] || key;

  return { t, loading };
}
