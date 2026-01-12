'use client';

import React from 'react';
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

const features = [
  {
    icon: Sparkles,
    title: 'Score de compatibilité IA',
    description: 'Analysez vos chances de succès avant de candidater grâce à notre algorithme prédictif.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: BarChart3,
    title: 'Analyse des attributaires',
    description: 'Consultez l\'historique des gagnants, leurs prix et stratégies pour mieux vous positionner.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Users,
    title: 'Marketplace partenaires',
    description: 'Trouvez des partenaires pour répondre en groupement et décrocher les gros marchés.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: FileText,
    title: 'Génération automatique',
    description: 'Créez vos mémoires techniques, DC1, DC2 et autres documents en quelques clics.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Clock,
    title: 'Alertes intelligentes',
    description: 'Recevez les AO correspondant à votre profil en temps réel sur votre canal préféré.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Target,
    title: 'Tableau de bord ROI',
    description: 'Mesurez votre performance, analysez vos stats et optimisez votre stratégie.',
    color: 'from-indigo-500 to-blue-600',
  },
];

const stats = [
  { value: '233 Mds €', label: 'Marché français annuel', icon: Building2 },
  { value: '+45%', label: 'Taux de réussite moyen', icon: TrendingUp },
  { value: '-60%', label: 'Temps de préparation', icon: Clock },
  { value: '15+', label: 'Secteurs couverts', icon: Target },
];

const testimonials = [
  {
    quote: "WeWinBid a transformé notre approche des marchés publics. Notre taux de succès a doublé en 6 mois.",
    author: 'Marie Lefort',
    role: 'DG, Sécurité Plus SARL',
    avatar: '/images/testimonials/marie.jpg',
  },
  {
    quote: "Le score IA nous permet de prioriser nos efforts sur les AO où nous avons vraiment nos chances.",
    author: 'Thomas Durand',
    role: 'Responsable commercial, BatiPro',
    avatar: '/images/testimonials/thomas.jpg',
  },
  {
    quote: "La marketplace nous a permis de remporter notre premier marché de plus d'1M€ en groupement.",
    author: 'Sophie Martin',
    role: 'CEO, CleanTech Solutions',
    avatar: '/images/testimonials/sophie.jpg',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 via-white to-surface-50">
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
                Fonctionnalités
              </a>
              <a href="#pricing" className="text-surface-600 hover:text-primary-600 transition-colors">
                Tarifs
              </a>
              <a href="#testimonials" className="text-surface-600 hover:text-primary-600 transition-colors">
                Témoignages
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost">Connexion</Button>
              </Link>
              <Link href="/auth/register">
                <Button rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Essai gratuit
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
                  Nouveau: Score IA v2.0
                </Badge>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-surface-900 mb-6">
                Remportez plus d&apos;
                <span className="text-gradient">appels d&apos;offres</span>
              </h1>
              <p className="text-xl text-surface-600 mb-8 max-w-2xl mx-auto">
                Automatisez vos réponses, analysez la concurrence et augmentez votre taux de réussite 
                grâce à l&apos;intelligence artificielle.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="btn-gradient" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Démarrer gratuitement
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button size="lg" variant="outline">
                    Voir la démo
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-surface-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  Essai gratuit 14 jours
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  Sans engagement
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-success-500" />
                  RGPD compliant
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
                  [Capture d&apos;écran du tableau de bord]
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
                <div className="text-surface-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Fonctionnalités</Badge>
            <h2 className="text-4xl font-display font-bold text-surface-900 mb-4">
              Tout ce dont vous avez besoin pour gagner
            </h2>
            <p className="text-xl text-surface-600 max-w-2xl mx-auto">
              Une suite complète d&apos;outils pour maximiser vos chances de succès sur les marchés publics et privés.
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
                  <h3 className="text-xl font-semibold text-surface-900 mb-2">{feature.title}</h3>
                  <p className="text-surface-600">{feature.description}</p>
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
            Prêt à remporter plus de marchés ?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Rejoignez les entreprises qui ont déjà multiplié leur taux de succès avec WeWinBid.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-surface-100">
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="ghost" className="text-white border-white/30 hover:bg-white/10">
                Contacter l&apos;équipe
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
                La plateforme qui vous aide à remporter plus d&apos;appels d&apos;offres.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Produit</h4>
              <ul className="space-y-2 text-surface-400">
                <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Intégrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Entreprise</h4>
              <ul className="space-y-2 text-surface-400">
                <li><a href="#" className="hover:text-white transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carrières</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Légal</h4>
              <ul className="space-y-2 text-surface-400">
                <li><a href="/legal/privacy" className="hover:text-white transition-colors">Confidentialité</a></li>
                <li><a href="/legal/terms" className="hover:text-white transition-colors">CGU</a></li>
                <li><a href="/legal/cookies" className="hover:text-white transition-colors">Cookies</a></li>
                <li><a href="/legal/mentions" className="hover:text-white transition-colors">Mentions légales</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-surface-500 text-sm">
              © 2025 WeWinBid. Commercialisé par JARVIS SAS. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              <Globe className="w-5 h-5 text-surface-500" />
              <select className="bg-transparent text-surface-400 text-sm border-none focus:ring-0">
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
