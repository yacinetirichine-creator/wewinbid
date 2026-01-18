'use client';

import Link from 'next/link';

export default function TermsPage() {
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
          Conditions Générales d'Utilisation
        </h1>
        <p className="text-surface-500 mb-12">Dernière mise à jour : 18 janvier 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">1. Objet</h2>
            <p className="text-surface-700 leading-relaxed">
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation
              de la plateforme WeWinBid, éditée par JARVIS SAS. En utilisant nos services, vous acceptez
              sans réserve les présentes CGU.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">2. Description du Service</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              WeWinBid est une plateforme SaaS B2B d'automatisation des réponses aux appels d'offres.
              Nous proposons notamment :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Analyse IA des appels d'offres et scoring de compatibilité</li>
              <li>Génération automatique de documents administratifs et techniques</li>
              <li>Analyse des attributaires et historiques de prix</li>
              <li>Marketplace pour trouver des partenaires</li>
              <li>Alertes personnalisées sur les nouvelles opportunités</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">3. Inscription et Compte</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              Pour utiliser nos services, vous devez :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Créer un compte avec des informations exactes et à jour</li>
              <li>Être une personne morale (entreprise) ou physique majeure</li>
              <li>Maintenir la confidentialité de vos identifiants</li>
              <li>Nous informer immédiatement de tout usage non autorisé</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">4. Abonnements et Paiement</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              Nous proposons plusieurs formules d'abonnement (Free, Pro, Business, Enterprise).
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Les paiements sont traités de manière sécurisée via Stripe</li>
              <li>Les abonnements sont renouvelés automatiquement</li>
              <li>Vous pouvez résilier à tout moment depuis votre compte</li>
              <li>Aucun remboursement n'est effectué pour les périodes déjà payées</li>
              <li>Essai gratuit de 14 jours sur les plans payants</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">5. Utilisation Acceptable</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              Vous vous engagez à :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Utiliser la plateforme conformément à la loi</li>
              <li>Ne pas tenter de contourner les limitations techniques</li>
              <li>Ne pas partager votre compte avec des tiers</li>
              <li>Ne pas extraire ou copier massivement nos données</li>
              <li>Respecter les droits de propriété intellectuelle</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">6. Propriété Intellectuelle</h2>
            <p className="text-surface-700 leading-relaxed">
              Tous les éléments de la plateforme (code, design, marques, contenus) sont la propriété
              exclusive de JARVIS SAS. Les documents générés par vos soins vous appartiennent, mais
              nous conservons une licence pour améliorer nos algorithmes.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">7. Responsabilité</h2>
            <p className="text-surface-700 leading-relaxed">
              WeWinBid est un outil d'aide à la réponse aux appels d'offres. Nous ne garantissons pas
              l'attribution des marchés. Vous restez seul responsable des documents soumis et de leur
              conformité aux exigences des acheteurs.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">8. Résiliation</h2>
            <p className="text-surface-700 leading-relaxed">
              Nous nous réservons le droit de suspendre ou résilier votre compte en cas de violation
              des présentes CGU, sans préavis ni remboursement.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">9. Modifications</h2>
            <p className="text-surface-700 leading-relaxed">
              Nous nous réservons le droit de modifier les présentes CGU à tout moment. Les modifications
              prendront effet dès leur publication sur la plateforme.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">10. Droit Applicable</h2>
            <p className="text-surface-700 leading-relaxed">
              Les présentes CGU sont soumises au droit français. Tout litige sera de la compétence
              exclusive des tribunaux de Paris.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">11. Contact</h2>
            <div className="p-6 bg-white rounded-xl border border-surface-200">
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
