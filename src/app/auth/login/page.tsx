'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Building2, Chrome } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Alert } from '@/components/ui';
import Logo, { LogoAuth } from '@/components/ui/Logo';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

export default function LoginPage() {
  const router = useRouter();
  const { locale } = useLocale();

  const entries = useMemo(
    () => ({
      'auth.login.left.title': 'Win more tenders with AI',
      'auth.login.left.subtitle': 'Join hundreds of companies that transformed their commercial approach with WeWinBid.',
      'auth.login.left.feature1': 'AI compatibility score for every tender',
      'auth.login.left.feature2': 'Competitor analysis and price history',
      'auth.login.left.feature3': 'Automatic document generation',

      'auth.login.header.title': 'Welcome back!',
      'auth.login.header.subtitle': 'Sign in to your account',

      'auth.login.form.email.label': 'Email',
      'auth.login.form.email.placeholder': 'you@company.com',
      'auth.login.form.password.label': 'Password',
      'auth.login.form.password.placeholder': '••••••••',
      'auth.login.form.rememberMe': 'Remember me',
      'auth.login.form.forgotPassword': 'Forgot password?',

      'auth.login.actions.signingIn': 'Signing in...',
      'auth.login.actions.signIn': 'Sign in',
      'auth.login.actions.orContinueWith': 'or continue with',

      'auth.login.footer.noAccount': "Don't have an account?",
      'auth.login.footer.createAccount': 'Create an account',

      'auth.login.legal.prefix': 'By signing in, you agree to our',
      'auth.login.legal.terms': 'Terms of Service',
      'auth.login.legal.and': 'and our',
      'auth.login.legal.privacy': 'Privacy Policy',

      'auth.login.errors.invalidCredentials': 'Incorrect email or password',
      'auth.login.errors.generic': 'Something went wrong. Please try again.',
      'auth.login.errors.googleGeneric': 'Something went wrong with Google. Please try again.',
    }),
    []
  );
  const { t } = useUiTranslations(locale, entries);

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }, []);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          setError(t('auth.login.errors.invalidCredentials'));
        } else {
          setError(error.message);
        }
        return;
      }

      // Vérifier si l'entreprise est configurée
      if (data.user) {
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('company_id, created_at, onboarding_skipped_at')
          .eq('id', data.user.id)
          .single();

        // Vérifier si les 24h d'exploration sont écoulées
        if (!profile?.company_id) {
          const skipDate = profile?.onboarding_skipped_at || profile?.created_at;
          if (skipDate) {
            const skipTime = new Date(skipDate).getTime();
            const now = Date.now();
            const twentyFourHours = 24 * 60 * 60 * 1000;
            
            if ((now - skipTime) >= twentyFourHours) {
              // Les 24h sont écoulées, rediriger vers l'onboarding
              router.push('/onboarding');
            } else {
              // Encore dans la période d'exploration
              router.push('/dashboard');
            }
          } else {
            // Nouvelle inscription, laisser explorer
            router.push('/dashboard');
          }
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err) {
      setError(t('auth.login.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
    } catch (err) {
      setError(t('auth.login.errors.googleGeneric'));
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-violet-600/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" className="flex items-center mb-12">
              <LogoAuth />
            </Link>

            <h1 className="text-4xl font-bold text-white mb-6">
              {t('auth.login.left.title')}
            </h1>
            
            <p className="text-xl text-slate-300 mb-8">
              {t('auth.login.left.subtitle')}
            </p>

            <div className="space-y-4">
              {[
                t('auth.login.left.feature1'),
                t('auth.login.left.feature2'),
                t('auth.login.left.feature3'),
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + idx * 0.1 }}
                  className="flex items-center gap-3 text-slate-200"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {feature}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-slate-900/80 to-transparent" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center mb-6">
              <Logo size="md" />
            </Link>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">{t('auth.login.header.title')}</h2>
              <p className="text-slate-400">{t('auth.login.header.subtitle')}</p>
            </div>

            {error && (
              <Alert type="error" className="mb-6">
                {error}
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <Input
                label={t('auth.login.form.email.label')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.login.form.email.placeholder')}
                leftIcon={<Mail className="w-5 h-5" />}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />

              <div className="relative">
                <Input
                  label={t('auth.login.form.password.label')}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.login.form.password.placeholder')}
                  leftIcon={<Lock className="w-5 h-5" />}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/20" />
                  {t('auth.login.form.rememberMe')}
                </label>
                <Link href="/auth/forgot-password" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  {t('auth.login.form.forgotPassword')}
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
              >
                {loading ? t('auth.login.actions.signingIn') : t('auth.login.actions.signIn')}
                {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-slate-500">{t('auth.login.actions.orContinueWith')}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleGoogleLogin}
              loading={googleLoading}
              className="w-full border-white/10 text-white hover:bg-white/5"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Chrome className="w-5 h-5 mr-2" />
                  Google
                </>
              )}
            </Button>

            <p className="mt-8 text-center text-slate-400">
              {t('auth.login.footer.noAccount')}{' '}
              <Link href="/auth/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                {t('auth.login.footer.createAccount')}
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            {t('auth.login.legal.prefix')}{' '}
            <Link href="/legal/terms" className="text-slate-400 hover:text-white transition-colors">
              {t('auth.login.legal.terms')}
            </Link>{' '}
            {t('auth.login.legal.and')}{' '}
            <Link href="/legal/privacy" className="text-slate-400 hover:text-white transition-colors">
              {t('auth.login.legal.privacy')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
