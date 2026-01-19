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
          Politique de Confidentialité (RGPD)
        </h1>
        <p className="text-surface-500 mb-12">Dernière mise à jour : 19 janvier 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">1. Responsable du Traitement</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              Le responsable du traitement des données personnelles est :
            </p>
            <div className="p-6 bg-white rounded-xl border border-surface-200">
              <p className="font-bold text-surface-900">JARVIS SAS</p>
              <p className="text-surface-700">Société par Actions Simplifiée au capital de 1 000 €</p>
              <p className="text-surface-700">Siège social : 64 Avenue Marinville, 94100 Saint-Maur-des-Fossés, France</p>
              <p className="text-surface-700">SIRET : En cours d'attribution</p>
              <p className="text-surface-700">RCS Créteil (en cours)</p>
              <p className="text-surface-700 mt-2">
                Email DPO :{' '}
                <a href="mailto:commercial@wewinbid.com" className="text-primary-600 hover:underline">
                  commercial@wewinbid.com
                </a>
              </p>
            </div>
            <p className="text-surface-700 leading-relaxed mt-4">
              JARVIS SAS, éditeur de la plateforme WeWinBid, accorde une grande importance à la protection
              de vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD)
              et à la loi Informatique et Libertés modifiée.
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
              Conformément au RGPD (articles 15 à 22) et à la loi Informatique et Libertés, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li><strong>Droit d'accès</strong> : obtenir la confirmation que vos données sont traitées et en obtenir une copie</li>
              <li><strong>Droit de rectification</strong> : corriger vos données inexactes ou incomplètes</li>
              <li><strong>Droit à l'effacement</strong> (droit à l'oubli) : supprimer vos données dans certaines conditions</li>
              <li><strong>Droit à la limitation</strong> : limiter le traitement de vos données</li>
              <li><strong>Droit à la portabilité</strong> : récupérer vos données dans un format structuré et lisible</li>
              <li><strong>Droit d'opposition</strong> : vous opposer au traitement de vos données</li>
              <li><strong>Droit de retirer votre consentement</strong> à tout moment</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              Pour exercer ces droits, contactez-nous à{' '}
              <a href="mailto:commercial@wewinbid.com" className="text-primary-600 hover:underline">
                commercial@wewinbid.com
              </a>{' '}
              en indiquant votre nom, prénom et adresse email. Nous vous répondrons dans un délai d'un mois.
            </p>
            <p className="text-surface-700 leading-relaxed mt-4">
              Vous disposez également du droit d'introduire une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) :{' '}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                www.cnil.fr
              </a>
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">6. Sécurité et Conservation</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour
              protéger vos données contre tout accès non autorisé, perte, destruction ou divulgation :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Chiffrement SSL/TLS pour toutes les communications</li>
              <li>Hébergement sécurisé chez des prestataires certifiés</li>
              <li>Sauvegardes régulières chiffrées</li>
              <li>Accès restreints aux données par authentification forte</li>
              <li>Surveillance et journalisation des accès</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              Vos données sont conservées pendant la durée de votre abonnement, puis archivées pendant 3 ans
              à des fins de preuve en cas de litige, conformément aux obligations légales. Les données de
              facturation sont conservées 10 ans conformément aux obligations comptables.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">7. Transferts de Données</h2>
            <p className="text-surface-700 leading-relaxed">
              Vos données sont hébergées au sein de l'Union Européenne. Aucun transfert vers des pays tiers
              n'est effectué sans garanties appropriées (clauses contractuelles types de la Commission Européenne).
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">8. Contact DPO</h2>
            <p className="text-surface-700 leading-relaxed">
              Pour toute question concernant cette politique ou l'exercice de vos droits :
            </p>
            <div className="mt-4 p-6 bg-white rounded-xl border border-surface-200">
              <p className="font-bold text-surface-900">Délégué à la Protection des Données (DPO)</p>
              <p className="text-surface-700">JARVIS SAS</p>
              <p className="text-surface-700">64 Avenue Marinville</p>
              <p className="text-surface-700">94100 Saint-Maur-des-Fossés, France</p>
              <p className="text-surface-700 mt-2">
                Email DPO :{' '}
                <a href="mailto:commercial@wewinbid.com" className="text-primary-600 hover:underline">
                  commercial@wewinbid.com
                </a>
              </p>
              <p className="text-surface-700">
                Support :{' '}
                <a href="mailto:contact@wewinbid.com" className="text-primary-600 hover:underline">
                  contact@wewinbid.com
                </a>
              </p>
            </div>
          </section>

          <div className="mt-16 pt-8 border-t border-surface-200">
            <p className="text-sm text-surface-500 text-center">
              Documents légaux :{' '}
              <Link href="/legal/terms" className="text-primary-600 hover:underline">
                CGU
              </Link>
              {' · '}
              <Link href="/legal/cgv" className="text-primary-600 hover:underline">
                CGV
              </Link>
              {' · '}
              <Link href="/legal/cookies" className="text-primary-600 hover:underline">
                Cookies
              </Link>
              {' · '}
              <Link href="/legal/mentions" className="text-primary-600 hover:underline">
                Mentions Légales
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
