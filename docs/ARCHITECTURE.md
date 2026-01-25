# WeWinBid - Architecture Technique

<div align="center">

**Document Technique pour Développeurs et Acquéreurs**

*Version 2.0 - Janvier 2026*

</div>

---

## Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Stack Technique](#stack-technique)
3. [Architecture Application](#architecture-application)
4. [Base de Données](#base-de-données)
5. [Sécurité](#sécurité)
6. [Intégrations IA](#intégrations-ia)
7. [Internationalisation](#internationalisation)
8. [Performance & Scalabilité](#performance--scalabilité)
9. [Tests](#tests)
10. [CI/CD](#cicd)

---

## Vue d'Ensemble

### Diagramme d'Architecture

```
                                    ┌─────────────────────────────────────┐
                                    │         CDN / Vercel Edge           │
                                    │    (Static assets, ISR caching)     │
                                    └─────────────────┬───────────────────┘
                                                      │
                                                      ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js 16)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │   Pages     │  │ Components  │  │   Hooks     │  │  State (Zustand)    │   │
│  │  (App Dir)  │  │  (81 UI)    │  │ (15 custom) │  │  (auth, ui, data)   │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└────────────────────────────────────────┬──────────────────────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
        ┌───────────────────┐  ┌─────────────────┐  ┌─────────────────┐
        │   API Routes      │  │   Supabase      │  │   External      │
        │   (92 endpoints)  │  │   Client SDK    │  │   Services      │
        │   ├─ /api/ai/*    │  │   (Real-time)   │  │   ├─ OpenAI     │
        │   ├─ /api/tenders │  │                 │  │   ├─ Anthropic  │
        │   ├─ /api/docs    │  │                 │  │   ├─ Stripe     │
        │   └─ /api/...     │  │                 │  │   └─ Resend     │
        └─────────┬─────────┘  └────────┬────────┘  └─────────────────┘
                  │                     │
                  └──────────┬──────────┘
                             ▼
        ┌────────────────────────────────────────────────────────────┐
        │                    SUPABASE PLATFORM                        │
        │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
        │  │  PostgreSQL  │  │    Auth      │  │     Storage      │  │
        │  │  (30+ tables)│  │  (JWT/OAuth) │  │  (Documents)     │  │
        │  │  + RLS       │  │              │  │                  │  │
        │  └──────────────┘  └──────────────┘  └──────────────────┘  │
        │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
        │  │  Edge Funcs  │  │   Realtime   │  │   Audit Logs     │  │
        │  │  (Webhooks)  │  │  (WebSocket) │  │   (RGPD)         │  │
        │  └──────────────┘  └──────────────┘  └──────────────────┘  │
        └────────────────────────────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────────────────────────┐
        │                    UPSTASH REDIS                            │
        │              (Cache, Rate Limiting, Sessions)               │
        └────────────────────────────────────────────────────────────┘
```

### Principes Architecturaux

1. **Serverless-First**: Pas de serveur à gérer, scaling automatique
2. **Edge Computing**: Assets et API au plus proche des utilisateurs
3. **Type Safety**: TypeScript strict sur toute la stack
4. **Security by Design**: RLS, validation Zod, rate limiting
5. **Multi-tenant**: Isolation des données par entreprise

---

## Stack Technique

### Frontend

| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js | 16.x | Framework React avec App Router |
| React | 18.x | Bibliothèque UI |
| TypeScript | 5.6 | Typage statique |
| Tailwind CSS | 3.4 | Styling utilitaire |
| Framer Motion | 11.x | Animations |
| Zustand | 4.x | State management |
| React Hook Form | 7.x | Gestion formulaires |
| Zod | 3.x | Validation schemas |
| Lucide React | 0.400+ | Icônes |

### Backend

| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js API Routes | 16.x | Endpoints RESTful |
| Supabase | 2.x | BaaS (DB, Auth, Storage) |
| PostgreSQL | 15 | Base de données |
| Upstash Redis | - | Cache & Rate limiting |

### Services Externes

| Service | Usage |
|---------|-------|
| OpenAI GPT-4o | Scoring IA, génération de contenu |
| OpenAI DALL-E 3 | Génération d'images HD |
| Anthropic Claude | Alternative IA (scoring) |
| Stripe | Paiements & abonnements |
| Resend | Emails transactionnels |
| Google Calendar API | Synchronisation calendrier |

### DevOps

| Outil | Usage |
|-------|-------|
| Vercel | Hosting & CI/CD |
| GitHub Actions | Automation |
| ESLint | Linting |
| Prettier | Formatting |
| Jest | Unit testing |
| Playwright | E2E testing |

---

## Architecture Application

### Structure des Dossiers

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Routes authentification
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Routes protégées
│   │   ├── dashboard/
│   │   ├── tenders/
│   │   │   ├── [id]/
│   │   │   ├── drafts/           # Dossiers en cours
│   │   │   └── new/
│   │   ├── marketplace/
│   │   ├── studio/
│   │   ├── analytics/
│   │   ├── documents/
│   │   ├── alerts/
│   │   ├── team/
│   │   └── settings/
│   ├── api/                      # API Routes
│   │   ├── ai/
│   │   │   ├── score/
│   │   │   ├── generate-image/
│   │   │   ├── generate-presentation/
│   │   │   └── generate-document/
│   │   ├── tenders/
│   │   ├── documents/
│   │   ├── partnerships/
│   │   ├── team/
│   │   ├── analytics/
│   │   └── webhooks/
│   │       └── stripe/
│   ├── layout.tsx                # Root layout
│   └── globals.css
│
├── components/
│   ├── ui/                       # 81 composants réutilisables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Tabs.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── dashboard/
│   │   ├── StatsCards.tsx
│   │   ├── DraftsWidget.tsx
│   │   └── RecentActivity.tsx
│   ├── tenders/
│   │   ├── TenderCard.tsx
│   │   ├── TenderKanban.tsx
│   │   ├── TenderResponseWizard.tsx
│   │   └── TenderScoring.tsx
│   ├── studio/
│   │   ├── ImageGenerator.tsx
│   │   └── ContentTemplates.tsx
│   └── forms/
│       ├── TenderForm.tsx
│       └── CompanyForm.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── admin.ts              # Admin client (service role)
│   ├── services/
│   │   ├── team-service.ts
│   │   ├── tender-service.ts
│   │   ├── document-service.ts
│   │   └── analytics-service.ts
│   ├── ai/
│   │   ├── openai.ts
│   │   ├── anthropic.ts
│   │   └── scoring.ts
│   ├── i18n/
│   │   ├── countries.ts          # 30+ pays configurés
│   │   ├── sectors.ts            # 22 secteurs
│   │   └── translations.ts
│   ├── validation.ts             # Schemas Zod
│   ├── security.ts               # Rate limiting, CORS
│   ├── cache.ts                  # Redis cache
│   ├── audit.ts                  # Audit logging
│   └── utils.ts                  # Utilitaires
│
├── hooks/
│   ├── useAuth.ts
│   ├── useTenders.ts
│   ├── useDocuments.ts
│   ├── useUiTranslations.ts
│   ├── useRealtime.ts
│   └── ... (15 hooks)
│
├── types/
│   ├── database.ts               # Types Supabase générés
│   ├── tender.ts
│   ├── user.ts
│   └── index.ts
│
├── stores/
│   ├── authStore.ts
│   ├── uiStore.ts
│   └── tenderStore.ts
│
└── middleware.ts                 # Auth & i18n middleware
```

### Flux de Données

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Middleware │────▶│   Page/API  │
└─────────────┘     │  (Auth+i18n)│     └──────┬──────┘
                    └─────────────┘            │
                                               ▼
                    ┌──────────────────────────────────────┐
                    │              Validation              │
                    │         (Zod Schema Check)           │
                    └──────────────────┬───────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            │                          │                          │
            ▼                          ▼                          ▼
    ┌───────────────┐         ┌───────────────┐         ┌───────────────┐
    │   Supabase    │         │   OpenAI/     │         │    Stripe     │
    │   (CRUD+RLS)  │         │   Claude      │         │  (Payments)   │
    └───────────────┘         └───────────────┘         └───────────────┘
            │                          │                          │
            └──────────────────────────┼──────────────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │            Audit Logging             │
                    │      (RGPD, Security Events)         │
                    └──────────────────────────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │             Response                 │
                    │         (JSON + Cache)               │
                    └──────────────────────────────────────┘
```

---

## Base de Données

### Schéma Principal (30+ tables)

```sql
-- UTILISATEURS & AUTH
├── profiles                    -- Profils utilisateurs (lié à auth.users)
├── companies                   -- Entreprises
├── company_members             -- Membres équipe (N-N)
├── team_invitations            -- Invitations en attente

-- APPELS D'OFFRES
├── tenders                     -- Appels d'offres
├── tender_documents            -- Documents liés (N-N)
├── tender_responses            -- Réponses aux AO
├── tender_scores               -- Scores IA calculés
├── buyers                      -- Acheteurs/donneurs d'ordre

-- DOCUMENTS
├── documents                   -- Fichiers uploadés
├── document_templates          -- Modèles DC1, DC2, etc.
├── generated_documents         -- Documents générés par IA

-- MARKETPLACE
├── partnerships                -- Partenariats
├── partnership_requests        -- Demandes de collaboration
├── partner_reviews             -- Évaluations

-- NOTIFICATIONS
├── alerts                      -- Alertes configurées
├── notifications               -- Notifications envoyées

-- ANALYTICS
├── analytics_events            -- Événements tracking
├── audit_logs                  -- Logs RGPD/sécurité

-- ABONNEMENTS
├── subscriptions               -- Abonnements Stripe
├── invoices                    -- Factures
├── usage_limits                -- Limites par plan

-- IA
├── ai_generations              -- Historique générations
├── ai_scores_cache             -- Cache scores IA
```

### Row Level Security (RLS)

Toutes les tables utilisent RLS pour l'isolation multi-tenant:

```sql
-- Exemple: Politique pour tenders
CREATE POLICY "Users can view own company tenders"
  ON tenders FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users with permission can create tenders"
  ON tenders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE user_id = auth.uid()
      AND company_id = tenders.company_id
      AND permissions->>'can_create_tenders' = 'true'
    )
  );
```

### Index Optimisés

```sql
-- Index pour performances
CREATE INDEX idx_tenders_company_id ON tenders(company_id);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_deadline ON tenders(deadline);
CREATE INDEX idx_tenders_created_at ON tenders(created_at DESC);
CREATE INDEX idx_audit_logs_user_company ON audit_logs(user_id, company_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

---

## Sécurité

### Score Sécurité: 9.5/10

| Catégorie | Implémentation | Status |
|-----------|----------------|--------|
| Authentification | Supabase Auth (JWT + OAuth) | ✅ |
| Autorisation | RLS + Permissions granulaires | ✅ |
| Validation | Zod schemas sur tous les inputs | ✅ |
| XSS | DOMPurify + React escaping | ✅ |
| CSRF | Token validation | ✅ |
| Injection SQL | Prepared statements (Supabase) | ✅ |
| Rate Limiting | Par endpoint (Redis) | ✅ |
| Encryption | TLS 1.3 + AES-256 at rest | ✅ |
| Audit Logging | 25+ types d'actions | ✅ |
| Secrets | Env vars, pas en code | ✅ |

### Rate Limiting

```typescript
// src/lib/security.ts
export const RATE_LIMITS = {
  '/api/ai/generate-image': { max: 10, window: 60000 },
  '/api/ai/generate-presentation': { max: 5, window: 60000 },
  '/api/ai/score': { max: 20, window: 60000 },
  '/api/documents/upload': { max: 10, window: 60000 },
  '/api/auth/login': { max: 5, window: 300000 },
  'default': { max: 100, window: 60000 },
};
```

### Validation Schemas

```typescript
// src/lib/validation.ts
export const TenderSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(10000).optional(),
  budget_min: z.number().min(0).max(100000000),
  budget_max: z.number().min(0).max(100000000),
  deadline: z.string().datetime(),
  status: z.enum(['DRAFT', 'IDENTIFIED', 'ANALYZING', ...]),
  country: z.string().length(2),
  sector: z.string().optional(),
});
```

---

## Intégrations IA

### OpenAI GPT-4

```typescript
// src/lib/ai/openai.ts
export async function generateTenderScore(
  tender: Tender,
  company: Company
): Promise<ScoringResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: SCORING_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: formatScoringPrompt(tender, company),
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  return parseScoringResponse(response);
}
```

### DALL-E 3 (Images HD)

```typescript
// src/lib/ai/openai.ts
export async function generateImage(
  prompt: string,
  style: ImageStyle,
  size: ImageSize = '1024x1024'
): Promise<ImageResult> {
  const enhancedPrompt = buildStyledPrompt(prompt, style);

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: enhancedPrompt,
    n: 1,
    size,
    quality: 'hd',
  });

  return {
    url: response.data[0].url,
    revisedPrompt: response.data[0].revised_prompt,
  };
}
```

### Scoring Weights

```typescript
// src/lib/ai/scoring.ts
export const SCORING_WEIGHTS = {
  sector_match: 30,        // Correspondance sectorielle
  certifications: 20,      // Certifications requises
  experience: 20,          // Expérience similaire
  financial_capacity: 15,  // Capacité financière
  geographic_coverage: 15, // Couverture géographique
};

export const TENDER_TYPE_WEIGHTS = {
  public_french: { certifications: 25, ... },
  private: { sector_match: 35, ... },
  european: { certifications: 30, ... },
};
```

---

## Internationalisation

### 8 Langues Supportées

| Code | Langue | Direction | Status |
|------|--------|-----------|--------|
| fr | Français | LTR | ✅ Complet |
| en | English | LTR | ✅ Complet |
| de | Deutsch | LTR | ✅ Complet |
| es | Español | LTR | ✅ Complet |
| it | Italiano | LTR | ✅ Complet |
| pt | Português | LTR | ✅ Complet |
| nl | Nederlands | LTR | ✅ Complet |
| ar | العربية | RTL | ✅ Complet |

### Pattern de Traduction

```typescript
// Composant avec traductions
const TRANSLATIONS: Record<string, Record<string, string>> = {
  fr: {
    'page.title': 'Tableau de bord',
    'action.submit': 'Soumettre',
    'status.pending': 'En attente',
  },
  en: {
    'page.title': 'Dashboard',
    'action.submit': 'Submit',
    'status.pending': 'Pending',
  },
};

// Utilisation
const { t } = useUiTranslations(locale, TRANSLATIONS[locale]);
return <h1>{t('page.title')}</h1>;
```

### 30+ Pays Configurés

```typescript
// src/lib/i18n/countries.ts
export const COUNTRIES = {
  FR: {
    name: 'France',
    currency: 'EUR',
    platforms: ['BOAMP', 'PLACE', 'Marchés Online'],
    documents: ['DC1', 'DC2', 'DC4'],
    thresholds: {
      supplies: 40000,
      services: 40000,
      works: 100000,
      european: 215000,
    },
    regulations: ['Code de la commande publique'],
  },
  DE: { ... },
  // ... 30+ pays
};
```

---

## Performance & Scalabilité

### Métriques Cibles

| Métrique | Cible | Actuel |
|----------|-------|--------|
| Time to First Byte (TTFB) | < 200ms | ~150ms |
| Largest Contentful Paint | < 2.5s | ~2.0s |
| First Input Delay | < 100ms | ~50ms |
| Cumulative Layout Shift | < 0.1 | ~0.05 |

### Stratégies de Cache

```typescript
// Redis Cache (Upstash)
export const CACHE_TTL = {
  ai_score: 600,           // 10 minutes
  tender_list: 60,         // 1 minute
  company_profile: 300,    // 5 minutes
  translations: 3600,      // 1 heure
  country_config: 86400,   // 24 heures
};

// Next.js ISR
export const revalidate = 60; // Pages statiques
```

### Scaling

- **Vercel**: Auto-scaling serverless functions
- **Supabase**: Connection pooling (Supavisor)
- **Redis**: Upstash serverless Redis
- **CDN**: Vercel Edge Network (global)

---

## Tests

### Couverture

| Type | Framework | Couverture |
|------|-----------|------------|
| Unit Tests | Jest | ~70% |
| Integration | Jest | ~50% |
| E2E | Playwright | ~30% |

### Structure Tests

```
src/__tests__/
├── lib/
│   ├── services/
│   │   └── team-service.test.ts
│   └── ai/
│       └── scoring.test.ts
├── hooks/
│   └── useUiTranslations.test.ts
├── components/
│   └── tenders/
│       └── drafts.test.ts
└── e2e/
    ├── auth.spec.ts
    └── tender-flow.spec.ts
```

### Commandes

```bash
# Unit & Integration
npm test
npm run test:watch
npm run test:coverage

# E2E
npm run test:e2e
npm run test:e2e:ui
```

---

## CI/CD

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build

  deploy:
    needs: [lint, test, build]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Vercel Integration

- **Preview**: Chaque PR déploie un environnement preview
- **Production**: Merge sur `main` déploie en production
- **Rollback**: 1-click depuis le dashboard

---

## Métriques Clés

### Statistiques Codebase

| Métrique | Valeur |
|----------|--------|
| API Endpoints | 92 |
| React Components | 81 |
| Custom Hooks | 15 |
| Database Tables | 30+ |
| Test Files | 20+ |
| Langues | 8 |
| Pays configurés | 30+ |
| Secteurs | 22 |

### Dépendances

- **Production**: 45 packages
- **Dev**: 25 packages
- **Vulnérabilités**: 0 high/critical

---

## Contact

Pour questions techniques:
- **GitHub**: github.com/yacinetirichine-creator/wewinbid
- **Email**: support@wewinbid.com

---

*Document généré automatiquement - Janvier 2026*
