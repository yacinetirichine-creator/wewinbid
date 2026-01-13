'use client';

/**
 * @fileoverview Hook for managing user subscription.
 * Provides subscription status and usage limits.
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Subscription {
  plan: 'free' | 'pro' | 'business';
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | null;
  interval: 'monthly' | 'yearly' | null;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
}

export interface UsageLimits {
  tenders: {
    limit: number;
    used: number;
    unlimited: boolean;
  };
  images: {
    limit: number;
    used: number;
    unlimited: boolean;
  };
  presentations: {
    limit: number;
    used: number;
    unlimited: boolean;
  };
  memoiresTechniques: {
    limit: number;
    used: number;
    unlimited: boolean;
  };
}

const PLAN_LIMITS = {
  free: {
    tenders: 5,
    images: 1,
    presentations: 0,
    memoiresTechniques: 0,
  },
  pro: {
    tenders: -1, // unlimited
    images: 50,
    presentations: 10,
    memoiresTechniques: 5,
  },
  business: {
    tenders: -1, // unlimited
    images: -1, // unlimited
    presentations: -1, // unlimited
    memoiresTechniques: -1, // unlimited
  },
};

/**
 * Hook to get current subscription and usage.
 */
export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Get subscription from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status, subscription_interval, subscription_current_period_end, stripe_customer_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        setSubscription({
          plan: (profile.subscription_plan as any) || 'free',
          status: profile.subscription_status as any,
          interval: profile.subscription_interval as any,
          currentPeriodEnd: profile.subscription_current_period_end,
          stripeCustomerId: profile.stripe_customer_id,
        });

        // Get usage stats
        const plan = (profile.subscription_plan as any) || 'free';
        const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

        // Get current month's usage
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [tendersCount, imagesCount, presentationsCount, memoiresCount] = await Promise.all([
          supabase
            .from('tenders')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', firstDayOfMonth),
          supabase
            .from('generated_images')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', firstDayOfMonth),
          supabase
            .from('presentations')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', firstDayOfMonth),
          supabase
            .from('memoires_techniques')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', firstDayOfMonth),
        ]);

        setUsage({
          tenders: {
            limit: limits.tenders,
            used: tendersCount.count || 0,
            unlimited: limits.tenders === -1,
          },
          images: {
            limit: limits.images,
            used: imagesCount.count || 0,
            unlimited: limits.images === -1,
          },
          presentations: {
            limit: limits.presentations,
            used: presentationsCount.count || 0,
            unlimited: limits.presentations === -1,
          },
          memoiresTechniques: {
            limit: limits.memoiresTechniques,
            used: memoiresCount.count || 0,
            unlimited: limits.memoiresTechniques === -1,
          },
        });
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Check if a feature is available.
   */
  function canUseFeature(feature: keyof UsageLimits): boolean {
    if (!usage) return false;
    const featureUsage = usage[feature];
    return featureUsage.unlimited || featureUsage.used < featureUsage.limit;
  }

  /**
   * Check if user has a specific plan or higher.
   */
  function hasPlan(minPlan: 'free' | 'pro' | 'business'): boolean {
    if (!subscription) return false;

    const planHierarchy = { free: 0, pro: 1, business: 2 };
    const currentLevel = planHierarchy[subscription.plan];
    const requiredLevel = planHierarchy[minPlan];

    return currentLevel >= requiredLevel;
  }

  return {
    subscription,
    usage,
    loading,
    canUseFeature,
    hasPlan,
    refresh: loadSubscription,
  };
}
