'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Building2, CheckCircle, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Vérification en cours...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setStatus('error');
          setMessage('Une erreur est survenue lors de la connexion.');
          return;
        }

        if (session) {
          const isSignup = searchParams.get('signup') === 'true';
          
          setStatus('success');
          setMessage(isSignup ? 'Compte créé avec succès !' : 'Connexion réussie !');
          
          // Redirect after a short delay
          setTimeout(() => {
            if (isSignup) {
              // New users might need to complete their profile
              router.push('/dashboard?welcome=true');
            } else {
              router.push('/dashboard');
            }
            router.refresh();
          }, 1500);
        } else {
          setStatus('error');
          setMessage('Impossible de finaliser la connexion.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Une erreur inattendue est survenue.');
      }
    };

    handleCallback();
  }, [router, searchParams, supabase.auth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">WeWinBid</span>
        </div>

        <div className="flex justify-center mb-6">
          {status === 'loading' && (
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center animate-in zoom-in duration-300">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
          )}
          {status === 'error' && (
            <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center animate-in zoom-in duration-300">
              <XCircle className="w-8 h-8 text-rose-400" />
            </div>
          )}
        </div>

        <h2 className={`text-xl font-semibold mb-2 ${
          status === 'success' ? 'text-emerald-400' :
          status === 'error' ? 'text-rose-400' :
          'text-white'
        }`}>
          {status === 'loading' && 'Authentification'}
          {status === 'success' && 'Succès !'}
          {status === 'error' && 'Erreur'}
        </h2>

        <p className="text-slate-400">{message}</p>

        {status === 'success' && (
          <p className="text-sm text-slate-500 mt-4">
            Redirection vers votre tableau de bord...
          </p>
        )}

        {status === 'error' && (
          <div className="mt-6 space-y-3">
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
            >
              Réessayer la connexion
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
