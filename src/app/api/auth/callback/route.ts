import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description);
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error_description || error)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError);
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent('Erreur de connexion. Veuillez réessayer.')}`
      );
    }

    // Get user after successful authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Check if profile exists, create if not
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        // Create profile
        await (supabase as any).from('profiles').insert({
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          avatar_url: user.user_metadata?.avatar_url || '',
        });
      }
    }

    // Redirect to the requested page
    return NextResponse.redirect(`${origin}${next}`);
  }

  // No code provided, redirect to login
  return NextResponse.redirect(`${origin}/auth/login`);
}

export async function POST(request: NextRequest) {
  // Handle POST requests for email verification, password reset, etc.
  const supabase = await createClient();
  const { origin } = new URL(request.url);
  
  try {
    const body = await request.json();
    const { type, token_hash, email } = body;

    switch (type) {
      case 'signup':
      case 'email_change':
      case 'recovery':
        if (token_hash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type === 'recovery' ? 'recovery' : 'email',
          });

          if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
          }

          return NextResponse.json({ success: true });
        }
        break;

      case 'magiclink':
        if (email) {
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: `${origin}/auth/callback`,
            },
          });

          if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
          }

          return NextResponse.json({ success: true, message: 'Magic link sent' });
        }
        break;
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Auth callback POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
