#!/bin/bash

# Script de création des produits Stripe pour WeWinBid
# Nécessite Stripe CLI installé: brew install stripe/stripe-cli/stripe

set -e

echo "🚀 Configuration des produits Stripe pour WeWinBid"
echo "================================================="
echo ""

# Vérifier si Stripe CLI est installé
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI n'est pas installé"
    echo "📦 Installation: brew install stripe/stripe-cli/stripe"
    exit 1
fi

echo "✅ Stripe CLI détecté"
echo ""

# Se connecter à Stripe
echo "🔐 Connexion à Stripe..."
stripe login

echo ""
echo "📦 Création du produit WeWinBid Pro..."
echo "--------------------------------------"

# Créer le produit Pro
PRO_PRODUCT=$(stripe products create \
  --name="WeWinBid Pro" \
  --description="Pour les TPE/PME actives - 20 réponses AO/mois, 5 collaborateurs, 5GB stockage, Score IA" \
  --statement-descriptor="WEWINBID PRO" \
  -o json)

PRO_PRODUCT_ID=$(echo $PRO_PRODUCT | grep -o '"id": "[^"]*"' | head -1 | sed 's/"id": "\(.*\)"/\1/')
echo "✅ Produit Pro créé: $PRO_PRODUCT_ID"

# Créer le prix mensuel Pro
echo "💶 Création du prix mensuel Pro (49€)..."
PRO_MONTHLY=$(stripe prices create \
  --product="$PRO_PRODUCT_ID" \
  --unit-amount=4900 \
  --currency=eur \
  --recurring[interval]=month \
  --nickname="Pro Monthly" \
  -o json)

PRO_MONTHLY_ID=$(echo $PRO_MONTHLY | grep -o '"id": "[^"]*"' | head -1 | sed 's/"id": "\(.*\)"/\1/')
echo "✅ Prix mensuel Pro: $PRO_MONTHLY_ID"

# Créer le prix annuel Pro
echo "💶 Création du prix annuel Pro (490€)..."
PRO_YEARLY=$(stripe prices create \
  --product="$PRO_PRODUCT_ID" \
  --unit-amount=49000 \
  --currency=eur \
  --recurring[interval]=year \
  --nickname="Pro Yearly" \
  -o json)

PRO_YEARLY_ID=$(echo $PRO_YEARLY | grep -o '"id": "[^"]*"' | head -1 | sed 's/"id": "\(.*\)"/\1/')
echo "✅ Prix annuel Pro: $PRO_YEARLY_ID"

echo ""
echo "📦 Création du produit WeWinBid Business..."
echo "-------------------------------------------"

# Créer le produit Business
BUSINESS_PRODUCT=$(stripe products create \
  --name="WeWinBid Business" \
  --description="Pour les équipes commerciales - Réponses illimitées, 20 collaborateurs, 50GB, Tout Pro + Co-édition + API" \
  --statement-descriptor="WEWINBID BIZ" \
  -o json)

BUSINESS_PRODUCT_ID=$(echo $BUSINESS_PRODUCT | grep -o '"id": "[^"]*"' | head -1 | sed 's/"id": "\(.*\)"/\1/')
echo "✅ Produit Business créé: $BUSINESS_PRODUCT_ID"

# Créer le prix mensuel Business
echo "💶 Création du prix mensuel Business (149€)..."
BUSINESS_MONTHLY=$(stripe prices create \
  --product="$BUSINESS_PRODUCT_ID" \
  --unit-amount=14900 \
  --currency=eur \
  --recurring[interval]=month \
  --nickname="Business Monthly" \
  -o json)

BUSINESS_MONTHLY_ID=$(echo $BUSINESS_MONTHLY | grep -o '"id": "[^"]*"' | head -1 | sed 's/"id": "\(.*\)"/\1/')
echo "✅ Prix mensuel Business: $BUSINESS_MONTHLY_ID"

# Créer le prix annuel Business
echo "💶 Création du prix annuel Business (1490€)..."
BUSINESS_YEARLY=$(stripe prices create \
  --product="$BUSINESS_PRODUCT_ID" \
  --unit-amount=149000 \
  --currency=eur \
  --recurring[interval]=year \
  --nickname="Business Yearly" \
  -o json)

BUSINESS_YEARLY_ID=$(echo $BUSINESS_YEARLY | grep -o '"id": "[^"]*"' | head -1 | sed 's/"id": "\(.*\)"/\1/')
echo "✅ Prix annuel Business: $BUSINESS_YEARLY_ID"

echo ""
echo "✨ Tous les produits ont été créés avec succès!"
echo "================================================"
echo ""
echo "📋 Price IDs à copier dans .env.local:"
echo "--------------------------------------"
echo "STRIPE_PRICE_PRO_MONTHLY=$PRO_MONTHLY_ID"
echo "STRIPE_PRICE_PRO_YEARLY=$PRO_YEARLY_ID"
echo "STRIPE_PRICE_BUSINESS_MONTHLY=$BUSINESS_MONTHLY_ID"
echo "STRIPE_PRICE_BUSINESS_YEARLY=$BUSINESS_YEARLY_ID"
echo ""
echo "📝 Pour mettre à jour automatiquement .env.local, exécutez:"
echo "sed -i '' \"s/STRIPE_PRICE_PRO_MONTHLY=.*/STRIPE_PRICE_PRO_MONTHLY=$PRO_MONTHLY_ID/\" .env.local"
echo "sed -i '' \"s/STRIPE_PRICE_PRO_YEARLY=.*/STRIPE_PRICE_PRO_YEARLY=$PRO_YEARLY_ID/\" .env.local"
echo "sed -i '' \"s/STRIPE_PRICE_BUSINESS_MONTHLY=.*/STRIPE_PRICE_BUSINESS_MONTHLY=$BUSINESS_MONTHLY_ID/\" .env.local"
echo "sed -i '' \"s/STRIPE_PRICE_BUSINESS_YEARLY=.*/STRIPE_PRICE_BUSINESS_YEARLY=$BUSINESS_YEARLY_ID/\" .env.local"
echo ""
echo "🔄 N'oubliez pas de redémarrer le serveur après:"
echo "pkill -f \"next dev\" && npm run dev"
