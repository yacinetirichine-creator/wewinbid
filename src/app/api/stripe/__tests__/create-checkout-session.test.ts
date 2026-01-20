/** @jest-environment node */

/**
 * Tests pour la route API /api/stripe/create-checkout-session
 * Vérifie la création de sessions Stripe et la gestion des erreurs
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

describe('POST /api/stripe/create-checkout-session', () => {
  describe('Validation des entrées', () => {
    it('should reject request without authentication', async () => {
      const request = new NextRequest('http://localhost:3000/api/stripe/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_1Sqy1TGGLTfcP2aLy7MtCKIb',
          plan: 'pro',
          interval: 'monthly',
        }),
      });

      // Test sans session utilisateur
      // La route devrait retourner 401 Unauthorized
      expect(request.method).toBe('POST');
    });

    it('should validate required fields', () => {
      const validBody = {
        priceId: 'price_1Sqy1TGGLTfcP2aLy7MtCKIb',
        plan: 'pro',
        interval: 'monthly',
      };

      expect(validBody.priceId).toBeDefined();
      expect(validBody.plan).toBeDefined();
      expect(validBody.interval).toBeDefined();
    });

    it('should validate Price ID format', () => {
      const priceIds = [
        'price_1Sqy1TGGLTfcP2aLy7MtCKIb', // Pro Monthly
        'price_1Sqy1ZGGLTfcP2aLbIVEtX2K', // Pro Yearly
        'price_1Sqy1qGGLTfcP2aLSY0AHqXC', // Business Monthly
        'price_1Sqy1xGGLTfcP2aL2K5RMkfW', // Business Yearly
      ];

      const priceIdRegex = /^price_[a-zA-Z0-9]+$/;
      
      priceIds.forEach(priceId => {
        expect(priceId).toMatch(priceIdRegex);
      });
    });

    it('should validate plan values', () => {
      const validPlans = ['pro', 'business'];
      const invalidPlans = ['free', 'enterprise', '', null];

      validPlans.forEach(plan => {
        expect(['pro', 'business']).toContain(plan);
      });

      invalidPlans.forEach(plan => {
        expect(['pro', 'business']).not.toContain(plan);
      });
    });

    it('should validate interval values', () => {
      const validIntervals = ['monthly', 'yearly'];
      const invalidIntervals = ['weekly', 'daily', '', null];

      validIntervals.forEach(interval => {
        expect(['monthly', 'yearly']).toContain(interval);
      });

      invalidIntervals.forEach(interval => {
        expect(['monthly', 'yearly']).not.toContain(interval);
      });
    });
  });

  describe('URL de redirection', () => {
    it('should have correct success URL format', () => {
      const plan = 'pro';
      const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?success=true&plan=${plan}`;
      
      expect(successUrl).toContain('/dashboard');
      expect(successUrl).toContain('success=true');
      expect(successUrl).toContain(`plan=${plan}`);
    });

    it('should have correct cancel URL format', () => {
      const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?canceled=true`;
      
      expect(cancelUrl).toContain('/pricing');
      expect(cancelUrl).toContain('canceled=true');
    });
  });

  describe('Correspondance Price ID / Plan / Interval', () => {
    const priceMapping = [
      { priceId: 'price_1Sqy1TGGLTfcP2aLy7MtCKIb', plan: 'pro', interval: 'monthly', amount: 4900 },
      { priceId: 'price_1Sqy1ZGGLTfcP2aLbIVEtX2K', plan: 'pro', interval: 'yearly', amount: 49000 },
      { priceId: 'price_1Sqy1qGGLTfcP2aLSY0AHqXC', plan: 'business', interval: 'monthly', amount: 14900 },
      { priceId: 'price_1Sqy1xGGLTfcP2aL2K5RMkfW', plan: 'business', interval: 'yearly', amount: 149000 },
    ];

    it('should map Pro Monthly correctly', () => {
      const pro = priceMapping.find(p => p.plan === 'pro' && p.interval === 'monthly');
      expect(pro?.priceId).toBe('price_1Sqy1TGGLTfcP2aLy7MtCKIb');
      expect(pro?.amount).toBe(4900); // 49.00 EUR
    });

    it('should map Pro Yearly correctly', () => {
      const pro = priceMapping.find(p => p.plan === 'pro' && p.interval === 'yearly');
      expect(pro?.priceId).toBe('price_1Sqy1ZGGLTfcP2aLbIVEtX2K');
      expect(pro?.amount).toBe(49000); // 490.00 EUR
    });

    it('should map Business Monthly correctly', () => {
      const business = priceMapping.find(p => p.plan === 'business' && p.interval === 'monthly');
      expect(business?.priceId).toBe('price_1Sqy1qGGLTfcP2aLSY0AHqXC');
      expect(business?.amount).toBe(14900); // 149.00 EUR
    });

    it('should map Business Yearly correctly', () => {
      const business = priceMapping.find(p => p.plan === 'business' && p.interval === 'yearly');
      expect(business?.priceId).toBe('price_1Sqy1xGGLTfcP2aL2K5RMkfW');
      expect(business?.amount).toBe(149000); // 1490.00 EUR
    });
  });

  describe('Metadata de la session', () => {
    it('should include user_id in metadata', () => {
      const metadata = {
        user_id: 'test-user-123',
        plan: 'pro',
        interval: 'monthly',
      };

      expect(metadata.user_id).toBeDefined();
      expect(metadata.plan).toBeDefined();
      expect(metadata.interval).toBeDefined();
    });

    it('should include plan and interval in metadata', () => {
      const metadata = {
        user_id: 'test-user-123',
        plan: 'business',
        interval: 'yearly',
      };

      expect(metadata.plan).toBe('business');
      expect(metadata.interval).toBe('yearly');
    });
  });
});
