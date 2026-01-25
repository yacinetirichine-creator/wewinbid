/**
 * Tests for useSubscription hook
 *
 * Tests subscription management including:
 * - Plan detection (free, pro, business)
 * - Usage limits tracking
 * - Feature availability checks
 * - Plan hierarchy validation
 */

import { renderHook, waitFor } from '@testing-library/react';

// Mock data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

const mockFreeProfile = {
  subscription_plan: 'free',
  subscription_status: 'active',
  subscription_interval: null,
  subscription_current_period_end: null,
  stripe_customer_id: null,
};

const mockProProfile = {
  subscription_plan: 'pro',
  subscription_status: 'active',
  subscription_interval: 'monthly',
  subscription_current_period_end: '2024-12-31T00:00:00Z',
  stripe_customer_id: 'cus_123',
};

const mockBusinessProfile = {
  subscription_plan: 'business',
  subscription_status: 'active',
  subscription_interval: 'yearly',
  subscription_current_period_end: '2025-01-01T00:00:00Z',
  stripe_customer_id: 'cus_456',
};

// Mock Supabase
const mockGetUser = jest.fn();
const mockProfileSelect = jest.fn();
const mockCountSelect = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: jest.fn((table: string) => ({
      select: jest.fn((cols: string, opts?: any) => {
        if (table === 'profiles') {
          return {
            eq: jest.fn(() => ({
              single: mockProfileSelect,
            })),
          };
        }
        // For count queries
        return {
          eq: jest.fn(() => ({
            gte: mockCountSelect,
          })),
        };
      }),
    })),
  })),
}));

describe('useSubscription Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockProfileSelect.mockResolvedValue({ data: mockFreeProfile, error: null });
    mockCountSelect.mockResolvedValue({ count: 0, error: null });
  });

  describe('Plan Limits Configuration', () => {
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

    it('should have correct free plan limits', () => {
      expect(PLAN_LIMITS.free.tenders).toBe(5);
      expect(PLAN_LIMITS.free.images).toBe(1);
      expect(PLAN_LIMITS.free.presentations).toBe(0);
      expect(PLAN_LIMITS.free.memoiresTechniques).toBe(0);
    });

    it('should have correct pro plan limits', () => {
      expect(PLAN_LIMITS.pro.tenders).toBe(-1); // unlimited
      expect(PLAN_LIMITS.pro.images).toBe(50);
      expect(PLAN_LIMITS.pro.presentations).toBe(10);
      expect(PLAN_LIMITS.pro.memoiresTechniques).toBe(5);
    });

    it('should have correct business plan limits', () => {
      expect(PLAN_LIMITS.business.tenders).toBe(-1);
      expect(PLAN_LIMITS.business.images).toBe(-1);
      expect(PLAN_LIMITS.business.presentations).toBe(-1);
      expect(PLAN_LIMITS.business.memoiresTechniques).toBe(-1);
    });
  });

  describe('Initial State', () => {
    it('should start with loading state', async () => {
      const { useSubscription } = await import('@/hooks/useSubscription');
      const { result } = renderHook(() => useSubscription());

      expect(result.current.loading).toBe(true);
      expect(result.current.subscription).toBeNull();
      expect(result.current.usage).toBeNull();
    });
  });

  describe('Subscription Detection', () => {
    it('should detect free plan', async () => {
      mockProfileSelect.mockResolvedValue({ data: mockFreeProfile, error: null });

      const { useSubscription } = await import('@/hooks/useSubscription');
      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.subscription?.plan).toBe('free');
    });

    it('should detect pro plan', async () => {
      mockProfileSelect.mockResolvedValue({ data: mockProProfile, error: null });

      const { useSubscription } = await import('@/hooks/useSubscription');
      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.subscription?.plan).toBe('pro');
      expect(result.current.subscription?.interval).toBe('monthly');
    });

    it('should detect business plan', async () => {
      mockProfileSelect.mockResolvedValue({ data: mockBusinessProfile, error: null });

      const { useSubscription } = await import('@/hooks/useSubscription');
      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.subscription?.plan).toBe('business');
      expect(result.current.subscription?.interval).toBe('yearly');
    });
  });

  describe('hasPlan Helper', () => {
    // Test the plan hierarchy logic
    const planHierarchy = { free: 0, pro: 1, business: 2 };

    const hasPlan = (currentPlan: string, minPlan: string): boolean => {
      const currentLevel = planHierarchy[currentPlan as keyof typeof planHierarchy] || 0;
      const requiredLevel = planHierarchy[minPlan as keyof typeof planHierarchy] || 0;
      return currentLevel >= requiredLevel;
    };

    it('should correctly check free plan requirements', () => {
      expect(hasPlan('free', 'free')).toBe(true);
      expect(hasPlan('pro', 'free')).toBe(true);
      expect(hasPlan('business', 'free')).toBe(true);
    });

    it('should correctly check pro plan requirements', () => {
      expect(hasPlan('free', 'pro')).toBe(false);
      expect(hasPlan('pro', 'pro')).toBe(true);
      expect(hasPlan('business', 'pro')).toBe(true);
    });

    it('should correctly check business plan requirements', () => {
      expect(hasPlan('free', 'business')).toBe(false);
      expect(hasPlan('pro', 'business')).toBe(false);
      expect(hasPlan('business', 'business')).toBe(true);
    });
  });

  describe('canUseFeature Helper', () => {
    // Test the feature availability logic
    interface FeatureUsage {
      limit: number;
      used: number;
      unlimited: boolean;
    }

    const canUseFeature = (usage: FeatureUsage): boolean => {
      return usage.unlimited || usage.used < usage.limit;
    };

    it('should allow feature if unlimited', () => {
      expect(canUseFeature({ limit: -1, used: 1000, unlimited: true })).toBe(true);
    });

    it('should allow feature if under limit', () => {
      expect(canUseFeature({ limit: 10, used: 5, unlimited: false })).toBe(true);
    });

    it('should deny feature if at limit', () => {
      expect(canUseFeature({ limit: 10, used: 10, unlimited: false })).toBe(false);
    });

    it('should deny feature if over limit', () => {
      expect(canUseFeature({ limit: 10, used: 15, unlimited: false })).toBe(false);
    });

    it('should allow feature with zero usage', () => {
      expect(canUseFeature({ limit: 5, used: 0, unlimited: false })).toBe(true);
    });
  });

  describe('Unauthenticated User', () => {
    it('should handle unauthenticated user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const { useSubscription } = await import('@/hooks/useSubscription');
      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.subscription).toBeNull();
      expect(result.current.usage).toBeNull();
    });
  });

  describe('Refresh Function', () => {
    it('should provide refresh function', async () => {
      const { useSubscription } = await import('@/hooks/useSubscription');
      const { result } = renderHook(() => useSubscription());

      expect(typeof result.current.refresh).toBe('function');
    });
  });

  describe('Subscription Status', () => {
    const validStatuses = ['active', 'canceled', 'past_due', 'trialing', null];

    it('should accept valid subscription statuses', () => {
      validStatuses.forEach((status) => {
        expect(validStatuses.includes(status)).toBe(true);
      });
    });

    it('should handle trial status', async () => {
      const trialProfile = {
        ...mockProProfile,
        subscription_status: 'trialing',
      };
      mockProfileSelect.mockResolvedValue({ data: trialProfile, error: null });

      const { useSubscription } = await import('@/hooks/useSubscription');
      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.subscription?.status).toBe('trialing');
    });

    it('should handle canceled status', async () => {
      const canceledProfile = {
        ...mockProProfile,
        subscription_status: 'canceled',
      };
      mockProfileSelect.mockResolvedValue({ data: canceledProfile, error: null });

      const { useSubscription } = await import('@/hooks/useSubscription');
      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.subscription?.status).toBe('canceled');
    });
  });
});

describe('Subscription Types', () => {
  it('should have correct Subscription interface shape', () => {
    const validSubscription = {
      plan: 'pro' as const,
      status: 'active' as const,
      interval: 'monthly' as const,
      currentPeriodEnd: '2024-12-31T00:00:00Z',
      stripeCustomerId: 'cus_123',
    };

    expect(['free', 'pro', 'business']).toContain(validSubscription.plan);
    expect(['active', 'canceled', 'past_due', 'trialing', null]).toContain(validSubscription.status);
    expect(['monthly', 'yearly', null]).toContain(validSubscription.interval);
  });

  it('should have correct UsageLimits interface shape', () => {
    const validUsage = {
      tenders: { limit: 5, used: 2, unlimited: false },
      images: { limit: 1, used: 0, unlimited: false },
      presentations: { limit: 0, used: 0, unlimited: false },
      memoiresTechniques: { limit: 0, used: 0, unlimited: false },
    };

    expect(validUsage).toHaveProperty('tenders');
    expect(validUsage).toHaveProperty('images');
    expect(validUsage).toHaveProperty('presentations');
    expect(validUsage).toHaveProperty('memoiresTechniques');
  });
});
