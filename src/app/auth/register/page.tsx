'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Loader2, 
  Building2, Chrome, User, Phone, MapPin, Briefcase, Check,
  Shield, FileText, Users
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Select, Alert } from '@/components/ui';
import Logo, { LogoAuth } from '@/components/ui/Logo';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

type OptionKeyed = { value: string; labelKey: string };

const SECTOR_OPTIONS: OptionKeyed[] = [
  { value: 'security', labelKey: 'auth.register.sectors.security' },
  { value: 'electronic_security', labelKey: 'auth.register.sectors.electronic_security' },
  { value: 'construction', labelKey: 'auth.register.sectors.construction' },
  { value: 'logistics', labelKey: 'auth.register.sectors.logistics' },
  { value: 'software', labelKey: 'auth.register.sectors.software' },
  { value: 'maintenance', labelKey: 'auth.register.sectors.maintenance' },
  { value: 'consulting', labelKey: 'auth.register.sectors.consulting' },
  { value: 'other', labelKey: 'auth.register.sectors.other' },
];

const COMPANY_SIZE_OPTIONS: OptionKeyed[] = [
  { value: '1-10', labelKey: 'auth.register.companySizes.1-10' },
  { value: '11-50', labelKey: 'auth.register.companySizes.11-50' },
  { value: '51-200', labelKey: 'auth.register.companySizes.51-200' },
  { value: '201-500', labelKey: 'auth.register.companySizes.201-500' },
  { value: '500+', labelKey: 'auth.register.companySizes.500+' },
];

const STEP_DEFS = [
  { id: 1, titleKey: 'auth.register.steps.account', icon: User },
  { id: 2, titleKey: 'auth.register.steps.company', icon: Building2 },
  { id: 3, titleKey: 'auth.register.steps.confirmation', icon: Check },
];

export default function RegisterPage() {
  const router = useRouter();
  const { locale } = useLocale();

  const entries = useMemo(
    () => ({
      'auth.register.left.title': "Démarrez gratuitement aujourd'hui",
      'auth.register.left.subtitle':
        "Créez votre compte en quelques minutes et accédez à tous nos outils d'analyse et de génération.",
      'auth.register.left.feature1.title': "14 jours d'essai gratuit",
      'auth.register.left.feature1.desc': 'Testez toutes les fonctionnalités Pro',
      'auth.register.left.feature2.title': 'Sans engagement',
      'auth.register.left.feature2.desc': 'Annulez à tout moment',
      'auth.register.left.feature3.title': 'Support dédié',
      'auth.register.left.feature3.desc': 'Notre équipe vous accompagne',

      'auth.register.steps.account': 'Compte',
      'auth.register.steps.company': 'Entreprise',
      'auth.register.steps.confirmation': 'Confirmation',

      'auth.register.step1.title': 'Créer votre compte',
      'auth.register.step1.subtitle': 'Commençons par vos informations personnelles',
      'auth.register.step1.firstName.label': 'Prénom *',
      'auth.register.step1.firstName.placeholder': 'Jean',
      'auth.register.step1.lastName.label': 'Nom *',
      'auth.register.step1.lastName.placeholder': 'Dupont',
      'auth.register.step1.email.label': 'Email professionnel *',
      'auth.register.step1.email.placeholder': 'vous@entreprise.com',
      'auth.register.step1.phone.label': 'Téléphone',
      'auth.register.step1.phone.placeholder': '+33 6 12 34 56 78',
      'auth.register.step1.password.label': 'Mot de passe *',
      'auth.register.step1.password.placeholder': '8 caractères minimum',
      'auth.register.step1.confirmPassword.label': 'Confirmer le mot de passe *',
      'auth.register.step1.confirmPassword.placeholder': '••••••••',

      'auth.register.step2.title': 'Votre entreprise',
      'auth.register.step2.subtitle': 'Parlez-nous de votre société',
      'auth.register.step2.companyName.label': "Nom de l'entreprise *",
      'auth.register.step2.companyName.placeholder': 'Ma Société SAS',
      'auth.register.step2.siret.label': 'SIRET *',
      'auth.register.step2.siret.placeholder': '12345678901234',
      'auth.register.step2.siret.hint': '14 chiffres sans espaces',
      'auth.register.step2.sector.label': "Secteur d'activité *",
      'auth.register.step2.sector.placeholder': 'Sélectionnez un secteur',
      'auth.register.step2.companySize.label': "Taille de l'entreprise",
      'auth.register.step2.companySize.placeholder': 'Sélectionnez une taille',
      'auth.register.step2.address.label': 'Adresse',
      'auth.register.step2.address.placeholder': '123 rue de la République',
      'auth.register.step2.postalCode.label': 'Code postal',
      'auth.register.step2.postalCode.placeholder': '75001',
      'auth.register.step2.city.label': 'Ville',
      'auth.register.step2.city.placeholder': 'Paris',

      'auth.register.step3.title': 'Confirmation',
      'auth.register.step3.subtitle': 'Dernière étape avant de commencer',
      'auth.register.step3.summary.email': 'Email',
      'auth.register.step3.summary.name': 'Nom',
      'auth.register.step3.summary.company': 'Entreprise',
      'auth.register.step3.summary.siret': 'SIRET',
      'auth.register.step3.summary.sector': 'Secteur',
      'auth.register.step3.acceptTerms.prefix': "J'accepte les",
      'auth.register.step3.acceptTerms.and': 'et la',
      'auth.register.step3.acceptTerms.terms': "Conditions Générales d'Utilisation",
      'auth.register.step3.acceptTerms.privacy': 'Politique de confidentialité',
      'auth.register.step3.acceptTerms.requiredMarker': '*',
      'auth.register.step3.newsletter': 'Je souhaite recevoir les actualités et conseils de WeWinBid par email',

      'auth.register.actions.continue': 'Continuer',
      'auth.register.actions.back': 'Retour',
      'auth.register.actions.or': 'ou',
      'auth.register.actions.continueWithGoogle': 'Continuer avec Google',
      'auth.register.actions.creating': 'Création...',
      'auth.register.actions.createAccount': 'Créer mon compte',
      'auth.register.footer.haveAccount': 'Déjà un compte ?',
      'auth.register.footer.signIn': 'Se connecter',

      'auth.register.errors.requiredFields': 'Veuillez remplir tous les champs obligatoires',
      'auth.register.errors.passwordMismatch': 'Les mots de passe ne correspondent pas',
      'auth.register.errors.passwordTooShort': 'Le mot de passe doit contenir au moins 8 caractères',
      'auth.register.errors.invalidSiret': 'Le SIRET doit contenir exactement 14 chiffres',
      'auth.register.errors.mustAcceptTerms': 'Vous devez accepter les conditions générales',
      'auth.register.errors.emailAlreadyRegistered': 'Un compte existe déjà avec cette adresse email',
      'auth.register.errors.generic': 'Une erreur est survenue. Veuillez réessayer.',
      'auth.register.errors.googleGeneric': 'Une erreur est survenue avec Google. Veuillez réessayer.',

      // Options
      'auth.register.sectors.security': 'Sécurité privée',
      'auth.register.sectors.electronic_security': 'Sécurité électronique',
      'auth.register.sectors.construction': 'BTP / Construction',
      'auth.register.sectors.logistics': 'Logistique',
      'auth.register.sectors.software': 'Développement logiciel',
      'auth.register.sectors.maintenance': 'Maintenance',
      'auth.register.sectors.consulting': 'Conseil',
      'auth.register.sectors.other': 'Autre',
      'auth.register.companySizes.1-10': '1-10 employés',
      'auth.register.companySizes.11-50': '11-50 employés',
      'auth.register.companySizes.51-200': '51-200 employés',
      'auth.register.companySizes.201-500': '201-500 employés',
      'auth.register.companySizes.500+': 'Plus de 500 employés',
    }),
    []
  );
  const { t } = useUiTranslations(locale, entries);

  const sectors = useMemo(
    () => SECTOR_OPTIONS.map((s) => ({ value: s.value, label: t(s.labelKey) })),
    [t]
  );
  const companySizes = useMemo(
    () => COMPANY_SIZE_OPTIONS.map((s) => ({ value: s.value, label: t(s.labelKey) })),
    [t]
  );
  const steps = useMemo(
    () => STEP_DEFS.map((s) => ({ id: s.id, title: t(s.titleKey), icon: s.icon })),
    [t]
  );

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }, []);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: Company
  const [companyName, setCompanyName] = useState('');
  const [siret, setSiret] = useState('');
  const [sector, setSector] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Step 3: Terms
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptNewsletter, setAcceptNewsletter] = useState(false);

  const validateStep1 = () => {
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      setError(t('auth.register.errors.requiredFields'));
      return false;
    }
    if (password !== confirmPassword) {
      setError(t('auth.register.errors.passwordMismatch'));
      return false;
    }
    if (password.length < 8) {
      setError(t('auth.register.errors.passwordTooShort'));
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!companyName || !siret || !sector) {
      setError(t('auth.register.errors.requiredFields'));
      return false;
    }
    if (siret.length !== 14 || !/^\d+$/.test(siret)) {
      setError(t('auth.register.errors.invalidSiret'));
      return false;
    }
    setError(null);
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      setError(t('auth.register.errors.mustAcceptTerms'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
            company_name: companyName,
            siret,
            sector,
            company_size: companySize,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError(t('auth.register.errors.emailAlreadyRegistered'));
        } else {
          setError(authError.message);
        }
        return;
      }

      // Redirect to confirmation page or dashboard
      router.push('/auth/register/success');
    } catch (err) {
      setError(t('auth.register.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?signup=true`,
        },
      });

      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
    } catch (err) {
      setError(t('auth.register.errors.googleGeneric'));
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
              {t('auth.register.left.title')}
            </h1>
            
            <p className="text-xl text-slate-300 mb-8">
              {t('auth.register.left.subtitle')}
            </p>

            <div className="space-y-6">
              {[
                { icon: Shield, title: t('auth.register.left.feature1.title'), desc: t('auth.register.left.feature1.desc') },
                { icon: FileText, title: t('auth.register.left.feature2.title'), desc: t('auth.register.left.feature2.desc') },
                { icon: Users, title: t('auth.register.left.feature3.title'), desc: t('auth.register.left.feature3.desc') },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + idx * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-slate-400 text-sm">{feature.desc}</p>
                  </div>
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
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">WeWinBid</span>
            </Link>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  step === s.id 
                    ? 'bg-indigo-500 text-white' 
                    : step > s.id 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-white/5 text-slate-500'
                }`}>
                  {step > s.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <s.icon className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    step > s.id ? 'bg-emerald-500' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
            {error && (
              <Alert type="error" className="mb-6">
                {error}
              </Alert>
            )}

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">{t('auth.register.step1.title')}</h2>
                    <p className="text-slate-400">{t('auth.register.step1.subtitle')}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label={t('auth.register.step1.firstName.label')}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder={t('auth.register.step1.firstName.placeholder')}
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                      <Input
                        label={t('auth.register.step1.lastName.label')}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder={t('auth.register.step1.lastName.placeholder')}
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <Input
                      label={t('auth.register.step1.email.label')}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.register.step1.email.placeholder')}
                      leftIcon={<Mail className="w-5 h-5" />}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />

                    <Input
                      label={t('auth.register.step1.phone.label')}
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('auth.register.step1.phone.placeholder')}
                      leftIcon={<Phone className="w-5 h-5" />}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />

                    <div className="relative">
                      <Input
                        label={t('auth.register.step1.password.label')}
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('auth.register.step1.password.placeholder')}
                        leftIcon={<Lock className="w-5 h-5" />}
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

                    <Input
                      label={t('auth.register.step1.confirmPassword.label')}
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('auth.register.step1.confirmPassword.placeholder')}
                      leftIcon={<Lock className="w-5 h-5" />}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={handleNextStep}
                    className="w-full mt-6"
                  >
                    {t('auth.register.actions.continue')}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-transparent text-slate-500">{t('auth.register.actions.or')}</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleGoogleSignup}
                    loading={googleLoading}
                    className="w-full border-white/10 text-white hover:bg-white/5"
                  >
                    {googleLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Chrome className="w-5 h-5 mr-2" />
                        {t('auth.register.actions.continueWithGoogle')}
                      </>
                    )}
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">{t('auth.register.step2.title')}</h2>
                    <p className="text-slate-400">{t('auth.register.step2.subtitle')}</p>
                  </div>

                  <div className="space-y-4">
                    <Input
                      label={t('auth.register.step2.companyName.label')}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={t('auth.register.step2.companyName.placeholder')}
                      leftIcon={<Building2 className="w-5 h-5" />}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />

                    <Input
                      label={t('auth.register.step2.siret.label')}
                      value={siret}
                      onChange={(e) => setSiret(e.target.value.replace(/\s/g, ''))}
                      placeholder={t('auth.register.step2.siret.placeholder')}
                      leftIcon={<Briefcase className="w-5 h-5" />}
                      hint={t('auth.register.step2.siret.hint')}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />

                    <Select
                      label={t('auth.register.step2.sector.label')}
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      options={[{ value: '', label: t('auth.register.step2.sector.placeholder') }, ...sectors]}
                      className="bg-white/5 border-white/10 text-white"
                    />

                    <Select
                      label={t('auth.register.step2.companySize.label')}
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      options={[{ value: '', label: t('auth.register.step2.companySize.placeholder') }, ...companySizes]}
                      className="bg-white/5 border-white/10 text-white"
                    />

                    <Input
                      label={t('auth.register.step2.address.label')}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={t('auth.register.step2.address.placeholder')}
                      leftIcon={<MapPin className="w-5 h-5" />}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label={t('auth.register.step2.postalCode.label')}
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder={t('auth.register.step2.postalCode.placeholder')}
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                      <Input
                        label={t('auth.register.step2.city.label')}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={t('auth.register.step2.city.placeholder')}
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => setStep(1)}
                      className="flex-1 border-white/10 text-white hover:bg-white/5"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      {t('auth.register.actions.back')}
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      onClick={handleNextStep}
                      className="flex-1"
                    >
                      {t('auth.register.actions.continue')}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">{t('auth.register.step3.title')}</h2>
                    <p className="text-slate-400">{t('auth.register.step3.subtitle')}</p>
                  </div>

                  {/* Summary */}
                  <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">{t('auth.register.step3.summary.email')}</span>
                      <span className="text-white">{email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">{t('auth.register.step3.summary.name')}</span>
                      <span className="text-white">{firstName} {lastName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">{t('auth.register.step3.summary.company')}</span>
                      <span className="text-white">{companyName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">{t('auth.register.step3.summary.siret')}</span>
                      <span className="text-white">{siret}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">{t('auth.register.step3.summary.sector')}</span>
                      <span className="text-white">{sectors.find((s) => s.value === sector)?.label}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/20" 
                      />
                      <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                        {t('auth.register.step3.acceptTerms.prefix')}{' '}
                        <Link href="/legal/terms" className="text-indigo-400 hover:text-indigo-300">
                          {t('auth.register.step3.acceptTerms.terms')}
                        </Link>{' '}
                        {t('auth.register.step3.acceptTerms.and')}{' '}
                        <Link href="/legal/privacy" className="text-indigo-400 hover:text-indigo-300">
                          {t('auth.register.step3.acceptTerms.privacy')}
                        </Link>{' '}
                        {t('auth.register.step3.acceptTerms.requiredMarker')}
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={acceptNewsletter}
                        onChange={(e) => setAcceptNewsletter(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/20" 
                      />
                      <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                        {t('auth.register.step3.newsletter')}
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => setStep(2)}
                      className="flex-1 border-white/10 text-white hover:bg-white/5"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      {t('auth.register.actions.back')}
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      onClick={handleRegister}
                      loading={loading}
                      className="flex-1"
                    >
                      {loading ? t('auth.register.actions.creating') : t('auth.register.actions.createAccount')}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="mt-6 text-center text-slate-400 text-sm">
              {t('auth.register.footer.haveAccount')}{' '}
              <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                {t('auth.register.footer.signIn')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
