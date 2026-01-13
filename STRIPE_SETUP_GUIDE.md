# 🎯 Guide Complet Configuration Stripe - WeWinBid

**Date**: 13 janvier 2026  
**Status**: Configuration en cours

---

## 📋 Table des matières

1. [Configuration initiale](#1-configuration-initiale)
2. [Création des produits et prix](#2-création-des-produits-et-prix)
3. [Configuration du webhook](#3-configuration-du-webhook)
4. [Migration base de données](#4-migration-base-de-données)
5. [Tests en mode Test](#5-tests-en-mode-test)
6. [Passage en Production](#6-passage-en-production)

---

## 1. Configuration initiale

### A. Clés Stripe déjà configurées ✅

Le fichier `.env.local` a été créé automatiquement avec vos clés de test Stripe.

**Vérifier** : Ouvrir `.env.local` dans l'éditeur et confirmer la présence de :

```env
# Stripe TEST MODE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Sp6...
STRIPE_SECRET_KEY=sk_test_51Sp6...
```

Les variables suivantes sont à remplir après les étapes 2 et 3 :

```env
# À REMPLIR après création des produits (étape 2)
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_YEARLY=
STRIPE_PRICE_BUSINESS_MONTHLY=
STRIPE_PRICE_BUSINESS_YEARLY=

# À REMPLIR après configuration webhook (étape 3)
STRIPE_WEBHOOK_SECRET=
```

### B. Vérifier l'accès au Dashboard Stripe

1. Aller sur https://dashboard.stripe.com
2. Vérifier que le toggle **"Mode Test"** est activé (en haut à droite)
3. Vous devriez voir vos clés de test dans **Developers > API keys**

---

## 2. Création des produits et prix

### Étape par étape dans Stripe Dashboard

#### Produit 1 : WeWinBid Pro

1. **Aller dans** : Dashboard Stripe → **Catalogue de produits** → **Ajouter un produit**

2. **Informations du produit** :
   ```
   Nom : WeWinBid Pro
   Description : Plan Pro pour les entreprises en croissance
   ```

3. **Modèle de tarification** :
   - Type : **Récurrent**
   - Prix unitaire : **49 €**
   - Période de facturation : **Mensuelle**
   - Devise : **EUR (€)**

4. **Cliquer sur "Enregistrer le produit"**

5. **Copier l'ID du prix** :
   - Dans la page du produit, section "Prix"
   - Vous verrez quelque chose comme `price_1Sp6...`
   - **Copier cet ID** → `STRIPE_PRICE_PRO_MONTHLY` dans `.env.local`

6. **Ajouter le prix annuel** :
   - Sur la même page produit, cliquer **"Ajouter un autre prix"**
   - Prix unitaire : **490 €**
   - Période de facturation : **Annuelle**
   - Enregistrer
   - **Copier cet ID** → `STRIPE_PRICE_PRO_YEARLY` dans `.env.local`

#### Produit 2 : WeWinBid Business

7. **Répéter les étapes 1-6 avec** :
   ```
   Nom : WeWinBid Business
   Description : Plan Business pour les grandes entreprises
   Prix mensuel : 149 €
   Prix annuel : 1490 €
   ```

8. **Copier les IDs** :
   - Prix mensuel → `STRIPE_PRICE_BUSINESS_MONTHLY`
   - Prix annuel → `STRIPE_PRICE_BUSINESS_YEARLY`

### Résultat attendu dans `.env.local`

```env
STRIPE_PRICE_PRO_MONTHLY=price_1Sp6XXXAfoo6C2op2XXXXXXXXX
STRIPE_PRICE_PRO_YEARLY=price_1Sp6YYYAfoo6C2op2YYYYYYYYY
STRIPE_PRICE_BUSINESS_MONTHLY=price_1Sp6ZZZAfoo6C2op2ZZZZZZZZZ
STRIPE_PRICE_BUSINESS_YEARLY=price_1Sp6AAAAfoo6C2op2AAAAAAAAA
```

---

## 3. Configuration du webhook

### A. Créer le webhook dans Stripe Dashboard

1. **Aller dans** : Dashboard Stripe → **Developers** → **Webhooks**

2. **Cliquer sur "Ajouter un point de terminaison"**

3. **URL du point de terminaison** :
   ```
   https://votre-domaine.vercel.app/api/stripe/webhook
   ```
   
   **⚠️ Pour tester en local**, utilisez Stripe CLI (voir section 5B)

4. **Sélectionner les événements à écouter** :
   - Cliquer sur **"Sélectionner les événements"**
   - Cocher :
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.paid`
     - ✅ `invoice.payment_failed`

5. **Cliquer sur "Ajouter un point de terminaison"**

6. **Copier le "Secret de signature"** :
   - Visible sur la page du webhook créé
   - Format : `whsec_...`
   - **Ajouter dans `.env.local`** :
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXX
   ```

---

## 4. Migration base de données

### Exécuter dans Supabase SQL Editor

1. **Ouvrir Supabase** : https://supabase.com/dashboard
2. **Sélectionner votre projet** : `igsankhoyzftyusliefp`
3. **Aller dans** : SQL Editor → **New Query**
4. **Copier-coller le contenu de** : `/supabase/migration-stripe.sql`
5. **Cliquer sur "Run"**

### Vérifier les modifications

```sql
-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE 'subscription%';

-- Devrait retourner :
-- subscription_plan | text
-- subscription_status | text
-- subscription_interval | text
-- subscription_current_period_end | timestamp with time zone
-- stripe_customer_id | text
```

---

## 5. Tests en mode Test

### A. Test rapide avec cartes de test Stripe

#### Cartes de test disponibles

| Numéro de carte | Résultat |
|----------------|----------|
| `4242 4242 4242 4242` | ✅ Paiement réussi |
| `4000 0000 0000 0002` | ❌ Carte refusée |
| `4000 0000 0000 9995` | 🔐 Authentification 3D Secure requise |

**Informations supplémentaires** (pour toutes les cartes) :
- Date d'expiration : N'importe quelle date future (ex: `12/26`)
- CVC : N'importe quel 3 chiffres (ex: `123`)
- Code postal : N'importe quel (ex: `75001`)

### B. Test du webhook en local avec Stripe CLI

#### Installation Stripe CLI

```bash
# macOS
brew install stripe/stripe-brew/stripe

# Vérifier l'installation
stripe --version
```

#### Connexion

```bash
# Se connecter à votre compte Stripe
stripe login
```

#### Redirection des webhooks vers localhost

```bash
# Terminal 1 : Démarrer le serveur Next.js
npm run dev

# Terminal 2 : Rediriger les webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Vous verrez un webhook secret temporaire
# > Ready! Your webhook signing secret is whsec_xxx
# COPIER ce secret dans .env.local pour les tests locaux
```

#### Test manuel d'un événement

```bash
# Simuler un checkout complété
stripe trigger checkout.session.completed

# Vérifier les logs dans le terminal
# Vérifier la base de données Supabase
```

### C. Test du flux complet

1. **Démarrer le serveur** :
   ```bash
   npm run dev
   ```

2. **Ouvrir** : http://localhost:3000/pricing

3. **Cliquer sur "Souscrire"** (plan Pro ou Business)

4. **Vous serez redirigé vers Stripe Checkout**

5. **Utiliser la carte de test** : `4242 4242 4242 4242`

6. **Compléter le paiement**

7. **Vérifier** :
   - Redirection vers `/dashboard?checkout=success`
   - Dans Supabase, vérifier que `profiles.subscription_plan` = `'pro'`
   - Dans Stripe Dashboard → Paiements, voir la transaction

---

## 6. Passage en Production

### A. Activer le compte Stripe en production

1. **Compléter les informations de votre entreprise** :
   - Dashboard Stripe → **Paramètres** → **Informations sur l'entreprise**
   - Remplir :
     - Nom légal : **JARVIS SAS**
     - SIRET : **93884854600010**
     - Adresse : **64 Avenue Marinville, 94100 Saint-Maur-des-Fossés**
     - Représentant légal
     - Coordonnées bancaires (IBAN pour recevoir les paiements)

2. **Vérification d'identité** :
   - Stripe demandera peut-être :
     - Pièce d'identité du représentant
     - Kbis de moins de 3 mois
     - Justificatif bancaire

3. **Activer le mode Production** :
   - Une fois validé, basculer le toggle **"Mode Test"** → **"Mode Production"**

### B. Créer les produits en Production

**⚠️ Répéter l'étape 2** (Création des produits) mais en **mode Production** :

1. Basculer en mode Production
2. Créer **WeWinBid Pro** (49€/mois, 490€/an)
3. Créer **WeWinBid Business** (149€/mois, 1490€/an)
4. Noter les nouveaux Price IDs (différents de ceux en test)

### C. Créer le webhook en Production

**⚠️ Répéter l'étape 3** mais avec :

- URL : `https://wewinbid.vercel.app/api/stripe/webhook` (votre domaine de production)
- Copier le nouveau webhook secret

### D. Variables d'environnement Production (Vercel)

1. **Aller sur Vercel Dashboard** → Votre projet WeWinBid → **Settings** → **Environment Variables**

2. **Ajouter les variables de PRODUCTION** :

```env
# Stripe PRODUCTION (clés différentes du mode test)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXXXXXXX
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXX

# Price IDs PRODUCTION (différents du mode test)
STRIPE_PRICE_PRO_MONTHLY=price_XXXXXXXXXXXXXXXXXXXXX
STRIPE_PRICE_PRO_YEARLY=price_XXXXXXXXXXXXXXXXXXXXX
STRIPE_PRICE_BUSINESS_MONTHLY=price_XXXXXXXXXXXXXXXXXXXXX
STRIPE_PRICE_BUSINESS_YEARLY=price_XXXXXXXXXXXXXXXXXXXXX
```

3. **Cliquer sur "Save"**

4. **Redéployer l'application** :
   ```bash
   git commit --allow-empty -m "Trigger production deploy"
   git push origin main
   ```

### E. Tests en Production

1. **Créer un compte de test** sur votre site production

2. **Effectuer un vrai paiement** (sera remboursé) :
   - Aller sur `/pricing`
   - Choisir un plan
   - Utiliser une **vraie carte bancaire**
   - Compléter le paiement

3. **Vérifier** :
   - Email de confirmation de Stripe
   - Abonnement visible dans Dashboard Stripe → Abonnements
   - Base de données mise à jour
   - Accès aux fonctionnalités Pro/Business

4. **Annuler et rembourser** :
   - Dashboard Stripe → Abonnements → Sélectionner → Annuler
   - Dashboard Stripe → Paiements → Sélectionner → Rembourser

---

## 📊 Checklist complète

### Mode Test (À faire maintenant)

- [x] 1. Ajouter les clés de test dans `.env.local` (fait automatiquement)
- [ ] 2. Créer produit "WeWinBid Pro" (49€/mois, 490€/an)
- [ ] 3. Créer produit "WeWinBid Business" (149€/mois, 1490€/an)
- [ ] 4. Copier les 4 Price IDs dans `.env.local`
- [ ] 5. Créer webhook de test (ou utiliser Stripe CLI pour local)
- [ ] 6. Copier webhook secret dans `.env.local`
- [ ] 7. Exécuter migration SQL dans Supabase
- [ ] 8. Tester paiement avec carte `4242 4242 4242 4242`
- [ ] 9. Vérifier webhook reçu (logs terminal)
- [ ] 10. Vérifier BDD mise à jour (Supabase)

### Mode Production (À faire après validation test)

- [ ] 11. Compléter informations entreprise Stripe
- [ ] 12. Vérification identité/documents
- [ ] 13. Activer mode Production
- [ ] 14. Créer produits en Production
- [ ] 15. Créer webhook Production
- [ ] 16. Ajouter variables env dans Vercel
- [ ] 17. Redéployer sur Vercel
- [ ] 18. Test paiement réel en Production
- [ ] 19. Vérifier email + dashboard + BDD
- [ ] 20. Annuler et rembourser le test

---

## 🔧 Configuration actuelle

### Grille tarifaire WeWinBid

| Plan | Mensuel | Annuel | Économie |
|------|---------|--------|----------|
| **Free** | 0 € | 0 € | - |
| **Pro** | 49 € | 490 € | 98 € (-17%) |
| **Business** | 149 € | 1 490 € | 298 € (-17%) |

---

## 🆘 Résolution de problèmes

### Erreur : "No such price"
- **Cause** : Price ID incorrect dans `.env.local`
- **Solution** : Vérifier les IDs dans Dashboard Stripe → Produits

### Webhook non reçu
- **Cause** : URL incorrecte ou événements non sélectionnés
- **Solution** : Vérifier la configuration du webhook

### Erreur : "Invalid signature"
- **Cause** : Webhook secret incorrect
- **Solution** : Copier le bon secret depuis le webhook créé

### Paiement test échoue
- **Cause** : Mauvaise carte de test
- **Solution** : Utiliser exactement `4242 4242 4242 4242`

### Base de données non mise à jour
- **Cause** : Migration non exécutée ou webhook non configuré
- **Solution** : Exécuter `/supabase/migration-stripe.sql` et vérifier webhook

---

## 📞 Support

- **Documentation Stripe** : https://docs.stripe.com
- **Dashboard Stripe** : https://dashboard.stripe.com
- **Stripe CLI Docs** : https://stripe.com/docs/cli
- **Support Stripe** : support@stripe.com

---

## ✅ Prochaines étapes

1. **Maintenant** : Compléter la checklist "Mode Test"
2. **Cette semaine** : Valider tous les flux de paiement
3. **Avant production** : Compléter dossier entreprise Stripe
4. **Lancement** : Activer mode Production et déployer

---

**Dernière mise à jour** : 13 janvier 2026  
**Status** : ⏳ En attente de création des produits Stripe
