/**
 * Middleware de sécurité pour les routes API
 * Rate limiting, CORS, et protection CSRF
 * 
 * @module middleware/security
 */

import { NextRequest, NextResponse } from 'next/server';
import { AppError, ErrorCode } from '@/lib/errors';

/**
 * Store en mémoire pour le rate limiting (production: utiliser Redis)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Configuration du rate limiting par endpoint
 */
const RATE_LIMITS = {
  '/api/ai/generate-image': { max: 10, windowMs: 60 * 1000 }, // 10 requêtes/minute
  '/api/ai/generate-presentation': { max: 5, windowMs: 60 * 1000 }, // 5 requêtes/minute
  '/api/ai/score': { max: 20, windowMs: 60 * 1000 }, // 20 requêtes/minute
  '/api/tenders': { max: 50, windowMs: 60 * 1000 }, // 50 requêtes/minute
  default: { max: 100, windowMs: 60 * 1000 }, // 100 requêtes/minute par défaut
};

/**
 * Middleware de rate limiting
 * 
 * @param request - Requête HTTP
 * @param identifier - Identifiant unique (IP ou user ID)
 * @param endpoint - Endpoint de l'API
 * @returns true si autorisé, throw AppError sinon
 */
export function rateLimit(
  request: NextRequest,
  identifier: string,
  endpoint: string
): boolean {
  const config = RATE_LIMITS[endpoint as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();

  let record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // Nouveau window ou expired
    record = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, record);
    return true;
  }

  if (record.count >= config.max) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    throw new AppError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      `Trop de requêtes. Réessayez dans ${retryAfter} secondes.`,
      429,
      { retryAfter }
    );
  }

  record.count++;
  return true;
}

/**
 * Obtient l'identifiant de l'utilisateur (IP ou user ID)
 */
export function getIdentifier(request: NextRequest, userId?: string): string {
  if (userId) return userId;
  
  // En production, utiliser l'IP réelle depuis les headers
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

/**
 * Middleware CORS
 */
export function corsMiddleware(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'https://wewinbid.com',
  ];

  // Preflight request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  return null;
}

/**
 * Ajoute les headers CORS à une réponse
 */
export function addCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'https://wewinbid.com',
  ];

  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}

/**
 * Validation simple du CSRF token (production: utiliser une lib dédiée)
 */
export function validateCsrfToken(request: NextRequest): boolean {
  // Pour les requêtes GET, pas de validation CSRF
  if (request.method === 'GET') return true;

  const token = request.headers.get('x-csrf-token');
  const cookie = request.cookies.get('csrf-token')?.value;

  // En développement, on passe la validation
  if (process.env.NODE_ENV === 'development') return true;

  return token === cookie;
}

/**
 * Nettoie le store de rate limiting (appeler périodiquement)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup automatique toutes les 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
