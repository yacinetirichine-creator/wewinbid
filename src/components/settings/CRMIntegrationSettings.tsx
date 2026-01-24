'use client';

import { useState } from 'react';
import {
  type CRMProvider,
  type CRMConfig,
  DEFAULT_CRM_CONFIG,
  getHubSpotAuthUrl,
  getSalesforceAuthUrl
} from '@/lib/integrations/crm-integration';

interface CRMIntegrationSettingsProps {
  initialConfig?: CRMConfig;
  onSave: (config: CRMConfig) => Promise<void>;
}

const CRM_PROVIDERS: { id: CRMProvider; name: string; logo: string; description: string }[] = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    logo: '🟠',
    description: 'Synchronisez vos AO avec HubSpot CRM'
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    logo: '☁️',
    description: 'Intégration native avec Salesforce'
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    logo: '🟢',
    description: 'Connectez votre pipeline Pipedrive'
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    logo: '🔴',
    description: 'Synchronisation avec Zoho CRM'
  }
];

export function CRMIntegrationSettings({ initialConfig, onSave }: CRMIntegrationSettingsProps) {
  const [config, setConfig] = useState<CRMConfig>(initialConfig || DEFAULT_CRM_CONFIG);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleProviderSelect = (provider: CRMProvider) => {
    setConfig(prev => ({ ...prev, provider }));
    setTestResult(null);
  };

  const handleConnect = async () => {
    setIsConnecting(true);

    try {
      const clientId = process.env.NEXT_PUBLIC_HUBSPOT_CLIENT_ID || '';
      const redirectUri = `${window.location.origin}/api/integrations/crm/callback`;

      let authUrl = '';

      switch (config.provider) {
        case 'hubspot':
          authUrl = getHubSpotAuthUrl(clientId, redirectUri, [
            'crm.objects.contacts.read',
            'crm.objects.contacts.write',
            'crm.objects.companies.read',
            'crm.objects.companies.write',
            'crm.objects.deals.read',
            'crm.objects.deals.write'
          ]);
          break;
        case 'salesforce':
          authUrl = getSalesforceAuthUrl(
            process.env.NEXT_PUBLIC_SALESFORCE_CLIENT_ID || '',
            redirectUri
          );
          break;
        case 'pipedrive':
          // Pipedrive uses API key, show input
          break;
        default:
          break;
      }

      if (authUrl) {
        // Open OAuth popup
        const popup = window.open(authUrl, 'CRM OAuth', 'width=600,height=700');

        // Listen for callback
        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'crm_oauth_success') {
            setConfig(prev => ({
              ...prev,
              accessToken: event.data.accessToken,
              refreshToken: event.data.refreshToken,
              instanceUrl: event.data.instanceUrl,
              enabled: true
            }));
            setTestResult({ success: true, message: 'Connexion réussie !' });
            popup?.close();
          } else if (event.data?.type === 'crm_oauth_error') {
            setTestResult({ success: false, message: event.data.error });
            popup?.close();
          }
        };

        window.addEventListener('message', handleMessage);

        // Cleanup listener when popup closes
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            setIsConnecting(false);
          }
        }, 1000);
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur de connexion'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleApiKeySubmit = (apiKey: string) => {
    setConfig(prev => ({
      ...prev,
      apiKey,
      enabled: true
    }));
    setTestResult({ success: true, message: 'Clé API enregistrée' });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(config);
      setTestResult({ success: true, message: 'Configuration sauvegardée' });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur de sauvegarde'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = () => {
    setConfig(prev => ({
      ...prev,
      accessToken: undefined,
      refreshToken: undefined,
      apiKey: undefined,
      enabled: false
    }));
    setTestResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Intégration CRM
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Synchronisez vos appels d&apos;offres avec votre CRM pour un suivi commercial optimal
        </p>
      </div>

      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Sélectionnez votre CRM
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CRM_PROVIDERS.map(provider => (
            <button
              key={provider.id}
              onClick={() => handleProviderSelect(provider.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                config.provider === provider.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <span className="text-2xl">{provider.logo}</span>
              <h4 className="font-semibold text-slate-900 dark:text-white mt-2">
                {provider.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {provider.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${config.enabled ? 'bg-green-500' : 'bg-slate-300'}`} />
            <span className="font-medium text-slate-900 dark:text-white">
              {config.enabled ? 'Connecté' : 'Non connecté'}
            </span>
          </div>

          {config.enabled ? (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Déconnecter
            </button>
          ) : (
            config.provider === 'pipedrive' ? (
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  placeholder="Clé API Pipedrive"
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleApiKeySubmit((e.target as HTMLInputElement).value);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Clé API Pipedrive"]') as HTMLInputElement;
                    if (input?.value) handleApiKeySubmit(input.value);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Connecter
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isConnecting ? 'Connexion...' : 'Connecter'}
              </button>
            )
          )}
        </div>

        {testResult && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            testResult.success
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}>
            {testResult.message}
          </div>
        )}
      </div>

      {/* Sync Settings */}
      {config.enabled && (
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-900 dark:text-white">
            Paramètres de synchronisation
          </h4>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.syncSettings.syncTenders}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  syncSettings: { ...prev.syncSettings, syncTenders: e.target.checked }
                }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-slate-700 dark:text-slate-300">
                Synchroniser les appels d&apos;offres comme opportunités/deals
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.syncSettings.syncContacts}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  syncSettings: { ...prev.syncSettings, syncContacts: e.target.checked }
                }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-slate-700 dark:text-slate-300">
                Synchroniser les contacts des acheteurs
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.syncSettings.syncCompanies}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  syncSettings: { ...prev.syncSettings, syncCompanies: e.target.checked }
                }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-slate-700 dark:text-slate-300">
                Synchroniser les entreprises/organisations
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.syncSettings.autoCreateDeals}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  syncSettings: { ...prev.syncSettings, autoCreateDeals: e.target.checked }
                }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-slate-700 dark:text-slate-300">
                Créer automatiquement un deal lors de la réponse à un AO
              </span>
            </label>
          </div>

          {/* Deal Stage Mapping */}
          <div className="mt-6">
            <h5 className="font-medium text-slate-900 dark:text-white mb-3">
              Mapping des statuts
            </h5>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'draft', label: 'Brouillon' },
                { key: 'submitted', label: 'Soumis' },
                { key: 'underReview', label: 'En cours d\'analyse' },
                { key: 'won', label: 'Gagné' },
                { key: 'lost', label: 'Perdu' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={config.syncSettings.dealStageMapping[key as keyof typeof config.syncSettings.dealStageMapping]}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      syncSettings: {
                        ...prev.syncSettings,
                        dealStageMapping: {
                          ...prev.syncSettings.dealStageMapping,
                          [key]: e.target.value
                        }
                      }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800"
                    placeholder={`Stage ${label}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}

export default CRMIntegrationSettings;
