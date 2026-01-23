import { useEffect, useMemo, useState } from 'react';
import IntlMessageFormat from 'intl-messageformat';
import type { Locale } from '@/lib/i18n';

interface TranslationEntry {
  key: string;
  source: string;
  context?: string;
}

const TRANSLATION_CACHE = new Map<string, Record<string, string>>();
const IN_FLIGHT = new Map<string, Promise<Record<string, string>>>();
const WARNED_MISSING_KEYS = new Set<string>();

const shouldAutoTranslateMissing = () => {
  // Par défaut: auto-translate en dev, désactivé en prod (à activer via env si souhaité)
  const explicit = process.env.NEXT_PUBLIC_I18N_AUTO_TRANSLATE;
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;
  return process.env.NODE_ENV !== 'production';
};

const looksLikeIcuMessage = (message: string) => {
  // Heuristic: détecter rapidement ICU plurals/selects
  return message.includes(', plural,') || message.includes(', select,') || message.includes('{0,');
};

const formatMessage = (locale: Locale, message: string, params?: Record<string, string | number>) => {
  if (!params) return message;
  if (!looksLikeIcuMessage(message)) {
    return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
      return acc.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
    }, message);
  }

  try {
    const mf = new IntlMessageFormat(message, locale);
    const out = mf.format(params);
    return typeof out === 'string' ? out : String(out);
  } catch {
    // Fallback interpolation simple si le message ICU est invalide
    return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
      return acc.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
    }, message);
  }
};

export function useUiTranslations(locale: Locale, entries: Record<string, string>, context?: Record<string, string>) {
  const [translations, setTranslations] = useState<Record<string, string>>(entries);
  const [loading, setLoading] = useState(false);

  const keys = useMemo(() => Object.keys(entries), [entries]);
  const keysParam = useMemo(() => keys.join(','), [keys]);
  const cacheKey = useMemo(() => `${locale}::${keysParam}`, [locale, keysParam]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!keys.length) return;

      const cached = TRANSLATION_CACHE.get(cacheKey);
      if (cached) {
        setTranslations(cached);
        return;
      }

      setLoading(true);
      try {
        const existingInFlight = IN_FLIGHT.get(cacheKey);
        const p =
          existingInFlight ||
          (async () => {
            const res = await fetch(`/api/i18n?locale=${locale}&keys=${encodeURIComponent(keysParam)}`);
            const data = await res.json();
            const merged = { ...entries, ...(data.translations || {}) };

            // Alerte console (1x) pour les clés manquantes, utile pour "traduction à fond"
            if (Array.isArray(data.missing) && data.missing.length) {
              for (const k of data.missing) {
                const warnKey = `${locale}::${k}`;
                if (!WARNED_MISSING_KEYS.has(warnKey)) {
                  WARNED_MISSING_KEYS.add(warnKey);
                  console.warn(`[i18n] Missing translation key (${locale}): ${k}`);
                }
              }
            }

            // Auto-génération (optionnelle) des manquants
            if (shouldAutoTranslateMissing() && Array.isArray(data.missing) && data.missing.length) {
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
              if (postData?.translations) {
                return { ...merged, ...postData.translations };
              }
            }

            return merged;
          })();

        if (!existingInFlight) IN_FLIGHT.set(cacheKey, p);
        const merged = await p;
        IN_FLIGHT.delete(cacheKey);

        TRANSLATION_CACHE.set(cacheKey, merged);
        if (mounted) setTranslations(merged);
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
  }, [cacheKey, context, entries, keys.length, keysParam, locale]);

  const t = (key: string, params?: Record<string, string | number>) => {
    const raw = translations[key] || entries[key] || key;
    return formatMessage(locale, raw, params);
  };

  return { t, loading };
}
