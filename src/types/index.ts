// Types principaux de l'application WeWinBid
export * from './database';
import type { Tender as TenderRow } from './database';

// Types pour les formulaires
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  companyName: string;
  acceptTerms: boolean;
}

export interface TenderFormData {
  title: string;
  type: 'PUBLIC' | 'PRIVATE';
  sector: string;
  buyerName: string;
  buyerType: string;
  estimatedValue?: number;
  deadline: string;
  description?: string;
  region?: string;
  department?: string;
  sourceUrl?: string;
}

export interface CompanyFormData {
  name: string;
  legalName?: string;
  siret?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  sectors: string[];
  description?: string;
}

// Types pour l'UI
export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavItem[];
}

export interface Stat {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  items: TenderRow[];
}

// Types pour la tarification
export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: PlanFeature[];
  limits: PlanLimits;
  popular?: boolean;
  stripePriceId?: {
    monthly: string;
    yearly: string;
  };
}

export interface PlanFeature {
  name: string;
  included: boolean;
  value?: string | number;
}

export interface PlanLimits {
  tendersPerMonth: number | 'unlimited';
  collaborators: number | 'unlimited';
  storage: string;
  aiScore: boolean;
  winnerAnalysis: boolean;
  marketplace: boolean;
  coEditing: boolean;
  roiDashboard: boolean;
  priceHistory: boolean;
  referenceGenerator: boolean;
  creativeStudio: boolean;
  api: boolean;
}

// Types pour l'IA
export interface AIScoreResult {
  score: number;
  confidence: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  competitorAnalysis?: {
    averagePrice: number;
    winRate: number;
    topCompetitors: string[];
  };
}

export interface AIGeneratedContent {
  content: string;
  type: string;
  tokens: number;
  model: string;
  createdAt: string;
}

// Types pour les régions de tarification
export type PricingRegion = 
  | 'FRANCE'
  | 'WESTERN_EUROPE'
  | 'SOUTHERN_EUROPE'
  | 'UK'
  | 'USA'
  | 'LATAM'
  | 'MENA';

export interface RegionalPricing {
  region: PricingRegion;
  currency: string;
  currencySymbol: string;
  prices: {
    pro: { monthly: number; yearly: number };
    business: { monthly: number; yearly: number };
  };
  vatRate: number;
}

// Labels et traductions
export const SECTOR_LABELS: Record<string, string> = {
  SECURITY_PRIVATE: 'Sécurité privée',
  SECURITY_ELECTRONIC: 'Sécurité électronique',
  CONSTRUCTION: 'Construction / BTP',
  LOGISTICS: 'Logistique',
  IT_SOFTWARE: 'Informatique / Logiciel',
  MAINTENANCE: 'Maintenance',
  CONSULTING: 'Conseil',
  CLEANING: 'Propreté',
  CATERING: 'Restauration',
  TRANSPORT: 'Transport',
  ENERGY: 'Énergie',
  HEALTHCARE: 'Santé',
  EDUCATION: 'Éducation',
  OTHER: 'Autre',
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  ANALYSIS: 'Analyse',
  IN_PROGRESS: 'En cours',
  REVIEW: 'Relecture',
  SUBMITTED: 'Soumis',
  WON: 'Gagné',
  LOST: 'Perdu',
  ABANDONED: 'Abandonné',
};

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ANALYSIS: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  REVIEW: 'bg-purple-100 text-purple-700',
  SUBMITTED: 'bg-indigo-100 text-indigo-700',
  WON: 'bg-emerald-100 text-emerald-700',
  LOST: 'bg-rose-100 text-rose-700',
  ABANDONED: 'bg-gray-100 text-gray-500',
};

export const BUYER_TYPE_LABELS: Record<string, string> = {
  STATE: 'État',
  REGION: 'Région',
  DEPARTMENT: 'Département',
  MUNICIPALITY: 'Commune',
  PUBLIC_ESTABLISHMENT: 'Établissement public',
  HOSPITAL: 'Hôpital / CHU',
  PRIVATE_COMPANY: 'Entreprise privée',
  ASSOCIATION: 'Association',
  OTHER: 'Autre',
};
