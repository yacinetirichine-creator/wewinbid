/**
 * TendersTable - Tableau des appels d'offres avec tri et filtres
 * Affiche les AO avec statut, client, deadline, et valeur estimée
 */

'use client';

import { useState } from 'react';
import { Card, Badge } from '@/components/ui';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Tender {
  id: string;
  title: string;
  reference?: string;
  status: 'DRAFT' | 'ANALYSIS' | 'IN_PROGRESS' | 'REVIEW' | 'SUBMITTED' | 'WON' | 'LOST' | 'ABANDONED';
  buyer_name?: string;
  deadline?: string;
  estimated_value?: number;
  created_at: string;
}

interface TendersTableProps {
  tenders: Tender[];
  showActions?: boolean;
  onTenderClick?: (id: string) => void;
}

const statusConfig = {
  DRAFT: { label: 'Brouillon', color: 'gray' as const },
  ANALYSIS: { label: 'Analyse', color: 'blue' as const },
  IN_PROGRESS: { label: 'En cours', color: 'yellow' as const },
  REVIEW: { label: 'Révision', color: 'purple' as const },
  SUBMITTED: { label: 'Soumis', color: 'blue' as const },
  WON: { label: 'Gagné', color: 'green' as const },
  LOST: { label: 'Perdu', color: 'red' as const },
  ABANDONED: { label: 'Abandonné', color: 'gray' as const },
};

export function TendersTable({ tenders, showActions = true, onTenderClick }: TendersTableProps) {
  const [sortBy, setSortBy] = useState<'deadline' | 'value' | 'created'>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sortedTenders = [...tenders].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'deadline':
        const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        comparison = dateA - dateB;
        break;
      case 'value':
        comparison = (a.estimated_value || 0) - (b.estimated_value || 0);
        break;
      case 'created':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Référence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Statut
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700"
                onClick={() => handleSort('deadline')}
              >
                Échéance {sortBy === 'deadline' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700"
                onClick={() => handleSort('value')}
              >
                Valeur {sortBy === 'value' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              {showActions && (
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedTenders.map((tender) => {
              const daysUntilDeadline = tender.deadline
                ? Math.ceil((new Date(tender.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;
              const isUrgent = daysUntilDeadline !== null && daysUntilDeadline >= 0 && daysUntilDeadline <= 7;

              return (
                <tr
                  key={tender.id}
                  className={`hover:bg-gray-50 ${onTenderClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onTenderClick?.(tender.id)}
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {tender.reference || tender.title}
                      </div>
                      {tender.reference && (
                        <div className="text-sm text-gray-500">{tender.title}</div>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {tender.buyer_name || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <Badge variant={statusConfig[tender.status].color}>
                      {statusConfig[tender.status].label}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {tender.deadline ? (
                      <div>
                        <div className={isUrgent ? 'font-medium text-red-600' : 'text-gray-900'}>
                          {formatDate(tender.deadline)}
                        </div>
                        {daysUntilDeadline !== null && daysUntilDeadline >= 0 && (
                          <div className={`text-xs ${isUrgent ? 'text-red-500' : 'text-gray-500'}`}>
                            {daysUntilDeadline === 0 ? "Aujourd'hui" : `J-${daysUntilDeadline}`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Non définie</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {tender.estimated_value ? formatCurrency(tender.estimated_value) : '-'}
                  </td>
                  {showActions && (
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/tenders/${tender.id}`;
                        }}
                      >
                        Voir
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {tenders.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            Aucun appel d'offres pour le moment
          </div>
        )}
      </div>
    </Card>
  );
}
