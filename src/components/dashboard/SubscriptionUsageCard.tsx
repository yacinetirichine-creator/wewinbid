'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

const entries = {
  'subscriptionUsage.plan': 'Plan {plan}',
  'subscriptionUsage.status.active': 'Active',
  'subscriptionUsage.status.inactive': 'Inactive',
  'subscriptionUsage.actions.manage': 'Manage',
  'subscriptionUsage.usage.tenders': 'Tender responses this month',
  'subscriptionUsage.limit.reached.title': 'Limit reached',
  'subscriptionUsage.limit.reached.body': 'You have reached your limit of {limit} responses this month.',
  'subscriptionUsage.limit.reached.cta': 'Upgrade your plan',
  'subscriptionUsage.limit.reached.suffix': 'to create more responses.',
  'subscriptionUsage.limit.near.title': 'Near the limit',
  'subscriptionUsage.limit.near.body': 'You are approaching your monthly limit.',
  'subscriptionUsage.limit.near.cta': 'Upgrade your plan',
  'subscriptionUsage.limit.near.suffix': 'for more responses.',
  'subscriptionUsage.usage.collaborators': 'Collaborators',
  'subscriptionUsage.usage.storage': 'Storage',
  'subscriptionUsage.features.title': 'Available features',
  'subscriptionUsage.features.aiScore': 'AI score',
  'subscriptionUsage.features.winnerAnalysis': 'Winner analysis',
  'subscriptionUsage.features.templates': 'Templates',
  'subscriptionUsage.features.coEditing': 'Co-editing',
  'subscriptionUsage.features.api': 'API',
} as const;

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
    templates: boolean;
    coEditing: boolean;
    api: boolean;
  };
}

export function SubscriptionUsageCard() {
  const { locale } = useLocale();
  const { t } = useUiTranslations(locale, entries);

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
            {t('subscriptionUsage.plan', {
              plan: subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1),
            })}
          </h3>
          <p className="text-sm text-surface-500">
            {subscription.isActive
              ? t('subscriptionUsage.status.active')
              : t('subscriptionUsage.status.inactive')}
          </p>
        </div>
        <Link
          href="/settings?tab=billing"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {t('subscriptionUsage.actions.manage')}
        </Link>
      </div>

      {/* Quota réponses AO */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-surface-700">
              {t('subscriptionUsage.usage.tenders')}
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
                      {t('subscriptionUsage.limit.reached.title')}
                    </p>
                    <p className="text-sm text-error-700">
                      {t('subscriptionUsage.limit.reached.body', {
                        limit: usage.tenders.limit === Infinity ? '∞' : String(usage.tenders.limit),
                      })}{' '}
                      <Link
                        href="/pricing"
                        className="font-medium underline hover:no-underline"
                      >
                        {t('subscriptionUsage.limit.reached.cta')}
                      </Link>
                      {' '}{t('subscriptionUsage.limit.reached.suffix')}
                    </p>
                  </div>
                </div>
              )}

              {isNearLimit && !isAtLimit && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-warning-900 mb-1">
                      {t('subscriptionUsage.limit.near.title')}
                    </p>
                    <p className="text-sm text-warning-700">
                      {t('subscriptionUsage.limit.near.body')}{' '}
                      <Link
                        href="/pricing"
                        className="font-medium underline hover:no-underline"
                      >
                        {t('subscriptionUsage.limit.near.cta')}
                      </Link>
                      {' '}{t('subscriptionUsage.limit.near.suffix')}
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
              {t('subscriptionUsage.usage.collaborators')}
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
              {t('subscriptionUsage.usage.storage')}
            </span>
            <span className="text-sm font-medium text-surface-900">
              {usage.storage.current.toLocaleString(locale, { maximumFractionDigits: 1 })} GB / {usage.storage.limit} GB
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
          {t('subscriptionUsage.features.title')}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle
              className={`w-4 h-4 ${
                stats.features.aiScore ? 'text-success-600' : 'text-surface-300'
              }`}
            />
            <span className="text-sm text-surface-700">{t('subscriptionUsage.features.aiScore')}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle
              className={`w-4 h-4 ${
                stats.features.winnerAnalysis ? 'text-success-600' : 'text-surface-300'
              }`}
            />
            <span className="text-sm text-surface-700">{t('subscriptionUsage.features.winnerAnalysis')}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle
              className={`w-4 h-4 ${
                stats.features.templates ? 'text-success-600' : 'text-surface-300'
              }`}
            />
            <span className="text-sm text-surface-700">{t('subscriptionUsage.features.templates')}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle
              className={`w-4 h-4 ${
                stats.features.coEditing ? 'text-success-600' : 'text-surface-300'
              }`}
            />
            <span className="text-sm text-surface-700">{t('subscriptionUsage.features.coEditing')}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle
              className={`w-4 h-4 ${
                stats.features.api ? 'text-success-600' : 'text-surface-300'
              }`}
            />
            <span className="text-sm text-surface-700">{t('subscriptionUsage.features.api')}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
