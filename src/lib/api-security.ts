/**
 * Wrapper de sécurité pour les routes API
 * Fournit validation, authentification, et logging automatiques
 * 
 * @module lib/api-security
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z, ZodSchema } from 'zod';
import { sanitizeText } from '@/lib/sanitize';
import { logAuditEvent } from '@/lib/audit-logger';

// ============================================
// TYPES
// ============================================

export interface ApiContext {
  user: {
    id: string;
    email: string;
    role?: string;
  } | null;
  ip: string;
  userAgent: string;
  requestId: string;
}

export interface SecureApiOptions<T = unknown> {
  // Authentification requise
  requireAuth?: boolean;
  
  // Rôles autorisés (si requireAuth)
  allowedRoles?: string[];
  
  // Schéma de validation du body (Zod)
  bodySchema?: ZodSchema<T>;
  
  // Schéma de validation des query params
  querySchema?: ZodSchema;
  
  // Rate limiting personnalisé
  rateLimit?: {
    max: number;
    windowMs: number;
  };
  
  // Logging des actions
  auditLog?: {
    action: string;
    resource: string;
  };
  
  // Sanitization automatique
  sanitizeInput?: boolean;
}

export type SecureApiHandler<T = unknown> = (
  request: NextRequest,
  context: ApiContext,
  body?: T
) => Promise<NextResponse>;

// ============================================
// RATE LIMIT STORE
// ============================================

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= max) {
    return false;
  }
  
  record.count++;
  return true;
}

// ============================================
// UTILITAIRES
// ============================================

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;
  
  return 'unknown';
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

function createErrorResponse(
  message: string, 
  status: number, 
  requestId: string,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      requestId,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && details ? { details } : {}),
    },
    { 
      status,
      headers: {
        'X-Request-Id': requestId,
      }
    }
  );
}

// ============================================
// WRAPPER PRINCIPAL
// ============================================

/**
 * Crée un handler API sécurisé avec validation, auth, et logging
 * 
 * @example
 * ```ts
 * export const POST = withApiSecurity(
 *   async (request, context, body) => {
 *     // body est typé et validé
 *     return NextResponse.json({ success: true });
 *   },
 *   {
 *     requireAuth: true,
 *     bodySchema: z.object({ name: z.string() }),
 *     auditLog: { action: 'create', resource: 'tender' }
 *   }
 * );
 * ```
 */
export function withApiSecurity<T = unknown>(
  handler: SecureApiHandler<T>,
  options: SecureApiOptions<T> = {}
): (request: NextRequest) => Promise<NextResponse> {
  const {
    requireAuth = true,
    allowedRoles,
    bodySchema,
    querySchema,
    rateLimit,
    auditLog,
    sanitizeInput = true,
  } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    try {
      // 1. RATE LIMITING
      if (rateLimit) {
        const rateLimitKey = `api:${ip}:${request.nextUrl.pathname}`;
        if (!checkRateLimit(rateLimitKey, rateLimit.max, rateLimit.windowMs)) {
          return createErrorResponse(
            'Trop de requêtes. Veuillez réessayer plus tard.',
            429,
            requestId
          );
        }
      }

      // 2. AUTHENTIFICATION
      let user: ApiContext['user'] = null;

      if (requireAuth) {
        const supabase = await createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
          return createErrorResponse('Non authentifié', 401, requestId);
        }

        // Récupérer le profil pour le rôle
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authUser.id)
          .single();

        user = {
          id: authUser.id,
          email: authUser.email || '',
          role: profile?.role,
        };

        // 3. VÉRIFICATION DES RÔLES
        if (allowedRoles && allowedRoles.length > 0) {
          if (!user.role || !allowedRoles.includes(user.role)) {
            await logAuditEvent({
              action: 'unauthorized_access_attempt',
              resource: request.nextUrl.pathname,
              userId: user.id,
              details: { requiredRoles: allowedRoles, userRole: user.role },
            });

            return createErrorResponse('Accès non autorisé', 403, requestId);
          }
        }
      }

      // 4. VALIDATION DES QUERY PARAMS
      if (querySchema) {
        const queryParams = Object.fromEntries(request.nextUrl.searchParams);
        const queryValidation = querySchema.safeParse(queryParams);

        if (!queryValidation.success) {
          return createErrorResponse(
            'Paramètres de requête invalides',
            400,
            requestId,
            queryValidation.error.errors
          );
        }
      }

      // 5. PARSING ET VALIDATION DU BODY
      let body: T | undefined;

      if (bodySchema && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          let rawBody = await request.json();

          // Sanitization
          if (sanitizeInput && typeof rawBody === 'object' && rawBody !== null) {
            rawBody = sanitizeObject(rawBody);
          }

          const bodyValidation = bodySchema.safeParse(rawBody);

          if (!bodyValidation.success) {
            return createErrorResponse(
              'Données invalides',
              400,
              requestId,
              bodyValidation.error.errors
            );
          }

          body = bodyValidation.data;
        } catch {
          return createErrorResponse('Corps de la requête invalide', 400, requestId);
        }
      }

      // 6. CONTEXTE
      const context: ApiContext = {
        user,
        ip,
        userAgent,
        requestId,
      };

      // 7. EXÉCUTION DU HANDLER
      const response = await handler(request, context, body);

      // 8. AUDIT LOG
      if (auditLog && user) {
        await logAuditEvent({
          action: auditLog.action,
          resource: auditLog.resource,
          userId: user.id,
          details: {
            method: request.method,
            path: request.nextUrl.pathname,
            ip,
          },
        });
      }

      // 9. AJOUT DES HEADERS DE SÉCURITÉ
      response.headers.set('X-Request-Id', requestId);
      response.headers.set('X-Content-Type-Options', 'nosniff');

      return response;

    } catch (error) {
      // Logging de l'erreur
      console.error(`[API Error] ${requestId}:`, error);

      // Ne pas exposer les détails d'erreur en production
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Erreur interne')
        : 'Une erreur est survenue';

      return createErrorResponse(errorMessage, 500, requestId);
    }
  };
}

// ============================================
// HELPERS POUR LES ROUTES API
// ============================================

/**
 * Handler pour les routes publiques (sans auth)
 */
export function withPublicApi<T = unknown>(
  handler: SecureApiHandler<T>,
  options: Omit<SecureApiOptions<T>, 'requireAuth'> = {}
): (request: NextRequest) => Promise<NextResponse> {
  return withApiSecurity(handler, { ...options, requireAuth: false });
}

/**
 * Handler pour les routes admin uniquement
 */
export function withAdminApi<T = unknown>(
  handler: SecureApiHandler<T>,
  options: Omit<SecureApiOptions<T>, 'requireAuth' | 'allowedRoles'> = {}
): (request: NextRequest) => Promise<NextResponse> {
  return withApiSecurity(handler, { 
    ...options, 
    requireAuth: true, 
    allowedRoles: ['admin', 'super_admin'] 
  });
}

/**
 * Vérifie si un utilisateur peut accéder à une ressource
 */
export async function canAccessResource(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  const supabase = await createClient();

  // Logique de vérification d'accès selon le type de ressource
  switch (resourceType) {
    case 'tender': {
      const { data } = await supabase
        .from('tenders')
        .select('user_id')
        .eq('id', resourceId)
        .single();
      return data?.user_id === userId;
    }
    case 'document': {
      const { data } = await supabase
        .from('documents')
        .select('user_id')
        .eq('id', resourceId)
        .single();
      return data?.user_id === userId;
    }
    default:
      return false;
  }
}
