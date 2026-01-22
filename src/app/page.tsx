'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle,
  Sparkles,
  BarChart3,
  Users,
  FileText,
  Shield,
  Zap,
  Globe,
  Award,
  TrendingUp,
  Clock,
  Target,
  Building2,
  ChevronRight,
  MousePointer2,
  Layers,
  Search,
  Bot
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { DEFAULT_LOCALE, isRTL, LOCALES, LOCALE_FLAGS, LOCALE_NAMES, type Locale } from '@/lib/i18n';
import { useLandingTranslations } from '@/lib/i18n/landing-translations';

const features = [
  {
    icon: Sparkles,
    titleKey: 'landing.features.aiScore.title',
    descriptionKey: 'landing.features.aiScore.description',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: BarChart3,
    titleKey: 'landing.features.winners.title',
    descriptionKey: 'landing.features.winners.description',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Users,
    titleKey: 'landing.features.marketplace.title',
    descriptionKey: 'landing.features.marketplace.description',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: FileText,
    titleKey: 'landing.features.generation.title',
    descriptionKey: 'landing.features.generation.description',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Clock,
    titleKey: 'landing.features.alerts.title',
    descriptionKey: 'landing.features.alerts.description',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Target,
    titleKey: 'landing.features.roi.title',
    descriptionKey: 'landing.features.roi.description',
    color: 'from-indigo-500 to-blue-600',
  },
];

const stats = [
  { value: '233 Mds €', labelKey: 'landing.stats.market', icon: Building2 },
  { value: '+45%', labelKey: 'landing.stats.success', icon: TrendingUp },
  { value: '-60%', labelKey: 'landing.stats.time', icon: Clock },
  { value: '15+', labelKey: 'landing.stats.sectors', icon: Target },
];

const testimonials = [
  {
    quoteKey: 'landing.testimonials.quote1',
    author: 'Marie Lefort',
    roleKey: 'landing.testimonials.role1',
    avatar: '/images/testimonials/marie.jpg',
  },
  {
    quoteKey: 'landing.testimonials.quote2',
    author: 'Thomas Durand',
    roleKey: 'landing.testimonials.role2',
    avatar: '/images/testimonials/thomas.jpg',
  },
  {
    quoteKey: 'landing.testimonials.quote3',
    author: 'Sophie Martin',
    roleKey: 'landing.testimonials.role3',
    avatar: '/images/testimonials/sophie.jpg',
  },
];

const BentoItem = ({ feature, index, t }: { feature: any, index: number, t: any }) => {
  const isLarge = index === 0 || index === 3;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`${isLarge ? 'md:col-span-2' : 'md:col-span-1'} group`}
    >
      <div className="h-full p-8 rounded-3xl bg-white/50 backdrop-blur-sm border border-surface-200 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 relative overflow-hidden group-hover:border-primary-200">
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${feature.color} opacity-[0.03] rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700`} />
        
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform duration-300`}>
          <feature.icon className="w-7 h-7 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold text-surface-900 mb-3 font-display">
          {t(feature.titleKey)}
        </h3>
        <p className="text-surface-600 leading-relaxed text-lg">
          {t(feature.descriptionKey)}
        </p>
        
        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
          <div className={`w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-primary-600`}>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function Hero3DCard({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPos = mouseX - width / 2;
    const yPos = mouseY - height / 2;
    x.set(xPos);
    y.set(yPos);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="perspective-1000 w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
       <motion.div 
         className="relative rounded-2xl shadow-2xl border border-surface-200/50 bg-white/40 backdrop-blur-md overflow-hidden transform-gpu ring-1 ring-white/50"
         style={{ transformStyle: "preserve-3d" }}
       >
         {children}
         <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-transparent pointer-events-none mix-blend-overlay" />
         <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 pointer-events-none animate-shimmer" style={{ backgroundSize: '50% 100%' }} />
       </motion.div>
    </motion.div>
  );
}

export default function LandingPage() {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [0, 1]);
  const headerY = useTransform(scrollY, [0, 100], [-20, 0]);

  // Utiliser les traductions statiques
  const { t } = useLandingTranslations(locale);

  const normalizeLocale = (value?: string | null): Locale => {
    if (!value) return DEFAULT_LOCALE;
    const normalized = value.toLowerCase();
    if (normalized === 'ar-ma' || normalized.startsWith('ar')) return 'ar-MA';
    const base = normalized.split('-')[0];
    if (LOCALES.includes(base as Locale)) return base as Locale;
    if (LOCALES.includes(normalized as Locale)) return normalized as Locale;
    return DEFAULT_LOCALE;
  };

  useEffect(() => {
    const saved = window.localStorage.getItem('locale') || window.localStorage.getItem('language');
    const browser = navigator.language;
    setLocale(normalizeLocale(saved || browser));
  }, []);

  const handleLocaleChange = (next: Locale) => {
    setLocale(next);
    window.localStorage.setItem('locale', next);
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 80; // hauteur du header
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <div
      className="min-h-screen bg-surface-50 overflow-x-hidden selection:bg-primary-500/30"
      dir={isRTL(locale) ? 'rtl' : 'ltr'}
    >
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      {/* Navigation */}
      <motion.nav 
        style={{ backgroundColor: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)" }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-surface-200/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/30">
                W
              </div>
              <span className="font-display font-bold text-2xl text-surface-900 tracking-tight">WeWinBid</span>
            </div>
            <div className="hidden md:flex items-center gap-10">
              <a 
                href="#features" 
                onClick={(e) => handleSmoothScroll(e, 'features')}
                className="text-sm font-medium text-surface-600 hover:text-primary-600 transition-colors cursor-pointer"
              >
                {t('landing.nav.features')}
              </a>
              <a 
                href="#pricing" 
                onClick={(e) => handleSmoothScroll(e, 'pricing')}
                className="text-sm font-medium text-surface-600 hover:text-primary-600 transition-colors cursor-pointer"
              >
                {t('landing.nav.pricing')}
              </a>
              <a 
                href="#roi" 
                onClick={(e) => handleSmoothScroll(e, 'roi')}
                className="text-sm font-medium text-surface-600 hover:text-primary-600 transition-colors cursor-pointer"
              >
                ROI & Performances
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="font-medium text-surface-600 hover:text-surface-900">{t('landing.nav.login')}</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="btn-gradient shadow-lg shadow-primary-500/25 rounded-full px-6">
                  {t('landing.nav.trial')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative pt-40 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary-400/20 blur-[120px] rounded-full mix-blend-multiply opacity-50 animate-pulse-soft" />
        <div className="absolute top-40 left-1/4 w-[600px] h-[400px] bg-secondary-400/20 blur-[100px] rounded-full mix-blend-multiply opacity-50 animate-float" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-left"
            >
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-surface-200 shadow-sm backdrop-blur-sm mb-8"
              >
                <Badge variant="primary" className="rounded-full px-3 py-0.5 text-xs shadow-none">NEW</Badge>
                <span className="text-sm font-medium text-surface-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                  {t('landing.hero.badge')}
                </span>
              </motion.div>
              
              <h1 className="text-6xl sm:text-7xl font-display font-bold text-surface-900 mb-8 leading-[1.1] tracking-tight">
                {t('landing.hero.titlePrefix')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600 animate-shimmer bg-[length:200%_auto]">
                  {t('landing.hero.titleHighlight')}
                </span>
              </h1>
              
              <p className="text-xl text-surface-600 mb-10 max-w-lg leading-relaxed">
                {t('landing.hero.subtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
                <Link href="/auth/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto btn-gradient h-14 px-8 text-lg rounded-full shadow-xl shadow-primary-500/20 hover:scale-105 transition-transform duration-200">
                    {t('landing.hero.ctaStart')}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <a href="https://calendly.com/commercial-wewinbid/30min" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full bg-white/50 border-surface-200 hover:bg-white transition-all">
                    {t('landing.hero.ctaDemo')}
                  </Button>
                </a>
              </div>

              <div className="flex items-center gap-8 text-sm font-medium text-surface-500">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-success-100 flex items-center justify-center text-success-600">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  {t('landing.hero.trust.freeTrial')}
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded-full bg-success-100 flex items-center justify-center text-success-600">
                    <Shield className="w-3 h-3" />
                  </div>
                  {t('landing.hero.trust.gdpr')}
                </div>
              </div>
            </motion.div>

            {/* Right 3D Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <Hero3DCard>
                <div className="bg-surface-50 aspect-[4/3] p-1">
                  {/* Mock Dashboard UI */}
                  <div className="w-full h-full bg-white rounded-xl overflow-hidden flex flex-col">
                    <div className="h-10 border-b border-surface-100 flex items-center px-4 gap-2 bg-surface-50">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-danger-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-warning-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-success-400" />
                      </div>
                      <div className="px-3 py-1 rounded-md bg-white border border-surface-200 text-xs text-surface-400 font-mono ml-4 flex-1 text-center">
                        wewinbid.ai/dashboard
                      </div>
                    </div>
                    <div className="flex-1 p-6 flex gap-6">
                      <div className="w-48 hidden sm:flex flex-col gap-3 border-r border-surface-100 pr-4">
                        <div className="h-8 w-24 bg-surface-100 rounded-md mb-4" />
                        <div className="h-6 w-full bg-primary-50 rounded-md text-primary-600 text-xs flex items-center px-2 font-medium">Dashboard</div>
                        <div className="h-6 w-full hover:bg-surface-50 rounded-md text-surface-400 text-xs flex items-center px-2">Tenders</div>
                        <div className="h-6 w-full hover:bg-surface-50 rounded-md text-surface-400 text-xs flex items-center px-2">Analytics</div>
                      </div>
                      <div className="flex-1 flex flex-col gap-4">
                        <div className="flex gap-4">
                          <div className="h-24 flex-1 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-3">
                             <div className="h-6 w-6 rounded-lg bg-primary-500/20 mb-2" />
                             <div className="h-4 w-12 bg-white/50 rounded-md" />
                          </div>
                          <div className="h-24 flex-1 bg-surface-50 rounded-xl p-3">
                             <div className="h-6 w-6 rounded-lg bg-surface-200 mb-2" />
                             <div className="h-4 w-12 bg-surface-200/50 rounded-md" />
                          </div>
                          <div className="h-24 flex-1 bg-surface-50 rounded-xl p-3">
                            <div className="h-6 w-6 rounded-lg bg-surface-200 mb-2" />
                            <div className="h-4 w-12 bg-surface-200/50 rounded-md" />
                          </div>
                        </div>
                        <div className="flex-1 bg-surface-50 rounded-xl border border-dashed border-surface-200 flex items-center justify-center text-surface-400 text-sm">
                           {t('landing.hero.preview')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Hero3DCard>
              
              {/* Floating Elements */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 bg-white p-3 rounded-xl shadow-xl border border-surface-100 z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-surface-500">Success Rate</div>
                    <div className="text-lg font-bold text-surface-900">+45%</div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-8 -left-8 bg-white p-3 rounded-xl shadow-xl border border-surface-100 z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-surface-500">AI Analysis</div>
                    <div className="text-lg font-bold text-surface-900">Ready</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats with Glassmorphism */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-surface-900 overflow-hidden px-8 py-12 shadow-2xl">
             <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 bg-repeat" />
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/30 blur-[100px] rounded-full mix-blend-overlay" />
             
             <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.labelKey}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center group"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-4 group-hover:bg-white/20 transition-colors backdrop-blur-md">
                    <stat.icon className="w-7 h-7 text-primary-300" />
                  </div>
                  <div className="text-4xl font-display font-bold text-white mb-2 tracking-tight">{stat.value}</div>
                  <div className="text-surface-400 font-medium">{t(stat.labelKey)}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="secondary" className="mb-4">
              {t('landing.features.badge')}
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-surface-900 mb-6 tracking-tight">
              {t('landing.features.title')}
            </h2>
            <p className="text-xl text-surface-600 max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 auto-rows-fr">
            {features.map((feature, index) => (
              <BentoItem key={index} feature={feature} index={index} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-surface-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="secondary" className="mb-4">
              {t('landing.pricing.badge')}
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-surface-900 mb-6 tracking-tight">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-xl text-surface-600 max-w-2xl mx-auto">
              {t('landing.pricing.subtitle')}
            </p>
            
            {/* Billing Toggle */}
            <div className="mt-8 inline-flex items-center gap-4 bg-surface-100 p-1.5 rounded-full">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-surface-900 shadow-md'
                    : 'text-surface-600 hover:text-surface-900'
                }`}
              >
                {t('landing.pricing.monthly')}
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === 'yearly'
                    ? 'bg-white text-surface-900 shadow-md'
                    : 'text-surface-600 hover:text-surface-900'
                }`}
              >
                {t('landing.pricing.yearly')}
                <span className="ml-2 text-xs bg-success-100 text-success-700 px-2 py-0.5 rounded-full">
                  -17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="relative rounded-3xl border-2 border-surface-200 bg-white p-8 hover:border-surface-300 transition-all"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-surface-900 mb-2">Gratuit</h3>
                <p className="text-surface-500">Pour découvrir WeWinBid</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-surface-900">0€</span>
                  <span className="text-surface-500">/ mois</span>
                </div>
              </div>
              <Link href="/auth/register">
                <Button variant="outline" className="w-full mb-8" size="lg">
                  Commencer gratuitement
                </Button>
              </Link>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-surface-700">2 réponses AO / mois</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-surface-700">1 collaborateur</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-surface-700">100 MB de stockage</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-surface-300 flex-shrink-0 mt-0.5" />
                  <span className="text-surface-400">Support email</span>
                </li>
              </ul>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative rounded-3xl border-2 border-primary-500 bg-white p-8 shadow-2xl shadow-primary-500/20 scale-105 z-10"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary-500 text-white px-4 py-1">
                  {t('landing.pricing.popular')}
                </Badge>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-surface-900 mb-2">Pro</h3>
                <p className="text-surface-500">Pour les TPE/PME actives</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-surface-900">
                    {billingPeriod === 'monthly' ? '49€' : '41€'}
                  </span>
                  <span className="text-surface-500">/ mois</span>
                </div>
                {billingPeriod === 'yearly' && (
                  <p className="text-sm text-surface-500 mt-2">490€ facturés annuellement</p>
                )}
              </div>
              <Link href="/auth/register?plan=pro">
                <Button className="w-full mb-8" size="lg">
                  Essayer gratuitement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-surface-700 font-medium">20 réponses AO / mois</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-surface-700 font-medium">5 collaborateurs</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-surface-700 font-medium">5 GB de stockage</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-surface-700">Score IA + Analyse gagnants</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-surface-700">Marketplace partenaires</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-surface-700">Support prioritaire</span>
                </li>
              </ul>
            </motion.div>

            {/* Business Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative rounded-3xl border-2 border-surface-200 bg-white p-8 hover:border-surface-300 transition-all"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-surface-900 mb-2">Business</h3>
                <p className="text-surface-500">Pour les équipes commerciales</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-surface-900">
                    {billingPeriod === 'monthly' ? '149€' : '124€'}
                  </span>
                  <span className="text-surface-500">/ mois</span>
                </div>
                {billingPeriod === 'yearly' && (
                  <p className="text-sm text-surface-500 mt-2">1490€ facturés annuellement</p>
                )}
              </div>
              <Link href="/auth/register?plan=business">
                <Button className="w-full mb-8" size="lg">
                  Essayer gratuitement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-surface-700 font-medium">Réponses illimitées</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-surface-700 font-medium">20 collaborateurs</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-surface-700 font-medium">50 GB de stockage</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-surface-700">Tout Pro +</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-surface-700">Co-rédaction temps réel</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-surface-700">Studio créatif + API</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-surface-700">Support dédié</span>
                </li>
              </ul>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative rounded-3xl border-2 border-surface-900 bg-gradient-to-br from-surface-900 to-surface-800 p-8 text-white"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <p className="text-surface-300">Solution sur mesure</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">Sur devis</span>
                </div>
                <p className="text-sm text-surface-400 mt-2">Volumes illimités et personnalisés</p>
              </div>
              <a href="https://calendly.com/commercial-wewinbid/30min" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full mb-8 bg-white text-surface-900 hover:bg-surface-100 border-white" size="lg">
                  Prendre RDV (30min)
                </Button>
              </a>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">Réponses AO illimitées</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">Utilisateurs illimités</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">Stockage illimité</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
                  <span>API dédiée + Intégrations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
                  <span>Account Manager dédié</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
                  <span>Formation équipe incluse</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
                  <span>SLA personnalisé</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ROI & Performances Section */}
      <section id="roi" className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-surface-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="secondary" className="mb-4">ROI & Performances</Badge>
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-surface-900 mb-6">
              Maximisez votre retour sur investissement
            </h2>
            <p className="text-xl text-surface-600 max-w-2xl mx-auto">
              Des résultats mesurables qui transforment votre approche des marchés publics
            </p>
          </div>

          {/* Performance Stats */}
          <div className="grid md:grid-cols-4 gap-8 mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center p-8 rounded-3xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-500 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-5xl font-bold text-primary-600 mb-2">+45%</div>
              <p className="text-surface-700 font-medium">Taux de réussite moyen</p>
              <p className="text-sm text-surface-500 mt-2">vs. méthodes traditionnelles</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center p-8 rounded-3xl bg-gradient-to-br from-success-50 to-success-100 border border-success-200"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-success-500 flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div className="text-5xl font-bold text-success-600 mb-2">-60%</div>
              <p className="text-surface-700 font-medium">Temps de préparation</p>
              <p className="text-sm text-surface-500 mt-2">Génération IA automatique</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center p-8 rounded-3xl bg-gradient-to-br from-secondary-50 to-secondary-100 border border-secondary-200"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary-500 flex items-center justify-center">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div className="text-5xl font-bold text-secondary-600 mb-2">3x</div>
              <p className="text-surface-700 font-medium">Plus d'AO traités</p>
              <p className="text-sm text-surface-500 mt-2">À effort équivalent</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500 flex items-center justify-center">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div className="text-5xl font-bold text-amber-600 mb-2">233 Mds€</div>
              <p className="text-surface-700 font-medium">Marchés accessibles</p>
              <p className="text-sm text-surface-500 mt-2">France + Europe</p>
            </motion.div>
          </div>

          {/* Languages Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl border border-surface-200 p-12 shadow-xl"
          >
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-medium mb-4">
                <Globe className="w-4 h-4" />
                Support Multilingue
              </div>
              <h3 className="text-3xl font-bold text-surface-900 mb-4">
                Disponible dans 7+ langues
              </h3>
              <p className="text-surface-600 max-w-xl mx-auto">
                Répondez aux appels d'offres internationaux dans la langue de votre choix. Notre IA s'adapte automatiquement.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { flag: '🇫🇷', name: 'Français', code: 'FR' },
                { flag: '🇬🇧', name: 'English', code: 'EN' },
                { flag: '🇪🇸', name: 'Español', code: 'ES' },
                { flag: '🇩🇪', name: 'Deutsch', code: 'DE' },
                { flag: '🇮🇹', name: 'Italiano', code: 'IT' },
                { flag: '🇵🇹', name: 'Português', code: 'PT' },
                { flag: '🇸🇦', name: 'العربية', code: 'AR' },
              ].map((lang, index) => (
                <motion.div
                  key={lang.code}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col items-center p-4 rounded-2xl bg-surface-50 hover:bg-primary-50 hover:border-primary-200 border border-surface-200 transition-all cursor-default"
                >
                  <span className="text-4xl mb-2">{lang.flag}</span>
                  <span className="font-medium text-surface-900 text-sm">{lang.name}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-surface-500 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span>Génération de documents multilingue</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span>Interface traduite</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span>Support client multilingue</span>
              </div>
            </div>
          </motion.div>

          {/* Secteurs couverts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <h3 className="text-2xl font-bold text-surface-900 mb-8">15+ secteurs d'activité couverts</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                'Sécurité privée', 'Sécurité électronique', 'BTP', 'Logistique', 
                'IT & Software', 'Maintenance', 'Conseil', 'Nettoyage', 
                'Restauration', 'Transport', 'Énergie', 'Santé', 
                'Éducation', 'Télécoms', 'Environnement'
              ].map((sector) => (
                <span
                  key={sector}
                  className="px-4 py-2 rounded-full bg-surface-100 text-surface-700 text-sm font-medium hover:bg-primary-50 hover:text-primary-600 transition-colors"
                >
                  {sector}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-surface-900 relative overflow-hidden">
        <div className="absolute inset-0">
           <div className="absolute inset-0 bg-gradient-to-r from-primary-900 to-surface-900" />
           <div className="absolute right-0 top-0 w-[800px] h-[800px] bg-primary-600/20 blur-[120px] rounded-full" />
           <div className="absolute left-0 bottom-0 w-[600px] h-[600px] bg-secondary-600/20 blur-[100px] rounded-full" />
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-5xl sm:text-6xl font-display font-bold text-white mb-8 tracking-tight">
            {t('landing.cta.title')}
          </h2>
          <p className="text-2xl text-surface-300 mb-12 max-w-2xl mx-auto font-light">
            {t('landing.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/auth/register">
              <Button size="lg" className="h-16 px-10 text-lg bg-white text-surface-900 hover:bg-surface-50 rounded-full shadow-2xl shadow-white/10 hover:scale-105 transition-transform">
                {t('landing.cta.primary')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="ghost" className="h-16 px-10 text-lg text-white border border-white/20 hover:bg-white/10 rounded-full">
                {t('landing.cta.secondary')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-4 sm:px-6 lg:px-8 bg-surface-50 border-t border-surface-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  W
                </div>
                <span className="font-display font-bold text-2xl text-surface-900">WeWinBid</span>
              </div>
              <p className="text-surface-500 leading-relaxed mb-6">
                {t('landing.footer.about')}
              </p>
              <div className="flex gap-4">
                 {/* Social icons placeholders */}
                 <div className="w-8 h-8 rounded-full bg-surface-200 hover:bg-primary-100 hover:text-primary-600 transition-colors cursor-pointer" />
                 <div className="w-8 h-8 rounded-full bg-surface-200 hover:bg-primary-100 hover:text-primary-600 transition-colors cursor-pointer" />
                 <div className="w-8 h-8 rounded-full bg-surface-200 hover:bg-primary-100 hover:text-primary-600 transition-colors cursor-pointer" />
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-surface-900 mb-6">{t('landing.footer.product')}</h4>
              <ul className="space-y-4 text-surface-500">
                <li><a href="#features" className="hover:text-primary-600 transition-colors">{t('landing.footer.links.features')}</a></li>
                <li><a href="#pricing" className="hover:text-primary-600 transition-colors">{t('landing.footer.links.pricing')}</a></li>
                <li><a href="#roi" className="hover:text-primary-600 transition-colors">ROI & Performances</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-surface-900 mb-6">{t('landing.footer.company')}</h4>
              <ul className="space-y-4 text-surface-500">
                <li><Link href="/contact" className="hover:text-primary-600 transition-colors">{t('landing.footer.links.contact')}</Link></li>
                <li><a href="https://calendly.com/commercial-wewinbid/30min" target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 transition-colors">Prendre rendez-vous</a></li>
                <li><a href="mailto:commercial@wewinbid.com" className="hover:text-primary-600 transition-colors">commercial@wewinbid.com</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-surface-900 mb-6">{t('landing.footer.legal')}</h4>
              <ul className="space-y-4 text-surface-500">
                <li><a href="/legal/privacy" className="hover:text-primary-600 transition-colors">{t('landing.footer.links.privacy')}</a></li>
                <li><a href="/legal/terms" className="hover:text-primary-600 transition-colors">{t('landing.footer.links.terms')}</a></li>
                <li><a href="/legal/cgv" className="hover:text-primary-600 transition-colors">{t('landing.footer.links.cgv')}</a></li>
                <li><a href="/legal/cookies" className="hover:text-primary-600 transition-colors">{t('landing.footer.links.cookies')}</a></li>
                <li><a href="/legal/mentions" className="hover:text-primary-600 transition-colors">{t('landing.footer.links.mentions')}</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-surface-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-surface-400 text-sm">
              {t('landing.footer.copyright')}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-surface-500 text-sm">Langue :</span>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-surface-200 shadow-sm">
                <Globe className="w-4 h-4 text-primary-500" />
                <select
                  className="bg-transparent text-surface-700 text-sm font-medium border-none focus:ring-0 cursor-pointer outline-none pr-6"
                  value={locale}
                  onChange={(event) => handleLocaleChange(event.target.value as Locale)}
                >
                  {LOCALES.map((option) => (
                    <option key={option} value={option}>
                      {LOCALE_FLAGS[option]} {LOCALE_NAMES[option]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
