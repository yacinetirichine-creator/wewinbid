'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import Logo, { LogoNavbar } from '@/components/ui/Logo';
import { DEFAULT_LOCALE, isRTL, LOCALES, LOCALE_FLAGS, LOCALE_NAMES, type Locale } from '@/lib/i18n';
import { useLandingTranslations } from '@/lib/i18n/landing-translations';
import { CookieConsentBanner } from '@/components/cookies/CookieConsentBanner';
import { Linkedin, Twitter, Facebook } from 'lucide-react';

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
    icon: Search,
    titleKey: 'landing.features.search.title',
    descriptionKey: 'landing.features.search.description',
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
  { valueKey: 'landing.stats.market.value', labelKey: 'landing.stats.market', icon: Building2 },
  { valueKey: 'landing.stats.success.value', labelKey: 'landing.stats.success', icon: TrendingUp },
  { valueKey: 'landing.stats.time.value', labelKey: 'landing.stats.time', icon: Clock },
  { valueKey: 'landing.stats.sectors.value', labelKey: 'landing.stats.sectors', icon: Target },
];

const testimonials = [
  {
    quoteKey: 'landing.testimonials.quote1',
    author: 'Marie Lefort',
    roleKey: 'landing.testimonials.role1',
    avatar: '/images/testimonials/marie.svg',
    initials: 'ML',
    color: 'from-violet-500 to-purple-600',
  },
  {
    quoteKey: 'landing.testimonials.quote2',
    author: 'Thomas Durand',
    roleKey: 'landing.testimonials.role2',
    avatar: '/images/testimonials/thomas.svg',
    initials: 'TD',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    quoteKey: 'landing.testimonials.quote3',
    author: 'Sophie Martin',
    roleKey: 'landing.testimonials.role3',
    avatar: '/images/testimonials/sophie.svg',
    initials: 'SM',
    color: 'from-pink-500 to-rose-500',
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
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [0, 1]);
  const headerY = useTransform(scrollY, [0, 100], [-20, 0]);

  // Utiliser les traductions statiques
  const { t } = useLandingTranslations(locale);

  // Rediriger vers le callback si un code OAuth est présent
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      window.location.href = `/auth/callback?code=${code}`;
    }
  }, []);

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
    // Recharger pour appliquer la nouvelle langue à tous les composants
    window.location.reload();
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
      className="min-h-screen bg-[#F8FAFC] overflow-x-hidden selection:bg-primary-500/30 selection:text-primary-900"
      dir={isRTL(locale) ? 'rtl' : 'ltr'}
    >
      {/* Dynamic Grid Background - Replaces static SVG */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-white to-transparent"></div>
      </div>
      
      {/* Navigation */}
      <motion.nav 
        style={{ 
          backgroundColor: "rgba(255,255,255,0.75)", 
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(226, 232, 240, 0.6)" 
        }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg shadow-sm group-hover:shadow-md transition-all">W</div>
              <span className="font-display font-bold text-xl text-slate-900 tracking-tight">{t('landing.brand')}</span>
            </Link>
            <div className="hidden md:flex items-center gap-10">
              <a 
                href="#features" 
                onClick={(e) => handleSmoothScroll(e, 'features')}
                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer tracking-wide"
              >
                {t('landing.nav.features')}
              </a>
              <a 
                href="#pricing" 
                onClick={(e) => handleSmoothScroll(e, 'pricing')}
                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer tracking-wide"
              >
                {t('landing.nav.pricing')}
              </a>
              <a 
                href="#roi" 
                onClick={(e) => handleSmoothScroll(e, 'roi')}
                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer tracking-wide"
              >
                {t('landing.nav.roi')}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                <Globe className="w-4 h-4 text-slate-400" />
                <span className="sr-only">{t('landing.nav.language')}</span>
                <select
                  aria-label={t('landing.nav.language')}
                  className="bg-transparent text-slate-600 text-sm font-medium border-none focus:ring-0 cursor-pointer outline-none pr-6 py-0 pl-1"
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
              <Link href="/auth/login">
                <Button variant="ghost" className="font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg">{t('landing.nav.login')}</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20 rounded-lg px-5 py-2.5 font-medium transition-all hover:scale-[1.02] active:scale-[0.98]">
                  {t('landing.nav.trial')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative pt-40 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-50/50">
        {/* Modern Fintech Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Subtle Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          {/* Top Fade */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-transparent"></div>
          {/* Spotlight Effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-blue-400/5 blur-[120px] rounded-full pointer-events-none" />
        </div>
        
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
                <Badge variant="primary" className="rounded-full px-3 py-0.5 text-xs shadow-none">{t('landing.hero.newLabel')}</Badge>
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
                <div className="bg-slate-50 aspect-[4/3] p-1.5 rounded-2xl">
                  {/* Mock Dashboard UI */}
                  <div className="w-full h-full bg-white rounded-xl overflow-hidden flex flex-col shadow-inner select-none pointer-events-none">
                    {/* Fake Browser Header */}
                    <div className="h-10 border-b border-slate-100 flex items-center px-4 gap-2 bg-slate-50/50 backdrop-blur-sm">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                      </div>
                      <div className="flex-1 flex justify-center px-12">
                         <div className="w-full max-w-[240px] h-6 bg-white rounded-md border border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-medium font-mono">
                            app.wewinbid.com/dashboard
                         </div>
                      </div>
                      <div className="w-8" />
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                      {/* Sidebar Mock */}
                      <div className="w-48 bg-slate-50/50 border-r border-slate-100 flex flex-col gap-1 p-3">
                        <div className="flex items-center gap-2 px-2 py-2 mb-4 opacity-80">
                           <div className="w-6 h-6 rounded bg-primary-600 flex items-center justify-center text-white">
                              <span className="font-bold text-[10px]">W</span>
                           </div>
                           <div className="h-3 w-20 bg-slate-200 rounded" />
                        </div>
                        
                        {[
                          { icon: Layers, label: 'Tableau de bord', active: true },
                          { icon: Search, label: 'Appels d\'offres', active: false },
                          { icon: Sparkles, label: 'Analyse IA', active: false },
                          { icon: FileText, label: 'Documents', active: false },
                        ].map((item, i) => (
                           <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[10px] font-medium transition-colors ${item.active ? 'bg-white text-primary-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:bg-slate-100/50'}`}>
                             <item.icon className="w-3.5 h-3.5" />
                             {item.label}
                           </div>
                        ))}
                        
                        <div className="mt-auto">
                           <div className="p-3 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl text-white relative overflow-hidden">
                              <div className="relative z-10">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mb-2">
                                  <Sparkles className="w-3 h-3 text-white" />
                                </div>
                                <div className="h-2 w-16 bg-white/40 rounded mb-1.5" />
                                <div className="h-1.5 w-12 bg-white/30 rounded" />
                              </div>
                              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                           </div>
                        </div>
                      </div>

                      {/* Main Content Mock */}
                      <div className="flex-1 bg-[#F8FAFC] p-6 overflow-hidden flex flex-col gap-6 relative">
                        
                        {/* Header Area */}
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
                            <div className="h-3 w-48 bg-slate-100 rounded" />
                          </div>
                          <div className="flex gap-2">
                             <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm" />
                             <div className="w-8 h-8 rounded-full bg-primary-600 shadow-lg shadow-primary-500/20 ring-2 ring-white" />
                          </div>
                        </div>

                        {/* KPI Cards */}
                        <div className="flex gap-4">
                           <div className="flex-1 bg-white rounded-xl p-4 border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
                              <div className="flex justify-between items-start mb-3">
                                 <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                                   <Search className="w-4 h-4" />
                                 </div>
                                 <Badge variant="success" className="text-[9px] px-1.5 h-5">{t('landing.mock.kpi.searchIncrease')}</Badge>
                              </div>
                              <div className="h-5 w-12 bg-slate-800 rounded mb-1" />
                              <div className="h-2 w-20 bg-slate-100 rounded" />
                           </div>
                           <div className="flex-1 bg-white rounded-xl p-4 border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
                              <div className="flex justify-between items-start mb-3">
                                 <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-500">
                                   <Sparkles className="w-4 h-4" />
                                 </div>
                                 <Badge variant="success" className="text-[9px] px-1.5 h-5">{t('landing.mock.kpi.matchScore')}</Badge>
                              </div>
                              <div className="h-5 w-10 bg-slate-800 rounded mb-1" />
                              <div className="h-2 w-24 bg-slate-100 rounded" />
                           </div>
                        </div>

                        {/* Active Tender Card Analysis Mock */}
                        <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] p-4 relative overflow-hidden group">
                           <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2.5">
                                 <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <Target className="w-4 h-4" />
                                 </div>
                                 <div> 
                                    <div className="h-3.5 w-32 bg-slate-800 rounded mb-1" />
                                    <div className="h-2 w-24 bg-slate-300 rounded" />
                                 </div>
                              </div>
                              <div className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                                 94% MATCH
                              </div>
                           </div>
                           
                           {/* Fake progress bars */}
                           <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                 <div className="h-2 w-16 bg-slate-100 rounded" />
                                 <div className="h-2 w-8 bg-slate-100 rounded" />
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                 <div className="bg-primary-500 h-full w-[85%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                              </div>
                              
                              <div className="flex items-center justify-between pt-1">
                                 <div className="h-2 w-20 bg-slate-100 rounded" />
                                 <div className="h-2 w-6 bg-slate-100 rounded" />
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                 <div className="bg-indigo-500 h-full w-[60%] rounded-full" />
                              </div>
                           </div>
                        </div>

                        {/* Floating "Smart" Badge over the UI */}
                        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur border border-slate-200 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 animate-bounce">
                           <Sparkles className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-semibold text-slate-700">{t('landing.mock.smartBadge')}</span>
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
                    <div className="text-xs text-surface-500">{t('landing.mock.floating.success.label')}</div>
                    <div className="text-lg font-bold text-surface-900">{t('landing.mock.floating.success.value')}</div>
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
                    <div className="text-xs text-surface-500">{t('landing.mock.floating.analysis.label')}</div>
                    <div className="text-lg font-bold text-surface-900">{t('landing.mock.floating.analysis.value')}</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats with Modern Fintech Style */}
      <section className="py-12 border-b border-slate-100 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-50/50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.labelKey}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center group p-6 rounded-2xl hover:bg-white hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300 border border-transparent hover:border-slate-100"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50 text-primary-600 mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-3xl font-display font-bold text-slate-900 mb-1 tracking-tight">{t(stat.valueKey)}</div>
                  <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">{t(stat.labelKey)}</div>
                </motion.div>
              ))}
            </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-32 px-4 sm:px-6 lg:px-8 relative bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="primary" className="mb-4 bg-primary-100 text-primary-700 border-none px-4 py-1.5 text-sm font-medium rounded-full">
              {t('landing.features.badge')}
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-slate-900 mb-6 tracking-tight">
              {t('landing.features.title')}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 auto-rows-fr">
            {features.map((feature, index) => (
              <BentoItem key={index} feature={feature} index={index} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="primary" className="mb-4 bg-primary-100 text-primary-700 border-none px-4 py-1.5 text-sm font-medium rounded-full">
              {t('landing.pricing.badge')}
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-slate-900 mb-6 tracking-tight">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {t('landing.pricing.subtitle')}
            </p>
            
            {/* Billing Toggle */}
            <div className="mt-8 inline-flex items-center gap-1 bg-slate-100 p-1.5 rounded-full border border-slate-200">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t('landing.pricing.monthly')}
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  billingPeriod === 'yearly'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t('landing.pricing.yearly')}
                <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  {t('landing.pricing.discount')}
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
              className="relative rounded-2xl border border-slate-200 bg-white p-8 hover:border-slate-300 transition-all shadow-sm hover:shadow-lg"
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{t('landing.pricing.free.name')}</h3>
                <p className="text-sm text-slate-500">{t('landing.pricing.free.description')}</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900 tracking-tight">{t('landing.pricing.free.price')}</span>
                  <span className="text-slate-500 font-medium">{t('landing.pricing.perMonth')}</span>
                </div>
              </div>
              <Link href="/auth/register">
                <Button variant="outline" className="w-full mb-8 border-slate-200 hover:bg-slate-50 hover:text-slate-900" size="lg">
                  {t('landing.pricing.free.cta')}
                </Button>
              </Link>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-slate-600">{t('landing.pricing.free.feature.1')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-slate-600">{t('landing.pricing.free.feature.2')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-slate-600">{t('landing.pricing.free.feature.3')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                  <span className="text-slate-400">{t('landing.pricing.free.feature.4')}</span>
                </li>
              </ul>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative rounded-2xl border-2 border-primary-600 bg-white p-8 shadow-xl shadow-primary-900/5 scale-105 z-10"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-md">
                  {t('landing.pricing.popular')}
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{t('landing.pricing.pro.name')}</h3>
                <p className="text-sm text-slate-500">{t('landing.pricing.pro.description')}</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900 tracking-tight">
                    {billingPeriod === 'monthly' ? '49€' : '41€'}
                  </span>
                  <span className="text-slate-500 font-medium">{t('landing.pricing.perMonth')}</span>
                </div>
                {billingPeriod === 'yearly' && (
                  <p className="text-xs text-emerald-600 font-medium mt-2 bg-emerald-50 inline-block px-2 py-1 rounded-md">{t('landing.pricing.pro.yearlyNote')}</p>
                )}
              </div>
              <Link href="/auth/register?plan=pro">
                <Button className="w-full mb-8 bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20" size="lg">
                  {t('landing.pricing.pro.cta')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  <span className="text-slate-700 font-medium">{t('landing.pricing.pro.feature.1')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  <span className="text-slate-700 font-medium">{t('landing.pricing.pro.feature.2')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  <span className="text-slate-700 font-medium">{t('landing.pricing.pro.feature.3')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  <span className="text-slate-700">{t('landing.pricing.pro.feature.4')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  <span className="text-slate-700">{t('landing.pricing.pro.feature.5')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  <span className="text-slate-700">{t('landing.pricing.pro.feature.6')}</span>
                </li>
              </ul>
            </motion.div>

            {/* Business Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative rounded-2xl border border-slate-200 bg-white p-8 hover:border-slate-300 transition-all shadow-sm hover:shadow-lg"
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{t('landing.pricing.business.name')}</h3>
                <p className="text-sm text-slate-500">{t('landing.pricing.business.description')}</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900 tracking-tight">
                    {billingPeriod === 'monthly' ? '149€' : '124€'}
                  </span>
                  <span className="text-slate-500 font-medium">{t('landing.pricing.perMonth')}</span>
                </div>
                {billingPeriod === 'yearly' && (
                  <p className="text-xs text-emerald-600 font-medium mt-2 bg-emerald-50 inline-block px-2 py-1 rounded-md">{t('landing.pricing.business.yearlyNote')}</p>
                )}
              </div>
              <Link href="/auth/register?plan=business">
                <Button className="w-full mb-8 bg-slate-900 hover:bg-slate-800 text-white" size="lg">
                  {t('landing.pricing.business.cta')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700 font-semibold">{t('landing.pricing.business.feature.1')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700 font-semibold">{t('landing.pricing.business.feature.2')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span className="text-slate-700 font-semibold">{t('landing.pricing.business.feature.3')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-slate-700 flex-shrink-0" />
                  <span className="text-slate-600">{t('landing.pricing.business.feature.4')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-slate-700 flex-shrink-0" />
                  <span className="text-slate-600">{t('landing.pricing.business.feature.5')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-slate-700 flex-shrink-0" />
                  <span className="text-surface-700">{t('landing.pricing.business.feature.6')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-surface-700">{t('landing.pricing.business.feature.7')}</span>
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
                <h3 className="text-2xl font-bold mb-2">{t('landing.pricing.enterprise.name')}</h3>
                <p className="text-surface-300">{t('landing.pricing.enterprise.description')}</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{t('landing.pricing.enterprise.price')}</span>
                </div>
                <p className="text-sm text-surface-400 mt-2">{t('landing.pricing.enterprise.subtitle')}</p>
              </div>
              <a href="https://calendly.com/commercial-wewinbid/30min" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full mb-8 bg-white text-surface-900 hover:bg-surface-100 border-white" size="lg">
                  {t('landing.pricing.enterprise.cta')}
                </Button>
              </a>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{t('landing.pricing.enterprise.feature.1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{t('landing.pricing.enterprise.feature.2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{t('landing.pricing.enterprise.feature.3')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
                  <span>{t('landing.pricing.enterprise.feature.4')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
                  <span>{t('landing.pricing.enterprise.feature.5')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
                  <span>{t('landing.pricing.enterprise.feature.6')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
                  <span>{t('landing.pricing.enterprise.feature.7')}</span>
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
            <Badge variant="secondary" className="mb-4">{t('landing.roi.badge')}</Badge>
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-surface-900 mb-6">
              {t('landing.roi.title')}
            </h2>
            <p className="text-xl text-surface-600 max-w-2xl mx-auto">
              {t('landing.roi.subtitle')}
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
              <div className="text-5xl font-bold text-primary-600 mb-2">{t('landing.roi.stat1.value')}</div>
              <p className="text-surface-700 font-medium">{t('landing.roi.stat1.label')}</p>
              <p className="text-sm text-surface-500 mt-2">{t('landing.roi.stat1.note')}</p>
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
              <div className="text-5xl font-bold text-success-600 mb-2">{t('landing.roi.stat2.value')}</div>
              <p className="text-surface-700 font-medium">{t('landing.roi.stat2.label')}</p>
              <p className="text-sm text-surface-500 mt-2">{t('landing.roi.stat2.note')}</p>
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
              <div className="text-5xl font-bold text-secondary-600 mb-2">{t('landing.roi.stat3.value')}</div>
              <p className="text-surface-700 font-medium">{t('landing.roi.stat3.label')}</p>
              <p className="text-sm text-surface-500 mt-2">{t('landing.roi.stat3.note')}</p>
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
              <div className="text-5xl font-bold text-amber-600 mb-2">{t('landing.roi.stat4.value')}</div>
              <p className="text-surface-700 font-medium">{t('landing.roi.stat4.label')}</p>
              <p className="text-sm text-surface-500 mt-2">{t('landing.roi.stat4.note')}</p>
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
                {t('landing.languages.badge')}
              </div>
              <h3 className="text-3xl font-bold text-surface-900 mb-4">
                {t('landing.languages.title')}
              </h3>
              <p className="text-surface-600 max-w-xl mx-auto">
                {t('landing.languages.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { flag: '🇫🇷', name: t('landing.languages.lang.fr'), code: 'FR' },
                { flag: '🇬🇧', name: t('landing.languages.lang.en'), code: 'EN' },
                { flag: '🇪🇸', name: t('landing.languages.lang.es'), code: 'ES' },
                { flag: '🇩🇪', name: t('landing.languages.lang.de'), code: 'DE' },
                { flag: '🇮🇹', name: t('landing.languages.lang.it'), code: 'IT' },
                { flag: '🇵🇹', name: t('landing.languages.lang.pt'), code: 'PT' },
                { flag: '🇸🇦', name: t('landing.languages.lang.ar'), code: 'AR' },
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
                <span>{t('landing.languages.point.multilingualDocs')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span>{t('landing.languages.point.translatedUi')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span>{t('landing.languages.point.multilingualSupport')}</span>
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
            <h3 className="text-xl font-bold text-slate-800 mb-8">{t('landing.sectors.title')}</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                t('landing.sectors.list.securityPrivate'),
                t('landing.sectors.list.securityElectronic'),
                t('landing.sectors.list.construction'),
                t('landing.sectors.list.logistics'),
                t('landing.sectors.list.itSoftware'),
                t('landing.sectors.list.maintenance'),
                t('landing.sectors.list.consulting'),
                t('landing.sectors.list.cleaning'),
                t('landing.sectors.list.catering'),
                t('landing.sectors.list.transport'),
                t('landing.sectors.list.energy'),
                t('landing.sectors.list.health'),
                t('landing.sectors.list.education'),
                t('landing.sectors.list.telecoms'),
                t('landing.sectors.list.environment'),
              ].map((sector) => (
                <span
                  key={sector}
                  className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-sm font-medium hover:border-primary-200 hover:text-primary-700 hover:bg-white transition-all duration-200 shadow-sm"
                >
                  {sector}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-32 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="primary" className="mb-4 bg-primary-100 text-primary-700 border-none px-4 py-1.5 text-sm font-medium rounded-full">
              {t('landing.testimonials.badge')}
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-slate-900 mb-6 tracking-tight">
              {t('landing.testimonials.title')}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {t('landing.testimonials.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-slate-700 leading-relaxed mb-6 text-lg italic">
                  "{t(testimonial.quoteKey)}"
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.author}</p>
                    <p className="text-sm text-slate-500">{t(testimonial.roleKey)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Modern Fintech Dark Mode */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-slate-900 relative overflow-hidden">
        {/* Abstract Grid Background */}
        <div className="absolute inset-0 z-0">
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
           <div className="absolute right-0 top-0 w-[800px] h-[800px] bg-primary-500/10 blur-[150px] rounded-full" />
           <div className="absolute left-0 bottom-0 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
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
      <footer className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  W
                </div>
                <span className="font-display font-bold text-xl text-slate-900 tracking-tight">{t('landing.brand')}</span>
              </div>
              <p className="text-slate-500 leading-relaxed mb-6 text-sm">
                {t('landing.footer.about')}
              </p>
              <div className="flex gap-3">
                 <a
                   href="https://www.linkedin.com/company/wewinbid"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-primary-500 hover:text-primary-600 transition-all cursor-pointer flex items-center justify-center shadow-sm text-slate-500"
                   aria-label="LinkedIn"
                 >
                   <Linkedin className="w-4 h-4" />
                 </a>
                 <a
                   href="https://twitter.com/wewinbid"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-primary-500 hover:text-primary-600 transition-all cursor-pointer flex items-center justify-center shadow-sm text-slate-500"
                   aria-label="Twitter"
                 >
                   <Twitter className="w-4 h-4" />
                 </a>
                 <a
                   href="https://www.facebook.com/wewinbid"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-primary-500 hover:text-primary-600 transition-all cursor-pointer flex items-center justify-center shadow-sm text-slate-500"
                   aria-label="Facebook"
                 >
                   <Facebook className="w-4 h-4" />
                 </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-wider">{t('landing.footer.product')}</h4>
              <ul className="space-y-3 text-slate-500 text-sm font-medium">
                <li><a href="#features" className="hover:text-primary-600 transition-colors">{t('landing.footer.links.features')}</a></li>
                <li><a href="#pricing" className="hover:text-primary-600 transition-colors">{t('landing.footer.links.pricing')}</a></li>
                <li><a href="#roi" className="hover:text-primary-600 transition-colors">{t('landing.nav.roi')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-wider">{t('landing.footer.company')}</h4>
              <ul className="space-y-3 text-slate-500 text-sm font-medium">
                <li><Link href="/contact" className="hover:text-primary-600 transition-colors">{t('landing.footer.links.contact')}</Link></li>
                <li><a href="https://calendly.com/commercial-wewinbid/30min" target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 transition-colors">{t('landing.footer.links.bookCall')}</a></li>
                <li><a href="mailto:commercial@wewinbid.com" className="hover:text-primary-600 transition-colors">{t('landing.contact.email')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-wider">{t('landing.footer.legal')}</h4>
              <ul className="space-y-3 text-slate-500 text-sm font-medium">
                <li><a href="/legal/privacy" className="hover:text-primary-600 transition-colors">{t('landing.footer.links.privacy')}</a></li>
                <li><a href="/legal/terms" className="hover:text-primary-600 transition-colors">{t('landing.footer.links.terms')}</a></li>
                <li><a href="/legal/cgv" className="hover:text-primary-600 transition-colors">{t('landing.footer.links.cgv')}</a></li>
                <li><a href="/legal/cookies" className="hover:text-primary-600 transition-colors">{t('landing.footer.links.cookies')}</a></li>
                <li><a href="/legal/mentions" className="hover:text-primary-600 transition-colors">{t('landing.footer.links.mentions')}</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              {t('landing.footer.copyright')}
            </p>
          </div>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      <CookieConsentBanner />
    </div>
  );
}
