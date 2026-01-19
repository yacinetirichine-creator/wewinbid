'use client';

import Link from 'next/link';

export default function MentionsPage() {
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
          Mentions Légales
        </h1>
        <p className="text-surface-500 mb-12">Dernière mise à jour : 19 janvier 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">Éditeur du Site</h2>
            <div className="p-6 bg-white rounded-xl border border-surface-200">
              <p className="text-surface-900"><strong>Raison sociale :</strong> JARVIS SAS</p>
              <p className="text-surface-700 mt-2"><strong>Forme juridique :</strong> Société par Actions Simplifiée</p>
              <p className="text-surface-700"><strong>Capital social :</strong> 1 000 €</p>
              <p className="text-surface-700"><strong>SIRET :</strong> En cours d'attribution</p>
              <p className="text-surface-700"><strong>RCS :</strong> Créteil (en cours)</p>
              <p className="text-surface-700"><strong>N° TVA intracommunautaire :</strong> En cours d'attribution</p>
              <p className="text-surface-700 mt-4"><strong>Siège social :</strong></p>
              <p className="text-surface-700">64 Avenue Marinville</p>
              <p className="text-surface-700">94100 Saint-Maur-des-Fossés, France</p>
              <p className="text-surface-700 mt-4">
                <strong>Email commercial :</strong>{' '}
                <a href="mailto:commercial@wewinbid.com" className="text-primary-600 hover:underline">
                  commercial@wewinbid.com
                </a>
              </p>
              <p className="text-surface-700">
                <strong>Email support :</strong>{' '}
                <a href="mailto:contact@wewinbid.com" className="text-primary-600 hover:underline">
                  contact@wewinbid.com
                </a>
              </p>
              <p className="text-surface-700 mt-4">
                <strong>Directeur de la publication :</strong> Représentant légal de JARVIS SAS
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">Hébergement</h2>
            <div className="p-6 bg-white rounded-xl border border-surface-200">
              <p className="text-surface-900"><strong>Hébergeur web :</strong> Vercel Inc.</p>
              <p className="text-surface-700 mt-2">340 S Lemon Ave #4133</p>
              <p className="text-surface-700">Walnut, CA 91789, USA</p>
              <p className="text-surface-700 mt-4">
                <strong>Base de données :</strong> Supabase Inc.
              </p>
              <p className="text-surface-700">970 Toa Payoh North #07-04</p>
              <p className="text-surface-700">Singapore 318992</p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">Propriété Intellectuelle</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              L'ensemble du contenu de ce site (structure, textes, logos, images, vidéos, code source, etc.)
              est la propriété exclusive de JARVIS SAS, sauf mention contraire.
            </p>
            <p className="text-surface-700 leading-relaxed">
              Toute reproduction, distribution, modification, adaptation, retransmission ou publication de
              ces éléments est strictement interdite sans l'accord écrit préalable de JARVIS SAS.
            </p>
            <p className="text-surface-700 leading-relaxed mt-4">
              <strong>Marques déposées :</strong> WeWinBid® est une marque déposée de JARVIS SAS.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">Données Personnelles</h2>
            <p className="text-surface-700 leading-relaxed">
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi
              Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, de suppression
              et d'opposition aux données personnelles vous concernant.
            </p>
            <p className="text-surface-700 leading-relaxed mt-4">
              Pour exercer ces droits ou pour toute question sur le traitement de vos données,
              contactez notre DPO à :{' '}
              <a href="mailto:contact@wewinbid.com" className="text-primary-600 hover:underline">
                contact@wewinbid.com
              </a>
            </p>
            <p className="text-surface-700 leading-relaxed mt-4">
              Pour en savoir plus, consultez notre{' '}
              <Link href="/legal/privacy" className="text-primary-600 hover:underline">
                Politique de Confidentialité
              </Link>
              .
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">Cookies</h2>
            <p className="text-surface-700 leading-relaxed">
              Ce site utilise des cookies pour améliorer votre expérience utilisateur et réaliser des
              statistiques de visite. Pour en savoir plus, consultez notre{' '}
              <Link href="/legal/cookies" className="text-primary-600 hover:underline">
                Politique de Cookies
              </Link>
              .
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">Crédits</h2>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li><strong>Design & Développement :</strong> JARVIS SAS</li>
              <li><strong>Icônes :</strong> Lucide Icons</li>
              <li><strong>Hébergement :</strong> Vercel, Supabase</li>
              <li><strong>Analytics :</strong> PostHog</li>
              <li><strong>Paiements :</strong> Stripe</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">Litiges</h2>
            <p className="text-surface-700 leading-relaxed">
              Les présentes mentions légales sont régies par le droit français. En cas de litige et
              à défaut d'accord amiable, le litige sera porté devant les tribunaux français conformément
              aux règles de compétence en vigueur.
            </p>
            <p className="text-surface-700 leading-relaxed mt-4">
              Conformément à l'article L. 612-1 du Code de la consommation, vous pouvez recourir
              gratuitement à un médiateur de la consommation en cas de litige. Coordonnées disponibles
              sur demande.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
