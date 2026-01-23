# 🔐 Guide de Configuration et Vérification du Compte Admin

## 📋 Vue d'ensemble

Ce guide vous permet de configurer et vérifier votre compte administrateur WeWinBid, ainsi que de s'assurer que toutes les métriques sont correctement chargées.

---

## 🚀 ÉTAPE 1 : Créer le Compte Admin

### A. Exécuter le Script SQL

1. **Accédez à Supabase Dashboard**
   - Allez sur : https://supabase.com/dashboard
   - Sélectionnez votre projet WeWinBid

2. **Ouvrez le SQL Editor**
   - Dans le menu latéral, cliquez sur **SQL Editor**
   - Cliquez sur **New Query**

3. **Copiez et Exécutez le Script**
   ```bash
   # Ouvrez le fichier dans votre éditeur
   cat supabase/create-admin-account.sql
   ```
   
   - Copiez **TOUT** le contenu du fichier
   - Collez-le dans le SQL Editor
   - Cliquez sur **Run** (Ctrl+Enter)

4. **Vérifiez l'Exécution**
   
   Vous devriez voir ces messages :
   ```
   NOTICE: Utilisateur créé avec succès
   NOTICE: Compte administrateur créé avec succès!
   NOTICE: Email: contact@wewinbid.com
   NOTICE: Mot de passe: WeWinBid2026@Admin!Secure
   ```

---

## ✅ ÉTAPE 2 : Vérifier le Compte

### A. Vérification dans Supabase

Exécutez ces requêtes SQL pour vérifier :

```sql
-- 1. Vérifier que l'utilisateur existe dans auth.users
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'contact@wewinbid.com';
```

**Résultat attendu** : 1 ligne avec l'email et un UUID

```sql
-- 2. Vérifier le profil avec le rôle admin
SELECT id, email, full_name, subscription_plan, created_at
FROM profiles
WHERE email = 'contact@wewinbid.com';
```

**Résultat attendu** : 1 ligne avec `subscription_plan = 'business'`

```sql
-- 3. Vérifier l'entreprise JARVIS SAS
SELECT id, name, subscription_plan, monthly_tenders_limit, storage_limit
FROM companies
WHERE name = 'JARVIS SAS';
```

**Résultat attendu** : 1 ligne avec les limites illimitées (999999, 1TB)

```sql
-- 4. Vérifier le lien utilisateur-entreprise
SELECT cm.id, cm.role, c.name as company_name, p.email
FROM company_members cm
JOIN companies c ON c.id = cm.company_id
JOIN profiles p ON p.id = cm.user_id
WHERE p.email = 'contact@wewinbid.com';
```

**Résultat attendu** : 1 ligne avec `role = 'owner'`

### B. Vérification via Connexion

1. **Ouvrez votre application**
   ```bash
   npm run dev
   ```

2. **Connectez-vous**
   - Allez sur : http://localhost:3000/auth/login
   - Email : `contact@wewinbid.com`
   - Mot de passe : `WeWinBid2026@Admin!Secure`

3. **Vérifiez l'accès Admin**
   - Après connexion, allez sur : http://localhost:3000/dashboard-admin
   - Vous devriez voir le dashboard administrateur

---

## 📊 ÉTAPE 3 : Vérifier les Métriques Réelles

### A. API Métriques Admin

Testez l'endpoint API :

```bash
# Depuis votre terminal (après connexion)
curl http://localhost:3000/api/metrics/admin \
  -H "Cookie: sb-access-token=VOTRE_TOKEN" \
  | jq
```

**Ou** directement dans votre navigateur après connexion :
```
http://localhost:3000/api/metrics/admin
```

### B. Données Attendues

Le dashboard admin affiche :

#### 📈 Statistiques Principales
- ✅ **Entreprises clientes** : Nombre total d'entreprises
- ✅ **Appels d'offres traités** : Total des AO dans la base
- ✅ **Chiffre d'affaires généré** : Somme des AO gagnés (status='WON')
- ✅ **Taux de conversion** : (AO gagnés / AO soumis) × 100

#### 💰 Métriques Financières
- **MRR** (Monthly Recurring Revenue) : 
  - Pro : 49€ × nombre de plans Pro
  - Business : 149€ × nombre de plans Business
- **ARR** (Annual Recurring Revenue) : MRR × 12

#### 📊 Répartition
- **Par plan** : Free / Pro / Business
- **Top 5 secteurs** : Secteurs les plus représentés
- **Top 5 pays** : Pays avec le plus d'AO
- **Évolution mensuelle** : 6 derniers mois
- **Top 10 entreprises** : Classées par nombre d'AO

---

## 🔍 ÉTAPE 4 : Résolution des Problèmes

### Problème : "Accès refusé - Droits administrateur requis"

**Cause** : Le champ `role` dans `profiles` n'est pas défini à `'admin'`

**Solution** :
```sql
-- Vérifier le rôle actuel
SELECT email, role FROM profiles WHERE email = 'contact@wewinbid.com';

-- Si NULL ou 'user', corriger :
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'contact@wewinbid.com';
```

### Problème : Métriques vides (toutes à 0)

**Cause** : Pas de données dans la base (normal pour un nouveau projet)

**Solution** : Créez des données de test

```sql
-- Insérer une entreprise de test
INSERT INTO companies (name, subscription_plan, subscription_status)
VALUES ('Test Company', 'pro', 'active')
RETURNING id;

-- Insérer un appel d'offre de test
INSERT INTO tenders (
  company_id, 
  title, 
  status, 
  estimated_value,
  sector,
  country
) VALUES (
  'UUID_DE_LA_COMPANY_CREEE_CI_DESSUS',
  'AO Test Sécurité',
  'WON',
  50000,
  'SECURITY_PRIVATE',
  'FR'
);
```

### Problème : Mot de passe refusé

**Cause** : Le mot de passe n'a pas été correctement hashé

**Solution** :
```sql
-- Réinitialiser le mot de passe
UPDATE auth.users
SET encrypted_password = crypt('WeWinBid2026@Admin!Secure', gen_salt('bf'))
WHERE email = 'contact@wewinbid.com';
```

### Problème : Erreur 401 "Unauthorized"

**Cause** : Session expirée ou cookies non définis

**Solution** :
1. Déconnectez-vous
2. Videz les cookies (DevTools > Application > Cookies)
3. Reconnectez-vous

---

## 🛡️ ÉTAPE 5 : Sécurité (IMPORTANT)

### A. Changer le Mot de Passe

**IMMÉDIATEMENT après la première connexion** :

1. Allez sur : http://localhost:3000/settings
2. Cliquez sur "Sécurité"
3. Changez le mot de passe par défaut

### B. Mettre à Jour le SIRET/SIREN

Le script crée JARVIS SAS avec des données fictives :

```sql
UPDATE companies
SET 
  siret = 'VOTRE_VRAI_SIRET',
  siren = 'VOTRE_VRAI_SIREN',
  legal_name = 'JARVIS Société par Actions Simplifiée',
  address = 'Votre vraie adresse',
  city = 'Votre ville',
  postal_code = 'Votre code postal'
WHERE name = 'JARVIS SAS';
```

---

## 📝 Checklist Finale

Avant de passer en production, vérifiez :

- [ ] Le compte admin est créé et accessible
- [ ] L'email est confirmé (`email_confirmed_at` n'est pas NULL)
- [ ] Le rôle est bien `'admin'` dans la table `profiles`
- [ ] L'entreprise JARVIS SAS est créée avec un plan Business
- [ ] Le lien company_members existe avec role='owner'
- [ ] Le dashboard admin est accessible via `/dashboard-admin`
- [ ] Les métriques se chargent correctement via l'API
- [ ] Le mot de passe a été changé
- [ ] Les informations SIRET/SIREN sont réelles

---

## 💡 Commandes Rapides

### Vérification Express

```sql
-- Tout-en-un : vérifier compte admin complet
SELECT 
  p.email,
  p.full_name,
  p.subscription_plan as user_plan,
  c.name as company_name,
  c.subscription_plan as company_plan,
  cm.role as company_role,
  au.email_confirmed_at
FROM profiles p
LEFT JOIN company_members cm ON cm.user_id = p.id
LEFT JOIN companies c ON c.id = cm.company_id
LEFT JOIN auth.users au ON au.id = p.id
WHERE p.email = 'contact@wewinbid.com';
```

**Résultat attendu** :
| email | full_name | user_plan | company_name | company_plan | company_role | email_confirmed_at |
|-------|-----------|-----------|--------------|--------------|--------------|-------------------|
| contact@wewinbid.com | WeWinBid Administrator | business | JARVIS SAS | BUSINESS | owner | 2026-01-23... |

---

## 🎯 Prochaines Étapes

Une fois le compte admin configuré :

1. **Inviter d'autres admins** (si nécessaire)
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'autre-admin@example.com';
   ```

2. **Configurer Stripe** pour la facturation réelle
   - Voir : `STRIPE_QUICK_START.md`

3. **Activer les sources externes** (BOAMP, TED, etc.)
   - Dashboard : `/dashboard-admin/external-sources`

4. **Monitorer les performances**
   - Dashboard : `/dashboard-admin`
   - Métriques en temps réel

---

## 🆘 Support

En cas de problème :

1. Vérifiez les logs Supabase (Database > Logs)
2. Vérifiez les logs Next.js (`npm run dev`)
3. Consultez la documentation : `DASHBOARDS_GUIDE.md`
4. Ouvrez une issue GitHub

---

**Dernière mise à jour** : 23 janvier 2026
