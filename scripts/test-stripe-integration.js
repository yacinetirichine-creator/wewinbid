#!/usr/bin/env node

/**
 * Script de test manuel pour l'intégration Stripe
 * Teste les connexions API et la configuration des produits
 */

const Stripe = require('stripe');
const { config } = require('dotenv');
const path = require('path');

// Charger .env.local
config({ path: path.join(__dirname, '..', '.env.local') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(message, 'blue');
  log('='.repeat(60), 'blue');
}

async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    logSection('TEST 1: Configuration des variables d\'environnement');
    
    const requiredEnvVars = [
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_PRICE_PRO_MONTHLY',
      'STRIPE_PRICE_PRO_YEARLY',
      'STRIPE_PRICE_BUSINESS_MONTHLY',
      'STRIPE_PRICE_BUSINESS_YEARLY',
    ];

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        logSuccess(`${envVar} est défini`);
        testsPassed++;
      } else {
        logError(`${envVar} n'est pas défini`);
        testsFailed++;
      }
    }

    // Vérifier le format des Price IDs
    logSection('TEST 2: Validation du format des Price IDs');
    
    const priceIdRegex = /^price_[a-zA-Z0-9]+$/;
    const priceIds = {
      'Pro Monthly': process.env.STRIPE_PRICE_PRO_MONTHLY,
      'Pro Yearly': process.env.STRIPE_PRICE_PRO_YEARLY,
      'Business Monthly': process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
      'Business Yearly': process.env.STRIPE_PRICE_BUSINESS_YEARLY,
    };

    for (const [name, priceId] of Object.entries(priceIds)) {
      if (priceId && priceIdRegex.test(priceId)) {
        logSuccess(`${name}: ${priceId} (format valide)`);
        testsPassed++;
      } else {
        logError(`${name}: ${priceId} (format invalide)`);
        testsFailed++;
      }
    }

    // Initialiser le client Stripe
    logSection('TEST 3: Connexion à l\'API Stripe');
    
    if (!process.env.STRIPE_SECRET_KEY) {
      logError('STRIPE_SECRET_KEY manquant, impossible de continuer');
      process.exit(1);
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });

    logSuccess('Client Stripe initialisé');
    testsPassed++;

    // Tester la connexion API
    logSection('TEST 4: Récupération des produits depuis Stripe');
    
    try {
      const products = await stripe.products.list({ limit: 10 });
      logSuccess(`${products.data.length} produits trouvés`);
      testsPassed++;

      for (const product of products.data) {
        logInfo(`  - ${product.name} (${product.id})`);
      }
    } catch (error) {
      logError(`Erreur lors de la récupération des produits: ${error.message}`);
      testsFailed++;
    }

    // Vérifier les prix configurés
    logSection('TEST 5: Vérification des prix configurés');
    
    const expectedPrices = [
      { id: process.env.STRIPE_PRICE_PRO_MONTHLY, name: 'Pro Monthly', amount: 4900 },
      { id: process.env.STRIPE_PRICE_PRO_YEARLY, name: 'Pro Yearly', amount: 49000 },
      { id: process.env.STRIPE_PRICE_BUSINESS_MONTHLY, name: 'Business Monthly', amount: 14900 },
      { id: process.env.STRIPE_PRICE_BUSINESS_YEARLY, name: 'Business Yearly', amount: 149000 },
    ];

    for (const expectedPrice of expectedPrices) {
      try {
        const price = await stripe.prices.retrieve(expectedPrice.id);
        
        if (price.unit_amount === expectedPrice.amount) {
          logSuccess(`${expectedPrice.name}: ${price.unit_amount / 100}€ ✓`);
          testsPassed++;
        } else {
          logError(`${expectedPrice.name}: montant incorrect (attendu: ${expectedPrice.amount / 100}€, trouvé: ${price.unit_amount / 100}€)`);
          testsFailed++;
        }

        logInfo(`  Currency: ${price.currency.toUpperCase()}`);
        logInfo(`  Interval: ${price.recurring?.interval || 'N/A'}`);
        logInfo(`  Product: ${price.product}`);
      } catch (error) {
        logError(`${expectedPrice.name}: Erreur - ${error.message}`);
        testsFailed++;
      }
    }

    // Simuler la création d'une session de checkout
    logSection('TEST 6: Simulation création session Checkout');
    
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: process.env.STRIPE_PRICE_PRO_MONTHLY,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: 'http://localhost:3000/dashboard?success=true&plan=pro',
        cancel_url: 'http://localhost:3000/pricing?canceled=true',
        metadata: {
          plan: 'pro',
          interval: 'monthly',
          test: 'true',
        },
      });

      logSuccess(`Session créée: ${session.id}`);
      logInfo(`  URL de paiement: ${session.url}`);
      testsPassed++;
    } catch (error) {
      logError(`Erreur création session: ${error.message}`);
      testsFailed++;
    }

    // Résumé des tests
    logSection('RÉSUMÉ DES TESTS');
    
    const totalTests = testsPassed + testsFailed;
    const successRate = ((testsPassed / totalTests) * 100).toFixed(1);

    log(`\nTests réussis: ${testsPassed}/${totalTests} (${successRate}%)`, testsPassed === totalTests ? 'green' : 'yellow');
    
    if (testsFailed > 0) {
      log(`Tests échoués: ${testsFailed}`, 'red');
      process.exit(1);
    } else {
      log('\n🎉 Tous les tests sont passés avec succès!', 'green');
      log('\n✅ L\'intégration Stripe est correctement configurée', 'green');
      log('✅ Les produits et prix sont valides', 'green');
      log('✅ Les sessions de checkout peuvent être créées', 'green');
      
      logSection('PROCHAINES ÉTAPES');
      log('1. Testez le flux complet sur http://localhost:3000', 'cyan');
      log('2. Cliquez sur "Essayer gratuitement" pour un plan', 'cyan');
      log('3. Créez un compte ou connectez-vous', 'cyan');
      log('4. Utilisez la carte test: 4242 4242 4242 4242', 'cyan');
      log('5. Vérifiez que le paiement fonctionne et redirige vers le dashboard\n', 'cyan');
    }

  } catch (error) {
    logError(`Erreur fatale: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter les tests
logInfo('Démarrage des tests Stripe...\n');
runTests();
