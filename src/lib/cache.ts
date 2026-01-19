/**
 * @fileoverview Redis cache utility for performance optimization.
 * Uses Upstash Redis for serverless-friendly caching.
 * 
 * USAGE:
 * - cache.get<T>(key): Get cached value
 * - cache.set(key, value, ttl): Set cache with TTL in seconds
 * - cache.del(key): Delete cached value
 * - cache.invalidate(pattern): Invalidate multiple keys matching pattern
 * 
 * TTL RECOMMENDATIONS:
 * - Recommendations: 5 minutes (300s) - frequently changing
 * - Analytics: 15 minutes (900s) - less frequent updates
 * - Tender matching scores: 10 minutes (600s) - moderate frequency
 * - Static data (sectors, countries): 24 hours (86400s)
 */

import { Redis } from '@upstash/redis';

// Initialize Redis client - environment variables required:
// UPSTASH_REDIS_REST_URL
// UPSTASH_REDIS_REST_TOKEN
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * Cache utility with type-safe operations
 */
export const cache = {
  /**
   * Get cached value
   * @param key Cache key
   * @returns Cached value or null
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!process.env.UPSTASH_REDIS_REST_URL) {
        console.warn('Redis not configured, skipping cache get');
        return null;
      }

      const value = await redis.get<T>(key);
      return value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * Set cached value with TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (default: 5 minutes)
   */
  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      if (!process.env.UPSTASH_REDIS_REST_URL) {
        console.warn('Redis not configured, skipping cache set');
        return;
      }

      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  /**
   * Delete cached value
   * @param key Cache key
   */
  async del(key: string): Promise<void> {
    try {
      if (!process.env.UPSTASH_REDIS_REST_URL) {
        return;
      }

      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  /**
   * Invalidate cache keys matching pattern
   * @param pattern Pattern to match (e.g., 'recommendations:*')
   */
  async invalidate(pattern: string): Promise<void> {
    try {
      if (!process.env.UPSTASH_REDIS_REST_URL) {
        return;
      }

      // Scan for matching keys (Upstash supports SCAN)
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  },
};

/**
 * Cache key builders for consistent naming
 */
export const cacheKeys = {
  // Recommendations cache
  recommendations: (userId: string) => `recommendations:${userId}`,
  recommendationsCompany: (companyId: string) => `recommendations:company:${companyId}`,

  // Analytics cache
  analytics: (companyId: string, period: string) => `analytics:${companyId}:${period}`,
  dashboardStats: (companyId: string) => `dashboard:stats:${companyId}`,

  // Tender matching scores
  tenderScore: (tenderId: string, companyId: string) => `tender:score:${tenderId}:${companyId}`,
  tenderMatches: (tenderId: string) => `tender:matches:${tenderId}`,

  // Static data
  sectors: () => 'static:sectors',
  countries: () => 'static:countries',
};

/**
 * Cache TTL constants (in seconds)
 */
export const cacheTTL = {
  SHORT: 60, // 1 minute - for rapidly changing data
  MEDIUM: 300, // 5 minutes - for frequently updated data
  LONG: 900, // 15 minutes - for less frequent updates
  HOUR: 3600, // 1 hour - for semi-static data
  DAY: 86400, // 24 hours - for static data
};
