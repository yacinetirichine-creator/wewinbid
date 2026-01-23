'use client';

import Link from 'next/link';
import { MapPin, Building, Calendar, Euro, TrendingUp, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';
import { trackEvent } from '@/lib/analytics';

interface Tender {
  tender_id: string;
  title: string;
  organization: string;
  country: string;
  budget: number;
  deadline: string;
  rank?: number;
}

interface SearchResultsProps {
  results: Tender[];
  isLoading: boolean;
  query?: string;
  totalResults?: number;
  onSaveSearch?: () => void;
}

export default function SearchResults({
  results,
  isLoading,
  query,
  totalResults,
  onSaveSearch
}: SearchResultsProps) {
  const { locale } = useLocale();
  const entries = {
    'search.results.loading': 'Recherche en cours...',
    'search.results.noneTitle': 'Aucun résultat trouvé',
    'search.results.noneForQuery': 'Aucun appel d\'offres ne correspond à "{query}"',
    'search.results.noneGeneric': "Aucun appel d'offres ne correspond à vos critères",
    'search.results.noneHint': 'Essayez de modifier vos filtres ou votre recherche',
    'search.results.header.results': 'résultats',
    'search.results.header.for': 'pour',
    'search.results.saveThis': 'Sauvegarder cette recherche',
    'search.results.relevance': '{pct}% pertinent',
  } as const;
  const { t } = useUiTranslations(locale, entries);

  const formatTemplate = (template: string, values: Record<string, string | number>) => {
    return Object.entries(values).reduce((acc, [key, value]) => {
      return acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }, template);
  };

  const dateLocale = locale === 'en' ? enUS : fr;
  const numberLocale = locale === 'en' ? 'en-US' : 'fr-FR';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">{t('search.results.loading')}</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('search.results.noneTitle')}
          </h3>
          <p className="text-gray-600 mb-4">
            {query
              ? formatTemplate(t('search.results.noneForQuery'), { query })
              : t('search.results.noneGeneric')}
          </p>
          <p className="text-sm text-gray-500">
            {t('search.results.noneHint')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{totalResults || results.length}</span> {t('search.results.header.results')}
          {query && (
            <span> {t('search.results.header.for')} "<span className="font-medium">{query}</span>"</span>
          )}
        </div>
        {onSaveSearch && (
          <button
            onClick={onSaveSearch}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            type="button"
          >
            {t('search.results.saveThis')}
          </button>
        )}
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {results.map((tender) => (
          <Link
            key={tender.tender_id}
            href={`/tenders/${tender.tender_id}`}
            className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-indigo-300 transition-all group"
            onClick={() => trackEvent('search_result_clicked', { tender_id: tender.tender_id })}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Title */}
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {tender.title}
                </h3>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{tender.organization}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{tender.country}</span>
                  </div>

                  {tender.budget && (
                    <div className="flex items-center gap-1">
                      <Euro className="w-4 h-4 text-gray-400" />
                      <span>{new Intl.NumberFormat(numberLocale).format(tender.budget)} €</span>
                    </div>
                  )}

                  {tender.deadline && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        {formatDistanceToNow(new Date(tender.deadline), {
                          addSuffix: true,
                          locale: dateLocale
                        })}
                      </span>
                    </div>
                  )}

                  {tender.rank !== undefined && tender.rank > 0 && (
                    <div className="flex items-center gap-1 ml-auto">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-medium text-green-600">
                        {formatTemplate(t('search.results.relevance'), {
                          pct: Math.round(tender.rank * 100),
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
