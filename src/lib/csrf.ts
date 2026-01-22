/**
 * Système de protection CSRF pour WeWinBid
 * Génère et valide des tokens CSRF pour les formulaires et API
 * 
 * @module lib/csrf
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// ============================================
// CONFIGURATION
// ============================================

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_MAX_AGE = 60 * 60 * 24; // 24 heures

// ============================================
// GÉNÉRATION DE TOKENS
// ============================================

/**
 * Génère un token CSRF cryptographiquement sécurisé
 */
export function generateCsrfToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(randomValues);
  
  let token = '';
  for (let i = 0; i < CSRF_TOKEN_LENGTH; i++) {
    token += chars[randomValues[i] % chars.length];
  }
  
  return token;
}

/**
 * Génère un token CSRF signé avec timestamp
 */
export function generateSignedCsrfToken(secret: string): string {
  const timestamp = Date.now().toString(36);
  const random = generateCsrfToken();
  const data = `${timestamp}.${random}`;
  
  // Créer une signature HMAC-like simple (en production, utiliser crypto.subtle)
  const signature = hashString(`${data}.${secret}`).substring(0, 16);
  
  return `${data}.${signature}`;
}

/**
 * Hash simple pour la signature (utiliser crypto.subtle en production)
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ============================================
// VALIDATION
// ============================================

/**
 * Vérifie si un token CSRF est valide
 */
export function validateCsrfToken(token: string, cookieToken: string): boolean {
  if (!token || !cookieToken) return false;
  if (token.length !== cookieToken.length) return false;
  
  // Comparaison en temps constant pour éviter les timing attacks
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Vérifie un token CSRF signé
 */
export function validateSignedCsrfToken(token: string, secret: string, maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const [timestamp, random, signature] = parts;
    
    // Vérifier l'âge du token
    const tokenTime = parseInt(timestamp, 36);
    if (Date.now() - tokenTime > maxAgeMs) return false;
    
    // Vérifier la signature
    const expectedSignature = hashString(`${timestamp}.${random}.${secret}`).substring(0, 16);
    return validateCsrfToken(signature, expectedSignature);
  } catch {
    return false;
  }
}

// ============================================
// COOKIES
// ============================================

/**
 * Définit le cookie CSRF
 */
export function setCsrfCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: CSRF_COOKIE_MAX_AGE,
  });
  
  return response;
}

/**
 * Récupère le token CSRF du cookie
 */
export async function getCsrfTokenFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

/**
 * Récupère le token CSRF du header de la requête
 */
export function getCsrfTokenFromHeader(request: NextRequest): string | undefined {
  return request.headers.get(CSRF_HEADER_NAME) || undefined;
}

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Middleware de validation CSRF pour les routes API
 */
export async function csrfMiddleware(request: NextRequest): Promise<{ valid: boolean; error?: string }> {
  // Méthodes sûres - pas de validation CSRF nécessaire
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { valid: true };
  }
  
  // En développement, on peut désactiver
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_CSRF === 'true') {
    return { valid: true };
  }
  
  const headerToken = getCsrfTokenFromHeader(request);
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  
  if (!headerToken) {
    return { valid: false, error: 'Token CSRF manquant dans le header' };
  }
  
  if (!cookieToken) {
    return { valid: false, error: 'Cookie CSRF manquant' };
  }
  
  if (!validateCsrfToken(headerToken, cookieToken)) {
    return { valid: false, error: 'Token CSRF invalide' };
  }
  
  return { valid: true };
}

// ============================================
// HELPERS POUR COMPOSANTS CLIENT
// ============================================

/**
 * Génère le script pour injecter le token CSRF dans les formulaires
 * À utiliser dans le layout principal
 */
export function getCsrfScript(token: string): string {
  return `
    window.__CSRF_TOKEN__ = "${token}";
    
    // Ajouter automatiquement le token aux requêtes fetch
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
      options.headers = options.headers || {};
      if (typeof options.headers === 'object' && !Array.isArray(options.headers)) {
        options.headers['${CSRF_HEADER_NAME}'] = window.__CSRF_TOKEN__;
      }
      return originalFetch(url, options);
    };
  `;
}

/**
 * Hook React pour récupérer le token CSRF côté client
 */
export function getClientCsrfToken(): string | null {
  if (typeof window !== 'undefined') {
    return (window as any).__CSRF_TOKEN__ || null;
  }
  return null;
}
