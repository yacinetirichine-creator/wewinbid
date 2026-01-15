'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Card, 
  CardContent,
  Button, 
  Badge 
} from '@/components/ui';
import { AppLayout } from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/layout/Sidebar';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Trophy,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Filter,
  ChevronDown,
  Euro,
  FileText,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

// Types
interface AnalyticsData {
  overview: {
    totalTenders: number;
    tendersThisMonth: number;
    tendersChange: number;
    wonTenders: number;
    wonThisMonth: number;
    wonChange: number;
    totalRevenue: number;
    revenueThisMonth: number;
    revenueChange: number;
    winRate: number;
    winRateChange: number;
  };
  byStatus: {
    status: string;
    count: number;
    value: number;
  }[];
  bySector: {
    sector: string;
    total: number;
    won: number;
    winRate: number;
  }[];
  winnerAnalysis: {
    id: string;
    tender_title: string;
    winner_name: string;
    winning_price: number;
    your_price?: number;
    price_gap?: number;
    sector: string;
    buyer: string;
    award_date: string;
  }[];
  monthlyTrend: {
    month: string;
    submitted: number;
    won: number;
    revenue: number;
  }[];
  recommendations: {
    type: 'success' | 'warning' | 'info';
    title: string;
    description: string;
  }[];
}

// Données de démonstration
const DEMO_DATA: AnalyticsData = {
  overview: {
    totalTenders: 156,
    tendersThisMonth: 12,
    tendersChange: 15,
    wonTenders: 47,
    wonThisMonth: 4,
    wonChange: 33,
    totalRevenue: 2340000,
    revenueThisMonth: 280000,
    revenueChange: 22,
    winRate: 30.1,
    winRateChange: 5.2,
  },
  byStatus: [
    { status: 'Gagnés', count: 47, value: 2340000 },
    { status: 'Perdus', count: 89, value: 0 },
    { status: 'En cours', count: 15, value: 890000 },
    { status: 'Brouillons', count: 5, value: 120000 },
  ],
  bySector: [
    { sector: 'Sécurité électronique', total: 45, won: 18, winRate: 40 },
    { sector: 'Sécurité privée', total: 38, won: 12, winRate: 31.6 },
    { sector: 'Informatique', total: 32, won: 8, winRate: 25 },
    { sector: 'BTP', total: 25, won: 6, winRate: 24 },
    { sector: 'Formation', total: 16, won: 3, winRate: 18.7 },
  ],
  winnerAnalysis: [
    {
      id: '1',
      tender_title: 'Marché de vidéosurveillance - Commune de Lyon',
      winner_name: 'SecurVision SAS',
      winning_price: 245000,
      your_price: 268000,
      price_gap: -8.6,
      sector: 'Sécurité électronique',
      buyer: 'Ville de Lyon',
      award_date: '2024-01-15',
    },
    {
      id: '2',
      tender_title: 'Gardiennage sites administratifs 2024',
      winner_name: 'Groupe Securitas',
      winning_price: 1200000,
      your_price: 1350000,
      price_gap: -11.1,
      sector: 'Sécurité privée',
      buyer: 'Ministère de l\'Intérieur',
      award_date: '2024-01-10',
    },
    {
      id: '3',
      tender_title: 'Développement portail usagers',
      winner_name: 'Sopra Steria',
      winning_price: 890000,
      your_price: 780000,
      price_gap: 14.1,
      sector: 'Informatique',
      buyer: 'Région Occitanie',
      award_date: '2024-01-08',
    },
    {
      id: '4',
      tender_title: 'Contrôle d\'accès bâtiments publics',
      winner_name: 'Vous',
      winning_price: 156000,
      sector: 'Sécurité électronique',
      buyer: 'Mairie de Bordeaux',
      award_date: '2024-01-05',
    },
  ],
  monthlyTrend: [
    { month: 'Jan', submitted: 8, won: 2, revenue: 145000 },
    { month: 'Fév', submitted: 12, won: 4, revenue: 320000 },
    { month: 'Mar', submitted: 15, won: 5, revenue: 280000 },
    { month: 'Avr', submitted: 10, won: 3, revenue: 195000 },
    { month: 'Mai', submitted: 18, won: 6, revenue: 420000 },
    { month: 'Juin', submitted: 14, won: 4, revenue: 310000 },
    { month: 'Juil', submitted: 9, won: 2, revenue: 120000 },
    { month: 'Août', submitted: 6, won: 2, revenue: 85000 },
    { month: 'Sep', submitted: 16, won: 5, revenue: 380000 },
    { month: 'Oct', submitted: 20, won: 7, revenue: 520000 },
    { month: 'Nov', submitted: 16, won: 3, revenue: 210000 },
    { month: 'Déc', submitted: 12, won: 4, revenue: 280000 },
  ],
  recommendations: [
    {
      type: 'success',
      title: 'Excellent taux de réussite en sécurité électronique',
      description: 'Votre taux de 40% est supérieur à la moyenne du secteur (28%). Continuez sur cette lancée !',
    },
    {
      type: 'warning',
      title: 'Prix souvent trop élevés',
      description: 'Sur les 5 derniers AO perdus, votre prix était en moyenne 12% plus élevé que le gagnant.',
    },
    {
      type: 'info',
      title: 'Nouveau marché identifié',
      description: 'Le secteur de la maintenance prédictive montre une forte croissance (+45% d\'AO publiés).',
    },
  ],
};

// Composant carte statistique
function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  prefix = '', 
  suffix = '' 
}: { 
  title: string; 
  value: number | string; 
  change?: number; 
  icon: any; 
  prefix?: string;
  suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">
              {prefix}{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}{suffix}
            </p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {change >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span>{Math.abs(change)}% ce mois</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-primary-100 rounded-xl">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant barre de progression
function ProgressBar({ value, max, color = 'primary' }: { value: number; max: number; color?: string }) {
  const percentage = (value / max) * 100;
  const colorClasses: Record<string, string> = {
    primary: 'bg-primary-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// Page principale
export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(DEMO_DATA);
  const [period, setPeriod] = useState('12m');
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calcul du max pour le graphique
  const maxMonthlyValue = Math.max(...data.monthlyTrend.map(m => m.submitted));

  return (
    <AppLayout>
      <PageHeader
        title="Analytiques"
        subtitle="Suivez vos performances et optimisez votre taux de réussite"
        actions={
          <div className="flex gap-3">
            <select
              className="px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="3m">3 derniers mois</option>
              <option value="6m">6 derniers mois</option>
              <option value="12m">12 derniers mois</option>
              <option value="all">Depuis le début</option>
            </select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        }
      />

      <div className="px-6 pb-6 space-y-6">
        {/* Cartes principales */}
        <div className="grid grid-cols-4 gap-6">
          <StatCard
            title="Total AO soumis"
            value={data.overview.totalTenders}
            change={data.overview.tendersChange}
            icon={FileText}
          />
          <StatCard
            title="AO gagnés"
            value={data.overview.wonTenders}
            change={data.overview.wonChange}
            icon={Trophy}
          />
          <StatCard
            title="Chiffre d'affaires"
            value={formatCurrency(data.overview.totalRevenue)}
            change={data.overview.revenueChange}
            icon={Euro}
          />
          <StatCard
            title="Taux de réussite"
            value={data.overview.winRate}
            suffix="%"
            change={data.overview.winRateChange}
            icon={Target}
          />
        </div>

        {/* Graphiques Recharts améliorés */}
        <div className="grid grid-cols-3 gap-6">
          {/* Tendance mensuelle avec Recharts */}
          <Card className="col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900">Tendance mensuelle (Interactif)</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm text-gray-500">Soumis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-500">Gagnés</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.monthlyTrend}>
                  <defs>
                    <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="submitted" 
                    stroke="#3B82F6" 
                    fillOpacity={1}
                    fill="url(#colorSubmitted)"
                    name="Soumis"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="won" 
                    stroke="#10B981" 
                    fillOpacity={1}
                    fill="url(#colorWon)"
                    name="Gagnés"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribution par statut avec PieChart */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-6">Répartition par statut</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={data.byStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.byStatus.map((entry, index) => {
                      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px' 
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Nouveaux graphiques: Revenus et Performance par secteur */}
        <div className="grid grid-cols-2 gap-6">
          {/* Revenus mensuels */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-6">Revenus mensuels</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={data.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                    formatter={(value: number) => [`${(value / 1000).toFixed(0)}k €`, 'Revenu']}
                  />
                  <Bar dataKey="revenue" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Taux de réussite par secteur */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-6">Performance par secteur</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={data.bySector} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" domain={[0, 100]} stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis dataKey="sector" type="category" width={130} stroke="#6B7280" style={{ fontSize: '11px' }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taux de réussite']}
                  />
                  <Bar dataKey="winRate" fill="#10B981" radius={[0, 8, 8, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Anciens graphiques barres (conservés pour compatibilité) */}
        <div className="grid grid-cols-2 gap-6">
          {/* Tendance mensuelle */}
          <Card className="col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900">Tendance mensuelle</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary-500" />
                    <span className="text-sm text-gray-500">Soumis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-500">Gagnés</span>
                  </div>
                </div>
              </div>
              <div className="flex items-end gap-2 h-48">
                {data.monthlyTrend.map((month) => (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-1 justify-center" style={{ height: '160px' }}>
                      <div 
                        className="w-4 bg-primary-200 rounded-t transition-all duration-300 hover:bg-primary-300"
                        style={{ height: `${(month.submitted / maxMonthlyValue) * 100}%`, marginTop: 'auto' }}
                        title={`${month.submitted} soumis`}
                      />
                      <div 
                        className="w-4 bg-green-400 rounded-t transition-all duration-300 hover:bg-green-500"
                        style={{ height: `${(month.won / maxMonthlyValue) * 100}%`, marginTop: 'auto' }}
                        title={`${month.won} gagnés`}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{month.month}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Répartition par statut */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-6">Répartition par statut</h3>
              <div className="space-y-4">
                {data.byStatus.map((item) => {
                  const total = data.byStatus.reduce((acc, s) => acc + s.count, 0);
                  const percentage = ((item.count / total) * 100).toFixed(1);
                  const colorMap: Record<string, string> = {
                    'Gagnés': 'green',
                    'Perdus': 'red',
                    'En cours': 'primary',
                    'Brouillons': 'yellow',
                  };
                  return (
                    <div key={item.status}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">{item.status}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {item.count} ({percentage}%)
                        </span>
                      </div>
                      <ProgressBar value={item.count} max={total} color={colorMap[item.status] || 'primary'} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance par secteur et Analyse des gagnants */}
        <div className="grid grid-cols-2 gap-6">
          {/* Performance par secteur */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-6">Performance par secteur</h3>
              <div className="space-y-4">
                {data.bySector.map((sector) => (
                  <div key={sector.sector} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{sector.sector}</span>
                        <span className="text-sm text-gray-500">
                          {sector.won}/{sector.total} gagnés
                        </span>
                      </div>
                      <ProgressBar 
                        value={sector.winRate} 
                        max={100} 
                        color={sector.winRate >= 30 ? 'green' : sector.winRate >= 20 ? 'yellow' : 'red'} 
                      />
                    </div>
                    <span className={`text-sm font-semibold ${
                      sector.winRate >= 30 ? 'text-green-600' : 
                      sector.winRate >= 20 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {sector.winRate}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommandations IA */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold text-gray-900">Recommandations IA</h3>
              </div>
              <div className="space-y-4">
                {data.recommendations.map((rec, index) => {
                  const iconMap = {
                    success: CheckCircle2,
                    warning: AlertTriangle,
                    info: Sparkles,
                  };
                  const colorMap = {
                    success: 'text-green-500 bg-green-50',
                    warning: 'text-yellow-500 bg-yellow-50',
                    info: 'text-blue-500 bg-blue-50',
                  };
                  const Icon = iconMap[rec.type];
                  return (
                    <div key={index} className={`p-4 rounded-xl ${colorMap[rec.type].split(' ')[1]}`}>
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${colorMap[rec.type].split(' ')[0]}`} />
                        <div>
                          <p className="font-medium text-gray-900">{rec.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analyse des attributaires */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-900">Analyse des attributaires récents</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Comparez vos prix avec les gagnants pour optimiser vos futures offres
                </p>
              </div>
              <Badge variant="info">
                <Sparkles className="w-3 h-3 mr-1" />
                Alimenté par IA
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Appel d'offres</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Attributaire</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Prix gagnant</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Votre prix</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Écart</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.winnerAnalysis.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900 text-sm">{item.tender_title}</p>
                        <p className="text-xs text-gray-500">{item.buyer}</p>
                      </td>
                      <td className="py-3 px-4">
                        {item.winner_name === 'Vous' ? (
                          <Badge variant="success" className="text-xs">
                            <Trophy className="w-3 h-3 mr-1" />
                            Vous
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-900">{item.winner_name}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(item.winning_price)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-600">
                        {item.your_price ? formatCurrency(item.your_price) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.price_gap !== undefined ? (
                          <span className={`text-sm font-medium ${
                            item.price_gap > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.price_gap > 0 ? '+' : ''}{item.price_gap.toFixed(1)}%
                          </span>
                        ) : (
                          <Badge variant="success" className="text-xs">Gagné</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(item.award_date).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
