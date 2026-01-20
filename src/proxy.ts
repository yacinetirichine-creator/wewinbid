import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { rateLimit } from '@/lib/security';

/**
 * Next.js proxy for authentication and rate limiting.
 *
 * Flow:
 * 1. Check rate limits for API routes
 * 2. Update Supabase auth session
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    try {
      const identifier =
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown';
      rateLimit(request, identifier, pathname);
    } catch (error: any) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: error.message || 'Rate limit exceeded.',
          retryAfter: error.metadata?.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(error.metadata?.retryAfter || 60),
          },
        }
      );
    }
  }

  // Update Supabase session
  return await updateSession(request);
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
