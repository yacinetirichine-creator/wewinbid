/**
 * @fileoverview Subscription utilities and quota management
 * Gère les vérifications des limites d'abonnement et les quotas
 */

import { createClient } from '@/lib/supabase/server';
import type { SubscriptionPlan } from '@/types/database';

/**
 * Configuration des limites par plan d'abonnement
 */
export const PLAN_LIMITS = {
  free: {
    tendersPerMonth: 2,
    collaborators: 1,
    storageGB: 0.1, // 100 MB
    aiScore: false,
    winnerAnalysis: false,
    templates: false,
    coEditing: false,
    api: false,
  },
  pro: {
    tendersPerMonth: 20,
    collaborators: 5,
    storageGB: 5,
    aiScore: true,
    winnerAnalysis: true,
    templates: true,
    coEditing: false,
    api: false,
  },
  business: {
    tendersPerMonth: Infinity, // Illimité
    collaborators: 20,
    storageGB: 50,
    aiScore: true,
    winnerAnalysis: true,
    templates: true,
    coEditing: true,
    api: true,
  },
} as const;

/**
 * Récupère les informations d'abonnement d'une entreprise
 */
export async function getCompanySubscription(companyId: string) {
  const supabase = await createClient();
  
  const { data: company, error } = await supabase
    .from('companies')
    .select('subscription_tier, subscription_status, stripe_subscription_id, stripe_customer_id')
    .eq('id', companyId)
    .single();

  if (error || !company) {
    throw new Error('Company not found');
  }

  const companyData = company as any; // Type assertion pour contourner le typage strict
  const plan = (companyData.subscription_tier || 'free') as SubscriptionPlan;
  const status = (companyData.subscription_status || 'inactive') as string;
  const limits = PLAN_LIMITS[plan];

  return {
    plan,
    status,
    limits,
    stripeSubscriptionId: companyData.stripe_subscription_id || null,
    stripeCustomerId: companyData.stripe_customer_id || null,
    isActive: status === 'active',
  };
}

/**
 * Compte le nombre de tenders créés ce mois pour une entreprise
 */
export async function getTendersCountThisMonth(companyId: string): Promise<number> {
  const supabase = await createClient();
  
  // Date de début du mois en cours
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const { count, error } = await supabase
    .from('tenders')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .gte('created_at', startOfMonth.toISOString());

  if (error) {
    console.error('Error counting tenders:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Vérifie si une entreprise peut créer un nouveau tender
 * @returns { canCreate: boolean, reason?: string, currentCount?: number, limit?: number }
 */
export async function canCreateTender(companyId: string) {
  try {
    const subscription = await getCompanySubscription(companyId);
    
    // Si l'abonnement n'est pas actif (sauf free)
    if (subscription.plan !== 'free' && !subscription.isActive) {
      return {
        canCreate: false,
        reason: 'Votre abonnement n\'est pas actif. Veuillez mettre à jour vos informations de paiement.',
        currentCount: 0,
        limit: 0,
      };
    }

    // Si le plan est Business (illimité)
    if (subscription.limits.tendersPerMonth === Infinity) {
      return {
        canCreate: true,
        currentCount: 0,
        limit: Infinity,
      };
    }

    // Vérifier le quota mensuel
    const currentCount = await getTendersCountThisMonth(companyId);
    const limit = subscription.limits.tendersPerMonth;

    if (currentCount >= limit) {
      return {
        canCreate: false,
        reason: `Limite de ${limit} réponses par mois atteinte. Passez à un plan supérieur pour créer plus de réponses.`,
        currentCount,
        limit,
      };
    }

    return {
      canCreate: true,
      currentCount,
      limit,
    };
  } catch (error) {
    console.error('Error checking tender quota:', error);
    return {
      canCreate: false,
      reason: 'Erreur lors de la vérification du quota',
    };
  }
}

/**
 * Compte le nombre de collaborateurs dans une entreprise
 */
export async function getCollaboratorsCount(companyId: string): Promise<number> {
  const supabase = await createClient();
  
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  if (error) {
    console.error('Error counting collaborators:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Vérifie si une entreprise peut ajouter un nouveau collaborateur
 */
export async function canAddCollaborator(companyId: string) {
  try {
    const subscription = await getCompanySubscription(companyId);
    
    if (subscription.plan !== 'free' && !subscription.isActive) {
      return {
        canAdd: false,
        reason: 'Votre abonnement n\'est pas actif.',
      };
    }

    const currentCount = await getCollaboratorsCount(companyId);
    const limit = subscription.limits.collaborators;

    if (currentCount >= limit) {
      return {
        canAdd: false,
        reason: `Limite de ${limit} collaborateur(s) atteinte. Passez à un plan supérieur.`,
        currentCount,
        limit,
      };
    }

    return {
      canAdd: true,
      currentCount,
      limit,
    };
  } catch (error) {
    console.error('Error checking collaborator quota:', error);
    return {
      canAdd: false,
      reason: 'Erreur lors de la vérification du quota',
    };
  }
}

/**
 * Vérifie si une fonctionnalité est disponible pour un plan
 */
export async function hasFeatureAccess(
  companyId: string,
  feature: keyof typeof PLAN_LIMITS.free
): Promise<boolean> {
  try {
    const subscription = await getCompanySubscription(companyId);
    
    // Pour les plans payants, vérifier que l'abonnement est actif
    if (subscription.plan !== 'free' && !subscription.isActive) {
      return false;
    }

    return Boolean(subscription.limits[feature]);
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}

/**
 * Récupère les statistiques d'utilisation pour le dashboard
 */
export async function getUsageStats(companyId: string) {
  try {
    const subscription = await getCompanySubscription(companyId);
    const tendersCount = await getTendersCountThisMonth(companyId);
    const collaboratorsCount = await getCollaboratorsCount(companyId);

    return {
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        isActive: subscription.isActive,
      },
      usage: {
        tenders: {
          current: tendersCount,
          limit: subscription.limits.tendersPerMonth,
          percentage: subscription.limits.tendersPerMonth === Infinity 
            ? 0 
            : Math.round((tendersCount / subscription.limits.tendersPerMonth) * 100),
        },
        collaborators: {
          current: collaboratorsCount,
          limit: subscription.limits.collaborators,
          percentage: Math.round((collaboratorsCount / subscription.limits.collaborators) * 100),
        },
        storage: {
          current: 0, // TODO: Implémenter le calcul du stockage
          limit: subscription.limits.storageGB,
          percentage: 0,
        },
      },
      features: {
        aiScore: subscription.limits.aiScore,
        winnerAnalysis: subscription.limits.winnerAnalysis,
        templates: subscription.limits.templates,
        coEditing: subscription.limits.coEditing,
        api: subscription.limits.api,
      },
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    throw error;
  }
}
