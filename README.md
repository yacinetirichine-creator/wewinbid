# 🏆 WeWinBid - Plateforme SaaS B2B pour Appels d'Offres

<div align="center">

![WeWinBid Logo](https://img.shields.io/badge/WeWinBid-v2.0-blue?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

**Automatisez vos réponses aux appels d'offres avec l'Intelligence Artificielle**

**Commercialisé par JARVIS SAS**

[Demo](https://wewinbid.com) · [Documentation](#-installation) · [Report Bug](https://github.com/yacinetirichine-creator/wewinbid/issues) · [Request Feature](https://github.com/yacinetirichine-creator/wewinbid/issues)

</div>

---

## 📋 Table des Matières

- [À Propos](#-à-propos)
- [Fonctionnalités](#-fonctionnalités)
- [Tech Stack](#️-tech-stack)
- [Installation](#-installation)
- [Configuration](#️-configuration)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Déploiement](#-déploiement)
- [Contribution](#-contribution)

---

## 🎯 À Propos

**WeWinBid** est une plateforme SaaS B2B complète qui révolutionne la gestion des appels d'offres publics et privés grâce à l'Intelligence Artificielle.

### 🌟 Pourquoi WeWinBid ?

- **233 Mds €** - Marché français des appels d'offres annuel
- **+45%** - Augmentation moyenne du taux de réussite
- **-60%** - Réduction du temps de préparation
- **15+** - Secteurs d'activité couverts

---

## ✨ Fonctionnalités

### 🤖 Intelligence Artificielle

- **Score de Compatibilité IA** (0-100%) - Évaluez vos chances avant de candidater
- **Génération d'images DALL-E 3** - Visuels professionnels (8 styles : professional, creative, technical, minimalist, corporate, modern, illustration, infographic)
- **Générateur de présentations** - Style Gamma.app avec slides et images automatiques
- **Mémoires techniques automatiques** - Génération de documents DC1, DC2, DC4
- **Analyse des attributaires** - Historique des gagnants et stratégies

### 📊 Gestion des Appels d'Offres

- 📋 **Pipeline Kanban** - 8 statuts (DRAFT → IDENTIFIED → ANALYZING → QUALIFIED → PREPARING → SUBMITTED → WON/LOST)
- 🔍 **Scoring IA automatique** - Évaluation multicritères de compatibilité
- 📄 **Génération de documents** - Mémoires techniques et lettres avec l'IA
- ⏰ **Alertes intelligentes** - Notifications personnalisées par email et in-app
- 📊 **Analytics ROI complètes** - Taux de réussite, revenus, pipeline forecast

### 🎨 Studio Créatif

- **Posts LinkedIn professionnels** - Génération de contenu engageant
- **Visuels automatisés** - Images DALL-E 3 en HD
- **Communiqués de presse** - Annonces officielles
- **Études de cas clients** - Success stories
- **Planification de contenu** - Calendrier éditorial

### 🤝 Marketplace Partenaires

- **Recherche de sous-traitants** - Par secteur, compétences, localisation
- **Groupements/Consortiums** - Pour les gros marchés (>500K€)
- **Système de notation** - Évaluations et références vérifiées
- **Gestion des contrats** - Suivi des engagements

### 📁 Gestion Documentaire

- **Bibliothèque centralisée** - Tous vos documents administratifs
- **Alertes d'expiration** - KBIS, attestations fiscales, assurances (DC1, DC2, DC4)
- **Checklist automatique** - Documents requis par pays et type d'AO
- **Stockage sécurisé** - Supabase Storage avec RLS

---

## 🌍 Internationalisation

### 8 Langues supportées
- 🇫🇷 Français (fr)
- 🇬🇧 English (en)
- 🇩🇪 Deutsch (de)
- 🇪🇸 Español (es)
- 🇮🇹 Italiano (it)
- 🇵🇹 Português (pt)
- 🇳🇱 Nederlands (nl)
- 🇸🇦 العربية (ar) - RTL support

### 30+ Pays configurés
Configurations complètes incluant :
- **Plateformes officielles** de marchés publics
- **Documents requis** (DC1, DC2, DC4, insurance certificates, etc.)
- **Seuils de procédure** (national, européen)
- **Délais minimums** de candidature
- **Réglementations spécifiques** par juridiction

---

## 💰 Plans et Tarification

| Plan | France | Europe | UK | USA | LATAM | MENA |
|------|--------|--------|-----|-----|-------|------|
| **Gratuit** | 0€ | 0€ | £0 | $0 | $0 | $0 |
| **Pro** | 49€ | 59€ | £49 | $59 | $39 | $49 |
| **Business** | 149€ | 179€ | £149 | $179 | $99 | $129 |
| **Enterprise** | 399€ | 479€ | £399 | $499 | $299 | $349 |

**Prix mensuels HT** - Abonnement annuel avec 2 mois offerts

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router) - React framework
- **TypeScript 5.6** - Type safety
- **Tailwind CSS 3.4** - Styling
- **Framer Motion 11** - Animations
- **Zustand** - State management
- **React Hook Form + Zod** - Forms & validation

### Backend
- **Next.js API Routes** - RESTful endpoints
- **Supabase** - PostgreSQL + Auth + Storage + RLS
- **OpenAI GPT-4** - Text generation & scoring
- **DALL-E 3** - Image generation (HD quality)
- **Stripe** - Payments & subscriptions

### DevOps
- **Vercel** - Hosting & CI/CD
- **GitHub Actions** - Automation
- **ESLint + Prettier** - Code quality

---

## 🚀 Installation

### Prérequis

- **Node.js** 18+ et npm
- **Compte Supabase** (gratuit sur supabase.com)
- **Clé API OpenAI** (optionnel, pour fonctionnalités IA)

### 1. Cloner et installer

```bash
# Cloner le projet
git clone https://github.com/yacinetirichine-creator/wewinbid.git
cd wewinbid

# Installer les dépendances
npm install
```

### 2. Configuration Supabase

#### A. Créer le projet

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre **URL** et **anon key**

#### B. Créer les tables

```bash
# Ouvrez SQL Editor dans Supabase Dashboard
# Copiez-collez le contenu de supabase/schema.sql
# Exécutez le script (créera 13 tables + RLS + triggers)
```

#### C. Configurer l'authentification

```
1. Authentication → Providers
2. Activer Email/Password
3. (Optionnel) Activer Google OAuth
```

#### D. Créer le bucket Storage

```
1. Storage → New bucket
2. Nom: "documents"
3. Public: NON (privé)
4. Créer
```

### 3. Variables d'environnement

```bash
# Copier le fichier exemple
cp .env.example .env.local

# Éditer avec vos valeurs
nano .env.local
```

**Minimum requis :**

```env
# Supabase (REQUIS)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# OpenAI (Optionnel - pour IA)
OPENAI_API_KEY=sk-proj-...

# Stripe (Optionnel - pour abonnements)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Lancer le développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Architecture

```
wewinbid/
├── src/
│   ├── app/                    # Pages Next.js (App Router)
│   │   ├── api/               # API Routes
│   │   │   ├── ai/            # Endpoints IA
│   │   │   │   ├── generate-image/  # DALL-E 3
│   │   │   │   ├── generate-presentation/
│   │   │   │   └── score/     # Scoring AO
│   │   │   ├── auth/callback/ # Supabase Auth
│   │   │   ├── tenders/       # CRUD appels d'offres
│   │   │   ├── documents/     # Gestion documents
│   │   │   └── partnerships/  # Marketplace
│   │   ├── dashboard/         # Tableau de bord principal
│   │   ├── tenders/           # Gestion AO
│   │   │   ├── [id]/          # Détail d'un AO
│   │   │   └── new/           # Créer un AO
│   │   ├── marketplace/       # Partenaires
│   │   ├── analytics/         # Analytics ROI
│   │   ├── studio/            # Studio créatif
│   │   ├── alerts/            # Centre de notifications
│   │   ├── documents/         # Bibliothèque docs
│   │   └── settings/          # Paramètres
│   ├── components/
│   │   ├── ui/                # Composants réutilisables
│   │   │   └── index.tsx      # Exports centralisés
│   │   ├── layout/            # Layouts
│   │   │   └── Sidebar.tsx
│   │   ├── studio/            # Composants studio
│   │   │   └── ImageGenerator.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── supabase/          # Clients Supabase
│   │   │   ├── client.ts      # Client-side
│   │   │   ├── server.ts      # Server-side
│   │   │   └── middleware.ts  # Auth middleware
│   │   ├── validation.ts      # Schémas Zod
│   │   ├── errors.ts          # Gestion d'erreurs
│   │   ├── security.ts        # Rate limiting, CORS
│   │   ├── utils.ts           # Utilitaires
│   │   └── i18n/              # Internationalisation
│   ├── hooks/
│   │   └── index.ts           # Custom hooks
│   ├── types/
│   │   ├── database.ts        # Types Supabase
│   │   └── index.ts           # Types généraux
│   ├── styles/
│   │   └── globals.css        # Styles globaux
│   └── middleware.ts          # Next.js middleware
├── supabase/
│   └── schema.sql             # Schéma PostgreSQL
├── public/                    # Assets statiques
├── .env.local                 # Variables d'env (gitignored)
├── .env.example               # Template env vars
├── next.config.js             # Config Next.js
├── tailwind.config.ts         # Config Tailwind
└── tsconfig.json              # Config TypeScript
```

### Flux de données

```
User Request
    ↓
Next.js Middleware (Auth + i18n)
    ↓
API Route
    ↓
Validation (Zod schemas)
    ↓
    ├→ Supabase (PostgreSQL + RLS)
    ├→ OpenAI (GPT-4 / DALL-E 3)
    └→ Stripe (Payments)
    ↓
Response (JSON)
```

### Base de données (13 tables)

- **profiles** - Utilisateurs (lié à auth.users)
- **companies** - Entreprises
- **tenders** - Appels d'offres
- **documents** - Fichiers uploadés
- **tender_documents** - Relation N-N
- **partnerships** - Marketplace
- **partnership_requests** - Demandes de collaboration
- **alerts** - Notifications
- **content_plans** - Planification studio
- **social_posts** - Posts générés
- **analytics_events** - Tracking
- **subscriptions** - Abonnements Stripe
- **invoices** - Factures

---

## 📚 API Documentation

### 🎨 Génération d'images

**Endpoint:** `POST /api/ai/generate-image`

**Description:** Génère une image professionnelle avec DALL-E 3 (qualité HD)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <supabase_token>
```

**Body:**
```typescript
{
  "prompt": "Une équipe travaillant sur un projet",
  "style": "professional",  // professional, creative, technical, minimalist, 
                            // corporate, modern, illustration, infographic
  "size": "1024x1024",     // 1024x1024, 1792x1024, 1024x1792
  "quality": "hd",         // standard, hd
  "context": "LinkedIn post about winning a tender"  // Optional
}
```

**Response (200):**
```json
{
  "success": true,
  "imageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/...",
  "revisedPrompt": "Professional team collaborating...",
  "metadata": {
    "style": "professional",
    "size": "1024x1024",
    "quality": "hd",
    "generatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `400` - Validation error (invalid style, size, etc.)
- `401` - Unauthorized (no auth token)
- `429` - Rate limit exceeded (max 10/min)
- `500` - OpenAI API error

**Rate Limiting:** 10 requêtes/minute par utilisateur

---

### 📊 Génération de présentations

**Endpoint:** `POST /api/ai/generate-presentation`

**Description:** Génère une présentation complète style Gamma.app

**Body:**
```typescript
{
  "topic": "Innovation dans les marchés publics",
  "slideCount": 8,
  "style": "professional",
  "includeImages": true,
  "language": "fr"
}
```

**Response (200):**
```json
{
  "presentation": {
    "title": "Innovation dans les marchés publics",
    "subtitle": "Transformer la manière...",
    "slides": [
      {
        "title": "Introduction",
        "content": [...],
        "imageUrl": "https://...",
        "notes": "Speaker notes..."
      }
    ]
  }
}
```

**Rate Limiting:** 5 requêtes/minute par utilisateur

---

### 🎯 Scoring d'appel d'offres

**Endpoint:** `POST /api/ai/score`

**Description:** Analyse la compatibilité entre une entreprise et un AO (score 0-100%)

**Body:**
```typescript
{
  "tenderId": "uuid",
  "companyId": "uuid"
}
```

**Response (200):**
```json
{
  "score": 85,
  "criteria": [
    {
      "name": "Technical Experience",
      "score": 90,
      "weight": 0.3,
      "analysis": "Strong match..."
    },
    {
      "name": "Financial Capacity",
      "score": 80,
      "weight": 0.2,
      "analysis": "..."
    }
  ],
  "recommendations": [
    "Highlight your 5 years experience in...",
    "Include reference from similar project..."
  ],
  "estimatedWinRate": "75-85%"
}
```

---

### 📄 Gestion des appels d'offres

**Endpoints:**
- `GET /api/tenders` - Liste tous les AO
- `GET /api/tenders/:id` - Détails d'un AO
- `POST /api/tenders` - Créer un AO
- `PATCH /api/tenders/:id` - Modifier un AO
- `DELETE /api/tenders/:id` - Supprimer un AO

**Query params (GET /api/tenders):**
```
?status=QUALIFIED
&country=FR
&sector=construction
&minBudget=100000
&sort=deadline:asc
&page=1
&limit=20
```

---

## 🔒 Sécurité

### Row Level Security (RLS)

Toutes les tables Supabase ont des politiques RLS :

```sql
-- Exemple: users can only see their own tenders
CREATE POLICY "Users can view own tenders"
  ON tenders FOR SELECT
  USING (auth.uid() = user_id);
```

### Rate Limiting

Configuration dans `/src/lib/security.ts` :

```typescript
export const RATE_LIMITS = {
  '/api/ai/generate-image': { max: 10, window: 60000 },     // 10/min
  '/api/ai/generate-presentation': { max: 5, window: 60000 }, // 5/min
  '/api/ai/score': { max: 20, window: 60000 },              // 20/min
};
```

### Validation

Tous les inputs sont validés avec Zod (`/src/lib/validation.ts`) :

```typescript
export const TenderSchema = z.object({
  title: z.string().min(5).max(200),
  budget: z.number().min(0).max(100000000),
  deadline: z.string().datetime(),
  // ...
});
```

---

## 🚀 Déploiement

### Vercel (Recommandé)

```bash
# 1. Installer Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Déployer
vercel

# 4. Production
vercel --prod
```

### Variables d'environnement Vercel

Ajoutez toutes les variables de `.env.local` dans :
```
Settings → Environment Variables
```

### Webhooks Stripe

```
URL: https://votre-domaine.vercel.app/api/webhooks/stripe
Events: 
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.paid
  - checkout.session.completed
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Suivez ces étapes :

1. **Fork** le projet
2. **Créez une branche** (`git checkout -b feature/AmazingFeature`)
3. **Committez** (`git commit -m 'Add AmazingFeature'`)
4. **Push** (`git push origin feature/AmazingFeature`)
5. **Ouvrez une Pull Request**

### Guidelines

- ✅ Code en **TypeScript strict**
- ✅ Suivre les conventions **ESLint**
- ✅ Ajouter des **tests** pour nouvelles fonctionnalités
- ✅ Documenter avec **JSDoc**
- ✅ Commits en **anglais**, messages clairs

---

## 📄 License

Distribué sous licence **MIT**. Voir `LICENSE` pour plus d'informations.

---

## 👥 Auteurs

**Yacine Tirichine** - *Créateur* - [@yacinetirichine-creator](https://github.com/yacinetirichine-creator)

**Commercialisé par JARVIS SAS**

---

## 🙏 Remerciements

- [Next.js](https://nextjs.org/) - Framework React
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [OpenAI](https://openai.com/) - GPT-4 & DALL-E 3
- [Vercel](https://vercel.com/) - Hosting
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations

---

<div align="center">

**[⬆ Retour en haut](#-wewinbid---plateforme-saas-b2b-pour-appels-doffres)**

Made with ❤️ by JARVIS SAS

</div>
```
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
