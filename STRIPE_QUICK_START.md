# Configuration rapide - Stripe WeWinBid

## 🚀 Étapes à suivre MAINTENANT

### 1️⃣ Vos clés Stripe ont été ajoutées dans .env.local ✅

Le fichier `.env.local` a été créé automatiquement avec vos clés de test Stripe.

**Vérifier** : Ouvrir `.env.local` et confirmer que ces lignes sont présentes :
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Sp6...
STRIPE_SECRET_KEY=sk_test_51Sp6...
```

### 2️⃣ Créer les produits dans Stripe Dashboard (10 min)

👉 https://dashboard.stripe.com/test/products

#### Produit 1 : WeWinBid Pro
- Nom : `WeWinBid Pro`
- Prix mensuel : `49 EUR`
- Prix annuel : `490 EUR`
- Copier les 2 Price IDs

#### Produit 2 : WeWinBid Business
- Nom : `WeWinBid Business`
- Prix mensuel : `149 EUR`
- Prix annuel : `1490 EUR`
- Copier les 2 Price IDs

**Ajouter dans .env.local** :
```env
STRIPE_PRICE_PRO_MONTHLY=price_XXX (copier depuis Stripe)
STRIPE_PRICE_PRO_YEARLY=price_XXX (copier depuis Stripe)
STRIPE_PRICE_BUSINESS_MONTHLY=price_XXX (copier depuis Stripe)
STRIPE_PRICE_BUSINESS_YEARLY=price_XXX (copier depuis Stripe)
```

### 3️⃣ Configurer le webhook pour tests locaux (5 min)

```bash
# Installer Stripe CLI
brew install stripe/stripe-brew/stripe

# Se connecter
stripe login

# Terminal 1 : Démarrer Next.js
npm run dev

# Terminal 2 : Écouter les webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copier le webhook secret affiché (whsec_xxx)
```

**Ajouter dans .env.local** :
```env
STRIPE_WEBHOOK_SECRET=whsec_XXX (affiché par stripe listen)
```

### 4️⃣ Migration base de données (2 min)

1. Ouvrir : https://supabase.com/dashboard/project/igsankhoyzftyusliefp/sql
2. Copier le contenu de `/supabase/migration-stripe.sql`
3. Coller dans l'éditeur SQL
4. Cliquer "Run"

### 5️⃣ Test paiement (3 min)

1. Démarrer : `npm run dev`
2. Ouvrir : http://localhost:3000/pricing
3. Cliquer "Souscrire" sur plan Pro
4. Carte test : `4242 4242 4242 4242`
5. Date : `12/26`, CVC : `123`
6. Valider le paiement
7. Vérifier dans Supabase que `subscription_plan = 'pro'`

---

## ✅ Checklist rapide

- [x] Clés Stripe ajoutées dans `.env.local` (fait automatiquement)
- [ ] 2 produits créés (Pro + Business)
- [ ] 4 Price IDs copiés dans `.env.local`
- [ ] Stripe CLI installé et connecté
- [ ] Webhook local configuré (`stripe listen`)
- [ ] Migration SQL exécutée dans Supabase
- [ ] Test paiement réussi avec `4242 4242 4242 4242`

---

## 📞 Besoin d'aide ?

Voir le guide complet : **STRIPE_SETUP_GUIDE.md**
