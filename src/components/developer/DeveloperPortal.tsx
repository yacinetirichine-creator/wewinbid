'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  Key,
  Webhook,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Zap,
  AlertTriangle,
  Loader2,
  X,
  RefreshCw,
  ChevronRight,
  Code,
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  description?: string;
  key_prefix: string;
  key?: string; // Seulement à la création
  scopes: string[];
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  expires_at?: string;
  last_used_at?: string;
  is_active: boolean;
  created_at: string;
}

interface WebhookConfig {
  id: string;
  name: string;
  description?: string;
  url: string;
  secret?: string; // Seulement à la création
  events: string[];
  is_active: boolean;
  retry_count: number;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  last_delivery_at?: string;
  last_success_at?: string;
  last_failure_at?: string;
  created_at: string;
}

const AVAILABLE_SCOPES = [
  { value: 'read:tenders', label: 'Lire les appels d\'offres' },
  { value: 'write:tenders', label: 'Modifier les appels d\'offres' },
  { value: 'read:responses', label: 'Lire les réponses' },
  { value: 'write:responses', label: 'Modifier les réponses' },
  { value: 'read:documents', label: 'Lire les documents' },
  { value: 'write:documents', label: 'Téléverser des documents' },
  { value: 'read:calendar', label: 'Lire le calendrier' },
  { value: 'write:calendar', label: 'Modifier le calendrier' },
  { value: 'read:analytics', label: 'Lire les analytics' },
  { value: 'webhooks:manage', label: 'Gérer les webhooks' },
];

const AVAILABLE_EVENTS = [
  { value: 'tender.created', label: 'Appel d\'offres créé' },
  { value: 'tender.updated', label: 'Appel d\'offres modifié' },
  { value: 'tender.deleted', label: 'Appel d\'offres supprimé' },
  { value: 'tender.deadline_approaching', label: 'Deadline approche' },
  { value: 'response.created', label: 'Réponse créée' },
  { value: 'response.submitted', label: 'Réponse soumise' },
  { value: 'response.status_changed', label: 'Statut réponse modifié' },
  { value: 'approval.requested', label: 'Approbation demandée' },
  { value: 'approval.approved', label: 'Approbation acceptée' },
  { value: 'approval.rejected', label: 'Approbation refusée' },
  { value: 'document.uploaded', label: 'Document téléversé' },
  { value: 'document.signed', label: 'Document signé' },
];

export function DeveloperPortal() {
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'docs'>('keys');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false);
  const [newKey, setNewKey] = useState<ApiKey | null>(null);
  const [newWebhook, setNewWebhook] = useState<WebhookConfig | null>(null);

  // Form states
  const [keyForm, setKeyForm] = useState({
    name: '',
    description: '',
    scopes: ['read:tenders'] as string[],
    expires_in_days: '',
  });
  const [webhookForm, setWebhookForm] = useState({
    name: '',
    description: '',
    url: '',
    events: [] as string[],
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [keysRes, webhooksRes] = await Promise.all([
        fetch('/api/developer/keys'),
        fetch('/api/developer/webhooks'),
      ]);

      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setApiKeys(keysData.api_keys || []);
      }

      if (webhooksRes.ok) {
        const webhooksData = await webhooksRes.json();
        setWebhooks(webhooksData.webhooks || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!keyForm.name) return;

    setCreating(true);
    try {
      const response = await fetch('/api/developer/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: keyForm.name,
          description: keyForm.description,
          scopes: keyForm.scopes,
          expires_in_days: keyForm.expires_in_days ? parseInt(keyForm.expires_in_days) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewKey(data.api_key);
        setShowCreateKeyModal(false);
        setKeyForm({ name: '', description: '', scopes: ['read:tenders'], expires_in_days: '' });
        await fetchData();
      }
    } catch (error) {
      console.error('Error creating key:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!webhookForm.name || !webhookForm.url || webhookForm.events.length === 0) return;

    setCreating(true);
    try {
      const response = await fetch('/api/developer/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookForm),
      });

      if (response.ok) {
        const data = await response.json();
        setNewWebhook(data.webhook);
        setShowCreateWebhookModal(false);
        setWebhookForm({ name: '', description: '', url: '', events: [] });
        await fetchData();
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette clé API ?')) return;

    try {
      await fetch(`/api/developer/keys/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Error deleting key:', error);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce webhook ?')) return;

    try {
      await fetch(`/api/developer/webhooks/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Error deleting webhook:', error);
    }
  };

  const handleToggleWebhook = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/developer/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });
      await fetchData();
    } catch (error) {
      console.error('Error toggling webhook:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
          Portail Développeur
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Gérez vos clés API et webhooks pour intégrer WeWinBid à vos applications.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-200 dark:border-surface-700">
        <button
          onClick={() => setActiveTab('keys')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'keys'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          <Key className="h-4 w-4 inline-block mr-2" />
          Clés API
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'webhooks'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          <Webhook className="h-4 w-4 inline-block mr-2" />
          Webhooks
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'docs'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          <Code className="h-4 w-4 inline-block mr-2" />
          Documentation
        </button>
      </div>

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowCreateKeyModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle clé API
            </Button>
          </div>

          {apiKeys.length === 0 ? (
            <Card>
              <div className="p-12 text-center">
                <Key className="h-12 w-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
                  Aucune clé API
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                  Créez votre première clé API pour commencer à utiliser l'API WeWinBid.
                </p>
                <Button onClick={() => setShowCreateKeyModal(true)}>
                  Créer une clé API
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <Card key={key.id}>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-surface-900 dark:text-surface-100">
                            {key.name}
                          </h3>
                          <Badge variant={key.is_active ? 'success' : 'default'}>
                            {key.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                          {key.description || 'Pas de description'}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <code className="px-2 py-1 bg-surface-100 dark:bg-surface-800 rounded text-surface-600 dark:text-surface-300">
                            {key.key_prefix}
                          </code>
                          <span className="text-surface-400">
                            Créé le {new Date(key.created_at).toLocaleDateString('fr-FR')}
                          </span>
                          {key.last_used_at && (
                            <span className="text-surface-400">
                              Dernière utilisation :{' '}
                              {new Date(key.last_used_at).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {key.scopes.map((scope) => (
                            <Badge key={scope} variant="default" className="text-xs">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKey(key.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowCreateWebhookModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau webhook
            </Button>
          </div>

          {webhooks.length === 0 ? (
            <Card>
              <div className="p-12 text-center">
                <Webhook className="h-12 w-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
                  Aucun webhook
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                  Créez des webhooks pour recevoir des notifications en temps réel.
                </p>
                <Button onClick={() => setShowCreateWebhookModal(true)}>
                  Créer un webhook
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => {
                const successRate =
                  webhook.total_deliveries > 0
                    ? Math.round((webhook.successful_deliveries / webhook.total_deliveries) * 100)
                    : 100;

                return (
                  <Card key={webhook.id}>
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-surface-900 dark:text-surface-100">
                              {webhook.name}
                            </h3>
                            <Badge variant={webhook.is_active ? 'success' : 'default'}>
                              {webhook.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 truncate">
                            {webhook.url}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {webhook.events.slice(0, 4).map((event) => (
                              <Badge key={event} variant="default" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                            {webhook.events.length > 4 && (
                              <Badge variant="default" className="text-xs">
                                +{webhook.events.length - 4}
                              </Badge>
                            )}
                          </div>
                          {webhook.total_deliveries > 0 && (
                            <div className="flex items-center gap-4 mt-3 text-sm text-surface-500 dark:text-surface-400">
                              <span>
                                {webhook.total_deliveries} livraisons
                              </span>
                              <span className={successRate >= 90 ? 'text-emerald-500' : successRate >= 70 ? 'text-amber-500' : 'text-red-500'}>
                                {successRate}% succès
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleWebhook(webhook.id, webhook.is_active)}
                          >
                            {webhook.is_active ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteWebhook(webhook.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Documentation Tab */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
                Démarrage rapide
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-surface-900 dark:text-surface-100 mb-2">
                    1. Authentification
                  </h4>
                  <p className="text-sm text-surface-600 dark:text-surface-300 mb-2">
                    Incluez votre clé API dans le header Authorization de chaque requête :
                  </p>
                  <pre className="p-4 bg-surface-900 dark:bg-surface-950 text-surface-100 rounded-lg text-sm overflow-x-auto">
{`curl -X GET "https://api.wewinbid.com/v1/tenders" \\
  -H "Authorization: Bearer ww_your_api_key"`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium text-surface-900 dark:text-surface-100 mb-2">
                    2. Endpoints disponibles
                  </h4>
                  <div className="space-y-2">
                    {[
                      { method: 'GET', path: '/v1/tenders', desc: 'Liste des appels d\'offres' },
                      { method: 'GET', path: '/v1/tenders/:id', desc: 'Détail d\'un appel d\'offres' },
                      { method: 'POST', path: '/v1/tenders', desc: 'Créer un appel d\'offres' },
                      { method: 'GET', path: '/v1/responses', desc: 'Liste des réponses' },
                      { method: 'POST', path: '/v1/responses', desc: 'Créer une réponse' },
                      { method: 'GET', path: '/v1/calendar/events', desc: 'Événements calendrier' },
                    ].map((endpoint) => (
                      <div
                        key={endpoint.path}
                        className="flex items-center gap-3 p-2 bg-surface-50 dark:bg-surface-800 rounded"
                      >
                        <Badge
                          variant={endpoint.method === 'GET' ? 'success' : 'warning'}
                          className="w-16 justify-center"
                        >
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm text-surface-700 dark:text-surface-200">
                          {endpoint.path}
                        </code>
                        <span className="text-sm text-surface-500">
                          {endpoint.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-surface-900 dark:text-surface-100 mb-2">
                    3. Webhooks
                  </h4>
                  <p className="text-sm text-surface-600 dark:text-surface-300 mb-2">
                    Vérifiez la signature des webhooks avec le header X-WeWinBid-Signature :
                  </p>
                  <pre className="p-4 bg-surface-900 dark:bg-surface-950 text-surface-100 rounded-lg text-sm overflow-x-auto">
{`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return signature === expected;
}`}
                  </pre>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
                Rate Limiting
              </h3>
              <p className="text-sm text-surface-600 dark:text-surface-300 mb-4">
                L'API est limitée à 60 requêtes par minute et 10 000 requêtes par jour par défaut.
                Les headers suivants sont inclus dans chaque réponse :
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 bg-surface-50 dark:bg-surface-800 rounded">
                  <code className="text-sm font-mono">X-RateLimit-Limit</code>
                  <span className="text-sm text-surface-500">Limite de requêtes</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-surface-50 dark:bg-surface-800 rounded">
                  <code className="text-sm font-mono">X-RateLimit-Remaining</code>
                  <span className="text-sm text-surface-500">Requêtes restantes</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-surface-50 dark:bg-surface-800 rounded">
                  <code className="text-sm font-mono">X-RateLimit-Reset</code>
                  <span className="text-sm text-surface-500">Timestamp de réinitialisation</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* New Key Display Modal */}
      {newKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-900 rounded-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                    Clé API créée !
                  </h3>
                  <p className="text-sm text-surface-500">
                    Copiez cette clé maintenant, elle ne sera plus affichée.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Important</span>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Cette clé ne sera affichée qu'une seule fois. Sauvegardez-la dans un endroit sûr.
                </p>
              </div>

              <div className="relative">
                <code className="block w-full p-4 bg-surface-900 dark:bg-surface-950 text-emerald-400 rounded-lg text-sm font-mono break-all">
                  {newKey.key}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(newKey.key!)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={() => setNewKey(null)}>
                  J'ai copié ma clé
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Webhook Display Modal */}
      {newWebhook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-900 rounded-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                    Webhook créé !
                  </h3>
                  <p className="text-sm text-surface-500">
                    Copiez ce secret pour vérifier les signatures.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Important</span>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Ce secret ne sera affiché qu'une seule fois. Sauvegardez-le pour vérifier les signatures.
                </p>
              </div>

              <div className="relative">
                <code className="block w-full p-4 bg-surface-900 dark:bg-surface-950 text-emerald-400 rounded-lg text-sm font-mono break-all">
                  {newWebhook.secret}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(newWebhook.secret!)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={() => setNewWebhook(null)}>
                  J'ai copié mon secret
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      {showCreateKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                  Nouvelle clé API
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateKeyModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1">
                    Nom *
                  </label>
                  <Input
                    value={keyForm.name}
                    onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })}
                    placeholder="Ex: Production API"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={keyForm.description}
                    onChange={(e) => setKeyForm({ ...keyForm, description: e.target.value })}
                    placeholder="Description optionnelle"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
                    Permissions
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {AVAILABLE_SCOPES.map((scope) => (
                      <label key={scope.value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={keyForm.scopes.includes(scope.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setKeyForm({ ...keyForm, scopes: [...keyForm.scopes, scope.value] });
                            } else {
                              setKeyForm({
                                ...keyForm,
                                scopes: keyForm.scopes.filter((s) => s !== scope.value),
                              });
                            }
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-surface-700 dark:text-surface-200">
                          {scope.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1">
                    Expire dans (jours)
                  </label>
                  <Input
                    type="number"
                    value={keyForm.expires_in_days}
                    onChange={(e) => setKeyForm({ ...keyForm, expires_in_days: e.target.value })}
                    placeholder="Vide = jamais"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowCreateKeyModal(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateKey} disabled={!keyForm.name || creating} loading={creating}>
                  Créer la clé
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Webhook Modal */}
      {showCreateWebhookModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                  Nouveau webhook
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateWebhookModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1">
                    Nom *
                  </label>
                  <Input
                    value={webhookForm.name}
                    onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                    placeholder="Ex: Notifications Slack"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1">
                    URL *
                  </label>
                  <Input
                    type="url"
                    value={webhookForm.url}
                    onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                    placeholder="https://your-app.com/webhook"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={webhookForm.description}
                    onChange={(e) => setWebhookForm({ ...webhookForm, description: e.target.value })}
                    placeholder="Description optionnelle"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
                    Événements *
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {AVAILABLE_EVENTS.map((event) => (
                      <label key={event.value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={webhookForm.events.includes(event.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setWebhookForm({
                                ...webhookForm,
                                events: [...webhookForm.events, event.value],
                              });
                            } else {
                              setWebhookForm({
                                ...webhookForm,
                                events: webhookForm.events.filter((ev) => ev !== event.value),
                              });
                            }
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-surface-700 dark:text-surface-200">
                          {event.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowCreateWebhookModal(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateWebhook}
                  disabled={!webhookForm.name || !webhookForm.url || webhookForm.events.length === 0 || creating}
                  loading={creating}
                >
                  Créer le webhook
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeveloperPortal;
