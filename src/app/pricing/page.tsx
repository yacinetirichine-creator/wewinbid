'use client';

/**
 * @fileoverview Public pricing page.
 * Displays all available plans with toggle for monthly/yearly.
 */

import { useState } from 'react';
import { PricingCard } from '@/components/pricing/PricingCard';
import { PricingToggle } from '@/components/pricing/PricingToggle';
import { REGIONAL_PRICING } from '@/lib/pricing';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

export default function PricingPage() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const { locale } = useLocale();

  const entries = {
    'pricing.title': 'Tarifs transparents',
    'pricing.subtitle': 'Choisissez le plan qui correspond à vos besoins',
    'pricing.plan.free.name': 'Free',
    'pricing.plan.free.description': 'Pour découvrir WeWinBid',
    'pricing.plan.free.feature.1': "5 appels d'offres par mois",
    'pricing.plan.free.feature.2': 'Score de compatibilité IA',
    'pricing.plan.free.feature.3': '1 image générée par AO',
    'pricing.plan.free.feature.4': 'Marketplace partenaires (consultation)',
    'pricing.plan.free.feature.5': 'Support par email',

    'pricing.plan.pro.name': 'Pro',
    'pricing.plan.pro.description': 'Pour les entreprises en croissance',
    'pricing.plan.pro.feature.1': "Appels d'offres illimités",
    'pricing.plan.pro.feature.2': 'Score IA + Analytics ROI',
    'pricing.plan.pro.feature.3': '50 images DALL-E 3 / mois',
    'pricing.plan.pro.feature.4': '10 présentations automatiques / mois',
    'pricing.plan.pro.feature.5': '5 mémoires techniques / mois',
    'pricing.plan.pro.feature.6': 'Marketplace partenaires (recherche)',
    'pricing.plan.pro.feature.7': 'Alertes personnalisées',
    'pricing.plan.pro.feature.8': 'Support prioritaire',

    'pricing.plan.business.name': 'Business',
    'pricing.plan.business.description': 'Pour les grandes entreprises',
    'pricing.plan.business.feature.1': 'Tout du plan Pro',
    'pricing.plan.business.feature.2': 'Images DALL-E illimitées',
    'pricing.plan.business.feature.3': 'Présentations illimitées',
    'pricing.plan.business.feature.4': 'Mémoires techniques illimités',
    'pricing.plan.business.feature.5': 'Marketplace (demandes de partenariat)',
    'pricing.plan.business.feature.6': 'API accès complet',
    'pricing.plan.business.feature.7': 'Gestion multi-utilisateurs',
    'pricing.plan.business.feature.8': 'Intégrations personnalisées',
    'pricing.plan.business.feature.9': 'Support dédié 24/7',
    'pricing.plan.business.feature.10': 'SLA garanti',

    'pricing.faq.title': 'Questions fréquentes',
    'pricing.faq.q1': 'Puis-je changer de plan à tout moment ?',
    'pricing.faq.a1': "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements sont proportionnels au temps restant.",
    'pricing.faq.q2': 'Quels moyens de paiement acceptez-vous ?',
    'pricing.faq.a2': 'Nous acceptons toutes les cartes bancaires (Visa, Mastercard, Amex) via notre partenaire sécurisé Stripe.',
    'pricing.faq.q3': 'Puis-je annuler mon abonnement ?',
    'pricing.faq.a3': "Oui, vous pouvez annuler à tout moment. Vous conservez l'accès jusqu'à la fin de votre période de facturation.",
    'pricing.faq.q4': 'Proposez-vous des réductions pour les ONG ?',
    'pricing.faq.a4': 'Oui, nous offrons des tarifs préférentiels pour les organisations à but non lucratif. Contactez-nous pour en savoir plus.',

    'pricing.cta.title': "Prêt à remporter plus d'appels d'offres ?",
    'pricing.cta.subtitle': 'Commencez gratuitement, aucune carte bancaire requise.',
    'pricing.cta.button': 'Créer un compte gratuit',
  } as const;

  const { t } = useUiTranslations(locale, entries);

  // Default to France pricing
  const pricing = REGIONAL_PRICING.FRANCE;

  const plans = [
    {
      plan: 'free' as const,
      name: t('pricing.plan.free.name'),
      description: t('pricing.plan.free.description'),
      price: { monthly: 0, yearly: 0 },
      features: [
        t('pricing.plan.free.feature.1'),
        t('pricing.plan.free.feature.2'),
        t('pricing.plan.free.feature.3'),
        t('pricing.plan.free.feature.4'),
        t('pricing.plan.free.feature.5'),
      ],
    },
    {
      plan: 'pro' as const,
      name: t('pricing.plan.pro.name'),
      description: t('pricing.plan.pro.description'),
      price: pricing.prices.pro,
      features: [
        t('pricing.plan.pro.feature.1'),
        t('pricing.plan.pro.feature.2'),
        t('pricing.plan.pro.feature.3'),
        t('pricing.plan.pro.feature.4'),
        t('pricing.plan.pro.feature.5'),
        t('pricing.plan.pro.feature.6'),
        t('pricing.plan.pro.feature.7'),
        t('pricing.plan.pro.feature.8'),
      ],
      highlighted: true,
    },
    {
      plan: 'business' as const,
      name: t('pricing.plan.business.name'),
      description: t('pricing.plan.business.description'),
      price: pricing.prices.business,
      features: [
        t('pricing.plan.business.feature.1'),
        t('pricing.plan.business.feature.2'),
        t('pricing.plan.business.feature.3'),
        t('pricing.plan.business.feature.4'),
        t('pricing.plan.business.feature.5'),
        t('pricing.plan.business.feature.6'),
        t('pricing.plan.business.feature.7'),
        t('pricing.plan.business.feature.8'),
        t('pricing.plan.business.feature.9'),
        t('pricing.plan.business.feature.10'),
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            {t('pricing.title')}
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            {t('pricing.subtitle')}
          </p>
        </div>

        {/* Toggle */}
        <div className="mt-12">
          <PricingToggle interval={interval} onChange={setInterval} />
        </div>

        {/* Pricing Cards */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard
              key={plan.plan}
              plan={plan.plan}
              name={plan.name}
              description={plan.description}
              price={plan.price}
              currency={pricing.currency}
              currencySymbol={pricing.currencySymbol}
              features={plan.features}
              interval={interval}
              highlighted={plan.highlighted}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            {t('pricing.faq.title')}
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">
                {t('pricing.faq.q1')}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {t('pricing.faq.a1')}
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">
                {t('pricing.faq.q2')}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {t('pricing.faq.a2')}
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">
                {t('pricing.faq.q3')}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {t('pricing.faq.a3')}
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">
                {t('pricing.faq.q4')}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {t('pricing.faq.a4')}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 rounded-2xl bg-blue-600 px-8 py-12 text-center">
          <h2 className="text-3xl font-bold text-white">
            {t('pricing.cta.title')}
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            {t('pricing.cta.subtitle')}
          </p>
          <a
            href="/auth/register"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 transition-transform hover:scale-105"
          >
            {t('pricing.cta.button')}
          </a>
        </div>
      </div>
    </div>
  );
}
