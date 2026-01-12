'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  PlusIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  EllipsisVerticalIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Button, Badge, Card, Input, Select, Modal, ScoreGauge, EmptyState } from '@/components/ui';
import { AppLayout, PageHeader } from '@/components/layout/Sidebar';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate, getDaysRemaining, getScoreColor } from '@/lib/utils';
import type { Tender, TenderStatus, TenderType } from '@/types/database';

// Colonnes du Kanban
const KANBAN_COLUMNS: { status: TenderStatus; label: string; color: string }[] = [
  { status: 'DRAFT', label: 'Brouillon', color: 'bg-slate-100' },
  { status: 'ANALYSIS', label: 'Analyse', color: 'bg-blue-50' },
  { status: 'IN_PROGRESS', label: 'En cours', color: 'bg-amber-50' },
  { status: 'REVIEW', label: 'Révision', color: 'bg-purple-50' },
  { status: 'SUBMITTED', label: 'Soumis', color: 'bg-cyan-50' },
  { status: 'WON', label: 'Gagné', color: 'bg-emerald-50' },
  { status: 'LOST', label: 'Perdu', color: 'bg-rose-50' },
];

// Composant Carte Tender
function TenderCard({ tender, onStatusChange }: { tender: Tender; onStatusChange: (id: string, status: TenderStatus) => void }) {
  const [showMenu, setShowMenu] = useState(false);
  const daysRemaining = tender.deadline ? getDaysRemaining(tender.deadline) : null;
  const isUrgent = daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0;
  const isOverdue = daysRemaining !== null && daysRemaining < 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="kanban-card"
    >
      <Link href={`/tenders/${tender.id}`}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-slate-500">{tender.reference}</span>
                <Badge variant={tender.type === 'PUBLIC' ? 'info' : 'secondary'} size="sm">
                  {tender.type === 'PUBLIC' ? 'Public' : 'Privé'}
                </Badge>
              </div>
              <h4 className="font-semibold text-slate-900 line-clamp-2 text-sm">
                {tender.title}
              </h4>
            </div>
            <button 
              onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <EllipsisVerticalIcon className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Acheteur */}
          {tender.buyer_name && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <BuildingOfficeIcon className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">{tender.buyer_name}</span>
            </div>
          )}

          {/* Montant */}
          {tender.estimated_value && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <CurrencyEuroIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatCurrency(Number(tender.estimated_value), 'EUR')}</span>
            </div>
          )}

          {/* Date limite */}
          {tender.deadline && (
            <div className={`flex items-center gap-2 text-xs ${
              isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-slate-600'
            }`}>
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>
                {formatDate(tender.deadline)}
                {isOverdue && ' (Expiré)'}
                {isUrgent && !isOverdue && ` (J-${daysRemaining})`}
              </span>
            </div>
          )}

          {/* Score IA */}
          {tender.ai_score !== null && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">Score IA</span>
              <div className="flex items-center gap-2">
                <div className={`w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden`}>
                  <div 
                    className={`h-full rounded-full ${getScoreColor(tender.ai_score).replace('text-', 'bg-')}`}
                    style={{ width: `${tender.ai_score}%` }}
                  />
                </div>
                <span className={`text-sm font-semibold ${getScoreColor(tender.ai_score)}`}>
                  {tender.ai_score}%
                </span>
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// Composant Colonne Kanban
function KanbanColumn({ 
  column, 
  tenders, 
  onStatusChange 
}: { 
  column: typeof KANBAN_COLUMNS[0]; 
  tenders: Tender[]; 
  onStatusChange: (id: string, status: TenderStatus) => void;
}) {
  return (
    <div className="kanban-column">
      <div className={`sticky top-0 z-10 px-3 py-2 rounded-t-lg ${column.color}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-700 text-sm">{column.label}</h3>
          <Badge variant="secondary" size="sm">{tenders.length}</Badge>
        </div>
      </div>
      
      <div className="p-2 space-y-2 min-h-[200px]">
        <AnimatePresence mode="popLayout">
          {tenders.map((tender) => (
            <TenderCard 
              key={tender.id} 
              tender={tender} 
              onStatusChange={onStatusChange}
            />
          ))}
        </AnimatePresence>
        
        {tenders.length === 0 && (
          <div className="flex items-center justify-center h-24 text-slate-400 text-sm">
            Aucun AO
          </div>
        )}
      </div>
    </div>
  );
}

// Page principale
export default function TendersPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TenderType | 'ALL'>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchTenders();
  }, []);

  async function fetchTenders() {
    try {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenders(data || []);
    } catch (error) {
      console.error('Error fetching tenders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(tenderId: string, newStatus: TenderStatus) {
    try {
      const { error } = await supabase
        .from('tenders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', tenderId);

      if (error) throw error;
      
      setTenders(prev => prev.map(t => 
        t.id === tenderId ? { ...t, status: newStatus } : t
      ));
    } catch (error) {
      console.error('Error updating tender status:', error);
    }
  }

  // Filtrer les tenders
  const filteredTenders = tenders.filter(tender => {
    const matchesSearch = searchQuery === '' || 
      tender.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tender.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tender.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'ALL' || tender.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Grouper par statut
  const tendersByStatus = KANBAN_COLUMNS.reduce((acc, col) => {
    acc[col.status] = filteredTenders.filter(t => t.status === col.status);
    return acc;
  }, {} as Record<TenderStatus, Tender[]>);

  // Stats rapides
  const stats = {
    total: tenders.length,
    inProgress: tenders.filter(t => ['ANALYSIS', 'IN_PROGRESS', 'REVIEW'].includes(t.status)).length,
    submitted: tenders.filter(t => t.status === 'SUBMITTED').length,
    won: tenders.filter(t => t.status === 'WON').length,
    totalValue: tenders
      .filter(t => t.status === 'WON')
      .reduce((sum, t) => sum + (Number(t.winning_price) || Number(t.proposed_price) || 0), 0),
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader 
        title="Appels d'offres"
        subtitle={`${stats.total} AO au total • ${stats.won} gagnés`}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filtres
          </Button>
          <Link href="/tenders/new">
            <Button size="sm">
              <PlusIcon className="w-4 h-4 mr-2" />
              Nouvel AO
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-500">Total AO</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <ChartBarIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.inProgress}</p>
              <p className="text-xs text-slate-500">En cours</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.won}</p>
              <p className="text-xs text-slate-500">Gagnés</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <CurrencyEuroIcon className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalValue, 'EUR', 'fr-FR', true)}</p>
              <p className="text-xs text-slate-500">CA gagné</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Barre de recherche et filtres */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <Card className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Rechercher par titre, référence, acheteur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<MagnifyingGlassIcon className="w-4 h-4" />}
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as TenderType | 'ALL')}
                    options={[
                      { value: 'ALL', label: 'Tous les types' },
                      { value: 'PUBLIC', label: 'Marchés publics' },
                      { value: 'PRIVATE', label: 'Marchés privés' },
                    ]}
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vue Kanban */}
      {filteredTenders.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="w-12 h-12" />}
          title="Aucun appel d'offres"
          description="Créez votre premier appel d'offres pour commencer à suivre vos opportunités commerciales."
          action={
            <Link href="/tenders/new">
              <Button>
                <PlusIcon className="w-4 h-4 mr-2" />
                Créer un AO
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {KANBAN_COLUMNS.map((column) => (
              <KanbanColumn
                key={column.status}
                column={column}
                tenders={tendersByStatus[column.status] || []}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
