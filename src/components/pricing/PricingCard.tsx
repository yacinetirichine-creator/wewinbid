'use client';

/**
 * @fileoverview Pricing plan card component.
 * Displays plan features and CTA button.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { redirectToCheckout } from '@/lib/stripe-client';
import { Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

interface PricingCardProps {
  plan: 'free' | 'pro' | 'business';
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  currency: string;
  currencySymbol: string;
  features: string[];
  interval: 'monthly' | 'yearly';
  highlighted?: boolean;
  currentPlan?: boolean;
}

export function PricingCard({
  plan,
  name,
  description,
  price,
  currency,
  currencySymbol,
  features,
  interval,
  highlighted = false,
  currentPlan = false,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const { locale } = useLocale();

  const entries = {
    'pricing.card.badge.popular': 'Le plus populaire',
    'pricing.card.badge.current': 'Plan actuel',
    'pricing.card.price.free': 'Gratuit',
    'pricing.card.interval.month': 'mois',
    'pricing.card.interval.year': 'an',
    'pricing.card.yearly.equivalent': 'Soit {amount}/mois',
    'pricing.card.cta.current': 'Plan actuel',
    'pricing.card.cta.free': 'Commencer gratuitement',
    'pricing.card.cta.subscribe': 'Souscrire',
    'pricing.card.error.checkout': 'Erreur lors de la redirection vers le paiement',
  } as const;

  const { t } = useUiTranslations(locale, entries);

  const displayPrice = interval === 'monthly' ? price.monthly : price.yearly;
  const pricePerMonth = interval === 'yearly' ? price.yearly / 12 : price.monthly;

  async function handleSubscribe() {
    if (plan === 'free' || currentPlan) return;

    setLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      await redirectToCheckout(sessionId);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(t('pricing.card.error.checkout'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`
        relative flex flex-col rounded-2xl border-2 bg-white p-8 shadow-sm transition-all
        ${highlighted 
          ? 'border-blue-600 shadow-lg scale-105' 
          : 'border-gray-200 hover:border-gray-300'
        }
      `}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-block rounded-full bg-blue-600 px-4 py-1 text-sm font-semibold text-white">
            {t('pricing.card.badge.popular')}
          </span>
        </div>
      )}

      {currentPlan && (
        <div className="absolute -top-4 right-8">
          <span className="inline-block rounded-full bg-green-600 px-4 py-1 text-sm font-semibold text-white">
            {t('pricing.card.badge.current')}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900">{name}</h3>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      </div>

      <div className="mb-6">
        {plan === 'free' ? (
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-gray-900">{t('pricing.card.price.free')}</span>
          </div>
        ) : (
          <>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-gray-900">
                {currencySymbol}{displayPrice}
              </span>
              <span className="ml-2 text-gray-600">
                /
                {interval === 'monthly'
                  ? t('pricing.card.interval.month')
                  : t('pricing.card.interval.year')}
              </span>
            </div>
            {interval === 'yearly' && (
              <p className="mt-1 text-sm text-gray-600">
                {t('pricing.card.yearly.equivalent', {
                  amount: `${currencySymbol}${pricePerMonth.toFixed(0)}`,
                })}
              </p>
            )}
          </>
        )}
      </div>

      <Button
        variant={plan === 'free' ? 'outline' : highlighted ? 'primary' : 'outline'}
        size="lg"
        className="mb-6 w-full"
        onClick={handleSubscribe}
        isLoading={loading}
        disabled={currentPlan || plan === 'free'}
      >
        {currentPlan
          ? t('pricing.card.cta.current')
          : plan === 'free'
            ? t('pricing.card.cta.free')
            : t('pricing.card.cta.subscribe')}
      </Button>

      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="h-5 w-5 shrink-0 text-green-600" />
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
