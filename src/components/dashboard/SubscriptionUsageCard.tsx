'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface UsageStats {
  subscription: {
    plan: string;
    status: string;
    isActive: boolean;
  };
  usage: {
    tenders: {
      current: number;
      limit: number;
      percentage: number;
    };
    collaborators: {
      current: number;
      limit: number;
      percentage: number;
    };
    storage: {
      current: number;
      limit: number;
      percentage: number;
    };
  };
  features: {
    aiScore: boolean;
    winnerAnalysis: boolean;
    marketplace: boolean;
    coEditing: boolean;
    api: boolean;
  };
}

export function SubscriptionUsageCard() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/subscription/usage')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching usage stats:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface-200 rounded w-1/3"></div>
          <div className="h-4 bg-surface-200 rounded w-2/3"></div>
          <div className="h-4 bg-surface-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const { subscription, usage } = stats;
  const tendersPercentage = usage.tenders.percentage;
  const isNearLimit = tendersPercentage >= 80;
  const isAtLimit = tendersPercentage >= 100;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-surface-900 mb-1">
            Plan {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
          </h3>
          <p className="text-sm text-surface-500">
            {subscription.isActive ? 'Actif' : 'Inactif'}
          </p>
        </div>
        <Link
          href="/settings?tab=billing"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Gérer
        </Link>
      </div>

      {/* Quota réponses AO */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-surface-700">
              Réponses aux AO ce mois
            </span>
            <span className="text-sm font-medium text-surface-900">
              {usage.tenders.current} / {usage.tenders.limit === Infinity ? '∞' : usage.tenders.limit}
            </span>
          </div>
          
          {usage.tenders.limit !== Infinity && (
            <>
              <div className="w-full bg-surface-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isAtLimit
                      ? 'bg-error-500'
                      : isNearLimit
                      ? 'bg-warning-500'
                      : 'bg-primary-500'
                  }`}
                  style={{ width: `${Math.min(tendersPercentage, 100)}%` }}
                />
              </div>

              {isAtLimit && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-error-50 border border-error-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-error-900 mb-1">
                      Limite atteinte
                    </p>
                    <p className="text-sm text-error-700">
                      Vous avez atteint votre limite de {usage.tenders.limit} réponses ce mois.{' '}
                      <Link
                        href="/pricing"
                        className="font-medium underline hover:no-underline"
                      >
                        Passez à un plan supérieur
                      </Link>
                      {' '}pour créer plus de réponses.
                    </p>
                  </div>
                </div>
              )}

              {isNearLimit && !isAtLimit && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-warning-900 mb-1">
                      Proche de la limite
                    </p>
                    <p className="text-sm text-warning-700">
                      Vous approchez de votre limite mensuelle.{' '}
                      <Link
                        href="/pricing"
                        className="font-medium underline hover:no-underline"
                      >
                        Upgrader votre plan
                      </Link>
                      {' '}pour plus de réponses.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Collaborateurs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-surface-700">
              Collaborateurs
            </span>
            <span className="text-sm font-medium text-surface-900">
              {usage.collaborators.current} / {usage.collaborators.limit}
            </span>
          </div>
          <div className="w-full bg-surface-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${Math.min(usage.collaborators.percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Stockage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-surface-700">
              Stockage
            </span>
            <span className="text-sm font-medium text-surface-900">
              {usage.storage.current.toFixed(1)} GB / {usage.storage.limit} GB
            </span>
          </div>
          <div className="w-full bg-surface-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${Math.min(usage.storage.percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Fonctionnalités */}
      <div className="mt-6 pt-6 border-t border-surface-200">
        <h4 className="text-sm font-medium text-surface-900 mb-3">
          Fonctionnalités disponibles
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle
              className={`w-4 h-4 ${
                stats.features.aiScore ? 'text-success-600' : 'text-surface-300'
              }`}
            />
            <span className="text-sm text-surface-700">Score IA</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle
              className={`w-4 h-4 ${
                stats.features.winnerAnalysis ? 'text-success-600' : 'text-surface-300'
              }`}
            />
            <span className="text-sm text-surface-700">Analyse gagnants</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle
              className={`w-4 h-4 ${
                stats.features.marketplace ? 'text-success-600' : 'text-surface-300'
              }`}
            />
            <span className="text-sm text-surface-700">Marketplace</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle
              className={`w-4 h-4 ${
                stats.features.coEditing ? 'text-success-600' : 'text-surface-300'
              }`}
            />
            <span className="text-sm text-surface-700">Co-édition</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle
              className={`w-4 h-4 ${
                stats.features.api ? 'text-success-600' : 'text-surface-300'
              }`}
            />
            <span className="text-sm text-surface-700">API</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
