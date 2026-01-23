'use client';

import { useEffect, useMemo, useState } from 'react';
import { 
  Card, 
  CardContent,
  Button, 
  Input, 
  Badge 
} from '@/components/ui';
import { NewAppLayout as AppLayout, PageHeader } from '@/components/layout/NewAppLayout';
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
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

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

type LabeledOption = { value: string; labelKey: string };

const REGION_OPTIONS: LabeledOption[] = [
  { value: 'idf', labelKey: 'alerts.regions.idf' },
  { value: 'ara', labelKey: 'alerts.regions.ara' },
  { value: 'naq', labelKey: 'alerts.regions.naq' },
  { value: 'occ', labelKey: 'alerts.regions.occ' },
  { value: 'paca', labelKey: 'alerts.regions.paca' },
  { value: 'pdl', labelKey: 'alerts.regions.pdl' },
  { value: 'ges', labelKey: 'alerts.regions.ges' },
  { value: 'hdf', labelKey: 'alerts.regions.hdf' },
  { value: 'bre', labelKey: 'alerts.regions.bre' },
  { value: 'nor', labelKey: 'alerts.regions.nor' },
];

const SECTOR_OPTIONS: LabeledOption[] = [
  { value: 'security_electronic', labelKey: 'alerts.sectors.security_electronic' },
  { value: 'security_private', labelKey: 'alerts.sectors.security_private' },
  { value: 'construction', labelKey: 'alerts.sectors.construction' },
  { value: 'it', labelKey: 'alerts.sectors.it' },
  { value: 'cleaning', labelKey: 'alerts.sectors.cleaning' },
  { value: 'training', labelKey: 'alerts.sectors.training' },
  { value: 'maintenance', labelKey: 'alerts.sectors.maintenance' },
  { value: 'transport', labelKey: 'alerts.sectors.transport' },
];

// Composant carte alerte
function AlertCard({ 
  alert, 
  onEdit, 
  onToggle, 
  onDelete,
  onViewMatches,
  t,
  regionLabelByValue,
  formatCurrency,
  formatDate,
}: { 
  alert: Alert;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onViewMatches: () => void;
  t: (key: string) => string;
  regionLabelByValue: Record<string, string>;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
}) {
  const budgetText = (() => {
    const min = typeof alert.min_value === 'number' ? alert.min_value : null;
    const max = typeof alert.max_value === 'number' ? alert.max_value : null;

    if (min != null && max != null) {
      return t('alerts.budget.range')
        .replace('{min}', formatCurrency(min))
        .replace('{max}', formatCurrency(max));
    }

    if (min != null) {
      return t('alerts.budget.minOnly').replace('{min}', formatCurrency(min));
    }

    if (max != null) {
      return t('alerts.budget.maxOnly').replace('{max}', formatCurrency(max));
    }

    return null;
  })();

  const regionsText = (() => {
    if (!alert.regions.length) return null;
    const labels = alert.regions.map((r) => regionLabelByValue[r] ?? r);
    return {
      preview: labels.slice(0, 2).join(', '),
      extra: labels.length > 2 ? ` +${labels.length - 2}` : '',
    };
  })();

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
                {t('alerts.card.matches').replace('{count}', String(alert.matches_count))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {alert.active ? (
              <Badge variant="success" className="text-xs">{t('alerts.card.active')}</Badge>
            ) : (
              <Badge variant="default" className="text-xs">{t('alerts.card.inactive')}</Badge>
            )}
          </div>
        </div>

        {/* Mots-clés */}
        <div className="mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Tag className="w-4 h-4" />
            <span>{t('alerts.card.keywords')}</span>
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
        {regionsText && (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <MapPin className="w-4 h-4" />
              <span>{t('alerts.card.regions')}</span>
            </div>
            <p className="text-sm text-gray-700">
              {regionsText.preview}
              {regionsText.extra}
            </p>
          </div>
        )}

        {/* Budget */}
        {budgetText && (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Euro className="w-4 h-4" />
              <span>{t('alerts.card.budget')}</span>
            </div>
            <p className="text-sm text-gray-700">{budgetText}</p>
          </div>
        )}

        {/* Notifications */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex items-center gap-1 text-xs ${alert.notification_email ? 'text-green-600' : 'text-gray-400'}`}>
            <Mail className="w-3 h-3" />
            <span>{t('alerts.card.email')}</span>
          </div>
          <div className={`flex items-center gap-1 text-xs ${alert.notification_push ? 'text-green-600' : 'text-gray-400'}`}>
            <Smartphone className="w-3 h-3" />
            <span>{t('alerts.card.push')}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span className="capitalize">
              {alert.frequency === 'realtime'
                ? t('alerts.frequency.realtime')
                : alert.frequency === 'daily'
                  ? t('alerts.frequency.daily')
                  : t('alerts.frequency.weekly')}
            </span>
          </div>
        </div>

        {/* Dernière correspondance */}
        {alert.last_match && (
          <p className="text-xs text-gray-500 mb-4">
            {t('alerts.card.lastMatch').replace('{date}', formatDate(new Date(alert.last_match)))}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <Button variant="outline" size="sm" className="flex-1" onClick={onViewMatches}>
            <Eye className="w-4 h-4 mr-1" />
            {t('alerts.card.view').replace('{count}', String(alert.matches_count))}
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
function MatchCard({ match, onMarkSeen, t }: { match: AlertMatch; onMarkSeen: () => void; t: (key: string) => string }) {
  const daysLeft = Math.ceil((new Date(match.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const { locale } = useLocale();
  const formatCurrency = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });
    } catch {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
    }
  }, [locale]);
  
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
                {formatCurrency.format(match.estimated_value)}
              </span>
            )}
            <span className={`${daysLeft <= 7 ? 'text-red-600' : 'text-gray-600'}`}>
              <Clock className="w-4 h-4 inline mr-1" />
              {t('alerts.match.daysLeft').replace('{days}', String(daysLeft))}
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
              {t('alerts.match.viewTender')}
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
  t,
  sectorOptions,
  regionOptions,
}: {
  alert?: Alert;
  onClose: () => void;
  onSave: (data: Partial<Alert>) => void;
  t: (key: string) => string;
  sectorOptions: Array<{ value: string; label: string }>;
  regionOptions: Array<{ value: string; label: string }>;
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
            {alert ? t('alerts.modal.editTitle') : t('alerts.modal.newTitle')}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('alerts.modal.nameLabel')}
            </label>
            <Input
              placeholder={t('alerts.modal.namePlaceholder')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('alerts.modal.keywordsLabel')}
            </label>
            <Input
              placeholder={t('alerts.modal.keywordsPlaceholder')}
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('alerts.modal.sectorsLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {sectorOptions.map((sector) => (
                <button
                  key={sector.value}
                  type="button"
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    formData.sectors.includes(sector.value)
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (formData.sectors.includes(sector.value)) {
                      setFormData({
                        ...formData,
                        sectors: formData.sectors.filter((s) => s !== sector.value),
                      });
                    } else {
                      setFormData({ ...formData, sectors: [...formData.sectors, sector.value] });
                    }
                  }}
                >
                  {sector.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('alerts.modal.regionsLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {regionOptions.map((region) => (
                <button
                  key={region.value}
                  type="button"
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    formData.regions.includes(region.value)
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (formData.regions.includes(region.value)) {
                      setFormData({
                        ...formData,
                        regions: formData.regions.filter((r) => r !== region.value),
                      });
                    } else {
                      setFormData({ ...formData, regions: [...formData.regions, region.value] });
                    }
                  }}
                >
                  {region.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('alerts.modal.minBudgetLabel')}
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
                {t('alerts.modal.maxBudgetLabel')}
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
              {t('alerts.modal.tenderTypeLabel')}
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500"
              value={formData.tender_type}
              onChange={(e) => setFormData({ ...formData, tender_type: e.target.value as 'public' | 'private' | 'all' })}
            >
              <option value="all">{t('alerts.modal.tenderType.all')}</option>
              <option value="public">{t('alerts.modal.tenderType.public')}</option>
              <option value="private">{t('alerts.modal.tenderType.private')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('alerts.modal.frequencyLabel')}
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as 'realtime' | 'daily' | 'weekly' })}
            >
              <option value="realtime">{t('alerts.modal.frequency.realtime')}</option>
              <option value="daily">{t('alerts.modal.frequency.daily')}</option>
              <option value="weekly">{t('alerts.modal.frequency.weekly')}</option>
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
              <span className="text-sm text-gray-700">{t('alerts.modal.email')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notification_push}
                onChange={(e) => setFormData({ ...formData, notification_push: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <Smartphone className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">{t('alerts.modal.push')}</span>
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t('alerts.modal.cancel')}
          </Button>
          <Button 
            variant="primary" 
            className="flex-1"
            onClick={handleSave}
            disabled={!formData.name.trim() || !formData.keywords.trim()}
          >
            {alert ? t('alerts.modal.save') : t('alerts.modal.create')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Page principale
export default function AlertsPage() {
  const { locale } = useLocale();
  const entries = useMemo(
    () => ({
      'alerts.title': 'Alertes',
      'alerts.subtitle': "Recevez des notifications pour les appels d'offres correspondant à vos critères",
      'alerts.new': 'Nouvelle alerte',
      'alerts.stats.alerts': 'Alertes',
      'alerts.stats.active': 'Actives',
      'alerts.stats.matches': 'Correspondances',
      'alerts.stats.unread': 'Non lus',
      'alerts.tabs.alerts': 'Mes alertes ({count})',
      'alerts.tabs.matches': 'Correspondances ({count})',
      'alerts.empty.title': 'Aucune alerte configurée',
      'alerts.empty.subtitle': "Créez votre première alerte pour être notifié des nouveaux appels d'offres",
      'alerts.empty.cta': 'Créer une alerte',
      'alerts.matches.filter': 'Filtré par :',
      'alerts.matches.empty.title': 'Aucune correspondance',
      'alerts.matches.empty.subtitle': "Les appels d'offres correspondant à vos alertes apparaîtront ici",
      'alerts.card.matches': '{count} correspondances',
      'alerts.card.active': 'Actif',
      'alerts.card.inactive': 'Inactif',
      'alerts.card.keywords': 'Mots-clés',
      'alerts.card.regions': 'Régions',
      'alerts.card.budget': 'Budget',
      'alerts.card.email': 'Email',
      'alerts.card.push': 'Push',
      'alerts.card.lastMatch': 'Dernière correspondance : {date}',
      'alerts.card.view': 'Voir ({count})',
      'alerts.infinity': '∞',
      'alerts.budget.range': '{min} - {max}',
      'alerts.budget.minOnly': 'À partir de {min}',
      'alerts.budget.maxOnly': "Jusqu'à {max}",
      'alerts.frequency.realtime': 'Temps réel',
      'alerts.frequency.daily': 'Quotidien',
      'alerts.frequency.weekly': 'Hebdo',
      'alerts.match.daysLeft': 'J-{days}',
      'alerts.match.viewTender': "Voir l'AO",
      'alerts.modal.editTitle': "Modifier l'alerte",
      'alerts.modal.newTitle': 'Nouvelle alerte',
      'alerts.modal.nameLabel': "Nom de l'alerte *",
      'alerts.modal.namePlaceholder': 'Ex: Vidéosurveillance Île-de-France',
      'alerts.modal.keywordsLabel': 'Mots-clés (séparés par des virgules) *',
      'alerts.modal.keywordsPlaceholder': 'Ex: vidéosurveillance, caméras, sécurité',
      'alerts.modal.sectorsLabel': 'Secteurs',
      'alerts.modal.regionsLabel': 'Régions',
      'alerts.modal.minBudgetLabel': 'Budget minimum (€)',
      'alerts.modal.maxBudgetLabel': 'Budget maximum (€)',
      'alerts.modal.tenderTypeLabel': 'Type de marché',
      'alerts.modal.tenderType.all': 'Tous',
      'alerts.modal.tenderType.public': 'Publics uniquement',
      'alerts.modal.tenderType.private': 'Privés uniquement',
      'alerts.modal.frequencyLabel': 'Fréquence de notification',
      'alerts.modal.frequency.realtime': 'Temps réel',
      'alerts.modal.frequency.daily': 'Quotidien (9h)',
      'alerts.modal.frequency.weekly': 'Hebdomadaire (Lundi 9h)',
      'alerts.modal.email': 'Email',
      'alerts.modal.push': 'Push',
      'alerts.modal.cancel': 'Annuler',
      'alerts.modal.save': 'Enregistrer',
      'alerts.modal.create': "Créer l'alerte",

      // Régions
      'alerts.regions.idf': 'Île-de-France',
      'alerts.regions.ara': 'Auvergne-Rhône-Alpes',
      'alerts.regions.naq': 'Nouvelle-Aquitaine',
      'alerts.regions.occ': 'Occitanie',
      'alerts.regions.paca': "Provence-Alpes-Côte d'Azur",
      'alerts.regions.pdl': 'Pays de la Loire',
      'alerts.regions.ges': 'Grand Est',
      'alerts.regions.hdf': 'Hauts-de-France',
      'alerts.regions.bre': 'Bretagne',
      'alerts.regions.nor': 'Normandie',

      // Secteurs
      'alerts.sectors.security_electronic': 'Sécurité électronique',
      'alerts.sectors.security_private': 'Sécurité privée',
      'alerts.sectors.construction': 'BTP',
      'alerts.sectors.it': 'Informatique',
      'alerts.sectors.cleaning': 'Propreté',
      'alerts.sectors.training': 'Formation',
      'alerts.sectors.maintenance': 'Maintenance',
      'alerts.sectors.transport': 'Transport',

      // Démo (noms/keywords/titres)
      'alerts.demo.alert1.name': 'Vidéosurveillance Île-de-France',
      'alerts.demo.alert1.kw1': 'vidéosurveillance',
      'alerts.demo.alert1.kw2': 'caméras',
      'alerts.demo.alert1.kw3': 'sécurité électronique',

      'alerts.demo.alert2.name': 'Gardiennage national',
      'alerts.demo.alert2.kw1': 'gardiennage',
      'alerts.demo.alert2.kw2': 'surveillance',
      'alerts.demo.alert2.kw3': 'sécurité privée',
      'alerts.demo.alert2.kw4': 'agents',

      'alerts.demo.alert3.name': "Contrôle d'accès",
      'alerts.demo.alert3.kw1': "contrôle d'accès",
      'alerts.demo.alert3.kw2': 'badge',
      'alerts.demo.alert3.kw3': 'biométrie',
      'alerts.demo.alert3.kw4': 'interphonie',

      'alerts.demo.match1.title': "Mise en place d'un système de vidéosurveillance - Lycée Jean Moulin",
      'alerts.demo.match1.buyer': 'Région Île-de-France',
      'alerts.demo.match2.title': 'Rénovation système vidéoprotection - Commune de Créteil',
      'alerts.demo.match2.buyer': 'Ville de Créteil',
      'alerts.demo.match3.title': 'Prestation de gardiennage - Sites administratifs',
      'alerts.demo.match3.buyer': 'Préfecture du Rhône',
    }),
    []
  );
  const { t } = useUiTranslations(locale, entries);

  const regionOptions = useMemo(
    () => REGION_OPTIONS.map((r) => ({ value: r.value, label: t(r.labelKey) })),
    [t]
  );
  const sectorOptions = useMemo(
    () => SECTOR_OPTIONS.map((s) => ({ value: s.value, label: t(s.labelKey) })),
    [t]
  );
  const regionLabelByValue = useMemo(
    () => Object.fromEntries(regionOptions.map((r) => [r.value, r.label])) as Record<string, string>,
    [regionOptions]
  );

  const dateFormatter = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale);
    } catch {
      return new Intl.DateTimeFormat('fr-FR');
    }
  }, [locale]);

  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });
    } catch {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
    }
  }, [locale]);

  const demoAlerts = useMemo<Alert[]>(
    () => [
      {
        id: '1',
        name: t('alerts.demo.alert1.name'),
        keywords: [t('alerts.demo.alert1.kw1'), t('alerts.demo.alert1.kw2'), t('alerts.demo.alert1.kw3')],
        sectors: ['security_electronic'],
        regions: ['idf'],
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
        name: t('alerts.demo.alert2.name'),
        keywords: [
          t('alerts.demo.alert2.kw1'),
          t('alerts.demo.alert2.kw2'),
          t('alerts.demo.alert2.kw3'),
          t('alerts.demo.alert2.kw4'),
        ],
        sectors: ['security_private'],
        regions: ['idf', 'ara', 'paca'],
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
        name: t('alerts.demo.alert3.name'),
        keywords: [
          t('alerts.demo.alert3.kw1'),
          t('alerts.demo.alert3.kw2'),
          t('alerts.demo.alert3.kw3'),
          t('alerts.demo.alert3.kw4'),
        ],
        sectors: ['security_electronic'],
        regions: [],
        tender_type: 'public',
        notification_email: true,
        notification_push: true,
        frequency: 'weekly',
        active: false,
        matches_count: 12,
        created_at: '2023-11-20T14:30:00Z',
      },
    ],
    [t]
  );

  const demoMatches = useMemo<AlertMatch[]>(
    () => [
      {
        id: '1',
        alert_id: '1',
        tender_title: t('alerts.demo.match1.title'),
        tender_reference: 'MAPA-2024-0156',
        buyer: t('alerts.demo.match1.buyer'),
        estimated_value: 85000,
        deadline: '2024-02-15T12:00:00Z',
        source_url: 'https://boamp.fr/...',
        match_score: 95,
        matched_keywords: [t('alerts.demo.alert1.kw1'), t('alerts.demo.alert1.kw2')],
        seen: false,
        created_at: '2024-01-15T09:30:00Z',
      },
      {
        id: '2',
        alert_id: '1',
        tender_title: t('alerts.demo.match2.title'),
        tender_reference: 'AO-2024-089',
        buyer: t('alerts.demo.match2.buyer'),
        estimated_value: 120000,
        deadline: '2024-02-20T16:00:00Z',
        source_url: 'https://marches.maximilien.fr/...',
        match_score: 88,
        matched_keywords: [t('alerts.demo.alert1.kw1')],
        seen: true,
        created_at: '2024-01-14T11:20:00Z',
      },
      {
        id: '3',
        alert_id: '2',
        tender_title: t('alerts.demo.match3.title'),
        tender_reference: 'DCE-2024-0234',
        buyer: t('alerts.demo.match3.buyer'),
        estimated_value: 450000,
        deadline: '2024-03-01T12:00:00Z',
        source_url: 'https://boamp.fr/...',
        match_score: 92,
        matched_keywords: [t('alerts.demo.alert2.kw1'), t('alerts.demo.alert2.kw2')],
        seen: false,
        created_at: '2024-01-14T16:45:00Z',
      },
    ],
    [t]
  );

  const [alerts, setAlerts] = useState<Alert[]>(demoAlerts);
  const [matches, setMatches] = useState<AlertMatch[]>(demoMatches);
  const [showModal, setShowModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'alerts' | 'matches'>('alerts');

  useEffect(() => {
    setAlerts(demoAlerts);
    setMatches(demoMatches);
  }, [demoAlerts, demoMatches]);

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
        title={t('alerts.title')}
        description={t('alerts.subtitle')}
        actions={
          <Button variant="primary" onClick={() => { setEditingAlert(null); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            {t('alerts.new')}
          </Button>
        }
      />

      <div className="px-4 sm:px-6 pb-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-xl">
                <Bell className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
                <p className="text-sm text-gray-500">{t('alerts.stats.alerts')}</p>
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
                <p className="text-sm text-gray-500">{t('alerts.stats.active')}</p>
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
                <p className="text-sm text-gray-500">{t('alerts.stats.matches')}</p>
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
                <p className="text-sm text-gray-500">{t('alerts.stats.unread')}</p>
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
            {t('alerts.tabs.alerts').replace('{count}', String(alerts.length))}
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
            {t('alerts.tabs.matches').replace('{count}', String(matches.length))}
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
                  {t('alerts.empty.title')}
                </h3>
                <p className="text-gray-500 mb-4">
                  {t('alerts.empty.subtitle')}
                </p>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('alerts.empty.cta')}
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
                  t={t}
                  regionLabelByValue={regionLabelByValue}
                  formatCurrency={(amount) => currencyFormatter.format(amount)}
                  formatDate={(d) => dateFormatter.format(d)}
                />
              ))}
            </div>
          )
        ) : (
          <>
            {selectedAlert && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-500">{t('alerts.matches.filter')}</span>
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
                    {t('alerts.matches.empty.title')}
                  </h3>
                  <p className="text-gray-500">
                    {t('alerts.matches.empty.subtitle')}
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
                    t={t}
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
          t={t}
          sectorOptions={sectorOptions}
          regionOptions={regionOptions}
        />
      )}
    </AppLayout>
  );
}
