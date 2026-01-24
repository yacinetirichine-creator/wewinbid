'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  GlobeAltIcon,
  KeyIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, Badge, Skeleton } from '@/components/ui';
import { AppLayout, PageHeader } from '@/components/layout/Sidebar';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

interface ExternalSource {
  id: string;
  name: string;
  country: string;
  base_url: string;
  is_active: boolean;
  sync_frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MANUAL';
  api_key_encrypted: string | null;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
  recent_logs: SyncLog[];
  success_rate: number;
  total_syncs: number;
}

interface SyncLog {
  id: string;
  source_id: string;
  sync_started_at: string;
  sync_completed_at: string | null;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  tenders_found: number;
  tenders_imported: number;
  error_message: string | null;
}

const SOURCE_ICONS: Record<string, string> = {
  'BOAMP': '🇫🇷',
  'TED': '🇪🇺',
  'Bund.de': '🇩🇪',
  'BOE': '🇪🇸',
  'Gazzetta Ufficiale': '🇮🇹',
};

const FREQUENCY_LABEL_KEYS: Record<ExternalSource['sync_frequency'], string> = {
  HOURLY: 'externalSources.frequency.hourly',
  DAILY: 'externalSources.frequency.daily',
  WEEKLY: 'externalSources.frequency.weekly',
  MANUAL: 'externalSources.frequency.manualOnly',
};

export default function ExternalSourcesPage() {
  const { locale } = useLocale();
  const entries = useMemo(
    () => ({
      'externalSources.title': 'External sources',
      'externalSources.subtitle': 'Manage tender data sources',
      'externalSources.badge.activeOfTotal': '{active} / {total} active',

      'externalSources.stats.activeSources': 'Active sources',
      'externalSources.stats.totalSyncs': 'Total synchronizations',
      'externalSources.stats.avgSuccessRate': 'Average success rate',
      'externalSources.stats.recentlySynced': 'Recently synced',

      'externalSources.status.active': 'Active',
      'externalSources.status.inactive': 'Inactive',

      'externalSources.action.sync': 'Sync',
      'externalSources.action.syncing': 'Syncing…',
      'externalSources.action.cancel': 'Cancel',
      'externalSources.action.configure': 'Configure',
      'externalSources.action.save': 'Save',

      'externalSources.field.apiKey': 'API key',
      'externalSources.field.apiKey.placeholder': 'Enter the API key…',
      'externalSources.field.apiKey.configured': 'API key configured',
      'externalSources.field.syncFrequency': 'Sync frequency',

      'externalSources.frequency.hourly': 'Hourly',
      'externalSources.frequency.daily': 'Daily',
      'externalSources.frequency.weekly': 'Weekly',
      'externalSources.frequency.manualOnly': 'Manual only',

      'externalSources.info.frequency': 'Frequency',
      'externalSources.info.lastSync': 'Last sync',
      'externalSources.info.successRate': 'Success rate',
      'externalSources.info.apiKey': 'API key',
      'externalSources.value.never': 'Never',
      'externalSources.value.configured': 'Configured',
      'externalSources.value.notConfigured': 'Not configured',

      'externalSources.logs.title': 'Sync history ({count})',
      'externalSources.logs.empty': 'No synchronizations yet',
      'externalSources.logs.importedOfFound': '{imported} / {found} tenders imported',
      'externalSources.logs.error': 'Error',

      'externalSources.toast.loadError': 'Error loading sources',
      'externalSources.toast.toggleActivated': 'Source activated',
      'externalSources.toast.toggleDeactivated': 'Source deactivated',
      'externalSources.toast.updateSuccess': 'Source updated successfully',
      'externalSources.toast.updateError': 'Error updating source',
      'externalSources.toast.syncStarted': 'Synchronization started',
      'externalSources.toast.syncStartError': 'Error starting synchronization',
    }),
    []
  );
  const { t } = useUiTranslations(locale, entries);

  const [sources, setSources] = useState<ExternalSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSource, setEditingSource] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<{
    api_key: string;
    sync_frequency: string;
  }>({
    api_key: '',
    sync_frequency: 'DAILY',
  });
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/external-sources');
      if (!response.ok) throw new Error('Failed to fetch sources');
      
      const data = await response.json();
      setSources(data.sources || []);
    } catch (error) {
      console.error('Error fetching sources:', error);
      toast.error(t('externalSources.toast.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  async function toggleSource(sourceId: string, currentStatus: boolean) {
    try {
      const response = await fetch('/api/admin/external-sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_id: sourceId,
          is_active: !currentStatus,
        }),
      });

      if (!response.ok) throw new Error('Failed to toggle source');

      toast.success(
        t(!currentStatus ? 'externalSources.toast.toggleActivated' : 'externalSources.toast.toggleDeactivated')
      );
      await fetchSources();
    } catch (error) {
      console.error('Error toggling source:', error);
      toast.error(t('externalSources.toast.updateError'));
    }
  }

  async function updateSource(sourceId: string) {
    try {
      const response = await fetch('/api/admin/external-sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_id: sourceId,
          sync_frequency: formData.sync_frequency,
          ...(formData.api_key && { api_key_encrypted: formData.api_key }),
        }),
      });

      if (!response.ok) throw new Error('Failed to update source');

      toast.success(t('externalSources.toast.updateSuccess'));
      setEditingSource(null);
      setFormData({ api_key: '', sync_frequency: 'DAILY' });
      await fetchSources();
    } catch (error) {
      console.error('Error updating source:', error);
      toast.error(t('externalSources.toast.updateError'));
    }
  }

  async function triggerSync(sourceId: string) {
    setSyncing({ ...syncing, [sourceId]: true });
    try {
      const response = await fetch('/api/admin/external-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_id: sourceId }),
      });

      if (!response.ok) throw new Error('Failed to trigger sync');

      toast.success(t('externalSources.toast.syncStarted'));
      
      // Rafraîchir les données après 4 secondes
      setTimeout(() => {
        fetchSources();
        setSyncing({ ...syncing, [sourceId]: false });
      }, 4000);
    } catch (error) {
      console.error('Error triggering sync:', error);
      toast.error(t('externalSources.toast.syncStartError'));
      setSyncing({ ...syncing, [sourceId]: false });
    }
  }

  function startEditing(source: ExternalSource) {
    setEditingSource(source.id);
    setFormData({
      api_key: '',
      sync_frequency: source.sync_frequency,
    });
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'SUCCESS': return 'text-emerald-600 bg-emerald-50';
      case 'FAILED': return 'text-rose-600 bg-rose-50';
      case 'RUNNING': return 'text-blue-600 bg-blue-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  }

  function getSuccessRateColor(rate: number): string {
    if (rate >= 90) return 'text-emerald-600';
    if (rate >= 70) return 'text-blue-600';
    if (rate >= 50) return 'text-amber-600';
    return 'text-rose-600';
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <AppLayout>
        <PageHeader
          title={t('externalSources.title')}
          subtitle={t('externalSources.subtitle')}
        />
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title={t('externalSources.title')}
        description={t('externalSources.subtitle')}
        actions={
          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              {t('externalSources.badge.activeOfTotal', {
                active: sources.filter(s => s.is_active).length,
                total: sources.length,
              })}
            </Badge>
          </div>
        }
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Stats Overview */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {sources.filter(s => s.is_active).length}
                </p>
                <p className="text-sm text-slate-500">{t('externalSources.stats.activeSources')}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ArrowPathIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {sources.reduce((sum, s) => sum + s.total_syncs, 0)}
                </p>
                <p className="text-sm text-slate-500">{t('externalSources.stats.totalSyncs')}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-violet-100 rounded-lg">
                <ChartBarIcon className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {Math.round(
                    sources.reduce((sum, s) => sum + s.success_rate, 0) / sources.length || 0
                  )}%
                </p>
                <p className="text-sm text-slate-500">{t('externalSources.stats.avgSuccessRate')}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <ClockIcon className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {sources.filter(s => s.last_sync_at).length}
                </p>
                <p className="text-sm text-slate-500">{t('externalSources.stats.recentlySynced')}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Sources List */}
        {sources.map((source) => (
          <motion.div key={source.id} variants={item}>
            <Card className="overflow-hidden">
              {/* Source Header */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{SOURCE_ICONS[source.name] || '🌐'}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        {source.name}
                        {source.is_active ? (
                          <Badge variant="success" size="sm">{t('externalSources.status.active')}</Badge>
                        ) : (
                          <Badge variant="secondary" size="sm">{t('externalSources.status.inactive')}</Badge>
                        )}
                      </h3>
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        <GlobeAltIcon className="w-4 h-4" />
                        {source.base_url}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={source.is_active}
                        onChange={() => toggleSource(source.id, source.is_active)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">
                        {source.is_active ? t('externalSources.status.active') : t('externalSources.status.inactive')}
                      </span>
                    </label>
                    <Button
                      onClick={() => triggerSync(source.id)}
                      disabled={!source.is_active || syncing[source.id]}
                      variant="secondary"
                      size="sm"
                    >
                      {syncing[source.id] ? (
                        <>
                          <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                          {t('externalSources.action.syncing')}
                        </>
                      ) : (
                        <>
                          <PlayIcon className="w-4 h-4 mr-2" />
                          {t('externalSources.action.sync')}
                        </>
                      )}
                    </Button>
                    {editingSource === source.id ? (
                      <Button
                        onClick={() => setEditingSource(null)}
                        variant="ghost"
                        size="sm"
                      >
                        {t('externalSources.action.cancel')}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => startEditing(source)}
                        variant="ghost"
                        size="sm"
                      >
                        <Cog6ToothIcon className="w-4 h-4 mr-2" />
                        {t('externalSources.action.configure')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Source Content */}
              <div className="p-6">
                {editingSource === source.id ? (
                  // Configuration Mode
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          <KeyIcon className="w-4 h-4 inline mr-1" />
                          {t('externalSources.field.apiKey')}
                        </label>
                        <div className="relative">
                          <input
                            type={showApiKey[source.id] ? 'text' : 'password'}
                            value={formData.api_key}
                            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder={t('externalSources.field.apiKey.placeholder')}
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey({ ...showApiKey, [source.id]: !showApiKey[source.id] })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showApiKey[source.id] ? (
                              <EyeSlashIcon className="w-5 h-5" />
                            ) : (
                              <EyeIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {source.api_key_encrypted && (
                          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                            <CheckCircleIcon className="w-3 h-3" />
                            {t('externalSources.field.apiKey.configured')}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          <ClockIcon className="w-4 h-4 inline mr-1" />
                          {t('externalSources.field.syncFrequency')}
                        </label>
                        <select
                          value={formData.sync_frequency}
                          onChange={(e) => setFormData({ ...formData, sync_frequency: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="HOURLY">{t('externalSources.frequency.hourly')}</option>
                          <option value="DAILY">{t('externalSources.frequency.daily')}</option>
                          <option value="WEEKLY">{t('externalSources.frequency.weekly')}</option>
                          <option value="MANUAL">{t('externalSources.frequency.manualOnly')}</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => updateSource(source.id)} variant="primary" size="sm">
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        {t('externalSources.action.save')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Info Display
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{t('externalSources.info.frequency')}</p>
                      <p className="font-medium text-slate-900">
                        {t(FREQUENCY_LABEL_KEYS[source.sync_frequency])}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{t('externalSources.info.lastSync')}</p>
                      <p className="font-medium text-slate-900">
                        {source.last_sync_at ? formatDate(source.last_sync_at, undefined, locale) : t('externalSources.value.never')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{t('externalSources.info.successRate')}</p>
                      <p className={`font-medium text-xl ${getSuccessRateColor(source.success_rate)}`}>
                        {source.success_rate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{t('externalSources.info.apiKey')}</p>
                      <p className="font-medium text-slate-900">
                        {source.api_key_encrypted ? (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircleIcon className="w-4 h-4" />
                            {t('externalSources.value.configured')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600">
                            <XCircleIcon className="w-4 h-4" />
                            {t('externalSources.value.notConfigured')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Sync Logs */}
                <div>
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5 text-indigo-600" />
                    {t('externalSources.logs.title', { count: source.recent_logs.length })}
                  </h4>
                  
                  {source.recent_logs.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                      <ClockIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">{t('externalSources.logs.empty')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {source.recent_logs.slice(0, 5).map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                              {log.status === 'SUCCESS' ? (
                                <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                              ) : log.status === 'FAILED' ? (
                                <XCircleIcon className="w-4 h-4 inline mr-1" />
                              ) : (
                                <ArrowPathIcon className="w-4 h-4 inline mr-1 animate-spin" />
                              )}
                              {log.status}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {t('externalSources.logs.importedOfFound', {
                                  imported: log.tenders_imported,
                                  found: log.tenders_found,
                                })}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatDate(log.sync_started_at, undefined, locale)}
                              </p>
                            </div>
                          </div>
                          {log.error_message && (
                            <Badge variant="danger" size="sm">
                              {t('externalSources.logs.error')}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </AppLayout>
  );
}
