'use client';

/**
 * @fileoverview Public pricing page.
 * Displays all available plans with toggle for monthly/yearly.
 */

import { useState } from 'react';
import { PricingCard } from '@/components/pricing/PricingCard';
import { PricingToggle } from '@/components/pricing/PricingToggle';
import { REGIONAL_PRICING } from '@/lib/pricing';

export default function PricingPage() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');

  // Default to France pricing
  const pricing = REGIONAL_PRICING.FRANCE;

  const plans = [
    {
      plan: 'free' as const,
      name: 'Free',
      description: 'Pour découvrir WeWinBid',
      price: { monthly: 0, yearly: 0 },
      features: [
        '5 appels d\'offres par mois',
        'Score de compatibilité IA',
        '1 image générée par AO',
        'Marketplace partenaires (consultation)',
        'Support par email',
      ],
    },
    {
      plan: 'pro' as const,
      name: 'Pro',
      description: 'Pour les entreprises en croissance',
      price: pricing.prices.pro,
      features: [
        'Appels d\'offres illimités',
        'Score IA + Analytics ROI',
        '50 images DALL-E 3 / mois',
        '10 présentations automatiques / mois',
        '5 mémoires techniques / mois',
        'Marketplace partenaires (recherche)',
        'Alertes personnalisées',
        'Support prioritaire',
      ],
      highlighted: true,
    },
    {
      plan: 'business' as const,
      name: 'Business',
      description: 'Pour les grandes entreprises',
      price: pricing.prices.business,
      features: [
        'Tout du plan Pro',
        'Images DALL-E illimitées',
        'Présentations illimitées',
        'Mémoires techniques illimités',
        'Marketplace (demandes de partenariat)',
        'API accès complet',
        'Gestion multi-utilisateurs',
        'Intégrations personnalisées',
        'Support dédié 24/7',
        'SLA garanti',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Tarifs transparents
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Choisissez le plan qui correspond à vos besoins
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
            Questions fréquentes
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">
                Puis-je changer de plan à tout moment ?
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. 
                Les changements sont proportionnels au temps restant.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">
                Quels moyens de paiement acceptez-vous ?
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Nous acceptons toutes les cartes bancaires (Visa, Mastercard, Amex) 
                via notre partenaire sécurisé Stripe.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">
                Puis-je annuler mon abonnement ?
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Oui, vous pouvez annuler à tout moment. Vous conservez l'accès 
                jusqu'à la fin de votre période de facturation.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">
                Proposez-vous des réductions pour les ONG ?
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Oui, nous offrons des tarifs préférentiels pour les organisations 
                à but non lucratif. Contactez-nous pour en savoir plus.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 rounded-2xl bg-blue-600 px-8 py-12 text-center">
          <h2 className="text-3xl font-bold text-white">
            Prêt à remporter plus d'appels d'offres ?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Commencez gratuitement, aucune carte bancaire requise.
          </p>
          <a
            href="/auth/register"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 transition-transform hover:scale-105"
          >
            Créer un compte gratuit
          </a>
        </div>
      </div>
    </div>
  );
}
