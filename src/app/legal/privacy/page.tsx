'use client';

import Link from 'next/link';

export default function PrivacyPage() {
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
          Politique de Confidentialité
        </h1>
        <p className="text-surface-500 mb-12">Dernière mise à jour : 18 janvier 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">1. Introduction</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              JARVIS SAS, éditeur de la plateforme WeWinBid, accorde une grande importance à la protection
              de vos données personnelles. Cette politique de confidentialité vous informe sur la manière
              dont nous collectons, utilisons et protégeons vos informations.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">2. Données Collectées</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              Nous collectons les données suivantes :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Données d'identification : nom, prénom, email, téléphone</li>
              <li>Données professionnelles : entreprise, SIRET, secteur d'activité</li>
              <li>Données de connexion : adresse IP, logs, cookies</li>
              <li>Données d'utilisation : appels d'offres consultés, documents générés</li>
              <li>Données de paiement : traitées par notre prestataire Stripe</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">3. Utilisation des Données</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              Vos données sont utilisées pour :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Fournir et améliorer nos services</li>
              <li>Gérer votre abonnement et facturation</li>
              <li>Vous envoyer des notifications pertinentes</li>
              <li>Analyser l'utilisation de la plateforme</li>
              <li>Assurer la sécurité de nos systèmes</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">4. Partage des Données</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              Nous ne vendons jamais vos données. Nous les partageons uniquement avec :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Nos prestataires techniques (hébergement, paiement)</li>
              <li>Les autorités légales si requis par la loi</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">5. Vos Droits (RGPD)</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement (droit à l'oubli)</li>
              <li>Droit à la portabilité</li>
              <li>Droit d'opposition au traitement</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              Pour exercer ces droits, contactez-nous à{' '}
              <a href="mailto:contact@wewinbid.com" className="text-primary-600 hover:underline">
                contact@wewinbid.com
              </a>
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">6. Sécurité</h2>
            <p className="text-surface-700 leading-relaxed">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour
              protéger vos données contre tout accès non autorisé, perte ou destruction.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">7. Contact</h2>
            <p className="text-surface-700 leading-relaxed">
              Pour toute question concernant cette politique :
            </p>
            <div className="mt-4 p-6 bg-white rounded-xl border border-surface-200">
              <p className="font-bold text-surface-900">JARVIS SAS</p>
              <p className="text-surface-700">123 Avenue des Champs-Élysées</p>
              <p className="text-surface-700">75008 Paris, France</p>
              <p className="text-surface-700 mt-2">
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
