import { NextRequest } from 'next/server';

// Mock Supabase server
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          gte: jest.fn(() => ({
            lte: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ 
              data: [
                { id: '1', status: 'won', estimated_value: 10000, created_at: '2026-01-01' },
                { id: '2', status: 'pending', estimated_value: 5000, created_at: '2026-01-15' },
              ], 
              error: null 
            })),
          })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: { id: 'new-id' }, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id', email: 'test@example.com' } }, 
        error: null 
      })),
    },
  })),
}));

describe('API Routes', () => {
  describe('GET /api/analytics', () => {
    it('returns analytics data for authenticated user', async () => {
      const { GET } = await import('@/app/api/analytics/route');
      
      const request = new NextRequest('http://localhost:3000/api/analytics?start=2026-01-01&end=2026-01-31');
      
      const response = await GET(request);
      const data = await response.json();
      
      // Should return current and previous data
      expect(data).toHaveProperty('current');
      expect(data).toHaveProperty('previous');
    });

    it('returns 401 for unauthenticated user', async () => {
      // Override mock for this test
      const { createClient } = require('@/lib/supabase/server');
      createClient.mockImplementationOnce(() => Promise.resolve({
        auth: {
          getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        },
      }));

      const { GET } = await import('@/app/api/analytics/route');
      
      const request = new NextRequest('http://localhost:3000/api/analytics');
      
      const response = await GET(request);
      
      expect(response.status).toBe(401);
    });
  });
});

describe('Analytics Calculations', () => {
  it('calculates win rate correctly', () => {
    const tenders = [
      { status: 'won' },
      { status: 'won' },
      { status: 'lost' },
      { status: 'pending' },
    ];

    const won = tenders.filter(t => t.status === 'won').length;
    const lost = tenders.filter(t => t.status === 'lost').length;
    const total = won + lost;
    const winRate = total > 0 ? (won / total) * 100 : 0;

    expect(winRate).toBeCloseTo(66.67, 1);
  });

  it('calculates total revenue correctly', () => {
    const tenders = [
      { status: 'won', estimated_value: 10000 },
      { status: 'won', estimated_value: 15000 },
      { status: 'lost', estimated_value: 5000 },
    ];

    const revenue = tenders
      .filter(t => t.status === 'won')
      .reduce((sum, t) => sum + t.estimated_value, 0);

    expect(revenue).toBe(25000);
  });

  it('handles empty data', () => {
    const tenders: any[] = [];
    
    const total = tenders.length;
    const won = tenders.filter(t => t.status === 'won').length;
    const winRate = total > 0 ? (won / total) * 100 : 0;

    expect(total).toBe(0);
    expect(winRate).toBe(0);
  });
});

describe('Date Range Calculations', () => {
  it('calculates previous period correctly', () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-01-31');
    const duration = end.getTime() - start.getTime();

    const previousStart = new Date(start.getTime() - duration);
    const previousEnd = new Date(start.getTime());

    expect(previousStart.toISOString().substring(0, 10)).toBe('2025-12-02');
    expect(previousEnd.toISOString().substring(0, 10)).toBe('2026-01-01');
  });
});
