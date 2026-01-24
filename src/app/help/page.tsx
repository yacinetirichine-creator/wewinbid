'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Book,
  MessageSquare,
  Mail,
  Phone,
  ChevronDown,
  Search,
  FileText,
  Sparkles,
  BarChart3,
  Bell,
  Users,
  Settings,
  CreditCard,
  Shield,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { NewAppLayout } from '@/components/layout/NewAppLayout';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'getting-started',
    question: "Comment analyser mon premier appel d'offres ?",
    answer: "Rendez-vous dans la section 'Analyser un AO' depuis le menu principal. Vous pouvez soit télécharger les documents DCE (PDF, Word, etc.), soit coller directement le texte de l'appel d'offres. Notre IA analysera automatiquement les exigences, les critères d'évaluation et générera un score de pertinence basé sur votre profil entreprise.",
  },
  {
    category: 'getting-started',
    question: 'Comment configurer mon profil entreprise ?',
    answer: "Allez dans Paramètres > Entreprise. Renseignez vos informations (secteur d'activité, certifications, références, effectifs). Plus votre profil est complet, plus les analyses IA seront pertinentes et personnalisées à votre activité.",
  },
  {
    category: 'features',
    question: "Comment fonctionne le score IA de matching ?",
    answer: "Notre algorithme IA analyse le contenu de l'appel d'offres et le compare à votre profil entreprise. Il évalue la correspondance sur plusieurs critères : secteur d'activité, compétences requises, certifications demandées, références similaires, capacité financière. Le score va de 0 à 100%, avec des recommandations détaillées.",
  },
  {
    category: 'features',
    question: 'Puis-je générer automatiquement mes documents de réponse ?',
    answer: "Oui ! WeWinBid peut générer automatiquement le mémoire technique, la lettre de candidature, les DC1/DC2, et d'autres documents. L'IA utilise vos informations entreprise et les exigences du DCE pour créer des documents personnalisés que vous pouvez ensuite modifier.",
  },
  {
    category: 'features',
    question: 'Comment configurer les alertes AO ?',
    answer: "Dans la section 'Alertes', créez des alertes personnalisées en définissant vos critères : mots-clés, secteurs, zones géographiques, montants min/max. Vous recevrez des notifications par email et dans l'application dès qu'un nouvel AO correspond à vos critères.",
  },
  {
    category: 'billing',
    question: 'Comment fonctionne la période d\'essai gratuite ?',
    answer: "Vous bénéficiez de 14 jours d'essai gratuit avec accès à toutes les fonctionnalités Pro. Aucune carte bancaire n'est requise pour commencer. À la fin de la période, vous pouvez choisir de continuer avec un abonnement payant ou rester sur le plan gratuit limité.",
  },
  {
    category: 'billing',
    question: 'Puis-je changer de forfait à tout moment ?',
    answer: "Oui, vous pouvez upgrader ou downgrader votre forfait à tout moment depuis Paramètres > Abonnement. Les changements prennent effet immédiatement, avec un calcul au prorata pour la facturation.",
  },
  {
    category: 'security',
    question: 'Mes données sont-elles sécurisées ?',
    answer: "Absolument. Toutes les données sont chiffrées en transit (TLS 1.3) et au repos (AES-256). Nous sommes conformes RGPD et hébergés en Europe. Vos documents ne sont jamais partagés avec des tiers et vous pouvez les supprimer à tout moment.",
  },
  {
    category: 'security',
    question: 'Comment supprimer mon compte et mes données ?',
    answer: "Allez dans Paramètres > Confidentialité > Supprimer mon compte. Toutes vos données seront définitivement supprimées sous 30 jours conformément au RGPD. Vous pouvez aussi exporter vos données avant suppression.",
  },
];

const categories = [
  { id: 'all', label: 'Toutes les questions', icon: HelpCircle },
  { id: 'getting-started', label: 'Démarrage', icon: Book },
  { id: 'features', label: 'Fonctionnalités', icon: Sparkles },
  { id: 'billing', label: 'Facturation', icon: CreditCard },
  { id: 'security', label: 'Sécurité', icon: Shield },
];

const quickLinks = [
  {
    title: 'Analyser un AO',
    description: "Démarrez l'analyse d'un nouvel appel d'offres",
    href: '/tenders/analyze',
    icon: FileText,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Studio IA',
    description: 'Créez des documents et présentations',
    href: '/studio',
    icon: Sparkles,
    color: 'from-violet-500 to-purple-500',
  },
  {
    title: 'Configurer les alertes',
    description: 'Recevez des notifications personnalisées',
    href: '/alerts',
    icon: Bell,
    color: 'from-amber-500 to-orange-500',
  },
  {
    title: 'Paramètres entreprise',
    description: 'Complétez votre profil pour de meilleures analyses',
    href: '/settings/company',
    icon: Settings,
    color: 'from-emerald-500 to-teal-500',
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <NewAppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 mb-4">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-surface-900 mb-3">
            Centre d'aide
          </h1>
          <p className="text-surface-600 max-w-xl mx-auto">
            Trouvez rapidement des réponses à vos questions ou contactez notre équipe support.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Rechercher dans l'aide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-lg"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {quickLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group p-5 rounded-2xl bg-white border border-surface-200 hover:border-primary-200 hover:shadow-lg transition-all"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <link.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-surface-900 mb-1">{link.title}</h3>
              <p className="text-sm text-surface-500">{link.description}</p>
            </a>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-2">
              <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-4">
                Catégories
              </h3>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    selectedCategory === category.id
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'hover:bg-surface-100 text-surface-600'
                  }`}
                >
                  <category.icon className="w-5 h-5" />
                  <span className="font-medium">{category.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* FAQ List */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-xl font-bold text-surface-900 mb-6">
              Questions fréquentes
              {selectedCategory !== 'all' && (
                <span className="text-surface-500 font-normal ml-2">
                  - {categories.find(c => c.id === selectedCategory)?.label}
                </span>
              )}
            </h2>

            {filteredFAQs.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="w-12 h-12 text-surface-300 mx-auto mb-4" />
                <p className="text-surface-500">Aucune question trouvée pour votre recherche.</p>
              </div>
            ) : (
              filteredFAQs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-surface-200 rounded-xl overflow-hidden bg-white"
                >
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-50 transition-colors"
                  >
                    <span className="font-semibold text-surface-900 pr-4">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-surface-400 flex-shrink-0 transition-transform ${
                        expandedFAQ === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {expandedFAQ === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 text-surface-600 leading-relaxed border-t border-surface-100 pt-4">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-surface-900 mb-2">Chat en direct</h3>
            <p className="text-surface-500 text-sm mb-4">
              Discutez avec notre équipe support en temps réel.
            </p>
            <Button variant="outline" className="w-full">
              Démarrer le chat
            </Button>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-surface-900 mb-2">Email</h3>
            <p className="text-surface-500 text-sm mb-4">
              Envoyez-nous un email, nous répondons sous 24h.
            </p>
            <a href="mailto:support@wewinbid.com">
              <Button variant="outline" className="w-full">
                support@wewinbid.com
              </Button>
            </a>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-surface-900 mb-2">Réserver un appel</h3>
            <p className="text-surface-500 text-sm mb-4">
              Planifiez un appel avec notre équipe commerciale.
            </p>
            <a href="https://calendly.com/commercial-wewinbid/30min" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Calendly
              </Button>
            </a>
          </Card>
        </div>
      </div>
    </NewAppLayout>
  );
}
