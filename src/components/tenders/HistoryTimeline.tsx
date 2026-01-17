'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Edit,
  Plus,
  Trash2,
  FileText,
  User,
  DollarSign,
  Calendar,
  Tag,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface HistoryEntry {
  id: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed';
  field_changed?: string;
  old_value?: any;
  new_value?: any;
  changes?: Record<string, any>;
  created_at: string;
  user: {
    full_name: string;
    avatar_url?: string;
  };
}

interface HistoryTimelineProps {
  tenderId: string;
}

export function HistoryTimeline({ tenderId }: HistoryTimelineProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/tenders/history?tenderId=${tenderId}`);
      if (!response.ok) throw new Error('Erreur fetch');

      const data = await response.json();
      setHistory(data.history);
    } catch (error) {
      console.error('Erreur fetch history:', error);
    } finally {
      setLoading(false);
    }
  }, [tenderId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="h-4 w-4" />;
      case 'updated':
        return <Edit className="h-4 w-4" />;
      case 'deleted':
        return <Trash2 className="h-4 w-4" />;
      case 'status_changed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 text-green-700';
      case 'updated':
        return 'bg-blue-100 text-blue-700';
      case 'deleted':
        return 'bg-red-100 text-red-700';
      case 'status_changed':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'title':
      case 'description':
        return <FileText className="h-3.5 w-3.5" />;
      case 'budget':
      case 'estimated_value':
        return <DollarSign className="h-3.5 w-3.5" />;
      case 'deadline':
      case 'publication_date':
        return <Calendar className="h-3.5 w-3.5" />;
      case 'status':
        return <Tag className="h-3.5 w-3.5" />;
      case 'assigned_to':
        return <User className="h-3.5 w-3.5" />;
      default:
        return <Edit className="h-3.5 w-3.5" />;
    }
  };

  const formatFieldName = (field: string) => {
    const fieldNames: Record<string, string> = {
      title: 'Titre',
      description: 'Description',
      budget: 'Budget',
      estimated_value: 'Valeur estimée',
      deadline: 'Date limite',
      publication_date: 'Date de publication',
      status: 'Statut',
      assigned_to: 'Assigné à',
      reference: 'Référence',
      contracting_authority: 'Autorité contractante',
      sector: 'Secteur',
      country: 'Pays',
    };
    return fieldNames[field] || field;
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const filteredHistory =
    filter === 'all' ? history : history.filter((entry) => entry.action === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-700">Filtrer :</span>
        {[
          { value: 'all', label: 'Tout' },
          { value: 'created', label: 'Créations' },
          { value: 'updated', label: 'Modifications' },
          { value: 'status_changed', label: 'Changements de statut' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Aucun historique trouvé</p>
        </div>
      ) : (
        <div className="relative">
          {/* Ligne verticale */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          {/* Entrées */}
          <div className="space-y-6">
            {filteredHistory.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-12"
              >
                {/* Icône de l'action */}
                <div
                  className={`absolute left-0 w-10 h-10 rounded-full flex items-center justify-center ${getActionColor(
                    entry.action
                  )}`}
                >
                  {getActionIcon(entry.action)}
                </div>

                {/* Carte de l'entrée */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                        {entry.user.full_name?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {entry.user.full_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(entry.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>

                  {/* Description de l'action */}
                  <div className="mt-3">
                    {entry.action === 'created' && (
                      <p className="text-sm text-gray-700">
                        A créé cet appel d'offres
                      </p>
                    )}

                    {entry.action === 'updated' && entry.field_changed && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          {getFieldIcon(entry.field_changed)}
                          <span>
                            A modifié{' '}
                            <span className="font-medium">
                              {formatFieldName(entry.field_changed)}
                            </span>
                          </span>
                        </div>
                        <div className="ml-6 space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <XCircle className="h-3 w-3 text-red-500" />
                            <span className="text-gray-500">Avant :</span>
                            <span className="font-mono bg-red-50 px-2 py-0.5 rounded text-red-700">
                              {formatValue(entry.old_value)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-gray-500">Après :</span>
                            <span className="font-mono bg-green-50 px-2 py-0.5 rounded text-green-700">
                              {formatValue(entry.new_value)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {entry.action === 'status_changed' && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700">
                          A changé le statut de l'appel d'offres
                        </p>
                        <div className="ml-6 flex items-center gap-3">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {entry.old_value}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {entry.new_value}
                          </span>
                        </div>
                      </div>
                    )}

                    {entry.changes && Object.keys(entry.changes).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {Object.keys(entry.changes).length} champ(s) modifié(s)
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
