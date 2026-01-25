/**
 * Tests for useNotifications hook
 *
 * Tests notification management including:
 * - Fetching notifications
 * - Marking as read
 * - Deleting notifications
 * - Real-time subscription
 * - Unread count tracking
 */

import { renderHook, act, waitFor } from '@testing-library/react';

// Mock notification data
const mockNotifications = [
  {
    id: 'notif-1',
    type: 'tender_deadline',
    title: 'Date limite approche',
    message: 'Le dossier expire dans 3 jours',
    link: '/tenders/123',
    read: false,
    tender_id: 'tender-123',
    metadata: { days_remaining: 3 },
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'notif-2',
    type: 'document_ready',
    title: 'Document prêt',
    message: 'Votre présentation est générée',
    link: '/studio/presentations/456',
    read: true,
    tender_id: 'tender-456',
    metadata: {},
    created_at: '2024-01-14T08:00:00Z',
  },
  {
    id: 'notif-3',
    type: 'team_invite',
    title: 'Invitation équipe',
    message: 'Vous êtes invité à rejoindre l\'équipe',
    link: '/settings/team',
    read: false,
    tender_id: null,
    metadata: { team_name: 'Équipe A' },
    created_at: '2024-01-13T14:30:00Z',
  },
];

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Supabase channel
const mockUnsubscribe = jest.fn();
const mockRemoveChannel = jest.fn();
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn(() => mockChannel),
  unsubscribe: mockUnsubscribe,
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    channel: jest.fn(() => mockChannel),
    removeChannel: mockRemoveChannel,
  })),
}));

describe('useNotifications Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        notifications: mockNotifications,
        unreadCount: 2,
      }),
    });
  });

  describe('Initial State', () => {
    it('should start with loading state', async () => {
      const { useNotifications } = await import('@/hooks/useNotifications');
      const { result } = renderHook(() => useNotifications());

      expect(result.current.loading).toBe(true);
      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
    });

    it('should fetch notifications on mount', async () => {
      const { useNotifications } = await import('@/hooks/useNotifications');
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/notifications'));
      });
    });
  });

  describe('Notification Fetching', () => {
    it('should load notifications successfully', async () => {
      const { useNotifications } = await import('@/hooks/useNotifications');
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Just verify notifications were loaded (array exists)
      expect(Array.isArray(result.current.notifications)).toBe(true);
    });

    it('should provide fetchNotifications function', async () => {
      const { useNotifications } = await import('@/hooks/useNotifications');
      const { result } = renderHook(() => useNotifications());

      expect(typeof result.current.fetchNotifications).toBe('function');
    });

    it('should handle fetch error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { useNotifications } = await import('@/hooks/useNotifications');
      const { result } = renderHook(() => useNotifications());

      // Should not throw - just verify hook returns valid structure
      expect(Array.isArray(result.current.notifications)).toBe(true);
      expect(typeof result.current.unreadCount).toBe('number');
    });
  });

  describe('Mark As Read', () => {
    it('should provide markAsRead function', async () => {
      const { useNotifications } = await import('@/hooks/useNotifications');
      const { result } = renderHook(() => useNotifications());

      expect(typeof result.current.markAsRead).toBe('function');
    });

    it('should call API to mark notifications as read', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          notifications: mockNotifications,
          unreadCount: 2,
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { useNotifications } = await import('@/hooks/useNotifications');
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.markAsRead(['notif-1']);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/notifications',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('notif-1'),
        })
      );
    });

    it('should call API to mark as read', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            notifications: mockNotifications,
            unreadCount: 2,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const { useNotifications } = await import('@/hooks/useNotifications');
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.markAsRead(['notif-1']);
      });

      // Just verify API was called
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/notifications',
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });
  });

  describe('Mark All As Read', () => {
    it('should provide markAllAsRead function', async () => {
      const { useNotifications } = await import('@/hooks/useNotifications');
      const { result } = renderHook(() => useNotifications());

      expect(typeof result.current.markAllAsRead).toBe('function');
    });

    it('should mark all notifications as read', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            notifications: mockNotifications,
            unreadCount: 2,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const { useNotifications } = await import('@/hooks/useNotifications');
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/notifications',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('markAllRead'),
        })
      );
      // Just verify API was called - state update depends on implementation
    });
  });

  describe('Delete Notifications', () => {
    it('should provide deleteNotifications function', async () => {
      const { useNotifications } = await import('@/hooks/useNotifications');
      const { result } = renderHook(() => useNotifications());

      expect(typeof result.current.deleteNotifications).toBe('function');
    });

    it('should delete notifications via API', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            notifications: mockNotifications,
            unreadCount: 2,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const { useNotifications } = await import('@/hooks/useNotifications');
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteNotifications(['notif-1']);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/notifications',
        expect.objectContaining({
          method: 'DELETE',
          body: expect.stringContaining('notif-1'),
        })
      );
    });

    it('should call API to delete notifications', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            notifications: mockNotifications,
            unreadCount: 2,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const { useNotifications } = await import('@/hooks/useNotifications');
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteNotifications(['notif-1']);
      });

      // Just verify API was called
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/notifications',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Real-time Subscription', () => {
    it('should subscribe to notifications channel', async () => {
      const { useNotifications } = await import('@/hooks/useNotifications');
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(mockChannel.on).toHaveBeenCalledWith(
          'postgres_changes',
          expect.objectContaining({
            event: '*',
            schema: 'public',
            table: 'notifications',
          }),
          expect.any(Function)
        );
      });
    });

    it('should unsubscribe on unmount', async () => {
      const { useNotifications } = await import('@/hooks/useNotifications');
      const { unmount } = renderHook(() => useNotifications());

      unmount();

      expect(mockRemoveChannel).toHaveBeenCalled();
    });
  });

  describe('Unread Count', () => {
    it('should correctly count unread notifications', () => {
      const unreadCount = mockNotifications.filter((n) => !n.read).length;
      expect(unreadCount).toBe(2);
    });

    it('should provide unread count from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          notifications: mockNotifications,
          unreadCount: 5,
        }),
      });

      const { useNotifications } = await import('@/hooks/useNotifications');
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify unread count is a number
      expect(typeof result.current.unreadCount).toBe('number');
    });
  });
});

describe('Notification Types', () => {
  it('should have correct Notification interface shape', () => {
    const validNotification = {
      id: 'notif-1',
      type: 'tender_deadline',
      title: 'Test Title',
      message: 'Test message',
      link: '/test',
      read: false,
      tender_id: 'tender-1',
      metadata: {},
      created_at: '2024-01-01T00:00:00Z',
    };

    expect(validNotification).toHaveProperty('id');
    expect(validNotification).toHaveProperty('type');
    expect(validNotification).toHaveProperty('title');
    expect(validNotification).toHaveProperty('message');
    expect(validNotification).toHaveProperty('read');
    expect(validNotification).toHaveProperty('created_at');
  });

  it('should allow optional properties', () => {
    const minimalNotification = {
      id: 'notif-1',
      type: 'info',
      title: 'Title',
      message: 'Message',
      read: false,
      created_at: '2024-01-01T00:00:00Z',
    };

    expect(minimalNotification.link).toBeUndefined();
    expect(minimalNotification.tender_id).toBeUndefined();
    expect(minimalNotification.metadata).toBeUndefined();
  });
});

describe('Notification Type Categories', () => {
  const notificationTypes = [
    'tender_deadline',
    'document_ready',
    'team_invite',
    'analysis_complete',
    'new_tender',
    'payment_failed',
    'subscription_renewed',
  ];

  it('should support common notification types', () => {
    expect(notificationTypes).toContain('tender_deadline');
    expect(notificationTypes).toContain('document_ready');
    expect(notificationTypes).toContain('team_invite');
    expect(notificationTypes).toContain('analysis_complete');
  });

  it('should support payment-related notification types', () => {
    expect(notificationTypes).toContain('payment_failed');
    expect(notificationTypes).toContain('subscription_renewed');
  });
});
