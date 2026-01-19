'use client';

import { useState } from 'react';
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

const SECTORS = [
  { value: 'security', label: 'Sécurité privée' },
  { value: 'electronic_security', label: 'Sécurité électronique' },
  { value: 'construction', label: 'BTP / Construction' },
  { value: 'logistics', label: 'Logistique' },
  { value: 'software', label: 'Développement logiciel' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'consulting', label: 'Conseil' },
  { value: 'other', label: 'Autre' },
];

const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employés' },
  { value: '11-50', label: '11-50 employés' },
  { value: '51-200', label: '51-200 employés' },
  { value: '201-500', label: '201-500 employés' },
  { value: '500+', label: 'Plus de 500 employés' },
];

const STEPS = [
  { id: 1, title: 'Compte', icon: User },
  { id: 2, title: 'Entreprise', icon: Building2 },
  { id: 3, title: 'Confirmation', icon: Check },
];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  
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
      setError('Veuillez remplir tous les champs obligatoires');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!companyName || !siret || !sector) {
      setError('Veuillez remplir tous les champs obligatoires');
      return false;
    }
    if (siret.length !== 14 || !/^\d+$/.test(siret)) {
      setError('Le SIRET doit contenir exactement 14 chiffres');
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
      setError('Vous devez accepter les conditions générales');
      return;
    }

    setLoading(true);
    setError(null);

    try {
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
          setError('Un compte existe déjà avec cette adresse email');
        } else {
          setError(authError.message);
        }
        return;
      }

      // Redirect to confirmation page or dashboard
      router.push('/auth/register/success');
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
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
      setError('Une erreur est survenue avec Google. Veuillez réessayer.');
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
            <Link href="/" className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">WeWinBid</span>
            </Link>

            <h1 className="text-4xl font-bold text-white mb-6">
              Démarrez gratuitement aujourd'hui
            </h1>
            
            <p className="text-xl text-slate-300 mb-8">
              Créez votre compte en quelques minutes et accédez à tous nos outils d'analyse et de génération.
            </p>

            <div className="space-y-6">
              {[
                { icon: Shield, title: '14 jours d\'essai gratuit', desc: 'Testez toutes les fonctionnalités Pro' },
                { icon: FileText, title: 'Sans engagement', desc: 'Annulez à tout moment' },
                { icon: Users, title: 'Support dédié', desc: 'Notre équipe vous accompagne' },
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
            {STEPS.map((s, idx) => (
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
                {idx < STEPS.length - 1 && (
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
                    <h2 className="text-2xl font-bold text-white mb-2">Créer votre compte</h2>
                    <p className="text-slate-400">Commençons par vos informations personnelles</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Prénom *"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Jean"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                      <Input
                        label="Nom *"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Dupont"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <Input
                      label="Email professionnel *"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@entreprise.com"
                      leftIcon={<Mail className="w-5 h-5" />}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />

                    <Input
                      label="Téléphone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                      leftIcon={<Phone className="w-5 h-5" />}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />

                    <div className="relative">
                      <Input
                        label="Mot de passe *"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="8 caractères minimum"
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
                      label="Confirmer le mot de passe *"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
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
                    Continuer
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-transparent text-slate-500">ou</span>
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
                        Continuer avec Google
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
                    <h2 className="text-2xl font-bold text-white mb-2">Votre entreprise</h2>
                    <p className="text-slate-400">Parlez-nous de votre société</p>
                  </div>

                  <div className="space-y-4">
                    <Input
                      label="Nom de l'entreprise *"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ma Société SAS"
                      leftIcon={<Building2 className="w-5 h-5" />}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />

                    <Input
                      label="SIRET *"
                      value={siret}
                      onChange={(e) => setSiret(e.target.value.replace(/\s/g, ''))}
                      placeholder="12345678901234"
                      leftIcon={<Briefcase className="w-5 h-5" />}
                      hint="14 chiffres sans espaces"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />

                    <Select
                      label="Secteur d'activité *"
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      options={[{ value: '', label: 'Sélectionnez un secteur' }, ...SECTORS]}
                      className="bg-white/5 border-white/10 text-white"
                    />

                    <Select
                      label="Taille de l'entreprise"
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      options={[{ value: '', label: 'Sélectionnez une taille' }, ...COMPANY_SIZES]}
                      className="bg-white/5 border-white/10 text-white"
                    />

                    <Input
                      label="Adresse"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 rue de la République"
                      leftIcon={<MapPin className="w-5 h-5" />}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Code postal"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="75001"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                      <Input
                        label="Ville"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Paris"
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
                      Retour
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      onClick={handleNextStep}
                      className="flex-1"
                    >
                      Continuer
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
                    <h2 className="text-2xl font-bold text-white mb-2">Confirmation</h2>
                    <p className="text-slate-400">Dernière étape avant de commencer</p>
                  </div>

                  {/* Summary */}
                  <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Email</span>
                      <span className="text-white">{email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Nom</span>
                      <span className="text-white">{firstName} {lastName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Entreprise</span>
                      <span className="text-white">{companyName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">SIRET</span>
                      <span className="text-white">{siret}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Secteur</span>
                      <span className="text-white">{SECTORS.find(s => s.value === sector)?.label}</span>
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
                        J'accepte les{' '}
                        <Link href="/legal/terms" className="text-indigo-400 hover:text-indigo-300">
                          Conditions Générales d'Utilisation
                        </Link>{' '}
                        et la{' '}
                        <Link href="/legal/privacy" className="text-indigo-400 hover:text-indigo-300">
                          Politique de Confidentialité
                        </Link>{' '}
                        *
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
                        Je souhaite recevoir les actualités et conseils de WeWinBid par email
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
                      Retour
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      onClick={handleRegister}
                      loading={loading}
                      className="flex-1"
                    >
                      {loading ? 'Création...' : 'Créer mon compte'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="mt-6 text-center text-slate-400 text-sm">
              Déjà un compte ?{' '}
              <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
