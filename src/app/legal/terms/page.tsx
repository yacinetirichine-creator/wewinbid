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
          Conditions Générales d'Utilisation (CGU)
        </h1>
        <p className="text-surface-500 mb-12">Dernière mise à jour : 19 janvier 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">1. Objet</h2>
            <p className="text-surface-700 leading-relaxed">
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation
              de la plateforme WeWinBid (ci-après "la Plateforme"), éditée par JARVIS SAS, société par actions
              simplifiée au capital de 1 000 €, dont le siège social est situé 64 Avenue Marinville, 94100
              Saint-Maur-des-Fossés, France. En utilisant nos services, vous acceptez sans réserve les
              présentes CGU.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">2. Description du Service</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              WeWinBid est une plateforme SaaS B2B d'automatisation des réponses aux appels d'offres publics
              et privés, développée et commercialisée par JARVIS SAS. La Plateforme propose les fonctionnalités suivantes :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li><strong>Analyse IA et scoring :</strong> Évaluation automatique de la compatibilité entre vos compétences et les appels d'offres</li>
              <li><strong>Génération de documents :</strong> Création automatique de mémoires techniques, DPGF, et documents administratifs</li>
              <li><strong>Base de données attributaires :</strong> Accès aux historiques de prix et aux entreprises attributaires</li>
              <li><strong>Marketplace partenaires :</strong> Identification de co-traitants et sous-traitants qualifiés</li>
              <li><strong>Alertes personnalisées :</strong> Notifications en temps réel sur les nouvelles opportunités correspondant à votre profil</li>
              <li><strong>Collaboration d'équipe :</strong> Outils de travail collaboratif pour rédiger les réponses en équipe</li>
              <li><strong>Bibliothèque de réponses :</strong> Stockage et réutilisation de vos meilleures réponses</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              JARVIS SAS se réserve le droit de faire évoluer les fonctionnalités de la Plateforme à tout moment
              afin d'améliorer l'expérience utilisateur et de s'adapter aux évolutions réglementaires.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">3. Inscription et Compte Utilisateur</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">3.1 Conditions d'inscription</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              L'accès à la Plateforme nécessite la création d'un compte utilisateur. Vous devez :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Être une personne physique majeure ou une personne morale dûment immatriculée</li>
              <li>Fournir des informations exactes, complètes et à jour (nom, prénom, email, entreprise, SIRET)</li>
              <li>Valider votre adresse email lors de l'inscription</li>
              <li>Choisir un mot de passe sécurisé conforme aux exigences de sécurité</li>
              <li>Accepter expressément les présentes CGU et la Politique de Confidentialité</li>
            </ul>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">3.2 Sécurité du compte</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              Vous êtes entièrement responsable de la confidentialité de vos identifiants de connexion et de toutes
              les activités effectuées depuis votre compte. Vous vous engagez à :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Ne pas partager vos identifiants avec des tiers non autorisés</li>
              <li>Maintenir la confidentialité de votre mot de passe</li>
              <li>Nous informer immédiatement à commercial@wewinbid.com de tout usage non autorisé ou suspect</li>
              <li>Vous déconnecter après chaque session, particulièrement sur les ordinateurs partagés</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              JARVIS SAS ne pourra être tenu responsable des dommages résultant d'un usage non autorisé de votre compte.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">4. Abonnements et Paiement</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              Nous proposons plusieurs formules d'abonnement :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li><strong>Gratuit :</strong> 0€/mois - Accès limité pour découvrir la plateforme</li>
              <li><strong>Pro :</strong> 49€/mois ou 490€/an - Pour les TPE/PME actives</li>
              <li><strong>Business :</strong> 149€/mois ou 1490€/an - Pour les équipes commerciales</li>
              <li><strong>Enterprise :</strong> Sur devis - Solution sur mesure pour les grandes entreprises</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              <strong>Modalités de paiement :</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Les paiements sont traités de manière sécurisée via Stripe</li>
              <li>Les abonnements sont renouvelés automatiquement sauf résiliation</li>
              <li>Vous pouvez résilier à tout moment depuis votre espace client</li>
              <li>Aucun remboursement n'est effectué pour les périodes déjà payées</li>
              <li>Essai gratuit de 14 jours sur les plans payants (sans engagement)</li>
              <li>TVA française (20%) applicable selon la législation en vigueur</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">5. Utilisation Acceptable de la Plateforme</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">5.1 Engagements de l'utilisateur</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              En utilisant la Plateforme, vous vous engagez à :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Utiliser la Plateforme uniquement à des fins professionnelles légales et conformes aux présentes CGU</li>
              <li>Respecter les lois et règlements en vigueur, notamment en matière de marchés publics</li>
              <li>Fournir des informations exactes et sincères dans vos réponses aux appels d'offres</li>
              <li>Respecter les quotas et limitations de votre formule d'abonnement</li>
              <li>Ne pas utiliser la Plateforme pour des activités frauduleuses ou trompeuses</li>
            </ul>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">5.2 Usages interdits</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              Sont strictement interdits les comportements suivants :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Tenter de contourner les mesures de sécurité ou les limitations techniques de la Plateforme</li>
              <li>Utiliser des robots, scrapers ou tout outil automatisé pour extraire massivement des données</li>
              <li>Partager votre compte avec des tiers ou créer plusieurs comptes pour la même entité</li>
              <li>Reverse-engineering, décompilation ou désassemblage du code source de la Plateforme</li>
              <li>Diffuser des virus, malwares ou tout code malveillant</li>
              <li>Usurper l'identité d'une autre personne ou entreprise</li>
              <li>Utiliser la Plateforme pour envoyer des communications commerciales non sollicitées (spam)</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              Toute violation de ces interdictions pourra entraîner la suspension immédiate de votre compte et
              d'éventuelles poursuites judiciaires.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">6. Propriété Intellectuelle</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">6.1 Droits de JARVIS SAS</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              L'ensemble des éléments composant la Plateforme WeWinBid sont la propriété exclusive de JARVIS SAS
              ou de ses concédants de licence, et sont protégés par le droit d'auteur, le droit des marques,
              le droit des bases de données et tous autres droits de propriété intellectuelle applicables.
            </p>
            <p className="text-surface-700 leading-relaxed mb-4">
              Sont notamment protégés :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Le code source, l'architecture logicielle et les algorithmes de la Plateforme</li>
              <li>Les marques "WeWinBid", logos et éléments graphiques associés</li>
              <li>La base de données d'attributaires, de prix et d'appels d'offres</li>
              <li>Les textes, images, vidéos et contenus éditoriaux</li>
              <li>Le design, l'interface utilisateur et l'expérience utilisateur (UX/UI)</li>
            </ul>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">6.2 Licence d'utilisation</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              JARVIS SAS vous accorde une licence non exclusive, non transférable, révocable et limitée à la durée
              de votre abonnement pour accéder et utiliser la Plateforme conformément aux présentes CGU.
            </p>
            <p className="text-surface-700 leading-relaxed mb-4">
              Cette licence ne vous confère aucun droit de propriété sur la Plateforme ou ses composants.
            </p>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">6.3 Contenus générés par l'utilisateur</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              Vous conservez l'entière propriété des documents et contenus que vous créez ou téléchargez sur la Plateforme
              (mémoires techniques, réponses aux AO, documents d'entreprise).
            </p>
            <p className="text-surface-700 leading-relaxed mb-4">
              Toutefois, en utilisant la Plateforme, vous accordez à JARVIS SAS une licence mondiale, non exclusive,
              libre de redevances pour :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Stocker et héberger vos contenus</li>
              <li>Analyser vos contenus de manière anonymisée pour améliorer nos algorithmes d'IA</li>
              <li>Utiliser des données agrégées et anonymisées à des fins statistiques</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              JARVIS SAS s'engage à ne jamais divulguer, vendre ou partager vos contenus avec des tiers sans votre
              autorisation expresse, sauf obligation légale.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">7. Responsabilité et Garanties</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">7.1 Nature du service</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              WeWinBid est un outil d'aide à la décision et à la rédaction pour les appels d'offres. Il ne constitue
              en aucun cas une garantie d'attribution de marchés publics ou privés.
            </p>
            <p className="text-surface-700 leading-relaxed mb-4">
              L'utilisateur reconnaît que :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Les scores de compatibilité IA sont indicatifs et ne remplacent pas votre jugement professionnel</li>
              <li>Les documents générés doivent être relus, personnalisés et validés avant soumission</li>
              <li>Les données d'attributaires et de prix sont fournies à titre informatif sans garantie d'exactitude absolue</li>
              <li>Vous restez seul responsable des réponses soumises aux acheteurs publics ou privés</li>
            </ul>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">7.2 Disponibilité du service</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              JARVIS SAS s'efforce d'assurer la disponibilité de la Plateforme 24h/24 et 7j/7, mais ne peut garantir
              une disponibilité totale en raison de :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Opérations de maintenance programmées (notifiées 48h à l'avance)</li>
              <li>Maintenances urgentes pour corriger des failles de sécurité</li>
              <li>Cas de force majeure (pannes réseau, attaques DDoS, catastrophes naturelles)</li>
              <li>Interruptions dues aux fournisseurs tiers (hébergeurs, APIs externes)</li>
            </ul>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">7.3 Limitation de responsabilité</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              Dans les limites autorisées par la loi, JARVIS SAS ne saurait être tenu responsable :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Des dommages indirects (perte de chance, perte d'exploitation, manque à gagner, perte de clientèle)</li>
              <li>De l'utilisation inappropriée de la Plateforme ou des contenus générés</li>
              <li>Des décisions prises sur la base des scores ou recommandations de l'IA</li>
              <li>Du non-respect par l'utilisateur des cahiers des charges des appels d'offres</li>
              <li>De la perte de données en cas de non-sauvegarde par l'utilisateur</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              En tout état de cause, la responsabilité totale de JARVIS SAS est limitée au montant des sommes versées
              par l'utilisateur au titre des 12 derniers mois précédant le fait générateur du dommage.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">8. Suspension et Résiliation</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">8.1 Résiliation par l'utilisateur</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              Vous pouvez résilier votre abonnement à tout moment :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Depuis votre espace client, section "Facturation" → "Annuler l'abonnement"</li>
              <li>Par email à commercial@wewinbid.com en précisant votre nom et adresse email</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              La résiliation prend effet à la fin de la période en cours déjà payée. Aucun remboursement au prorata
              n'est effectué pour la période restante. Vous conservez l'accès à vos données pendant 30 jours après
              la résiliation, délai au-delà duquel elles seront définitivement supprimées.
            </p>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">8.2 Suspension par JARVIS SAS</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              JARVIS SAS se réserve le droit de suspendre immédiatement votre accès en cas de :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Défaut de paiement (suspension après 7 jours de retard)</li>
              <li>Violation des présentes CGU ou utilisation frauduleuse</li>
              <li>Activité suspecte menaçant la sécurité de la Plateforme</li>
              <li>Dépassement excessif et répété des quotas de votre abonnement</li>
            </ul>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">8.3 Résiliation par JARVIS SAS</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              En cas de manquement grave ou répété à vos obligations, JARVIS SAS pourra résilier votre compte
              avec un préavis de 15 jours notifié par email, sauf cas d'urgence (fraude, atteinte à la sécurité)
              nécessitant une résiliation immédiate.
            </p>
            <p className="text-surface-700 leading-relaxed mt-4">
              Aucun remboursement ne sera effectué en cas de résiliation pour faute de l'utilisateur.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">9. Modifications des CGU</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              JARVIS SAS se réserve le droit de modifier les présentes Conditions Générales d'Utilisation à tout
              moment pour s'adapter aux évolutions légales, techniques ou commerciales de la Plateforme.
            </p>
            <p className="text-surface-700 leading-relaxed mb-4">
              Vous serez informé de toute modification substantielle par :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Email envoyé à votre adresse enregistrée au moins 30 jours avant l'entrée en vigueur</li>
              <li>Notification dans votre espace client lors de votre prochaine connexion</li>
              <li>Bannière d'information sur la page d'accueil de la Plateforme</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              La poursuite de l'utilisation de la Plateforme après l'entrée en vigueur des nouvelles CGU vaut
              acceptation de celles-ci. Si vous n'acceptez pas les modifications, vous pouvez résilier votre
              abonnement conformément à l'article 8.
            </p>
            <p className="text-surface-700 leading-relaxed mt-4">
              Les CGU applicables sont celles en vigueur à la date de votre connexion. La version actualisée
              est toujours accessible à l'adresse <Link href="/legal/terms" className="text-primary-600 hover:underline">wewinbid.com/legal/terms</Link>.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">10. Droit Applicable et Résolution des Litiges</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">10.1 Loi applicable</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              Les présentes Conditions Générales d'Utilisation sont régies par le droit français, à l'exclusion
              de toute autre législation. La langue du contrat est le français.
            </p>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">10.2 Médiation préalable</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              En cas de litige ou réclamation relatif à l'interprétation ou l'exécution des présentes CGU,
              les parties s'engagent à rechercher une solution amiable avant toute action judiciaire.
            </p>
            <p className="text-surface-700 leading-relaxed mb-4">
              Vous pouvez contacter notre service client à :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>Email : commercial@wewinbid.com</li>
              <li>Courrier : JARVIS SAS, 64 Avenue Marinville, 94100 Saint-Maur-des-Fossés</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              Nous nous engageons à vous répondre dans un délai maximum de 30 jours.
            </p>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">10.3 Juridiction compétente</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              À défaut de résolution amiable dans un délai de 60 jours, tout litige relatif aux présentes CGU
              sera soumis à la compétence exclusive des tribunaux compétents de Créteil, France, sauf dispositions
              impératives contraires applicables aux consommateurs.
            </p>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">10.4 Médiation de la consommation</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              Conformément à l'article L612-1 du Code de la consommation, si vous êtes un consommateur, vous avez
              le droit de recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable
              du litige. Nous adhérons au service de médiation suivant :
            </p>
            <div className="p-6 bg-white rounded-xl border border-surface-200">
              <p className="text-surface-700"><strong>Médiateur de la Fédération du e-commerce et de la vente à distance (FEVAD)</strong></p>
              <p className="text-surface-700">60 Rue La Boétie – 75008 Paris</p>
              <p className="text-surface-700">
                Site web :{' '}
                <a href="https://www.mediateurfevad.fr" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  www.mediateurfevad.fr
                </a>
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">11. Données Personnelles</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              Le traitement de vos données personnelles est régi par notre Politique de Confidentialité,
              consultable à l'adresse{' '}
              <Link href="/legal/privacy" className="text-primary-600 hover:underline">
                wewinbid.com/legal/privacy
              </Link>.
            </p>
            <p className="text-surface-700 leading-relaxed">
              JARVIS SAS s'engage à respecter le Règlement Général sur la Protection des Données (RGPD)
              et la loi Informatique et Libertés modifiée. Pour toute question relative à vos données,
              contactez notre DPO à commercial@wewinbid.com.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">12. Contact et Support</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              Pour toute question concernant les présentes CGU ou l'utilisation de la Plateforme :
            </p>
            <div className="p-6 bg-white rounded-xl border border-surface-200">
              <p className="font-bold text-surface-900 mb-2">JARVIS SAS</p>
              <p className="text-surface-700">Société par Actions Simplifiée au capital de 1 000 €</p>
              <p className="text-surface-700">Siège social : 64 Avenue Marinville</p>
              <p className="text-surface-700 mb-3">94100 Saint-Maur-des-Fossés, France</p>
              <p className="text-surface-700">SIRET : En cours d'attribution</p>
              <p className="text-surface-700 mb-3">RCS Créteil (en cours)</p>
              <p className="text-surface-700">
                <strong>Email commercial :</strong>{' '}
                <a href="mailto:commercial@wewinbid.com" className="text-primary-600 hover:underline">
                  commercial@wewinbid.com
                </a>
              </p>
              <p className="text-surface-700">
                <strong>Support technique :</strong>{' '}
                <a href="mailto:contact@wewinbid.com" className="text-primary-600 hover:underline">
                  contact@wewinbid.com
                </a>
              </p>
              <p className="text-surface-700 mt-2">
                <strong>Prise de rendez-vous :</strong>{' '}
                <a href="https://calendly.com/commercial-wewinbid/30min" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  Réserver un créneau
                </a>
              </p>
            </div>
          </section>

          <div className="mt-16 pt-8 border-t border-surface-200">
            <p className="text-sm text-surface-500 text-center mb-4">
              Version des CGU : 19 janvier 2026
            </p>
            <p className="text-sm text-surface-500 text-center">
              Documents légaux complémentaires :{' '}
              <Link href="/legal/cgv" className="text-primary-600 hover:underline">
                CGV
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
