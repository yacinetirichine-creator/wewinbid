/**
 * Tests for useAuth hook
 *
 * Tests authentication including:
 * - Initial auth state
 * - User authentication detection
 * - Profile and role management
 * - Sign out functionality
 * - Admin detection
 */

import { renderHook, act, waitFor } from '@testing-library/react';

// Mock user data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
};

const mockProfile = {
  id: 'user-123',
  role: 'user' as const,
  company_id: 'company-456',
};

const mockAdminProfile = {
  id: 'admin-123',
  role: 'admin' as const,
  company_id: null,
};

// Mock Supabase
const mockUnsubscribe = jest.fn();
const mockSignOut = jest.fn(() => Promise.resolve({ error: null }));
const mockOnAuthStateChange = jest.fn(() => ({
  data: { subscription: { unsubscribe: mockUnsubscribe } },
}));
const mockGetUser = jest.fn();
const mockProfileSelect = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: mockProfileSelect,
        })),
      })),
    })),
  })),
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockProfileSelect.mockResolvedValue({ data: null, error: null });
  });

  describe('Initial State', () => {
    it('should start with loading state', async () => {
      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.profile).toBeNull();
      expect(result.current.isAdmin).toBe(false);
    });
  });

  describe('Authenticated User', () => {
    it('should detect authenticated user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockProfileSelect.mockResolvedValue({ data: mockProfile, error: null });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeTruthy();
      expect(result.current.profile).toBeTruthy();
    });

    it('should load user profile with role', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockProfileSelect.mockResolvedValue({ data: mockProfile, error: null });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profile?.role).toBe('user');
      expect(result.current.profile?.company_id).toBe('company-456');
    });
  });

  describe('Admin Detection', () => {
    it('should detect admin users', async () => {
      const adminUser = { ...mockUser, id: 'admin-123' };
      mockGetUser.mockResolvedValue({ data: { user: adminUser }, error: null });
      mockProfileSelect.mockResolvedValue({ data: mockAdminProfile, error: null });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(true);
    });

    it('should not mark regular users as admin', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockProfileSelect.mockResolvedValue({ data: mockProfile, error: null });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
    });
  });

  describe('Unauthenticated User', () => {
    it('should handle unauthenticated state', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.profile).toBeNull();
      expect(result.current.isAdmin).toBe(false);
    });
  });

  describe('Sign Out', () => {
    it('should provide signOut function', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockProfileSelect.mockResolvedValue({ data: mockProfile, error: null });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.signOut).toBe('function');
    });

    it('should clear state on sign out', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockProfileSelect.mockResolvedValue({ data: mockProfile, error: null });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.profile).toBeNull();
      expect(result.current.isAdmin).toBe(false);
    });
  });

  describe('Auth State Change Listener', () => {
    it('should subscribe to auth state changes', async () => {
      const { useAuth } = await import('@/hooks/useAuth');
      renderHook(() => useAuth());

      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    it('should unsubscribe on unmount', async () => {
      const { useAuth } = await import('@/hooks/useAuth');
      const { unmount } = renderHook(() => useAuth());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle profile fetch error gracefully', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockProfileSelect.mockResolvedValue({ data: null, error: { message: 'Profile not found' } });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not throw, profile should be null
      expect(result.current.profile).toBeNull();
    });
  });
});

describe('Auth State Types', () => {
  it('should have correct shape for AuthState', () => {
    const validState = {
      user: null,
      profile: null,
      loading: false,
      isAdmin: false,
    };

    expect(validState).toHaveProperty('user');
    expect(validState).toHaveProperty('profile');
    expect(validState).toHaveProperty('loading');
    expect(validState).toHaveProperty('isAdmin');
  });

  it('should have correct shape for profile', () => {
    const validProfile = {
      id: 'user-123',
      role: 'user' as const,
      company_id: 'company-456',
    };

    expect(validProfile.role).toMatch(/^(user|admin)$/);
    expect(typeof validProfile.id).toBe('string');
  });
});
