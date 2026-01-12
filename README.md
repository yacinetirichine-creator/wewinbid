# WeWinBid 🏆

Plateforme SaaS B2B d'automatisation des réponses aux appels d'offres publics et privés, avec studio créatif intégré pour le contenu professionnel des réseaux sociaux.

**Commercialisé par JARVIS SAS**

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-cyan)

## 🚀 Fonctionnalités

### Gestion des Appels d'Offres
- 📋 **Pipeline Kanban** - Visualisez et gérez vos AO dans un tableau kanban intuitif
- 🔍 **Scoring IA** - Évaluez automatiquement vos chances de succès
- 📄 **Génération de documents** - Créez des mémoires techniques et lettres de candidature avec l'IA
- ⏰ **Alertes intelligentes** - Ne manquez plus aucune deadline
- 📊 **Analytics ROI** - Mesurez votre taux de réussite et revenus

### Studio Créatif
- 🎨 **Posts LinkedIn** - Créez du contenu professionnel engageant
- 🖼️ **Visuels automatisés** - Génération d'images et templates
- 📱 **Multi-plateformes** - LinkedIn, Twitter, Facebook, Instagram
- 📅 **Planification** - Programmez vos publications

### Marketplace Partenaires
- 🤝 **Sous-traitance** - Trouvez des partenaires qualifiés
- 📜 **Groupements** - Formez des consortiums pour les gros marchés
- ⭐ **Évaluations** - Système de notation et références

### Gestion Documentaire
- 📁 **Bibliothèque centralisée** - Tous vos documents administratifs
- ⏱️ **Alertes d'expiration** - KBIS, attestations fiscales, assurances
- ✅ **Checklist automatique** - Documents requis par pays et type d'AO

## 🌍 Internationalisation

### 8 Langues supportées
- 🇫🇷 Français
- 🇬🇧 English
- 🇩🇪 Deutsch
- 🇪🇸 Español
- 🇮🇹 Italiano
- 🇵🇹 Português
- 🇳🇱 Nederlands
- 🇸🇦 العربية (RTL)

### 30+ Pays configurés
Configurations complètes pour chaque pays incluant :
- Plateformes officielles de marchés publics
- Documents requis (public vs privé)
- Seuils de procédure
- Délais minimums
- Réglementations spécifiques

## 💰 Plans et Tarification

| Plan | France | Europe | UK | USA | LATAM | MENA |
|------|--------|--------|-----|-----|-------|------|
| Gratuit | 0€ | 0€ | £0 | $0 | $0 | $0 |
| Pro | 49€ | 59€ | £49 | $59 | $39 | $49 |
| Business | 149€ | 179€ | £149 | $179 | $99 | $129 |
| Enterprise | 399€ | 479€ | £399 | $499 | $299 | $349 |

## 🛠️ Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Supabase (gratuit)

### 1. Cloner et installer

```bash
# Cloner le projet
cd wewinbid

# Installer les dépendances
npm install
```

### 2. Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Exécutez le schéma SQL dans `supabase/schema.sql`
3. Configurez l'authentification (Email/Password, Google OAuth)
4. Créez un bucket Storage `documents` (public: false)

### 3. Variables d'environnement

```bash
# Copier le fichier exemple
cp .env.example .env.local

# Éditer avec vos valeurs
nano .env.local
```

Variables requises :
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 4. Lancer le développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## 📁 Structure du Projet

```
wewinbid/
├── src/
│   ├── app/                    # Pages Next.js App Router
│   │   ├── (auth)/            # Pages d'authentification
│   │   ├── dashboard/         # Tableau de bord
│   │   ├── tenders/           # Gestion des AO
│   │   ├── documents/         # Gestion documentaire
│   │   ├── marketplace/       # Marketplace partenaires
│   │   ├── studio/            # Studio créatif
│   │   ├── analytics/         # Analytics et ROI
│   │   ├── alerts/            # Alertes intelligentes
│   │   ├── settings/          # Paramètres
│   │   └── api/               # Routes API
│   │       ├── tenders/       # CRUD appels d'offres
│   │       ├── documents/     # Upload/gestion docs
│   │       ├── partnerships/  # API marketplace
│   │       └── ai/            # Scoring et génération IA
│   ├── components/
│   │   ├── ui/                # Composants UI réutilisables
│   │   └── layout/            # Layouts (Sidebar, etc.)
│   ├── lib/
│   │   ├── supabase/          # Client Supabase
│   │   ├── i18n/              # Traductions
│   │   ├── countries.ts       # Config par pays
│   │   ├── pricing.ts         # Plans et tarifs
│   │   └── utils.ts           # Utilitaires
│   ├── types/                 # Types TypeScript
│   └── styles/                # Styles globaux
├── supabase/
│   └── schema.sql             # Schéma de base de données
├── public/                    # Assets statiques
└── package.json
```

## 🔧 Technologies

- **Framework**: Next.js 14 (App Router)
- **Langage**: TypeScript
- **Base de données**: Supabase (PostgreSQL)
- **Authentification**: Supabase Auth
- **Stockage**: Supabase Storage
- **Styling**: Tailwind CSS
- **IA**: OpenAI GPT-4 / Anthropic Claude
- **Paiement**: Stripe (optionnel)
- **Email**: Resend (optionnel)

## 📄 Base de données

Le schéma inclut :
- `profiles` - Profils utilisateurs
- `companies` - Entreprises
- `tenders` - Appels d'offres
- `buyers` - Acheteurs/donneurs d'ordre
- `documents` - Documents téléchargés
- `tender_documents` - Documents liés aux AO
- `partnerships` - Partenariats
- `alerts` - Alertes configurées
- `subscriptions` - Abonnements
- `ai_generations` - Historique générations IA

Politiques RLS (Row Level Security) pour la sécurité des données.

## 🚀 Déploiement

### Vercel (Recommandé)

```bash
npm install -g vercel
vercel
```

### IONOS / Autre hébergeur

```bash
npm run build
npm start
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](CONTRIBUTING.md).

## 📝 Licence

Propriétaire - © 2025 JARVIS SAS. Tous droits réservés.

## 📞 Support

- Email: support@wewinbid.com
- Documentation: [docs.wewinbid.com](https://docs.wewinbid.com)

---

Fait avec ❤️ par l'équipe JARVIS
