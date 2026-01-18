# 🎯 Guide Express - Création Produits Stripe (5 minutes)

## Étape 1 : Aller sur le Dashboard

👉 **Ouvrez ce lien dans votre navigateur :**
https://dashboard.stripe.com/test/products

⚠️ **Assurez-vous d'être en mode TEST** (toggle en haut à droite)

---

## Étape 2 : Créer le produit "Pro"

### Cliquez sur le bouton bleu "Create product" en haut à droite

**Remplissez le formulaire :**

```
Name: WeWinBid Pro
Description: Pour les TPE/PME actives
```

**Section Pricing :**
- ☑️ Cochez "Recurring"
- Prix 1 :
  * Amount: 49.00
  * Currency: EUR
  * Billing period: Monthly
  
- Cliquez sur "+ Add another price"
- Prix 2 :
  * Amount: 490.00
  * Currency: EUR  
  * Billing period: Yearly

**Cliquez sur "Save product"**

### 📝 Copiez les Price IDs du produit Pro

1. Dans la liste des produits, cliquez sur "WeWinBid Pro"
2. Dans la section "Pricing", vous verrez 2 prix
3. Pour chaque prix, cliquez dessus et copiez l'ID (commence par `price_`)

```
Prix mensuel (49€) : price_________________
Prix annuel (490€) : price_________________
```

---

## Étape 3 : Créer le produit "Business"

### Cliquez à nouveau sur "Create product"

**Remplissez le formulaire :**

```
Name: WeWinBid Business
Description: Pour les équipes commerciales
```

**Section Pricing :**
- ☑️ Cochez "Recurring"
- Prix 1 :
  * Amount: 149.00
  * Currency: EUR
  * Billing period: Monthly
  
- Cliquez sur "+ Add another price"
- Prix 2 :
  * Amount: 1490.00
  * Currency: EUR
  * Billing period: Yearly

**Cliquez sur "Save product"**

### 📝 Copiez les Price IDs du produit Business

```
Prix mensuel (149€) : price_________________
Prix annuel (1490€) : price_________________
```

---

## Étape 4 : Mettre à jour .env.local

**Ouvrez le fichier :** `/Users/yacinetirichine/Downloads/wewinbid /.env.local`

**Remplacez les lignes 28-31 par vos vrais Price IDs :**

```env
STRIPE_PRICE_PRO_MONTHLY=price_________________
STRIPE_PRICE_PRO_YEARLY=price_________________
STRIPE_PRICE_BUSINESS_MONTHLY=price_________________
STRIPE_PRICE_BUSINESS_YEARLY=price_________________
```

---

## Étape 5 : Redémarrer le serveur

```bash
pkill -f "next dev"
npm run dev
```

---

## ✅ Test rapide

1. Allez sur http://localhost:3000
2. Cliquez sur "Essayer gratuitement" (plan Pro)
3. Créez un compte ou connectez-vous
4. Vous devriez être redirigé vers Stripe Checkout

**Carte de test :**
- Numéro : `4242 4242 4242 4242`
- Date : n'importe quelle date future
- CVC : `123`

---

## 🆘 Besoin d'aide ?

Si vous avez un problème :
1. Vérifiez que vous êtes en mode TEST
2. Les IDs doivent commencer par `price_` (PAS `prod_`)
3. Vérifiez que vous avez redémarré le serveur

**Ensuite, envoyez-moi les 4 Price IDs et je les configure pour vous !**
