'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  MessageSquare,
  Hash,
  Bell,
  CheckCircle,
  XCircle,
  Send,
  Settings,
  Zap,
  Link,
  TestTube,
  Loader2,
} from 'lucide-react';

interface IntegrationConfig {
  platform: 'slack' | 'teams';
  webhook_url: string;
  is_enabled: boolean;
  events: {
    new_tender: boolean;
    deadline_reminder: boolean;
    status_change: boolean;
    score_update: boolean;
  };
}

interface SlackTeamsIntegrationsProps {
  onSave?: (configs: IntegrationConfig[]) => void;
}

// Logo Slack SVG
function SlackLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 127 127" xmlns="http://www.w3.org/2000/svg">
      <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z" fill="#E01E5A"/>
      <path d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z" fill="#36C5F0"/>
      <path d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z" fill="#2EB67D"/>
      <path d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z" fill="#ECB22E"/>
    </svg>
  );
}

// Logo Teams SVG
function TeamsLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 2228.833 2073.333" xmlns="http://www.w3.org/2000/svg">
      <path fill="#5059C9" d="M1554.637 777.5h575.713c54.391 0 98.483 44.092 98.483 98.483v524.398c0 199.901-162.051 361.952-361.952 361.952h-.091c-199.901.001-361.952-162.051-361.952-361.952V875.419c0-54.074 43.829-97.919 97.903-97.919h-.104z"/>
      <circle fill="#5059C9" cx="1943.75" cy="440.583" r="233.25"/>
      <circle fill="#7B83EB" cx="1218.083" cy="336.917" r="336.917"/>
      <path fill="#7B83EB" d="M1667.323 777.5H717.01c-53.743 1.33-96.257 45.931-95.01 99.676v598.105c-7.505 322.519 247.657 590.16 570.167 598.053 322.51-7.893 577.671-275.534 570.167-598.053V877.176c1.245-53.745-41.268-98.346-95.011-99.676z"/>
      <path d="M1244 777.5v838.145c-.258 38.435-23.549 72.964-59.09 87.598-11.316 4.787-23.478 7.254-35.765 7.257H667.613c-6.738-17.105-12.958-34.21-18.142-51.833-18.144-59.477-27.402-121.307-27.472-183.49V877.02c-1.246-53.659 41.198-98.19 94.855-99.52H1244z" opacity=".1"/>
      <path d="M1192.167 777.5v889.978a91.84 91.84 0 0 1-7.257 35.765c-14.634 35.541-49.163 58.833-87.598 59.09H691.975c-8.812-17.105-17.105-34.21-24.362-51.833a585.906 585.906 0 0 1-18.142-51.833c-18.144-59.477-27.402-121.307-27.472-183.49V877.02c-1.246-53.659 41.198-98.19 94.855-99.52h475.313z" opacity=".2"/>
      <path d="M1192.167 777.5v786.312c-.395 52.223-42.632 94.46-94.855 94.855H649.471c-18.144-59.477-27.402-121.307-27.472-183.49V877.02c-1.246-53.659 41.198-98.19 94.855-99.52h475.313z" opacity=".2"/>
      <path d="M1140.333 777.5v786.312c-.395 52.223-42.632 94.46-94.855 94.855H649.471c-18.144-59.477-27.402-121.307-27.472-183.49V877.02c-1.246-53.659 41.198-98.19 94.855-99.52h423.479z" opacity=".2"/>
      <linearGradient id="a" gradientUnits="userSpaceOnUse" x1="198.099" y1="1683.073" x2="942.234" y2="394.261" gradientTransform="matrix(1 0 0 -1 0 2075.333)">
        <stop offset="0" stopColor="#5a62c3"/>
        <stop offset=".5" stopColor="#4d55bd"/>
        <stop offset="1" stopColor="#3940ab"/>
      </linearGradient>
      <path fill="url(#a)" d="M95.01 777.5h950.312c52.473 0 95.01 42.538 95.01 95.01v950.312c0 52.473-42.538 95.01-95.01 95.01H95.01c-52.473 0-95.01-42.538-95.01-95.01V872.51c0-52.472 42.538-95.01 95.01-95.01z"/>
      <path fill="#FFF" d="M820.211 1100.322H630.241v517.297H509.211v-517.297H320.123V999.869h500.088v100.453z"/>
    </svg>
  );
}

export function SlackTeamsIntegrations({ onSave }: SlackTeamsIntegrationsProps) {
  const [configs, setConfigs] = useState<IntegrationConfig[]>([
    {
      platform: 'slack',
      webhook_url: '',
      is_enabled: false,
      events: {
        new_tender: true,
        deadline_reminder: true,
        status_change: true,
        score_update: false,
      },
    },
    {
      platform: 'teams',
      webhook_url: '',
      is_enabled: false,
      events: {
        new_tender: true,
        deadline_reminder: true,
        status_change: true,
        score_update: false,
      },
    },
  ]);
  const [testing, setTesting] = useState<'slack' | 'teams' | null>(null);
  const [testResult, setTestResult] = useState<{ platform: string; success: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const updateConfig = (
    platform: 'slack' | 'teams',
    updates: Partial<IntegrationConfig>
  ) => {
    setConfigs(prev =>
      prev.map(c =>
        c.platform === platform ? { ...c, ...updates } : c
      )
    );
  };

  const updateEvent = (
    platform: 'slack' | 'teams',
    event: keyof IntegrationConfig['events'],
    value: boolean
  ) => {
    setConfigs(prev =>
      prev.map(c =>
        c.platform === platform
          ? { ...c, events: { ...c.events, [event]: value } }
          : c
      )
    );
  };

  const testConnection = async (platform: 'slack' | 'teams') => {
    const config = configs.find(c => c.platform === platform);
    if (!config?.webhook_url) return;

    setTesting(platform);
    setTestResult(null);

    try {
      const response = await fetch('/api/integrations/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          event_type: 'new',
          webhook_url: config.webhook_url,
          tender_data: {
            id: 'test',
            title: '🧪 Test de connexion WeWinBid',
            reference: 'TEST-001',
            type: 'PUBLIC',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            score: 85,
          },
        }),
      });

      const success = response.ok;
      setTestResult({ platform, success });
    } catch {
      setTestResult({ platform, success: false });
    } finally {
      setTesting(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrations: configs }),
      });

      if (onSave) {
        onSave(configs);
      }
    } catch (error) {
      console.error('Error saving integrations:', error);
    } finally {
      setSaving(false);
    }
  };

  const eventLabels = {
    new_tender: 'Nouvel appel d\'offres',
    deadline_reminder: 'Rappel de deadline',
    status_change: 'Changement de statut',
    score_update: 'Mise à jour du score',
  };

  return (
    <div className="space-y-6">
      {/* Slack Integration */}
      <IntegrationCard
        platform="slack"
        logo={<SlackLogo className="h-8 w-8" />}
        title="Slack"
        description="Recevez des notifications dans vos canaux Slack"
        config={configs.find(c => c.platform === 'slack')!}
        onUpdate={(updates) => updateConfig('slack', updates)}
        onUpdateEvent={(event, value) => updateEvent('slack', event, value)}
        onTest={() => testConnection('slack')}
        testing={testing === 'slack'}
        testResult={testResult?.platform === 'slack' ? testResult.success : undefined}
        eventLabels={eventLabels}
      />

      {/* Teams Integration */}
      <IntegrationCard
        platform="teams"
        logo={<TeamsLogo className="h-8 w-8" />}
        title="Microsoft Teams"
        description="Recevez des notifications dans vos canaux Teams"
        config={configs.find(c => c.platform === 'teams')!}
        onUpdate={(updates) => updateConfig('teams', updates)}
        onUpdateEvent={(event, value) => updateEvent('teams', event, value)}
        onTest={() => testConnection('teams')}
        testing={testing === 'teams'}
        testResult={testResult?.platform === 'teams' ? testResult.success : undefined}
        eventLabels={eventLabels}
      />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
}

interface IntegrationCardProps {
  platform: 'slack' | 'teams';
  logo: React.ReactNode;
  title: string;
  description: string;
  config: IntegrationConfig;
  onUpdate: (updates: Partial<IntegrationConfig>) => void;
  onUpdateEvent: (event: keyof IntegrationConfig['events'], value: boolean) => void;
  onTest: () => void;
  testing: boolean;
  testResult?: boolean;
  eventLabels: Record<string, string>;
}

function IntegrationCard({
  platform,
  logo,
  title,
  description,
  config,
  onUpdate,
  onUpdateEvent,
  onTest,
  testing,
  testResult,
  eventLabels,
}: IntegrationCardProps) {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
              {logo}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                {title}
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {description}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.is_enabled}
              onChange={(e) => onUpdate({ is_enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-200 dark:bg-surface-700 peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        {config.is_enabled && (
          <div className="space-y-4">
            {/* Webhook URL */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
                URL du Webhook
              </label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={config.webhook_url}
                  onChange={(e) => onUpdate({ webhook_url: e.target.value })}
                  placeholder={platform === 'slack' 
                    ? 'https://hooks.slack.com/services/...' 
                    : 'https://outlook.office.com/webhook/...'}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={onTest}
                  disabled={!config.webhook_url || testing}
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  Tester
                </Button>
              </div>
              {testResult !== undefined && (
                <p className={`mt-2 text-sm flex items-center gap-1 ${
                  testResult ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {testResult ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Connexion réussie ! Vérifiez votre canal.
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      Échec de la connexion. Vérifiez l'URL du webhook.
                    </>
                  )}
                </p>
              )}
              <p className="mt-2 text-xs text-surface-400 dark:text-surface-500">
                {platform === 'slack' ? (
                  <>
                    Créez un webhook dans les{' '}
                    <a
                      href="https://api.slack.com/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      paramètres Slack
                    </a>
                  </>
                ) : (
                  <>
                    Créez un webhook dans les{' '}
                    <a
                      href="https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      connecteurs Teams
                    </a>
                  </>
                )}
              </p>
            </div>

            {/* Events */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-3">
                Événements à notifier
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(eventLabels).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 cursor-pointer p-3 bg-surface-50 dark:bg-surface-800 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={config.events[key as keyof IntegrationConfig['events']]}
                      onChange={(e) =>
                        onUpdateEvent(
                          key as keyof IntegrationConfig['events'],
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-surface-700 dark:text-surface-200">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default SlackTeamsIntegrations;
