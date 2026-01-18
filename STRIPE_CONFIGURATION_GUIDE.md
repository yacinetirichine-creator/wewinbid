# Guide de Configuration Stripe pour WeWinBid

## 📋 Étape 1 : Créer les Produits dans Stripe Dashboard

### 1.1 Connexion à Stripe
1. Allez sur https://dashboard.stripe.com/test/products
2. Assurez-vous d'être en **mode Test** (toggle en haut à droite)

### 1.2 Créer le Produit "Pro"

**Cliquez sur "Create product"**

```
Name: WeWinBid Pro
Description: Pour les TPE/PME actives
Statement descriptor: WEWINBID PRO (apparaîtra sur relevé bancaire)
```

**Pricing:**
- ✅ Cochez "Recurring" (abonnement récurrent)
- Prix 1 (Mensuel):
  - Amount: 49.00 EUR
  - Billing period: Monthly
  - Name: "Pro Monthly"
  
- Cliquez sur "Add another price"
- Prix 2 (Annuel):
  - Amount: 490.00 EUR
  - Billing period: Yearly
  - Name: "Pro Yearly"

**Cliquez sur "Save product"**

### 1.3 Créer le Produit "Business"

**Cliquez sur "Create product"**

```
Name: WeWinBid Business
Description: Pour les équipes commerciales
Statement descriptor: WEWINBID BIZ
```

**Pricing:**
- ✅ Cochez "Recurring"
- Prix 1 (Mensuel):
  - Amount: 149.00 EUR
  - Billing period: Monthly
  - Name: "Business Monthly"
  
- Prix 2 (Annuel):
  - Amount: 1490.00 EUR
  - Billing period: Yearly
  - Name: "Business Yearly"

**Cliquez sur "Save product"**

---

## 📋 Étape 2 : Copier les Price IDs

### 2.1 Récupérer les IDs

Pour chaque produit créé :
1. Cliquez sur le produit (Pro ou Business)
2. Dans la section "Pricing", vous verrez les prix
3. Cliquez sur chaque prix pour voir son ID (format: `price_xxxxxxxxxxxxx`)

### 2.2 Mettre à jour .env.local

Ouvrez `/Users/yacinetirichine/Downloads/wewinbid /.env.local` et remplissez :

```env
# Produit Pro
STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxxx    # ID du prix Pro mensuel
STRIPE_PRICE_PRO_YEARLY=price_xxxxxxxxxxxxx     # ID du prix Pro annuel

# Produit Business
STRIPE_PRICE_BUSINESS_MONTHLY=price_xxxxxxxxxxxxx  # ID du prix Business mensuel
STRIPE_PRICE_BUSINESS_YEARLY=price_xxxxxxxxxxxxx   # ID du prix Business annuel
```

**⚠️ Important :** Les IDs commencent par `price_` et PAS par `prod_`

---

## 📋 Étape 3 : Configurer le Webhook (pour les tests locaux)

### 3.1 Installer Stripe CLI (si pas déjà fait)

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Vérifier l'installation
stripe --version
```

### 3.2 Se connecter

```bash
stripe login
```

### 3.3 Lancer le webhook listener

```bash
cd /Users/yacinetirichine/Downloads/wewinbid 
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Copiez le webhook secret** qui s'affiche (commence par `whsec_`)

### 3.4 Mettre à jour .env.local

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## 📋 Étape 4 : Redémarrer le serveur

```bash
# Arrêter le serveur actuel
pkill -f "next dev"

# Relancer
npm run dev
```

---

## ✅ Vérification

### Test rapide :
1. Allez sur http://localhost:3000
2. Cliquez sur "Essayer gratuitement" (plan Pro)
3. Vous devriez être redirigé vers Stripe Checkout
4. Utilisez la carte de test : `4242 4242 4242 4242`
   - Date : n'importe quelle date future
   - CVC : n'importe quel 3 chiffres
   - Code postal : n'importe quel code

---

## 🎯 Récapitulatif des IDs à obtenir

- [ ] `price_xxx` pour Pro Monthly (49€/mois)
- [ ] `price_xxx` pour Pro Yearly (490€/an)
- [ ] `price_xxx` pour Business Monthly (149€/mois)
- [ ] `price_xxx` pour Business Yearly (1490€/an)
- [ ] `whsec_xxx` pour le webhook secret

---

## 🔧 En cas de problème

Si vous voyez une erreur "No such price", vérifiez :
1. Vous êtes bien en mode **Test** dans Stripe
2. Les IDs commencent par `price_` (pas `prod_`)
3. Vous avez redémarré le serveur après modification du .env.local

---

## 📞 Support

En cas de blocage, je peux vous aider à :
- Vérifier la configuration
- Tester la route de checkout
- Debugger les webhooks
