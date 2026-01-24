import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: any) {
          cookiesToSet.forEach(({ name, value, options }: any) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }: any) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Rafraîchir la session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Routes protégées
  const protectedRoutes = ['/dashboard', '/tenders', '/analytics', '/studio', '/alerts', '/documents', '/settings'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // Rediriger vers login si non authentifié
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Rediriger vers dashboard si déjà authentifié et sur page auth
  const authRoutes = ['/auth/login', '/auth/register'];
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
