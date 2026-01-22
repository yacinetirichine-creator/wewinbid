'use client';

import Link from 'next/link';
import Logo, { LogoNavbar } from '@/components/ui/Logo';

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-surface-50">
      <header className="border-b border-surface-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="flex items-center">
            <LogoNavbar />
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-display font-bold text-surface-900 mb-4">
          Conditions Générales de Vente (CGV)
        </h1>
        <p className="text-surface-500 mb-12">Dernière mise à jour : 19 janvier 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">1. Préambule</h2>
            <p className="text-surface-700 leading-relaxed">
              Les présentes Conditions Générales de Vente (CGV) régissent les relations commerciales entre
              JARVIS SAS, société par actions simplifiée au capital de 1 000 €, immatriculée au RCS de Créteil
              (en cours), dont le siège social est situé 64 Avenue Marinville, 94100 Saint-Maur-des-Fossés,
              France (ci-après "JARVIS" ou "le Vendeur"), et toute personne morale ou physique souhaitant
              souscrire à un abonnement à la plateforme WeWinBid (ci-après "le Client").
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">2. Objet</h2>
            <p className="text-surface-700 leading-relaxed">
              Les présentes CGV ont pour objet de définir les conditions dans lesquelles JARVIS commercialise
              l'accès à la plateforme SaaS WeWinBid, une solution d'automatisation des réponses aux appels
              d'offres publics et privés, comprenant notamment :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700 mt-4">
              <li>L'analyse par intelligence artificielle des appels d'offres</li>
              <li>La génération automatique de documents administratifs et techniques</li>
              <li>L'accès à une base de données d'attributaires et d'historiques de prix</li>
              <li>Une marketplace pour identifier des partenaires</li>
              <li>Des alertes personnalisées sur les nouvelles opportunités</li>
              <li>Des outils de collaboration d'équipe</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">3. Offres et Tarifs</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">3.1 Formules d'abonnement</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              JARVIS propose les formules d'abonnement suivantes :
            </p>
            
            <div className="bg-white p-6 rounded-xl border border-surface-200 mb-4">
              <h4 className="font-bold text-surface-900 mb-2">Formule Gratuite</h4>
              <p className="text-surface-700">
                <strong>Prix :</strong> 0€/mois<br/>
                <strong>Inclus :</strong> 2 réponses AO/mois, 1 collaborateur, 100 MB stockage, support email
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-surface-200 mb-4">
              <h4 className="font-bold text-surface-900 mb-2">Formule Pro</h4>
              <p className="text-surface-700">
                <strong>Prix :</strong> 49€ HT/mois ou 490€ HT/an (soit 41€/mois)<br/>
                <strong>Inclus :</strong> 20 réponses AO/mois, 5 collaborateurs, 5 GB stockage, toutes fonctionnalités,
                support prioritaire<br/>
                <strong>Essai gratuit :</strong> 14 jours sans engagement
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-surface-200 mb-4">
              <h4 className="font-bold text-surface-900 mb-2">Formule Business</h4>
              <p className="text-surface-700">
                <strong>Prix :</strong> 149€ HT/mois ou 1 490€ HT/an (soit 124€/mois)<br/>
                <strong>Inclus :</strong> Réponses illimitées, 20 collaborateurs, 50 GB stockage, co-rédaction temps réel,
                API, support dédié<br/>
                <strong>Essai gratuit :</strong> 14 jours sans engagement
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-surface-200 mb-4">
              <h4 className="font-bold text-surface-900 mb-2">Formule Enterprise</h4>
              <p className="text-surface-700">
                <strong>Prix :</strong> Sur devis personnalisé<br/>
                <strong>Inclus :</strong> Volumes illimités, utilisateurs illimités, stockage illimité, API dédiée,
                Account Manager, formation équipe, SLA personnalisé<br/>
                <strong>Contact :</strong> commercial@wewinbid.com ou prise de RDV sur Calendly
              </p>
            </div>

            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">3.2 TVA et taxes</h3>
            <p className="text-surface-700 leading-relaxed">
              Tous les prix sont affichés hors taxes (HT). La TVA française au taux en vigueur (20% au 19/01/2026)
              s'applique pour les clients établis en France. Pour les clients établis dans un autre État membre
              de l'Union Européenne et disposant d'un numéro de TVA intracommunautaire valide, l'autoliquidation
              de la TVA s'applique conformément à la réglementation européenne.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">4. Souscription et Commande</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">4.1 Processus de souscription</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              La souscription à un abonnement s'effectue en ligne sur le site wewinbid.com selon les étapes suivantes :
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-surface-700">
              <li>Création d'un compte utilisateur avec validation de l'adresse email</li>
              <li>Sélection de la formule d'abonnement souhaitée</li>
              <li>Renseignement des informations de facturation</li>
              <li>Acceptation des présentes CGV et de la Politique de Confidentialité</li>
              <li>Paiement sécurisé via Stripe</li>
              <li>Confirmation de la commande par email</li>
            </ol>

            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">4.2 Validation de la commande</h3>
            <p className="text-surface-700 leading-relaxed">
              La validation de la commande implique l'acceptation pleine et entière des présentes CGV.
              JARVIS se réserve le droit de refuser toute commande pour un motif légitime, notamment en cas
              de litige existant avec le Client.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">5. Modalités de Paiement</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">5.1 Modes de paiement acceptés</h3>
            <p className="text-surface-700 leading-relaxed">
              Les paiements sont traités de manière sécurisée via la plateforme Stripe. Les modes de paiement
              acceptés sont : carte bancaire (Visa, Mastercard, American Express), virement SEPA, prélèvement automatique.
            </p>

            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">5.2 Facturation</h3>
            <p className="text-surface-700 leading-relaxed">
              Les abonnements mensuels sont facturés le jour de la souscription puis tous les mois à date anniversaire.
              Les abonnements annuels sont facturés en une fois lors de la souscription puis à chaque date anniversaire.
              Les factures sont disponibles en téléchargement dans l'espace client et envoyées par email.
            </p>

            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">5.3 Renouvellement automatique</h3>
            <p className="text-surface-700 leading-relaxed">
              Les abonnements sont renouvelés automatiquement sauf résiliation expressément notifiée par le Client
              au moins 48 heures avant la date de renouvellement. Le Client peut résilier son abonnement à tout moment
              depuis son espace client ou en contactant commercial@wewinbid.com.
            </p>

            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">5.4 Retard de paiement</h3>
            <p className="text-surface-700 leading-relaxed">
              En cas de défaut de paiement, l'accès au service sera suspendu après un délai de grâce de 7 jours.
              Des pénalités de retard au taux de 3 fois le taux d'intérêt légal seront appliquées, ainsi qu'une
              indemnité forfaitaire pour frais de recouvrement de 40€.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">6. Droit de Rétractation</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              Conformément à l'article L221-28 du Code de la consommation, le Client professionnel ne bénéficie
              pas d'un droit de rétractation pour les contrats de fourniture de contenu numérique non fourni sur
              un support matériel dont l'exécution a commencé avec l'accord préalable exprès du consommateur et
              pour lequel il a renoncé à son droit de rétractation.
            </p>
            <p className="text-surface-700 leading-relaxed">
              Pour les Clients consommateurs, un droit de rétractation de 14 jours s'applique, sauf si le Client
              a expressément demandé l'exécution immédiate du service durant cette période.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">7. Durée et Résiliation</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">7.1 Durée</h3>
            <p className="text-surface-700 leading-relaxed">
              Les abonnements sont souscrits pour une durée d'un mois (formule mensuelle) ou d'un an (formule annuelle),
              renouvelables par tacite reconduction.
            </p>

            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">7.2 Résiliation par le Client</h3>
            <p className="text-surface-700 leading-relaxed">
              Le Client peut résilier son abonnement à tout moment sans préavis ni pénalité. La résiliation prend
              effet à la fin de la période en cours déjà payée. Aucun remboursement au prorata n'est effectué.
            </p>

            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">7.3 Résiliation par JARVIS</h3>
            <p className="text-surface-700 leading-relaxed">
              JARVIS se réserve le droit de résilier l'abonnement en cas de manquement grave du Client à ses
              obligations, notamment en cas d'utilisation frauduleuse, de non-paiement, ou de violation des CGU.
              La résiliation sera notifiée par email avec un préavis de 15 jours sauf urgence.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">8. Garanties et Responsabilités</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">8.1 Disponibilité du service</h3>
            <p className="text-surface-700 leading-relaxed">
              JARVIS s'engage à fournir un service accessible 24h/24 et 7j/7, sous réserve des opérations de
              maintenance programmées (notifiées 48h à l'avance) et des cas de force majeure. Un taux de
              disponibilité de 99,5% est visé (hors maintenance programmée).
            </p>

            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">8.2 Limitation de responsabilité</h3>
            <p className="text-surface-700 leading-relaxed">
              JARVIS ne saurait être tenu responsable des dommages indirects (perte de données, perte de chance,
              perte d'exploitation, manque à gagner) résultant de l'utilisation ou de l'impossibilité d'utiliser
              le service. La responsabilité de JARVIS est limitée au montant des sommes versées par le Client
              au titre des 12 derniers mois.
            </p>

            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">8.3 Sauvegardes</h3>
            <p className="text-surface-700 leading-relaxed">
              JARVIS effectue des sauvegardes quotidiennes des données. Toutefois, il appartient au Client de
              procéder à ses propres sauvegardes. JARVIS ne garantit pas la récupération des données en cas de
              sinistre.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">9. Propriété Intellectuelle</h2>
            <p className="text-surface-700 leading-relaxed">
              La plateforme WeWinBid, son code source, sa structure, ses bases de données et tous les contenus
              sont la propriété exclusive de JARVIS et sont protégés par le droit d'auteur, les marques déposées
              et autres droits de propriété intellectuelle. Le Client dispose d'un droit d'usage non exclusif,
              non transférable et limité à la durée de son abonnement.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">10. Données Personnelles</h2>
            <p className="text-surface-700 leading-relaxed">
              Le traitement des données personnelles du Client est régi par notre Politique de Confidentialité,
              consultable à l'adresse{' '}
              <Link href="/legal/privacy" className="text-primary-600 hover:underline">
                wewinbid.com/legal/privacy
              </Link>.
              JARVIS s'engage à respecter le Règlement Général sur la Protection des Données (RGPD) et la loi
              Informatique et Libertés.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">11. Modifications des CGV</h2>
            <p className="text-surface-700 leading-relaxed">
              JARVIS se réserve le droit de modifier les présentes CGV à tout moment. Les Clients seront informés
              par email de toute modification substantielle au moins 30 jours avant son entrée en vigueur.
              La poursuite de l'utilisation du service après cette date vaut acceptation des nouvelles CGV.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">12. Loi Applicable et Juridiction</h2>
            <p className="text-surface-700 leading-relaxed">
              Les présentes CGV sont régies par le droit français. En cas de litige, les parties s'efforceront
              de trouver une solution amiable. À défaut, le litige sera porté devant les tribunaux compétents
              de Créteil, France, sauf dispositions d'ordre public contraires.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">13. Contact</h2>
            <div className="bg-white p-6 rounded-xl border border-surface-200">
              <p className="text-surface-900 mb-2"><strong>JARVIS SAS</strong></p>
              <p className="text-surface-700">64 Avenue Marinville</p>
              <p className="text-surface-700 mb-4">94100 Saint-Maur-des-Fossés, France</p>
              <p className="text-surface-700">
                <strong>Email commercial :</strong>{' '}
                <a href="mailto:commercial@wewinbid.com" className="text-primary-600 hover:underline">
                  commercial@wewinbid.com
                </a>
              </p>
              <p className="text-surface-700">
                <strong>Support :</strong>{' '}
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
              <Link href="/legal/privacy" className="text-primary-600 hover:underline">
                Politique de Confidentialité
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
