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
  // Tenders
  | 'tender_created'
  | 'tender_updated'
  | 'tender_deleted'
  | 'tender_status_changed'
  // Documents
  | 'document_uploaded'
  | 'document_downloaded'
  | 'document_deleted'
  // RGPD
  | 'data_exported'
  | 'account_deleted'
  | 'consent_updated'
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
  // Security
  | 'login_failed'
  | 'rate_limit_exceeded'
  | 'unauthorized_access_attempt'
  | 'malicious_file_blocked';

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
