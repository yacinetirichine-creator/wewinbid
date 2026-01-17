'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { DEFAULT_LOCALE, isRTL, LOCALES, LOCALE_FLAGS, LOCALE_NAMES, type Locale } from '@/lib/i18n';
import { useUiTranslations } from '@/hooks/useUiTranslations';

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

export default function LandingPage() {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  const entries = useMemo(
    () => ({
      'landing.nav.features': 'Fonctionnalités',
      'landing.nav.pricing': 'Tarifs',
      'landing.nav.testimonials': 'Témoignages',
      'landing.nav.login': 'Connexion',
      'landing.nav.trial': 'Essai gratuit',
      'landing.hero.badge': 'Nouveau: Score IA v2.0',
      'landing.hero.titlePrefix': "Remportez plus d'",
      'landing.hero.titleHighlight': "appels d'offres",
      'landing.hero.subtitle':
        "Automatisez vos réponses, analysez la concurrence et augmentez votre taux de réussite grâce à l'intelligence artificielle.",
      'landing.hero.ctaStart': 'Démarrer gratuitement',
      'landing.hero.ctaDemo': 'Voir la démo',
      'landing.hero.trust.freeTrial': 'Essai gratuit 14 jours',
      'landing.hero.trust.noCommitment': 'Sans engagement',
      'landing.hero.trust.gdpr': 'RGPD compliant',
      'landing.hero.preview': "[Capture d'écran du tableau de bord]",
      'landing.stats.market': 'Marché français annuel',
      'landing.stats.success': 'Taux de réussite moyen',
      'landing.stats.time': 'Temps de préparation',
      'landing.stats.sectors': 'Secteurs couverts',
      'landing.features.badge': 'Fonctionnalités',
      'landing.features.title': 'Tout ce dont vous avez besoin pour gagner',
      'landing.features.subtitle':
        "Une suite complète d'outils pour maximiser vos chances de succès sur les marchés publics et privés.",
      'landing.features.aiScore.title': 'Score de compatibilité IA',
      'landing.features.aiScore.description':
        'Analysez vos chances de succès avant de candidater grâce à notre algorithme prédictif.',
      'landing.features.winners.title': 'Analyse des attributaires',
      'landing.features.winners.description':
        "Consultez l'historique des gagnants, leurs prix et stratégies pour mieux vous positionner.",
      'landing.features.marketplace.title': 'Marketplace partenaires',
      'landing.features.marketplace.description':
        'Trouvez des partenaires pour répondre en groupement et décrocher les gros marchés.',
      'landing.features.generation.title': 'Génération automatique',
      'landing.features.generation.description':
        'Créez vos mémoires techniques, DC1, DC2 et autres documents en quelques clics.',
      'landing.features.alerts.title': 'Alertes intelligentes',
      'landing.features.alerts.description':
        'Recevez les AO correspondant à votre profil en temps réel sur votre canal préféré.',
      'landing.features.roi.title': 'Tableau de bord ROI',
      'landing.features.roi.description': 'Mesurez votre performance, analysez vos stats et optimisez votre stratégie.',
      'landing.cta.title': 'Prêt à remporter plus de marchés ?',
      'landing.cta.subtitle':
        'Rejoignez les entreprises qui ont déjà multiplié leur taux de succès avec WeWinBid.',
      'landing.cta.primary': 'Commencer gratuitement',
      'landing.cta.secondary': "Contacter l'équipe",
      'landing.footer.about': "La plateforme qui vous aide à remporter plus d'appels d'offres.",
      'landing.footer.product': 'Produit',
      'landing.footer.company': 'Entreprise',
      'landing.footer.legal': 'Légal',
      'landing.footer.links.features': 'Fonctionnalités',
      'landing.footer.links.pricing': 'Tarifs',
      'landing.footer.links.integrations': 'Intégrations',
      'landing.footer.links.api': 'API',
      'landing.footer.links.about': 'À propos',
      'landing.footer.links.blog': 'Blog',
      'landing.footer.links.careers': 'Carrières',
      'landing.footer.links.contact': 'Contact',
      'landing.footer.links.privacy': 'Confidentialité',
      'landing.footer.links.terms': 'CGU',
      'landing.footer.links.cookies': 'Cookies',
      'landing.footer.links.mentions': 'Mentions légales',
      'landing.footer.copyright': '© 2025 WeWinBid. Commercialisé par JARVIS SAS. Tous droits réservés.',
      'landing.testimonials.quote1':
        'WeWinBid a transformé notre approche des marchés publics. Notre taux de succès a doublé en 6 mois.',
      'landing.testimonials.role1': 'DG, Sécurité Plus SARL',
      'landing.testimonials.quote2':
        'Le score IA nous permet de prioriser nos efforts sur les AO où nous avons vraiment nos chances.',
      'landing.testimonials.role2': 'Responsable commercial, BatiPro',
      'landing.testimonials.quote3':
        "La marketplace nous a permis de remporter notre premier marché de plus d'1M€ en groupement.",
      'landing.testimonials.role3': 'CEO, CleanTech Solutions',
    }),
    []
  );

  const context = useMemo(
    () => ({
      'landing.stats.market': 'Label under 233 Mds € market stat',
      'landing.stats.success': 'Label under +45% stat',
      'landing.stats.time': 'Label under -60% stat',
      'landing.stats.sectors': 'Label under 15+ stat',
      'landing.hero.titleHighlight': 'Highlight word(s) for hero title',
    }),
    []
  );

  const { t } = useUiTranslations(locale, entries, context);

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

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-surface-50 via-white to-surface-50"
      dir={isRTL(locale) ? 'rtl' : 'ltr'}
    >
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
                W
              </div>
              <span className="font-display font-bold text-xl text-surface-900">WeWinBid</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-surface-600 hover:text-primary-600 transition-colors">
                {t('landing.nav.features')}
              </a>
              <a href="#pricing" className="text-surface-600 hover:text-primary-600 transition-colors">
                {t('landing.nav.pricing')}
              </a>
              <a href="#testimonials" className="text-surface-600 hover:text-primary-600 transition-colors">
                {t('landing.nav.testimonials')}
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost">{t('landing.nav.login')}</Button>
              </Link>
              <Link href="/auth/register">
                <Button rightIcon={<ArrowRight className="w-4 h-4" />}>
                  {t('landing.nav.trial')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-center gap-2 mb-6">
                <Badge variant="primary" className="px-4 py-1.5">
                  <Sparkles className="w-4 h-4 mr-1" />
                  {t('landing.hero.badge')}
                </Badge>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-surface-900 mb-6">
                {t('landing.hero.titlePrefix')}
                <span className="text-gradient">{t('landing.hero.titleHighlight')}</span>
              </h1>
              <p className="text-xl text-surface-600 mb-8 max-w-2xl mx-auto">
                {t('landing.hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="btn-gradient" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    {t('landing.hero.ctaStart')}
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button size="lg" variant="outline">
                    {t('landing.hero.ctaDemo')}
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-surface-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  {t('landing.hero.trust.freeTrial')}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  {t('landing.hero.trust.noCommitment')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-success-500" />
                  {t('landing.hero.trust.gdpr')}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 blur-3xl -z-10" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-surface-200">
              <div className="bg-surface-900 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-danger-500" />
                  <div className="w-3 h-3 rounded-full bg-warning-500" />
                  <div className="w-3 h-3 rounded-full bg-success-500" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-sm text-surface-400">app.wewinbid.com</span>
                </div>
              </div>
              <div className="bg-surface-100 aspect-video flex items-center justify-center">
                <div className="text-surface-400 text-lg">
                  {t('landing.hero.preview')}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-surface-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-4">
                  <stat.icon className="w-6 h-6 text-primary-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-surface-400">{t(stat.labelKey)}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">{t('landing.features.badge')}</Badge>
            <h2 className="text-4xl font-display font-bold text-surface-900 mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-xl text-surface-600 max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover className="h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-surface-900 mb-2">{t(feature.titleKey)}</h3>
                  <p className="text-surface-600">{t(feature.descriptionKey)}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-display font-bold text-white mb-6">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl text-white/80 mb-8">
            {t('landing.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-surface-100">
                {t('landing.cta.primary')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="ghost" className="text-white border-white/30 hover:bg-white/10">
                {t('landing.cta.secondary')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-surface-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                  W
                </div>
                <span className="font-display font-bold text-xl text-white">WeWinBid</span>
              </div>
              <p className="text-surface-400 text-sm">
                {t('landing.footer.about')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t('landing.footer.product')}</h4>
              <ul className="space-y-2 text-surface-400">
                <li><a href="#features" className="hover:text-white transition-colors">{t('landing.footer.links.features')}</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">{t('landing.footer.links.pricing')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.links.integrations')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.links.api')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t('landing.footer.company')}</h4>
              <ul className="space-y-2 text-surface-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.links.about')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.links.blog')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.links.careers')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.links.contact')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t('landing.footer.legal')}</h4>
              <ul className="space-y-2 text-surface-400">
                <li><a href="/legal/privacy" className="hover:text-white transition-colors">{t('landing.footer.links.privacy')}</a></li>
                <li><a href="/legal/terms" className="hover:text-white transition-colors">{t('landing.footer.links.terms')}</a></li>
                <li><a href="/legal/cookies" className="hover:text-white transition-colors">{t('landing.footer.links.cookies')}</a></li>
                <li><a href="/legal/mentions" className="hover:text-white transition-colors">{t('landing.footer.links.mentions')}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-surface-500 text-sm">
              {t('landing.footer.copyright')}
            </p>
            <div className="flex items-center gap-4">
              <Globe className="w-5 h-5 text-surface-500" />
              <select
                className="bg-transparent text-surface-400 text-sm border-none focus:ring-0"
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
      </footer>
    </div>
  );
}
