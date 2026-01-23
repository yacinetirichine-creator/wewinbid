# 🏢 Architecture Multi-Entreprises WeWinBid

## 📊 Séparation des données

### 🔵 JARVIS SAS (Administrateur Plateforme)
**Rôle** : Éditeur et opérateur de WeWinBid

- **Email admin** : `contact@wewinbid.com`
- **Dashboard** : `/dashboard-admin`
- **Accès** : Métriques globales de TOUS les clients
- **Données visibles** :
  - Nombre total d'utilisateurs
  - Nombre d'entreprises clientes
  - Nombre total d'AO créés
  - Statistiques d'utilisation globales
  - Logs système

**❌ JARVIS SAS ne crée PAS d'appels d'offres**  
**❌ JARVIS SAS n'a PAS de company_id dans `tenders`**

---

### 🟢 Entreprises Clientes (Utilisateurs finaux)
**Rôle** : Entreprises qui utilisent WeWinBid pour gérer leurs AO

Chaque entreprise cliente :
1. **S'inscrit** via le formulaire d'onboarding
2. **Crée sa propre entreprise** (table `companies`)
3. **Ses utilisateurs sont liés** via `company_members`
4. **Voit uniquement ses propres AO** filtrés par `company_id`

#### Exemple d'entreprise cliente :
```
Nom : BTP Solutions SAS
SIRET : 123 456 789 00012
Utilisateurs : jean.dupont@btpsolutions.fr, marie.martin@btpsolutions.fr
Appels d'offres : Uniquement ceux créés par BTP Solutions SAS (company_id = uuid_de_btp_solutions)
```

---

## 🔐 Isolation des données par entreprise

### Table `tenders` (Appels d'offres)
```sql
CREATE TABLE tenders (
  id UUID PRIMARY KEY,
  reference TEXT,
  title TEXT,
  company_id UUID REFERENCES companies(id), -- ⚠️ CLÉ D'ISOLATION
  created_by UUID REFERENCES profiles(id),
  ...
);
```

**Règle de filtrage** :
```typescript
// ✅ CORRECT : Filtrer par company_id
const { data } = await supabase
  .from('tenders')
  .select('*')
  .eq('company_id', userCompanyId);

// ❌ FAUX : Récupérer tous les AO
const { data } = await supabase
  .from('tenders')
  .select('*');
```

---

## 🛠️ Récupérer le company_id de l'utilisateur

### Méthode 1 : Via `company_members`
```typescript
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();

// Récupérer le company_id
const { data: memberData } = await supabase
  .from('company_members')
  .select('company_id')
  .eq('user_id', user.id)
  .single();

const companyId = memberData?.company_id;
```

### Méthode 2 : JOIN pour récupérer les infos complètes
```typescript
const { data: userData } = await supabase
  .from('company_members')
  .select(`
    company_id,
    role,
    companies (
      id,
      name,
      siret,
      subscription_plan
    )
  `)
  .eq('user_id', user.id)
  .single();

const company = userData?.companies;
```

---

## 📝 Workflow Utilisateur

### 1️⃣ Inscription + Onboarding
1. Utilisateur s'inscrit (`auth.users` créé automatiquement)
2. Profil créé dans `profiles` (trigger Supabase)
3. Onboarding : créer ou rejoindre une entreprise
   - **Nouveau** : Créer entreprise → `companies` + `company_members` (role: owner)
   - **Rejoindre** : Invitation → `company_members` (role: member)

### 2️⃣ Création d'un AO
```typescript
const { data: { user } } = await supabase.auth.getUser();

// Récupérer company_id
const { data: memberData } = await supabase
  .from('company_members')
  .select('company_id')
  .eq('user_id', user.id)
  .single();

// Créer l'AO avec company_id
const { data, error } = await supabase
  .from('tenders')
  .insert({
    reference: 'AO-2026-001',
    title: 'Construction école primaire',
    company_id: memberData.company_id, // ⚠️ OBLIGATOIRE
    created_by: user.id,
    ...
  });
```

### 3️⃣ Liste des AO
```typescript
// Filtrage automatique par company_id
const { data: tenders } = await supabase
  .from('tenders')
  .select('*')
  .eq('company_id', userCompanyId)
  .order('created_at', { ascending: false });
```

---

## ✅ Fonctionnalité "Suivi AO" (Reprendre où on s'est arrêté)

### Auto-sauvegarde
Le hook `useAutoSave` sauvegarde automatiquement toutes les 2 secondes :
- **Étape courante** (current_step)
- **Documents uploadés/générés** (documents_status)
- **Notes** (notes)
- **Checklist** (checklist)

### Restauration automatique
Quand l'utilisateur clique sur **"Continuer la réponse"** :
1. Charge le brouillon depuis `tender_responses`
2. Restaure l'étape courante
3. Restaure documents, notes, checklist
4. Affiche l'indicateur de sauvegarde

### Table `tender_responses`
```sql
CREATE TABLE tender_responses (
  id UUID PRIMARY KEY,
  tender_id UUID REFERENCES tenders(id),
  user_id UUID REFERENCES profiles(id),
  current_step INTEGER DEFAULT 0,
  documents_status JSONB DEFAULT '{}',
  notes JSONB DEFAULT '{}',
  checklist JSONB DEFAULT '{}',
  form_data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 Corrections apportées

### ✅ Filtrage par entreprise dans `/tenders/page.tsx`
**Avant** :
```typescript
const { data, error } = await supabase
  .from('tenders')
  .select('*')
  .order('created_at', { ascending: false });
```

**Après** :
```typescript
// Récupérer company_id de l'utilisateur
const { data: memberData } = await supabase
  .from('company_members')
  .select('company_id')
  .eq('user_id', user.id)
  .single();

// Filtrer par company_id
const { data, error } = await supabase
  .from('tenders')
  .select('*')
  .eq('company_id', memberData.company_id)
  .order('created_at', { ascending: false });
```

### ✅ Indication visuelle sur le bouton "Continuer"
```tsx
<Link 
  href={`/tenders/${tender.id}/respond`}
  title="Reprenez votre travail là où vous vous êtes arrêté"
>
  <SparklesIcon />
  Continuer la réponse
  <span>• Auto-sauvegardé</span>
</Link>
```

---

## 🔒 Row Level Security (RLS)

**Important** : Ajouter des politiques RLS pour garantir l'isolation :

```sql
-- Policy pour tenders : utilisateur voit uniquement les AO de son entreprise
CREATE POLICY "Users can view their company's tenders"
ON tenders FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  )
);

-- Policy pour tender_responses : utilisateur voit uniquement ses propres brouillons
CREATE POLICY "Users can view their own drafts"
ON tender_responses FOR SELECT
USING (user_id = auth.uid());
```

---

## 📌 Résumé

| Entité | Rôle | Accès aux AO | Dashboard |
|--------|------|-------------|-----------|
| **JARVIS SAS** | Admin plateforme | Aucun (métriques globales uniquement) | `/dashboard-admin` |
| **Entreprise Cliente** | Utilisateur final | Uniquement ses propres AO (filtrés par `company_id`) | `/dashboard` |

**Isolation stricte** : Chaque entreprise voit uniquement ses propres données grâce au filtre `company_id` et aux politiques RLS.
