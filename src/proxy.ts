import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { rateLimit, getIdentifier } from '@/lib/security';

// ============================================
// CONFIGURATION DE SÉCURITÉ
// ============================================

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_AUTH_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Stores pour tracking
const authAttempts = new Map<string, { count: number; resetTime: number; blockedUntil?: number }>();
const suspiciousIPs = new Map<string, { count: number; lastAttempt: number }>();

// Patterns de requêtes suspectes
const SUSPICIOUS_PATTERNS = [
  /(\.\.|\/\/|\\\\)/, // Path traversal
  /<script/i, // XSS
  /javascript:/i,
  /on\w+\s*=/i, // Event handlers
  /union\s+select/i, // SQL injection
  /exec\s*\(/i,
  /eval\s*\(/i,
];

// User agents suspects (scanners/bots malveillants)
const SUSPICIOUS_USER_AGENTS = [
  /sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /burp/i, /dirbuster/i, /gobuster/i, /wfuzz/i, /hydra/i,
];

// Routes sensibles
const SENSITIVE_AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/reset-password', '/api/auth/'];

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function getClientIP(request: NextRequest): string {
  const cfIP = request.headers.get('cf-connecting-ip');
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (cfIP) return cfIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;
  return 'unknown';
}

function isSuspiciousRequest(request: NextRequest): { suspicious: boolean; reason?: string } {
  const url = request.nextUrl.toString();
  const userAgent = request.headers.get('user-agent') || '';
  
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(url)) {
      return { suspicious: true, reason: `URL pattern: ${pattern.source}` };
    }
  }
  
  for (const pattern of SUSPICIOUS_USER_AGENTS) {
    if (pattern.test(userAgent)) {
      return { suspicious: true, reason: `User agent: ${userAgent}` };
    }
  }
  
  return { suspicious: false };
}

function checkAuthRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  let record = authAttempts.get(ip);
  
  if (record?.blockedUntil && now < record.blockedUntil) {
    return { allowed: false, retryAfter: Math.ceil((record.blockedUntil - now) / 1000) };
  }
  
  if (!record || now > record.resetTime) {
    authAttempts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  
  record.count++;
  if (record.count > MAX_AUTH_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    return { allowed: false, retryAfter: Math.ceil(BLOCK_DURATION_MS / 1000) };
  }
  
  return { allowed: true };
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  return response;
}

function logSecurityEvent(type: string, ip: string, details: Record<string, unknown>, request: NextRequest): void {
  const event = {
    timestamp: new Date().toISOString(),
    type,
    ip,
    path: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    ...details,
  };
  
  if (process.env.NODE_ENV === 'production') {
    console.warn('[SECURITY]', JSON.stringify(event));
  }
}

/**
 * Next.js proxy for authentication, rate limiting, and security.
 *
 * Flow:
 * 1. Check for suspicious requests
 * 2. Rate limit auth routes (brute force protection)
 * 3. Apply general rate limiting to API routes
 * 4. Validate CSRF for mutations
 * 5. Update Supabase auth session
 * 6. Add security headers
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);

  // 1. DÉTECTION DES REQUÊTES SUSPECTES
  const { suspicious, reason } = isSuspiciousRequest(request);
  if (suspicious) {
    logSecurityEvent('suspicious_request', ip, { reason }, request);
    
    const record = suspiciousIPs.get(ip) || { count: 0, lastAttempt: 0 };
    record.count++;
    record.lastAttempt = Date.now();
    suspiciousIPs.set(ip, record);
    
    if (record.count > 10) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
  }

  // 2. RATE LIMITING POUR ROUTES D'AUTH (protection brute force)
  const isAuthRoute = SENSITIVE_AUTH_ROUTES.some(route => pathname.startsWith(route));
  if (isAuthRoute && ['POST', 'PUT'].includes(request.method)) {
    const authLimit = checkAuthRateLimit(ip);
    if (!authLimit.allowed) {
      logSecurityEvent('auth_rate_limit', ip, { retryAfter: authLimit.retryAfter }, request);
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez réessayer plus tard.', retryAfter: authLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(authLimit.retryAfter) } }
      );
    }
  }

  // 3. RATE LIMITING GÉNÉRAL POUR API
  if (pathname.startsWith('/api/')) {
    try {
      const identifier = getIdentifier(request);
      rateLimit(request, identifier, pathname);
    } catch (error: any) {
      logSecurityEvent('rate_limit', ip, { endpoint: pathname }, request);
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: error.message || 'Rate limit exceeded.',
          retryAfter: error.metadata?.retryAfter,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(error.metadata?.retryAfter || 60) },
        }
      );
    }
  }

  // 4. PROTECTION CSRF POUR MUTATIONS (POST, PUT, PATCH, DELETE)
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    // Routes exemptées (webhooks, callbacks)
    const exemptedRoutes = ['/api/webhooks', '/api/stripe/webhook', '/api/auth/callback'];
    const isExempted = exemptedRoutes.some(route => pathname.startsWith(route));
    
    if (!isExempted && process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        `https://${host}`,
        process.env.NEXT_PUBLIC_APP_URL,
      ].filter(Boolean);
      
      if (origin && !allowedOrigins.some(allowed => origin === allowed)) {
        logSecurityEvent('csrf_violation', ip, { origin, host }, request);
        return NextResponse.json(
          { error: 'Invalid request origin' },
          { status: 403 }
        );
      }
    }
  }

  // 5. VÉRIFICATION METHOD OVERRIDE
  if (request.headers.get('x-http-method-override')) {
    logSecurityEvent('method_override_attempt', ip, {}, request);
    return NextResponse.json(
      { error: 'Method override not allowed' },
      { status: 400 }
    );
  }

  // 6. MISE À JOUR SESSION SUPABASE
  let response = await updateSession(request);

  // 7. AJOUT HEADERS SÉCURITÉ
  response = addSecurityHeaders(response);

  return response;
}

// Also export as default to be compatible across Next versions.
export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
