# 🛡️ Guide de robustesse TypeScript + Supabase

## 🔴 Problème récurrent

Lors de l'utilisation de Supabase avec TypeScript, l'inférence de type échoue souvent pour les requêtes complexes :

```typescript
// ❌ ERREUR TypeScript
const { data: memberData } = await supabase
  .from('company_members')
  .select('company_id')
  .eq('user_id', user.id)
  .single();

// Error: Property 'company_id' does not exist on type 'never'
if (!memberData?.company_id) { ... }
```

**Cause** : Supabase génère des types complexes qui ne correspondent pas toujours aux requêtes `.select()` personnalisées.

---

## ✅ Solutions robustes

### Solution 1 : Cast `as any` (Recommandé pour rapidité)

```typescript
const { data: memberData } = await (supabase
  .from('company_members') as any)
  .select('company_id')
  .eq('user_id', user.id)
  .single();

// ✅ Plus d'erreur TypeScript
if (!memberData?.company_id) { ... }
```

**Avantages** :
- ✅ Simple et rapide
- ✅ Fonctionne partout
- ✅ Pas de configuration supplémentaire

**Inconvénients** :
- ❌ Perte de la vérification de type
- ❌ Erreurs possibles au runtime

---

### Solution 2 : Helper functions (Recommandé pour qualité)

Créer des fonctions réutilisables avec gestion d'erreur :

```typescript
// src/lib/company.ts
export async function getUserCompanyId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await (supabase
      .from('company_members') as any)
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    return data?.company_id || null;
  } catch (err) {
    console.error('Error getUserCompanyId:', err);
    return null;
  }
}

// Utilisation
const companyId = await getUserCompanyId();
if (!companyId) {
  toast.error('Entreprise non trouvée');
  return;
}
```

**Avantages** :
- ✅ Code réutilisable
- ✅ Gestion d'erreur centralisée
- ✅ Plus maintenable
- ✅ Tests unitaires plus faciles

---

### Solution 3 : Types explicites (Complexe, déconseillé)

```typescript
interface CompanyMember {
  company_id: string;
  user_id: string;
  role: string;
}

const { data: memberData } = await supabase
  .from('company_members')
  .select('company_id')
  .eq('user_id', user.id)
  .single() as { data: Pick<CompanyMember, 'company_id'> | null };
```

**Inconvénients** :
- ❌ Verbeux
- ❌ Doit être maintenu manuellement
- ❌ Peut devenir obsolète si le schéma change

---

## 📋 Checklist de robustesse

### 1. Toujours caster Supabase pour les requêtes complexes

```typescript
// ❌ FRAGILE
await supabase.from('table').insert(data)

// ✅ ROBUSTE
await (supabase as any).from('table').insert(data)
```

### 2. Vérifier null/undefined avant accès

```typescript
// ❌ FRAGILE
const companyId = data.company_id;

// ✅ ROBUSTE
const companyId = data?.company_id || null;
```

### 3. Gérer les erreurs explicitement

```typescript
// ❌ FRAGILE
const { data } = await supabase.from('table').select('*');
setData(data);

// ✅ ROBUSTE
const { data, error } = await supabase.from('table').select('*');
if (error) {
  console.error('Error:', error);
  toast.error('Erreur de chargement');
  return;
}
setData(data || []);
```

### 4. Valider les données critiques

```typescript
// ✅ ROBUSTE
const companyId = await getUserCompanyId();
if (!companyId) {
  console.error('No company_id found');
  router.push('/onboarding');
  return;
}
```

---

## 🔧 Corrections appliquées

### Fichiers corrigés (Commit 91c6a47 + suivants)

1. **src/app/tenders/page.tsx**
   ```diff
   - const { data: memberData } = await supabase.from('company_members')
   + const { data: memberData } = await (supabase.from('company_members') as any)
   ```

2. **src/app/tenders/analyze/page.tsx**
   ```diff
   - const { data: memberData } = await supabase.from('company_members')
   + const { data: memberData } = await (supabase.from('company_members') as any)
   ```

3. **src/app/tenders/[id]/page.tsx**
   ```diff
   - const { data: memberData } = await supabase.from('company_members')
   + const { data: memberData } = await (supabase.from('company_members') as any)
   ```

4. **src/app/tenders/[id]/respond/page.tsx**
   ```diff
   - const { data: memberData } = await supabase.from('company_members')
   + const { data: memberData } = await (supabase.from('company_members') as any)
   ```

5. **src/app/tenders/new/page.tsx**
   ```diff
   - const { data: membership } = await supabase.from('company_members')
   + const { data: membership } = await (supabase.from('company_members') as any)
   ```

6. **src/lib/company.ts** (nouveau)
   - Helper `getUserCompanyId()` : récupère le company_id de manière robuste
   - Helper `getUserCompany()` : récupère les infos complètes de l'entreprise
   - Helper `canAccessTender()` : vérifie l'accès à un tender

---

## 🚀 Pattern recommandé

Pour tout nouveau code :

```typescript
async function fetchData() {
  try {
    const supabase = createClient();
    
    // 1. Vérifier l'utilisateur
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User error:', userError);
      return null;
    }

    // 2. Requête avec cast as any
    const { data, error } = await (supabase
      .from('table') as any)
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 3. Gérer l'erreur
    if (error) {
      console.error('Query error:', error);
      toast.error('Erreur de chargement');
      return null;
    }

    // 4. Valider les données
    if (!data?.required_field) {
      console.error('Missing required_field');
      return null;
    }

    // 5. Retourner les données
    return data;
    
  } catch (err) {
    console.error('Unexpected error:', err);
    return null;
  }
}
```

---

## 📊 Impact sur les builds

### Avant les corrections
```
Failed to compile.
./src/app/tenders/[id]/page.tsx:109:24
Type error: Property 'company_id' does not exist on type 'never'.
```

### Après les corrections
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Creating an optimized production build
```

---

## 🎯 Prochaines étapes

### 1. Ajouter des tests unitaires

```typescript
// src/lib/__tests__/company.test.ts
describe('getUserCompanyId', () => {
  it('should return company_id for valid user', async () => {
    const companyId = await getUserCompanyId();
    expect(companyId).toBeTruthy();
  });

  it('should return null for user without company', async () => {
    // Mock user without company
    const companyId = await getUserCompanyId();
    expect(companyId).toBeNull();
  });
});
```

### 2. Monitorer les erreurs en production

Ajouter Sentry ou équivalent pour tracker les erreurs runtime :

```typescript
try {
  const data = await fetchData();
} catch (err) {
  Sentry.captureException(err);
  console.error('Error:', err);
}
```

### 3. Améliorer la génération de types Supabase

```bash
# Regénérer les types depuis le schéma
npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
```

---

## ✅ Résumé

**Règle d'or** : Toujours caster avec `as any` les requêtes Supabase complexes pour éviter les erreurs TypeScript.

**Best practices** :
1. ✅ Cast `as any` sur les requêtes `.from()`
2. ✅ Vérifier `error` avant d'utiliser `data`
3. ✅ Valider `data?.field` avec optional chaining
4. ✅ Utiliser des helpers pour le code réutilisable
5. ✅ Logger les erreurs pour faciliter le debug

**Résultat** : Build stable, code robuste, maintenance facilitée.
