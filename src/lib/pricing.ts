import type { PricingRegion, RegionalPricing, PricingPlan } from '@/types';

// Configuration des régions
export const REGIONAL_PRICING: Record<PricingRegion, RegionalPricing> = {
  FRANCE: {
    region: 'FRANCE',
    currency: 'EUR',
    currencySymbol: '€',
    prices: {
      pro: { monthly: 49, yearly: 490 },
      business: { monthly: 149, yearly: 1490 },
    },
    vatRate: 20,
  },
  WESTERN_EUROPE: {
    region: 'WESTERN_EUROPE',
    currency: 'EUR',
    currencySymbol: '€',
    prices: {
      pro: { monthly: 59, yearly: 590 },
      business: { monthly: 169, yearly: 1690 },
    },
    vatRate: 21,
  },
  SOUTHERN_EUROPE: {
    region: 'SOUTHERN_EUROPE',
    currency: 'EUR',
    currencySymbol: '€',
    prices: {
      pro: { monthly: 39, yearly: 390 },
      business: { monthly: 119, yearly: 1190 },
    },
    vatRate: 22,
  },
  UK: {
    region: 'UK',
    currency: 'GBP',
    currencySymbol: '£',
    prices: {
      pro: { monthly: 45, yearly: 450 },
      business: { monthly: 139, yearly: 1390 },
    },
    vatRate: 20,
  },
  USA: {
    region: 'USA',
    currency: 'USD',
    currencySymbol: '$',
    prices: {
      pro: { monthly: 59, yearly: 590 },
      business: { monthly: 179, yearly: 1790 },
    },
    vatRate: 0,
  },
  LATAM: {
    region: 'LATAM',
    currency: 'USD',
    currencySymbol: '$',
    prices: {
      pro: { monthly: 29, yearly: 290 },
      business: { monthly: 89, yearly: 890 },
    },
    vatRate: 0,
  },
  MENA: {
    region: 'MENA',
    currency: 'USD',
    currencySymbol: '$',
    prices: {
      pro: { monthly: 39, yearly: 390 },
      business: { monthly: 99, yearly: 990 },
    },
    vatRate: 5,
  },
};

// Mapping pays -> région
export const COUNTRY_TO_REGION: Record<string, PricingRegion> = {
  // France
  FR: 'FRANCE',
  
  // Europe de l'Ouest
  DE: 'WESTERN_EUROPE',
  BE: 'WESTERN_EUROPE',
  NL: 'WESTERN_EUROPE',
  LU: 'WESTERN_EUROPE',
  AT: 'WESTERN_EUROPE',
  CH: 'WESTERN_EUROPE',
  
  // Europe du Sud
  ES: 'SOUTHERN_EUROPE',
  IT: 'SOUTHERN_EUROPE',
  PT: 'SOUTHERN_EUROPE',
  GR: 'SOUTHERN_EUROPE',
  
  // UK
  GB: 'UK',
  IE: 'UK',
  
  // USA
  US: 'USA',
  CA: 'USA',
  
  // Amérique Latine
  MX: 'LATAM',
  BR: 'LATAM',
  AR: 'LATAM',
  CO: 'LATAM',
  CL: 'LATAM',
  PE: 'LATAM',
  
  // MENA
  MA: 'MENA',
  TN: 'MENA',
  DZ: 'MENA',
  AE: 'MENA',
  SA: 'MENA',
  QA: 'MENA',
  KW: 'MENA',
  EG: 'MENA',
};

// Obtenir la région à partir du pays
export function getRegionFromCountry(countryCode: string): PricingRegion {
  return COUNTRY_TO_REGION[countryCode.toUpperCase()] || 'FRANCE';
}

// Obtenir les tarifs pour une région
export function getPricingForRegion(region: PricingRegion): RegionalPricing {
  return REGIONAL_PRICING[region];
}

// Générer les plans de tarification pour une région
export function getPlansForRegion(region: PricingRegion): PricingPlan[] {
  const pricing = REGIONAL_PRICING[region];
  
  return [
    {
      id: 'free',
      name: 'Gratuit',
      description: 'Pour découvrir WeWinBid',
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: pricing.currency,
      features: [
        { name: 'Réponses AO / mois', included: true, value: 2 },
        { name: 'Collaborateurs', included: true, value: 1 },
        { name: 'Stockage', included: true, value: '100 MB' },
        { name: 'Score de compatibilité IA', included: false },
        { name: 'Analyse des attributaires', included: false },
        { name: 'Marketplace partenaires', included: false },
        { name: 'Support', included: true, value: 'Email' },
      ],
      limits: {
        tendersPerMonth: 2,
        collaborators: 1,
        storage: '100 MB',
        aiScore: false,
        winnerAnalysis: false,
        marketplace: false,
        coEditing: false,
        roiDashboard: false,
        priceHistory: false,
        referenceGenerator: false,
        creativeStudio: false,
        api: false,
      },
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Pour les TPE/PME actives',
      monthlyPrice: pricing.prices.pro.monthly,
      yearlyPrice: pricing.prices.pro.yearly,
      currency: pricing.currency,
      popular: true,
      features: [
        { name: 'Réponses AO / mois', included: true, value: 20 },
        { name: 'Collaborateurs', included: true, value: 5 },
        { name: 'Stockage', included: true, value: '5 GB' },
        { name: 'Score de compatibilité IA', included: true },
        { name: 'Analyse des attributaires', included: true },
        { name: 'Marketplace partenaires', included: true },
        { name: 'Historique des prix', included: true },
        { name: 'Support', included: true, value: 'Prioritaire' },
      ],
      limits: {
        tendersPerMonth: 20,
        collaborators: 5,
        storage: '5 GB',
        aiScore: true,
        winnerAnalysis: true,
        marketplace: true,
        coEditing: false,
        roiDashboard: true,
        priceHistory: true,
        referenceGenerator: true,
        creativeStudio: false,
        api: false,
      },
    },
    {
      id: 'business',
      name: 'Business',
      description: 'Pour les équipes commerciales',
      monthlyPrice: pricing.prices.business.monthly,
      yearlyPrice: pricing.prices.business.yearly,
      currency: pricing.currency,
      features: [
        { name: 'Réponses AO / mois', included: true, value: 'Illimité' },
        { name: 'Collaborateurs', included: true, value: 20 },
        { name: 'Stockage', included: true, value: '50 GB' },
        { name: 'Score de compatibilité IA', included: true },
        { name: 'Analyse des attributaires', included: true },
        { name: 'Marketplace partenaires', included: true },
        { name: 'Co-rédaction temps réel', included: true },
        { name: 'Studio créatif', included: true },
        { name: 'Accès API', included: true },
        { name: 'Support', included: true, value: 'Dédié' },
      ],
      limits: {
        tendersPerMonth: 'unlimited',
        collaborators: 20,
        storage: '50 GB',
        aiScore: true,
        winnerAnalysis: true,
        marketplace: true,
        coEditing: true,
        roiDashboard: true,
        priceHistory: true,
        referenceGenerator: true,
        creativeStudio: true,
        api: true,
      },
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Solution sur mesure',
      monthlyPrice: -1, // Sur devis
      yearlyPrice: -1,
      currency: pricing.currency,
      features: [
        { name: 'Tout Business +', included: true },
        { name: 'Collaborateurs illimités', included: true },
        { name: 'Stockage illimité', included: true },
        { name: 'SSO / SAML', included: true },
        { name: 'SLA garanti', included: true },
        { name: 'Formation personnalisée', included: true },
        { name: 'Account Manager dédié', included: true },
      ],
      limits: {
        tendersPerMonth: 'unlimited',
        collaborators: 'unlimited',
        storage: 'Illimité',
        aiScore: true,
        winnerAnalysis: true,
        marketplace: true,
        coEditing: true,
        roiDashboard: true,
        priceHistory: true,
        referenceGenerator: true,
        creativeStudio: true,
        api: true,
      },
    },
  ];
}

// Formater le prix
export function formatPrice(
  amount: number,
  currency: string,
  locale: string = 'fr-FR'
): string {
  if (amount === -1) return 'Sur devis';
  if (amount === 0) return 'Gratuit';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Calculer l'économie annuelle
export function calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
  const yearlyIfMonthly = monthlyPrice * 12;
  return Math.round(((yearlyIfMonthly - yearlyPrice) / yearlyIfMonthly) * 100);
}
