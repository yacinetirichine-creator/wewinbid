# Guide de contribution - WeWinBid

Merci de votre intérêt pour contribuer à WeWinBid ! Ce guide vous aidera à démarrer.

## Table des matières

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Structure du projet](#structure-du-projet)
- [Standards de code](#standards-de-code)
- [Tests](#tests)
- [Internationalisation](#internationalisation)
- [Processus de contribution](#processus-de-contribution)

---

## Prérequis

- **Node.js** 18+ et npm
- **Git**
- Un éditeur de code (VS Code recommandé)
- Compte Supabase (gratuit)

### Extensions VS Code recommandées

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma"
  ]
}
```

---

## Installation

```bash
# 1. Cloner le repo
git clone https://github.com/yacinetirichine-creator/wewinbid.git
cd wewinbid

# 2. Installer les dépendances
npm install

# 3. Copier les variables d'environnement
cp .env.example .env.local

# 4. Lancer le serveur de développement
npm run dev
```

---

## Structure du projet

```
wewinbid/
├── src/
│   ├── app/                    # Pages Next.js (App Router)
│   │   ├── api/               # Routes API
│   │   ├── dashboard/         # Pages dashboard
│   │   ├── tenders/           # Pages appels d'offres
│   │   └── ...
│   ├── components/
│   │   ├── ui/                # Composants UI réutilisables
│   │   ├── layout/            # Layouts (Sidebar, Header)
│   │   ├── tenders/           # Composants spécifiques AO
│   │   └── ...
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilitaires et configurations
│   │   ├── supabase/         # Client Supabase
│   │   ├── i18n/             # Internationalisation
│   │   └── validation.ts     # Schémas Zod
│   └── types/                 # Types TypeScript
├── e2e/                       # Tests E2E Playwright
├── public/                    # Assets statiques
└── supabase/                  # Schéma base de données
```

---

## Standards de code

### TypeScript

- Utiliser TypeScript strict (`strict: true`)
- Typer explicitement les props des composants
- Éviter `any` - utiliser `unknown` si nécessaire

```typescript
// ✅ Bon
interface Props {
  title: string;
  count: number;
  onSubmit: (data: FormData) => Promise<void>;
}

// ❌ Mauvais
const Component = (props: any) => { ... }
```

### Composants React

- Utiliser les composants fonctionnels
- Préférer les hooks aux HOCs
- Colocate les styles avec les composants

```typescript
// ✅ Bon
export function TenderCard({ tender }: { tender: Tender }) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{tender.title}</h3>
    </div>
  );
}
```

### Commits

Format des messages de commit :

```
type(scope): description

[body optional]
```

Types :
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage, pas de changement de code
- `refactor`: Refactoring
- `test`: Ajout/modification de tests
- `chore`: Maintenance

Exemples :
```bash
feat(tenders): add tender creation wizard
fix(auth): resolve login redirect issue
docs(readme): update installation instructions
test(api): add notification API tests
```

---

## Tests

### Tests unitaires (Jest)

```bash
# Lancer tous les tests
npm test

# Lancer en mode watch
npm run test:watch

# Avec couverture
npm run test:coverage
```

Structure des tests :
```
src/
├── __tests__/
│   ├── hooks/           # Tests des hooks
│   │   ├── useAuth.test.ts
│   │   ├── useLocale.test.ts
│   │   └── ...
│   ├── api/             # Tests des API
│   │   ├── notifications.test.ts
│   │   └── ...
│   └── components/      # Tests des composants
```

Exemple de test :
```typescript
import { renderHook } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

describe('useAuth', () => {
  it('should return user when authenticated', async () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeDefined();
  });
});
```

### Tests E2E (Playwright)

```bash
# Lancer les tests E2E
npm run test:e2e

# Mode UI interactif
npm run test:e2e:ui

# Mode headed (voir le navigateur)
npm run test:e2e:headed
```

Structure :
```
e2e/
├── auth.spec.ts         # Tests authentification
├── tenders.spec.ts      # Tests appels d'offres
├── navigation.spec.ts   # Tests navigation
├── basic.spec.ts        # Tests de base
└── features.spec.ts     # Tests fonctionnalités
```

---

## Internationalisation

Le projet supporte 8 langues : FR, EN, DE, ES, IT, PT, NL, AR (RTL).

### Ajouter des traductions

Utiliser le hook `useUiTranslations` :

```typescript
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

const entries = {
  'component.title': 'Mon titre',
  'component.description': 'Ma description',
} as const;

export function MyComponent() {
  const { locale } = useLocale();
  const { t } = useUiTranslations(locale, entries);

  return (
    <div>
      <h1>{t('component.title')}</h1>
      <p>{t('component.description')}</p>
    </div>
  );
}
```

### Convention de nommage des clés

```
{namespace}.{section}.{element}

Exemples:
- tenders.list.title
- tenders.form.submitButton
- notifications.empty.title
- settings.profile.firstName
```

---

## Processus de contribution

### 1. Créer une branche

```bash
git checkout -b feature/ma-fonctionnalite
# ou
git checkout -b fix/mon-bug
```

### 2. Développer

- Écrire le code
- Ajouter des tests
- Vérifier le linting : `npm run lint`
- Vérifier le build : `npm run build`

### 3. Committer

```bash
git add .
git commit -m "feat(scope): description"
```

### 4. Pousser et créer une PR

```bash
git push origin feature/ma-fonctionnalite
```

Puis ouvrir une Pull Request sur GitHub.

### Checklist PR

- [ ] Tests passent (`npm test`)
- [ ] Build réussit (`npm run build`)
- [ ] Lint OK (`npm run lint`)
- [ ] Documentation mise à jour si nécessaire
- [ ] Traductions ajoutées pour les nouvelles chaînes

---

## Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Démarrer en production |
| `npm run lint` | Vérifier le linting |
| `npm test` | Tests unitaires |
| `npm run test:watch` | Tests en mode watch |
| `npm run test:coverage` | Tests avec couverture |
| `npm run test:e2e` | Tests E2E Playwright |
| `npm run test:e2e:ui` | Tests E2E mode UI |

---

## Questions ?

- Ouvrir une [Issue](https://github.com/yacinetirichine-creator/wewinbid/issues)
- Contacter l'équipe : support@wewinbid.com

Merci de contribuer à WeWinBid ! 🎉
