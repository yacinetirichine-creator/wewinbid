'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Pause,
  Play,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileCode,
  Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

interface AgentStatus {
  status: 'active' | 'paused' | 'error';
  autonomyLevel: 'low' | 'medium' | 'high';
  lastAction: string | null;
  totalActions: number;
  successRate: number;
  pendingApprovals: number;
  recentChanges: Array<{
    type: string;
    files: string[];
    impact: string;
    timestamp: string;
    approved: boolean;
  }>;
}

interface AIAgentsData {
  landingAgent: AgentStatus;
  appAgent: AgentStatus;
  recentActions: any[];
}

type UiT = (key: string, vars?: Record<string, any>) => string;

export default function AIAgentsPage() {
  const { locale } = useLocale();
  const entries = useMemo(
    () => ({
      'aiAgents.title': 'AI agents',
      'aiAgents.description': 'Monitor and control autonomous agents',

      'aiAgents.agent.landing.name': 'Landing Agent',
      'aiAgents.agent.landing.description': 'Marketing and SEO optimization',
      'aiAgents.agent.app.name': 'App Agent',
      'aiAgents.agent.app.description': 'Code maintenance and optimization',

      'aiAgents.recentActions.title': 'Recent actions (24h)',
      'aiAgents.recentActions.empty': 'No recent actions',
      'aiAgents.recentActions.files': '{count} files',
      'aiAgents.recentActions.lines': '{count} lines',

      'aiAgents.guide.title': 'Usage guide',
      'aiAgents.guide.emergencyPause.title': 'Emergency pause',
      'aiAgents.guide.emergencyPause.text': 'Click the Pause button to stop an agent immediately',
      'aiAgents.guide.autonomy.title': 'Autonomy level',
      'aiAgents.guide.autonomy.text': 'Medium = major actions require approval',
      'aiAgents.guide.pendingApprovals.title': 'Pending approvals',
      'aiAgents.guide.pendingApprovals.text': 'Review and approve proposed changes',
      'aiAgents.guide.docs.title': 'Full documentation',
      'aiAgents.guide.docs.text': 'See AI_AGENTS_GUIDE.md for all details',

      'aiAgents.error.adminOnly': 'Access restricted to administrators',
      'aiAgents.error.fetch': 'Error while fetching data',
      'aiAgents.error.unknown': 'Unknown error',
      'aiAgents.error.toggle': 'Error toggling agent:',
      'aiAgents.error.update': 'Error while updating',

      'aiAgents.agent.toggle.pause': 'Pause',
      'aiAgents.agent.toggle.resume': 'Resume',

      'aiAgents.agent.stats.actions24h': 'Actions (24h)',
      'aiAgents.agent.stats.successRate': 'Success rate',

      'aiAgents.agent.status.active': 'Active',
      'aiAgents.agent.status.error': 'Error',
      'aiAgents.agent.status.paused': 'Paused',

      'aiAgents.agent.autonomy.low': 'Low autonomy',
      'aiAgents.agent.autonomy.medium': 'Medium autonomy',
      'aiAgents.agent.autonomy.high': 'High autonomy',

      'aiAgents.agent.pendingApprovals': '{count} pending',
      'aiAgents.agent.lastAction': 'Last action: {date}',
      'aiAgents.agent.recentChanges': 'Recent changes',
    }),
    []
  );
  const { t } = useUiTranslations(locale, entries);

  const [data, setData] = useState<AIAgentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentsStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-agents/status');
      if (!response.ok) {
        if (response.status === 403) {
          setError(t('aiAgents.error.adminOnly'));
          return;
        }
        throw new Error(t('aiAgents.error.fetch'));
      }
      const data = await response.json();
      setData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('aiAgents.error.unknown'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAgentsStatus();
    // Refresh toutes les 30 secondes
    const interval = setInterval(fetchAgentsStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchAgentsStatus]);

  const toggleAgent = async (agentName: 'landing' | 'app', enabled: boolean) => {
    try {
      const response = await fetch('/api/ai-agents/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName, enabled }),
      });

      if (!response.ok) throw new Error(t('aiAgents.error.update'));

      await fetchAgentsStatus();
    } catch (err) {
      console.error(t('aiAgents.error.toggle'), err);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-3" />
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={t('aiAgents.title')}
        description={t('aiAgents.description')}
      />

      <div className="p-8 space-y-6">
        {/* Vue d'ensemble */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Landing Agent */}
          <AgentCard
            name={t('aiAgents.agent.landing.name')}
            description={t('aiAgents.agent.landing.description')}
            icon={<Zap className="h-6 w-6" />}
            status={data.landingAgent}
            locale={locale}
            t={t}
            onToggle={(enabled) => toggleAgent('landing', enabled)}
          />

          {/* App Agent */}
          <AgentCard
            name={t('aiAgents.agent.app.name')}
            description={t('aiAgents.agent.app.description')}
            icon={<FileCode className="h-6 w-6" />}
            status={data.appAgent}
            locale={locale}
            t={t}
            onToggle={(enabled) => toggleAgent('app', enabled)}
          />
        </div>

        {/* Actions récentes globales */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            {t('aiAgents.recentActions.title')}
          </h3>
          {data.recentActions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {t('aiAgents.recentActions.empty')}
            </p>
          ) : (
            <div className="space-y-3">
              {data.recentActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      action.agent_name === 'landing'
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {action.agent_name === 'landing' ? (
                      <Zap className="h-4 w-4" />
                    ) : (
                      <FileCode className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {action.action_type.replace(/_/g, ' ')}
                      </span>
                      {action.approved ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{action.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{t('aiAgents.recentActions.files', { count: action.files_modified?.length || 0 })}</span>
                      <span>{t('aiAgents.recentActions.lines', { count: action.lines_changed || 0 })}</span>
                      <span>
                        {new Date(action.created_at).toLocaleString(locale)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* Guide d'utilisation */}
        <Card className="p-6 bg-blue-50 border border-blue-200">
          <h3 className="text-lg font-semibold mb-3 text-blue-900">
            📚 {t('aiAgents.guide.title')}
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>
              • <strong>{t('aiAgents.guide.emergencyPause.title')}</strong>: {t('aiAgents.guide.emergencyPause.text')}
            </li>
            <li>
              • <strong>{t('aiAgents.guide.autonomy.title')}</strong>: {t('aiAgents.guide.autonomy.text')}
            </li>
            <li>
              • <strong>{t('aiAgents.guide.pendingApprovals.title')}</strong>: {t('aiAgents.guide.pendingApprovals.text')}
            </li>
            <li>
              • <strong>{t('aiAgents.guide.docs.title')}</strong>: {t('aiAgents.guide.docs.text')}
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

// Composant carte agent
interface AgentCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: AgentStatus;
  locale: string;
  t: UiT;
  onToggle: (enabled: boolean) => void;
}

function AgentCard({ name, description, icon, status, locale, t, onToggle }: AgentCardProps) {
  const isActive = status.status === 'active';
  const hasError = status.status === 'error';

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-lg ${
              hasError
                ? 'bg-red-100 text-red-600'
                : isActive
                ? 'bg-green-100 text-green-600'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{name}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        <button
          onClick={() => onToggle(!isActive)}
          className={`p-2 rounded-lg transition-colors ${
            isActive
              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
          title={isActive ? t('aiAgents.agent.toggle.pause') : t('aiAgents.agent.toggle.resume')}
        >
          {isActive ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {status.totalActions}
          </div>
          <div className="text-xs text-gray-600">{t('aiAgents.agent.stats.actions24h')}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {status.successRate}%
          </div>
          <div className="text-xs text-gray-600">{t('aiAgents.agent.stats.successRate')}</div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            hasError
              ? 'bg-red-100 text-red-700'
              : isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {status.status === 'active'
            ? t('aiAgents.agent.status.active')
            : status.status === 'error'
            ? t('aiAgents.agent.status.error')
            : t('aiAgents.agent.status.paused')}
        </span>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
          {status.autonomyLevel === 'low'
            ? t('aiAgents.agent.autonomy.low')
            : status.autonomyLevel === 'high'
            ? t('aiAgents.agent.autonomy.high')
            : t('aiAgents.agent.autonomy.medium')}
        </span>
        {status.pendingApprovals > 0 && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
            {t('aiAgents.agent.pendingApprovals', { count: status.pendingApprovals })}
          </span>
        )}
      </div>

      {/* Dernière action */}
      {status.lastAction && (
        <div className="text-xs text-gray-600">
          {t('aiAgents.agent.lastAction', { date: new Date(status.lastAction).toLocaleString(locale) })}
        </div>
      )}

      {/* Actions récentes */}
      {status.recentChanges.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">{t('aiAgents.agent.recentChanges')}</h4>
          <div className="space-y-2">
            {status.recentChanges.slice(0, 3).map((change, index) => (
              <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">
                    {change.type.replace(/_/g, ' ')}
                  </span>
                  {change.approved ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <Clock className="h-3 w-3 text-yellow-600" />
                  )}
                </div>
                <p className="text-gray-600">{change.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
