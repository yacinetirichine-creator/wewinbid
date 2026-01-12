'use client';

import { useState } from 'react';
import { 
  Card, 
  CardContent,
  Button, 
  Input, 
  Badge 
} from '@/components/ui';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Bell,
  BellRing,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Pause,
  Play,
  Settings,
  Mail,
  Smartphone,
  Clock,
  MapPin,
  Euro,
  Building2,
  Tag,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Eye,
  Sparkles,
  Zap,
  TrendingUp,
} from 'lucide-react';

// Types
interface Alert {
  id: string;
  name: string;
  keywords: string[];
  sectors: string[];
  regions: string[];
  min_value?: number;
  max_value?: number;
  tender_type: 'all' | 'public' | 'private';
  notification_email: boolean;
  notification_push: boolean;
  frequency: 'realtime' | 'daily' | 'weekly';
  active: boolean;
  matches_count: number;
  last_match?: string;
  created_at: string;
}

interface AlertMatch {
  id: string;
  alert_id: string;
  tender_title: string;
  tender_reference: string;
  buyer: string;
  estimated_value?: number;
  deadline: string;
  source_url: string;
  match_score: number;
  matched_keywords: string[];
  seen: boolean;
  created_at: string;
}

// Données de démonstration
const DEMO_ALERTS: Alert[] = [
  {
    id: '1',
    name: 'Vidéosurveillance Île-de-France',
    keywords: ['vidéosurveillance', 'caméras', 'sécurité électronique'],
    sectors: ['Sécurité électronique'],
    regions: ['Île-de-France'],
    min_value: 10000,
    max_value: 500000,
    tender_type: 'public',
    notification_email: true,
    notification_push: true,
    frequency: 'realtime',
    active: true,
    matches_count: 23,
    last_match: '2024-01-15T09:30:00Z',
    created_at: '2023-09-01T10:00:00Z',
  },
  {
    id: '2',
    name: 'Gardiennage National',
    keywords: ['gardiennage', 'surveillance', 'sécurité privée', 'agents'],
    sectors: ['Sécurité privée'],
    regions: ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Provence-Alpes-Côte d\'Azur'],
    min_value: 50000,
    tender_type: 'all',
    notification_email: true,
    notification_push: false,
    frequency: 'daily',
    active: true,
    matches_count: 56,
    last_match: '2024-01-14T16:45:00Z',
    created_at: '2023-06-15T08:00:00Z',
  },
  {
    id: '3',
    name: 'Contrôle d\'accès',
    keywords: ['contrôle d\'accès', 'badge', 'biométrie', 'interphonie'],
    sectors: ['Sécurité électronique'],
    regions: [],
    tender_type: 'public',
    notification_email: true,
    notification_push: true,
    frequency: 'weekly',
    active: false,
    matches_count: 12,
    created_at: '2023-11-20T14:30:00Z',
  },
];

const DEMO_MATCHES: AlertMatch[] = [
  {
    id: '1',
    alert_id: '1',
    tender_title: 'Mise en place d\'un système de vidéosurveillance - Lycée Jean Moulin',
    tender_reference: 'MAPA-2024-0156',
    buyer: 'Région Île-de-France',
    estimated_value: 85000,
    deadline: '2024-02-15T12:00:00Z',
    source_url: 'https://boamp.fr/...',
    match_score: 95,
    matched_keywords: ['vidéosurveillance', 'caméras'],
    seen: false,
    created_at: '2024-01-15T09:30:00Z',
  },
  {
    id: '2',
    alert_id: '1',
    tender_title: 'Rénovation système vidéoprotection - Commune de Créteil',
    tender_reference: 'AO-2024-089',
    buyer: 'Ville de Créteil',
    estimated_value: 120000,
    deadline: '2024-02-20T16:00:00Z',
    source_url: 'https://marches.maximilien.fr/...',
    match_score: 88,
    matched_keywords: ['vidéosurveillance'],
    seen: true,
    created_at: '2024-01-14T11:20:00Z',
  },
  {
    id: '3',
    alert_id: '2',
    tender_title: 'Prestation de gardiennage - Sites administratifs',
    tender_reference: 'DCE-2024-0234',
    buyer: 'Préfecture du Rhône',
    estimated_value: 450000,
    deadline: '2024-03-01T12:00:00Z',
    source_url: 'https://boamp.fr/...',
    match_score: 92,
    matched_keywords: ['gardiennage', 'surveillance'],
    seen: false,
    created_at: '2024-01-14T16:45:00Z',
  },
];

const REGIONS = [
  'Île-de-France',
  'Auvergne-Rhône-Alpes',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Provence-Alpes-Côte d\'Azur',
  'Pays de la Loire',
  'Grand Est',
  'Hauts-de-France',
  'Bretagne',
  'Normandie',
];

const SECTORS = [
  'Sécurité électronique',
  'Sécurité privée',
  'BTP',
  'Informatique',
  'Propreté',
  'Formation',
  'Maintenance',
  'Transport',
];

// Composant carte alerte
function AlertCard({ 
  alert, 
  onEdit, 
  onToggle, 
  onDelete,
  onViewMatches,
}: { 
  alert: Alert;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onViewMatches: () => void;
}) {
  return (
    <Card className={`border-gray-200 ${!alert.active ? 'opacity-60' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${alert.active ? 'bg-primary-100' : 'bg-gray-100'}`}>
              {alert.active ? (
                <BellRing className={`w-5 h-5 ${alert.active ? 'text-primary-600' : 'text-gray-400'}`} />
              ) : (
                <Bell className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{alert.name}</h3>
              <p className="text-sm text-gray-500">
                {alert.matches_count} correspondances
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {alert.active ? (
              <Badge variant="success" className="text-xs">Actif</Badge>
            ) : (
              <Badge variant="default" className="text-xs">Inactif</Badge>
            )}
          </div>
        </div>

        {/* Mots-clés */}
        <div className="mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Tag className="w-4 h-4" />
            <span>Mots-clés</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {alert.keywords.slice(0, 4).map((kw) => (
              <span key={kw} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                {kw}
              </span>
            ))}
            {alert.keywords.length > 4 && (
              <span className="text-xs text-gray-500">+{alert.keywords.length - 4}</span>
            )}
          </div>
        </div>

        {/* Régions */}
        {alert.regions.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <MapPin className="w-4 h-4" />
              <span>Régions</span>
            </div>
            <p className="text-sm text-gray-700">
              {alert.regions.slice(0, 2).join(', ')}
              {alert.regions.length > 2 && ` +${alert.regions.length - 2}`}
            </p>
          </div>
        )}

        {/* Budget */}
        {(alert.min_value || alert.max_value) && (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Euro className="w-4 h-4" />
              <span>Budget</span>
            </div>
            <p className="text-sm text-gray-700">
              {alert.min_value?.toLocaleString('fr-FR')} € - {alert.max_value?.toLocaleString('fr-FR') || '∞'} €
            </p>
          </div>
        )}

        {/* Notifications */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex items-center gap-1 text-xs ${alert.notification_email ? 'text-green-600' : 'text-gray-400'}`}>
            <Mail className="w-3 h-3" />
            <span>Email</span>
          </div>
          <div className={`flex items-center gap-1 text-xs ${alert.notification_push ? 'text-green-600' : 'text-gray-400'}`}>
            <Smartphone className="w-3 h-3" />
            <span>Push</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span className="capitalize">{alert.frequency === 'realtime' ? 'Temps réel' : alert.frequency === 'daily' ? 'Quotidien' : 'Hebdo'}</span>
          </div>
        </div>

        {/* Dernière correspondance */}
        {alert.last_match && (
          <p className="text-xs text-gray-500 mb-4">
            Dernière correspondance : {new Date(alert.last_match).toLocaleDateString('fr-FR')}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <Button variant="outline" size="sm" className="flex-1" onClick={onViewMatches}>
            <Eye className="w-4 h-4 mr-1" />
            Voir ({alert.matches_count})
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onToggle}>
            {alert.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant correspondance
function MatchCard({ match, onMarkSeen }: { match: AlertMatch; onMarkSeen: () => void }) {
  const daysLeft = Math.ceil((new Date(match.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  return (
    <Card className={`border-gray-200 ${!match.seen ? 'border-l-4 border-l-primary-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {!match.seen && (
                <span className="w-2 h-2 bg-primary-500 rounded-full" />
              )}
              <span className="text-xs text-gray-500">{match.tender_reference}</span>
            </div>
            <h4 className="font-medium text-gray-900 line-clamp-2">{match.tender_title}</h4>
            <p className="text-sm text-gray-500 mt-1">{match.buyer}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="font-semibold text-primary-600">{match.match_score}%</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {match.matched_keywords.map((kw) => (
            <span key={kw} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded">
              {kw}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {match.estimated_value && (
              <span className="text-gray-600">
                <Euro className="w-4 h-4 inline mr-1" />
                {match.estimated_value.toLocaleString('fr-FR')} €
              </span>
            )}
            <span className={`${daysLeft <= 7 ? 'text-red-600' : 'text-gray-600'}`}>
              <Clock className="w-4 h-4 inline mr-1" />
              J-{daysLeft}
            </span>
          </div>
          <div className="flex gap-2">
            {!match.seen && (
              <Button variant="outline" size="sm" onClick={onMarkSeen}>
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={() => window.open(match.source_url, '_blank')}>
              <ExternalLink className="w-4 h-4 mr-1" />
              Voir l'AO
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Modal création/édition alerte
function AlertModal({
  alert,
  onClose,
  onSave,
}: {
  alert?: Alert;
  onClose: () => void;
  onSave: (data: Partial<Alert>) => void;
}) {
  const [formData, setFormData] = useState({
    name: alert?.name || '',
    keywords: alert?.keywords.join(', ') || '',
    sectors: alert?.sectors || [],
    regions: alert?.regions || [],
    min_value: alert?.min_value || '',
    max_value: alert?.max_value || '',
    tender_type: alert?.tender_type || 'all',
    notification_email: alert?.notification_email ?? true,
    notification_push: alert?.notification_push ?? true,
    frequency: alert?.frequency || 'daily',
  });

  const handleSave = () => {
    onSave({
      name: formData.name,
      keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
      sectors: formData.sectors,
      regions: formData.regions,
      min_value: formData.min_value ? Number(formData.min_value) : undefined,
      max_value: formData.max_value ? Number(formData.max_value) : undefined,
      tender_type: formData.tender_type as 'all' | 'public' | 'private',
      notification_email: formData.notification_email,
      notification_push: formData.notification_push,
      frequency: formData.frequency as 'realtime' | 'daily' | 'weekly',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {alert ? 'Modifier l\'alerte' : 'Nouvelle alerte'}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'alerte *
            </label>
            <Input
              placeholder="Ex: Vidéosurveillance Île-de-France"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mots-clés (séparés par des virgules) *
            </label>
            <Input
              placeholder="Ex: vidéosurveillance, caméras, sécurité"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secteurs
            </label>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map((sector) => (
                <button
                  key={sector}
                  type="button"
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    formData.sectors.includes(sector)
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (formData.sectors.includes(sector)) {
                      setFormData({ ...formData, sectors: formData.sectors.filter(s => s !== sector) });
                    } else {
                      setFormData({ ...formData, sectors: [...formData.sectors, sector] });
                    }
                  }}
                >
                  {sector}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Régions
            </label>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((region) => (
                <button
                  key={region}
                  type="button"
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    formData.regions.includes(region)
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (formData.regions.includes(region)) {
                      setFormData({ ...formData, regions: formData.regions.filter(r => r !== region) });
                    } else {
                      setFormData({ ...formData, regions: [...formData.regions, region] });
                    }
                  }}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget minimum (€)
              </label>
              <Input
                type="number"
                placeholder="10000"
                value={formData.min_value}
                onChange={(e) => setFormData({ ...formData, min_value: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget maximum (€)
              </label>
              <Input
                type="number"
                placeholder="500000"
                value={formData.max_value}
                onChange={(e) => setFormData({ ...formData, max_value: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de marché
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500"
              value={formData.tender_type}
              onChange={(e) => setFormData({ ...formData, tender_type: e.target.value })}
            >
              <option value="all">Tous</option>
              <option value="public">Publics uniquement</option>
              <option value="private">Privés uniquement</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fréquence de notification
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            >
              <option value="realtime">Temps réel</option>
              <option value="daily">Quotidien (9h)</option>
              <option value="weekly">Hebdomadaire (Lundi 9h)</option>
            </select>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notification_email}
                onChange={(e) => setFormData({ ...formData, notification_email: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Email</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notification_push}
                onChange={(e) => setFormData({ ...formData, notification_push: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <Smartphone className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Push</span>
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant="primary" 
            className="flex-1"
            onClick={handleSave}
            disabled={!formData.name.trim() || !formData.keywords.trim()}
          >
            {alert ? 'Enregistrer' : 'Créer l\'alerte'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Page principale
export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(DEMO_ALERTS);
  const [matches, setMatches] = useState<AlertMatch[]>(DEMO_MATCHES);
  const [showModal, setShowModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'alerts' | 'matches'>('alerts');

  const unseenMatchesCount = matches.filter(m => !m.seen).length;

  const handleSaveAlert = (data: Partial<Alert>) => {
    if (editingAlert) {
      setAlerts(alerts.map(a => a.id === editingAlert.id ? { ...a, ...data } : a));
    } else {
      const newAlert: Alert = {
        id: Date.now().toString(),
        name: data.name || '',
        keywords: data.keywords || [],
        sectors: data.sectors || [],
        regions: data.regions || [],
        min_value: data.min_value,
        max_value: data.max_value,
        tender_type: data.tender_type || 'all',
        notification_email: data.notification_email ?? true,
        notification_push: data.notification_push ?? true,
        frequency: data.frequency || 'daily',
        active: true,
        matches_count: 0,
        created_at: new Date().toISOString(),
      };
      setAlerts([newAlert, ...alerts]);
    }
    setShowModal(false);
    setEditingAlert(null);
  };

  const filteredMatches = selectedAlert
    ? matches.filter(m => m.alert_id === selectedAlert)
    : matches;

  return (
    <AppLayout>
      <PageHeader
        title="Alertes"
        subtitle="Recevez des notifications pour les appels d'offres correspondant à vos critères"
        actions={
          <Button variant="primary" onClick={() => { setEditingAlert(null); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle alerte
          </Button>
        }
      />

      <div className="px-6 pb-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-xl">
                <Bell className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
                <p className="text-sm text-gray-500">Alertes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.filter(a => a.active).length}
                </p>
                <p className="text-sm text-gray-500">Actives</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.reduce((acc, a) => acc + a.matches_count, 0)}
                </p>
                <p className="text-sm text-gray-500">Correspondances</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{unseenMatchesCount}</p>
                <p className="text-sm text-gray-500">Non lus</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mb-6">
          <button
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'alerts'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('alerts')}
          >
            <Bell className="w-4 h-4 inline-block mr-2" />
            Mes alertes ({alerts.length})
          </button>
          <button
            className={`px-4 py-2 rounded-xl font-medium transition-colors relative ${
              activeTab === 'matches'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('matches')}
          >
            <Search className="w-4 h-4 inline-block mr-2" />
            Correspondances ({matches.length})
            {unseenMatchesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unseenMatchesCount}
              </span>
            )}
          </button>
        </div>

        {/* Contenu */}
        {activeTab === 'alerts' ? (
          alerts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucune alerte configurée
                </h3>
                <p className="text-gray-500 mb-4">
                  Créez votre première alerte pour être notifié des nouveaux appels d'offres
                </p>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une alerte
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onEdit={() => { setEditingAlert(alert); setShowModal(true); }}
                  onToggle={() => setAlerts(alerts.map(a => a.id === alert.id ? { ...a, active: !a.active } : a))}
                  onDelete={() => setAlerts(alerts.filter(a => a.id !== alert.id))}
                  onViewMatches={() => { setSelectedAlert(alert.id); setActiveTab('matches'); }}
                />
              ))}
            </div>
          )
        ) : (
          <>
            {selectedAlert && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-500">Filtré par :</span>
                <Badge variant="primary">
                  {alerts.find(a => a.id === selectedAlert)?.name}
                  <button 
                    className="ml-2 hover:text-primary-900"
                    onClick={() => setSelectedAlert(null)}
                  >
                    ×
                  </button>
                </Badge>
              </div>
            )}
            {filteredMatches.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucune correspondance
                  </h3>
                  <p className="text-gray-500">
                    Les appels d'offres correspondant à vos alertes apparaîtront ici
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onMarkSeen={() => setMatches(matches.map(m => m.id === match.id ? { ...m, seen: true } : m))}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <AlertModal
          alert={editingAlert || undefined}
          onClose={() => { setShowModal(false); setEditingAlert(null); }}
          onSave={handleSaveAlert}
        />
      )}
    </AppLayout>
  );
}
