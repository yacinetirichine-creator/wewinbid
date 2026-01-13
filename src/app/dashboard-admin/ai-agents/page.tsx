'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Activity,
  Pause,
  Play,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileCode,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui';

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

export default function AIAgentsPage() {
  const [data, setData] = useState<AIAgentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgentsStatus();
    // Refresh toutes les 30 secondes
    const interval = setInterval(fetchAgentsStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAgentsStatus = async () => {
    try {
      const response = await fetch('/api/ai-agents/status');
      if (!response.ok) {
        if (response.status === 403) {
          setError('Accès réservé aux administrateurs');
          return;
        }
        throw new Error('Erreur lors de la récupération des données');
      }
      const data = await response.json();
      setData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const toggleAgent = async (agentName: 'landing' | 'app', enabled: boolean) => {
    try {
      const response = await fetch('/api/ai-agents/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName, enabled }),
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour');

      await fetchAgentsStatus();
    } catch (err) {
      console.error('Erreur toggle agent:', err);
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
        title="Agents IA"
        description="Surveillance et contrôle des agents autonomes"
      />

      <div className="p-8 space-y-6">
        {/* Vue d'ensemble */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Landing Agent */}
          <AgentCard
            name="Landing Agent"
            description="Optimisation marketing et SEO"
            icon={<Zap className="h-6 w-6" />}
            status={data.landingAgent}
            onToggle={(enabled) => toggleAgent('landing', enabled)}
          />

          {/* App Agent */}
          <AgentCard
            name="App Agent"
            description="Maintenance et optimisation code"
            icon={<FileCode className="h-6 w-6" />}
            status={data.appAgent}
            onToggle={(enabled) => toggleAgent('app', enabled)}
          />
        </div>

        {/* Actions récentes globales */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Actions récentes (24h)
          </h3>
          {data.recentActions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aucune action récente
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
                      <span>{action.files_modified?.length || 0} fichiers</span>
                      <span>{action.lines_changed || 0} lignes</span>
                      <span>
                        {new Date(action.created_at).toLocaleString('fr-FR')}
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
            📚 Guide d'utilisation
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>
              • <strong>Pause d'urgence</strong> : Cliquez sur le bouton Pause pour
              arrêter un agent immédiatement
            </li>
            <li>
              • <strong>Niveau d'autonomie</strong> : Medium = actions majeures
              nécessitent approbation
            </li>
            <li>
              • <strong>Approbations en attente</strong> : Consultez et approuvez les
              modifications proposées
            </li>
            <li>
              • <strong>Documentation complète</strong> : Voir AI_AGENTS_GUIDE.md pour
              tous les détails
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
  onToggle: (enabled: boolean) => void;
}

function AgentCard({ name, description, icon, status, onToggle }: AgentCardProps) {
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
          title={isActive ? 'Pause' : 'Reprendre'}
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
          <div className="text-xs text-gray-600">Actions (24h)</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {status.successRate}%
          </div>
          <div className="text-xs text-gray-600">Taux de succès</div>
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
            ? 'Actif'
            : status.status === 'error'
            ? 'Erreur'
            : 'En pause'}
        </span>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
          {status.autonomyLevel === 'low'
            ? 'Basse autonomie'
            : status.autonomyLevel === 'high'
            ? 'Haute autonomie'
            : 'Autonomie moyenne'}
        </span>
        {status.pendingApprovals > 0 && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
            {status.pendingApprovals} en attente
          </span>
        )}
      </div>

      {/* Dernière action */}
      {status.lastAction && (
        <div className="text-xs text-gray-600">
          Dernière action :{' '}
          {new Date(status.lastAction).toLocaleString('fr-FR')}
        </div>
      )}

      {/* Actions récentes */}
      {status.recentChanges.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Changements récents</h4>
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
