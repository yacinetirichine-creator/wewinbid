/**
 * Utilitaire pour créer des logs d'audit centralisés
 * Utilisé pour la conformité RGPD et la sécurité
 */

import { createClient } from '@/lib/supabase/server';

export type AuditAction =
  // Auth
  | 'user_login'
  | 'user_logout'
  | 'user_signup'
  | 'password_changed'
  | 'password_reset_requested'
  | 'session_created'
  | 'session_expired'
  // Tenders
  | 'tender_created'
  | 'tender_updated'
  | 'tender_deleted'
  | 'tender_status_changed'
  | 'tender_exported'
  // Documents
  | 'document_uploaded'
  | 'document_downloaded'
  | 'document_deleted'
  | 'document_signed'
  | 'document_shared'
  // RGPD
  | 'data_exported'
  | 'account_deleted'
  | 'consent_updated'
  | 'data_access_request'
  | 'data_rectification'
  // Subscription
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'payment_succeeded'
  | 'payment_failed'
  // Team
  | 'team_member_invited'
  | 'team_member_removed'
  | 'team_member_role_changed'
  // Security - Extended
  | 'login_failed'
  | 'login_blocked'
  | 'rate_limit_exceeded'
  | 'unauthorized_access_attempt'
  | 'malicious_file_blocked'
  | 'suspicious_request'
  | 'csrf_violation'
  | 'xss_attempt'
  | 'sql_injection_attempt'
  | 'brute_force_detected'
  | 'api_key_created'
  | 'api_key_revoked'
  | 'api_key_used'
  | 'webhook_created'
  | 'webhook_deleted'
  | 'permission_changed'
  | 'ip_blocked'
  | 'ip_unblocked'
  // Approvals
  | 'approval_requested'
  | 'approval_approved'
  | 'approval_rejected'
  | 'approval_delegated'
  // Generic
  | 'create'
  | 'read'
  | 'update'
  | 'delete';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export type AuditResource = 
  | 'user'
  | 'tender'
  | 'document'
  | 'subscription'
  | 'team'
  | 'company'
  | 'payment';

interface CreateAuditLogParams {
  action: AuditAction;
  userId?: string;
  companyId?: string;
  resource?: AuditResource;
  resourceId?: string;
  details?: Record<string, any>;
  severity?: AuditSeverity;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  statusCode?: number;
  errorMessage?: string;
}

/**
 * Crée un log d'audit dans la base de données
 * 
 * @example
 * ```typescript
 * await createAuditLog({
 *   action: 'document_uploaded',
 *   userId: user.id,
 *   companyId: profile.company_id,
 *   resource: 'document',
 *   resourceId: document.id,
 *   details: {
 *     file_name: 'memo.pdf',
 *     size_mb: 2.5,
 *   },
 *   severity: 'info',
 *   ipAddress: req.headers.get('x-forwarded-for'),
 * });
 * ```
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<string | null> {
  try {
    const supabase = await createClient();

    // Utiliser la fonction SQL pour bypasser RLS
    const { data, error } = await (supabase as any).rpc('create_audit_log', {
      p_user_id: params.userId || null,
      p_company_id: params.companyId || null,
      p_action: params.action,
      p_resource: params.resource || null,
      p_resource_id: params.resourceId || null,
      p_details: params.details ? JSON.stringify(params.details) : null,
      p_severity: params.severity || 'info',
      p_ip_address: params.ipAddress || null,
      p_user_agent: params.userAgent || null,
      p_request_method: params.requestMethod || null,
      p_request_path: params.requestPath || null,
      p_status_code: params.statusCode || null,
      p_error_message: params.errorMessage || null,
    });

    if (error) {
      console.error('[AUDIT LOG ERROR]', error);
      return null;
    }

    return data as string;
  } catch (error) {
    console.error('[AUDIT LOG ERROR]', error);
    return null;
  }
}

/**
 * Helper pour extraire l'IP de la requête
 */
export function getIpAddress(request: Request): string | undefined {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || undefined;
}

/**
 * Helper pour extraire le User-Agent
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

/**
 * Helper pour logger une action RGPD
 */
export async function logRgpdAction(
  action: Extract<AuditAction, 'data_exported' | 'account_deleted' | 'consent_updated'>,
  userId: string,
  companyId: string,
  details?: Record<string, any>,
  request?: Request
) {
  return createAuditLog({
    action,
    userId,
    companyId,
    resource: 'user',
    resourceId: userId,
    details,
    severity: 'info',
    ipAddress: request ? getIpAddress(request) : undefined,
    userAgent: request ? getUserAgent(request) : undefined,
    requestMethod: request?.method,
    requestPath: request ? new URL(request.url).pathname : undefined,
  });
}

/**
 * Helper pour logger une erreur de sécurité
 */
export async function logSecurityEvent(
  action: Extract<AuditAction, 'login_failed' | 'rate_limit_exceeded' | 'unauthorized_access_attempt' | 'malicious_file_blocked'>,
  details: Record<string, any>,
  request?: Request,
  userId?: string,
  companyId?: string
) {
  return createAuditLog({
    action,
    userId,
    companyId,
    details,
    severity: 'warning',
    ipAddress: request ? getIpAddress(request) : undefined,
    userAgent: request ? getUserAgent(request) : undefined,
    requestMethod: request?.method,
    requestPath: request ? new URL(request.url).pathname : undefined,
  });
}

/**
 * Helper pour logger un événement de document
 */
export async function logDocumentEvent(
  action: Extract<AuditAction, 'document_uploaded' | 'document_downloaded' | 'document_deleted'>,
  userId: string,
  companyId: string,
  documentId: string,
  details: Record<string, any>,
  request?: Request
) {
  return createAuditLog({
    action,
    userId,
    companyId,
    resource: 'document',
    resourceId: documentId,
    details,
    severity: 'info',
    ipAddress: request ? getIpAddress(request) : undefined,
    userAgent: request ? getUserAgent(request) : undefined,
    requestMethod: request?.method,
    requestPath: request ? new URL(request.url).pathname : undefined,
  });
}

/**
 * Interface simplifiée pour logAuditEvent (compatible avec api-security.ts)
 */
interface AuditEventParams {
  action: AuditAction | string;
  resource: string;
  userId?: string;
  resourceId?: string;
  details?: Record<string, any>;
  severity?: AuditSeverity;
}

/**
 * Log générique pour audit (utilisé par api-security.ts)
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    await createAuditLog({
      action: params.action as AuditAction,
      userId: params.userId,
      resource: params.resource as AuditResource,
      resourceId: params.resourceId,
      details: params.details,
      severity: params.severity || 'info',
    });
  } catch (error) {
    // Ne pas bloquer si le logging échoue
    console.error('[AUDIT LOG] Failed to log event:', error);
  }
}

/**
 * Log critique pour les incidents de sécurité majeurs
 */
export async function logCriticalSecurityEvent(
  action: AuditAction,
  details: Record<string, any>,
  request?: Request,
  userId?: string
): Promise<void> {
  // Log dans la BDD
  await createAuditLog({
    action,
    userId,
    details: {
      ...details,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    },
    severity: 'critical',
    ipAddress: request ? getIpAddress(request) : undefined,
    userAgent: request ? getUserAgent(request) : undefined,
    requestMethod: request?.method,
    requestPath: request ? new URL(request.url).pathname : undefined,
  });
  
  // Log également dans la console avec alerte
  console.error('[CRITICAL SECURITY EVENT]', {
    action,
    details,
    ip: request ? getIpAddress(request) : 'unknown',
    path: request ? new URL(request.url).pathname : 'unknown',
  });
  
  // En production, on pourrait envoyer à Sentry, Slack, etc.
  if (process.env.NODE_ENV === 'production' && process.env.SECURITY_WEBHOOK_URL) {
    try {
      await fetch(process.env.SECURITY_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'critical_security_event',
          action,
          details,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      // Ignorer les erreurs de webhook
    }
  }
}

/**
 * Vérifie les tentatives de brute force et bloque si nécessaire
 */
const loginAttempts = new Map<string, { count: number; lastAttempt: number; blocked: boolean }>();

export function checkBruteForce(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  blockDurationMs: number = 60 * 60 * 1000 // 1 heure
): { allowed: boolean; attemptsRemaining: number; blockedUntil?: number } {
  const now = Date.now();
  let record = loginAttempts.get(identifier);
  
  // Nettoyer les anciennes entrées
  if (record && now - record.lastAttempt > windowMs) {
    loginAttempts.delete(identifier);
    record = undefined;
  }
  
  // Vérifier si bloqué
  if (record?.blocked) {
    const blockedUntil = record.lastAttempt + blockDurationMs;
    if (now < blockedUntil) {
      return { 
        allowed: false, 
        attemptsRemaining: 0, 
        blockedUntil 
      };
    }
    // Débloquer
    loginAttempts.delete(identifier);
    record = undefined;
  }
  
  if (!record) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now, blocked: false });
    return { allowed: true, attemptsRemaining: maxAttempts - 1 };
  }
  
  record.count++;
  record.lastAttempt = now;
  
  if (record.count >= maxAttempts) {
    record.blocked = true;
    return { 
      allowed: false, 
      attemptsRemaining: 0, 
      blockedUntil: now + blockDurationMs 
    };
  }
  
  return { 
    allowed: true, 
    attemptsRemaining: maxAttempts - record.count 
  };
}

/**
 * Enregistre une tentative de login réussie (reset le compteur)
 */
export function resetBruteForceCounter(identifier: string): void {
  loginAttempts.delete(identifier);
}
