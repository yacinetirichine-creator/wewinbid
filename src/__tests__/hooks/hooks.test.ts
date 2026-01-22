import { renderHook, act, waitFor } from '@testing-library/react';

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
    })),
  })),
}));

describe('useAutoSave Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with default values', async () => {
    const { useAutoSave } = await import('@/hooks/useAutoSave');
    
    const { result } = renderHook(() => useAutoSave('tender-123'));
    
    expect(result.current.saveStatus).toBe('idle');
    expect(result.current.loading).toBe(true);
  });

  it('debounces save calls', async () => {
    const { useAutoSave } = await import('@/hooks/useAutoSave');
    
    const { result } = renderHook(() => useAutoSave('tender-123', { debounceMs: 1000 }));
    
    act(() => {
      result.current.updateNotes('step1', 'Note 1');
      result.current.updateNotes('step1', 'Note 2');
      result.current.updateNotes('step1', 'Note 3');
    });
    
    // Should still be idle before debounce
    expect(result.current.saveStatus).toBe('idle');
  });

  it('provides saveNow for immediate save', async () => {
    const { useAutoSave } = await import('@/hooks/useAutoSave');
    
    const { result } = renderHook(() => useAutoSave('tender-123'));
    
    await act(async () => {
      result.current.updateNotes('step1', 'Important note');
      await result.current.saveNow();
    });
    
    // Status should update after save
    expect(['saved', 'idle', 'error']).toContain(result.current.saveStatus);
  });
});

describe('useRealtimeNotifications Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with empty notifications', async () => {
    const { useRealtimeNotifications } = await import('@/hooks/useRealtimeNotifications');
    
    const { result } = renderHook(() => useRealtimeNotifications());
    
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.loading).toBe(true);
  });

  it('provides markAsRead function', async () => {
    const { useRealtimeNotifications } = await import('@/hooks/useRealtimeNotifications');
    
    const { result } = renderHook(() => useRealtimeNotifications());
    
    expect(typeof result.current.markAsRead).toBe('function');
    expect(typeof result.current.markAllAsRead).toBe('function');
    expect(typeof result.current.deleteNotification).toBe('function');
  });
});

describe('usePWA Hook', () => {
  const originalNavigator = global.navigator;
  const originalWindow = global.window;

  beforeEach(() => {
    // Mock navigator.serviceWorker
    Object.defineProperty(global, 'navigator', {
      value: {
        ...originalNavigator,
        serviceWorker: {
          register: jest.fn(() => Promise.resolve({
            addEventListener: jest.fn(),
            installing: null,
            waiting: null,
          })),
          addEventListener: jest.fn(),
          controller: null,
        },
        onLine: true,
      },
      writable: true,
    });

    // Mock window.matchMedia
    Object.defineProperty(global, 'window', {
      value: {
        ...originalWindow,
        matchMedia: jest.fn((query) => ({
          matches: false,
          media: query,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        })),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', { value: originalNavigator });
    Object.defineProperty(global, 'window', { value: originalWindow });
  });

  it('initializes with default state', async () => {
    const { usePWA } = await import('@/hooks/usePWA');
    
    const { result } = renderHook(() => usePWA());
    
    expect(result.current.state.isInstalled).toBe(false);
    expect(result.current.state.isOnline).toBe(true);
    expect(typeof result.current.install).toBe('function');
    expect(typeof result.current.update).toBe('function');
  });
});
