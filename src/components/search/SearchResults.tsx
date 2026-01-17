'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Building, Calendar, Euro, TrendingUp, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Recherche en cours...</p>
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
            Aucun résultat trouvé
          </h3>
          <p className="text-gray-600 mb-4">
            {query
              ? `Aucun appel d'offres ne correspond à "${query}"`
              : 'Aucun appel d\'offres ne correspond à vos critères'}
          </p>
          <p className="text-sm text-gray-500">
            Essayez de modifier vos filtres ou votre recherche
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
          <span className="font-semibold text-gray-900">{totalResults || results.length}</span> résultats
          {query && (
            <span> pour "<span className="font-medium">{query}</span>"</span>
          )}
        </div>
        {onSaveSearch && (
          <button
            onClick={onSaveSearch}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Sauvegarder cette recherche
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
                      <span>{tender.budget.toLocaleString('fr-FR')} €</span>
                    </div>
                  )}

                  {tender.deadline && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        {formatDistanceToNow(new Date(tender.deadline), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </span>
                    </div>
                  )}

                  {tender.rank !== undefined && tender.rank > 0 && (
                    <div className="flex items-center gap-1 ml-auto">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-medium text-green-600">
                        {Math.round(tender.rank * 100)}% pertinent
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
