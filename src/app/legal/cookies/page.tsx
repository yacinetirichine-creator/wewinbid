'use client';

import Link from 'next/link';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-surface-50">
      <header className="border-b border-surface-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center text-white font-bold text-lg">
              W
            </div>
            <span className="font-display font-bold text-xl">WeWinBid</span>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-display font-bold text-surface-900 mb-4">
          Politique de Cookies
        </h1>
        <p className="text-surface-500 mb-12">Dernière mise à jour : 18 janvier 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">Qu'est-ce qu'un cookie ?</h2>
            <p className="text-surface-700 leading-relaxed">
              Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, smartphone, tablette)
              lors de la visite d'un site web. Il permet de mémoriser des informations relatives à votre
              navigation.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">Cookies utilisés sur WeWinBid</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mb-3 mt-6">1. Cookies Essentiels (toujours actifs)</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              Ces cookies sont nécessaires au fonctionnement de la plateforme :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li><strong>Session</strong> : maintient votre connexion</li>
              <li><strong>CSRF</strong> : protection contre les attaques</li>
              <li><strong>Préférences</strong> : langue, thème</li>
            </ul>

            <h3 className="text-xl font-bold text-surface-900 mb-3 mt-6">2. Cookies Analytiques</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              Nous utilisons PostHog pour comprendre comment vous utilisez la plateforme :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Pages visitées</li>
              <li>Durée des sessions</li>
              <li>Fonctionnalités utilisées</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              Ces données sont anonymisées et nous aident à améliorer l'expérience utilisateur.
            </p>

            <h3 className="text-xl font-bold text-surface-900 mb-3 mt-6">3. Cookies Tiers</h3>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li><strong>Stripe</strong> : traitement sécurisé des paiements</li>
              <li><strong>Supabase</strong> : authentification et stockage</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">Gestion des Cookies</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              Vous pouvez gérer vos préférences de cookies :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Via le bandeau qui apparaît à votre première visite</li>
              <li>Dans les paramètres de votre navigateur</li>
              <li>En nous contactant à contact@wewinbid.com</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              <strong>Attention :</strong> La désactivation de certains cookies peut affecter le
              fonctionnement de la plateforme.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">Durée de Conservation</h2>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Cookies de session : supprimés à la fermeture du navigateur</li>
              <li>Cookies de préférences : 12 mois</li>
              <li>Cookies analytiques : 13 mois maximum</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">Contact</h2>
            <div className="p-6 bg-white rounded-xl border border-surface-200">
              <p className="font-bold text-surface-900">JARVIS SAS</p>
              <p className="text-surface-700">
                Email:{' '}
                <a href="mailto:contact@wewinbid.com" className="text-primary-600 hover:underline">
                  contact@wewinbid.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
