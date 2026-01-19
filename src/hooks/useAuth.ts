/**
 * useAuth - Hook pour gérer l'authentification et les rôles
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: {
    id: string;
    role: 'user' | 'admin';
    company_id: string | null;
  } | null;
  loading: boolean;
  isAdmin: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isAdmin: false,
  });

  useEffect(() => {
    const supabase = createClient();

    // Récupérer l'utilisateur initial
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Récupérer le profil avec le rôle
        supabase
          .from('profiles')
          .select('id, role, company_id')
          .eq('id', user.id)
          .single()
          .then(({ data: profile }) => {
            setState({
              user,
              profile: profile || null,
              loading: false,
              isAdmin: (profile as any)?.role === 'admin',
            });
          });
      } else {
        setState({
          user: null,
          profile: null,
          loading: false,
          isAdmin: false,
        });
      }
    });

    // Écouter les changements d'auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role, company_id')
          .eq('id', session.user.id)
          .single();

        setState({
          user: session.user,
          profile: profile || null,
          loading: false,
          isAdmin: (profile as any)?.role === 'admin',
        });
      } else {
        setState({
          user: null,
          profile: null,
          loading: false,
          isAdmin: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setState({
      user: null,
      profile: null,
      loading: false,
      isAdmin: false,
    });
  };

  return {
    ...state,
    signOut,
  };
}
