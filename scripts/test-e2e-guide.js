#!/usr/bin/env node

/**
 * Script de test End-to-End pour le flux utilisateur complet
 * Simule: Inscription → Connexion → Click pricing → Stripe Checkout
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(message) {
  log(`\n${'='.repeat(70)}`, 'blue');
  log(message, 'blue');
  log('='.repeat(70), 'blue');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logStep(step, message) {
  log(`\n[ÉTAPE ${step}] ${message}`, 'magenta');
}

logSection('GUIDE DE TEST MANUEL - FLUX UTILISATEUR COMPLET');

logInfo('Ce guide vous accompagne pour tester le flux complet:');
logInfo('Inscription → Connexion → Dashboard → Paiement Stripe\n');

// Étape 1
logStep(1, 'Accédez à la page d\'accueil');
logSuccess('URL: http://localhost:3000');
log('   • Vérifiez que la page se charge correctement', 'cyan');
log('   • Vérifiez que la Hero 3D Card s\'affiche', 'cyan');
log('   • Vérifiez que le menu de navigation fonctionne', 'cyan');

// Étape 2
logStep(2, 'Testez le smooth scroll vers la section Pricing');
logSuccess('Action: Cliquez sur "Tarifs" dans le menu');
log('   • La page devrait scroller smoothly vers la section pricing', 'cyan');
log('   • Le toggle mensuel/annuel devrait être visible', 'cyan');

// Étape 3
logStep(3, 'Testez les plans de pricing');
logSuccess('Plans disponibles:');
log('   • Free: 0€ (bouton "Commencer")', 'cyan');
log('   • Pro: 49€/mois ou 490€/an (bouton "Essayer gratuitement")', 'cyan');
log('   • Business: 149€/mois ou 1490€/an (bouton "Nous contacter")', 'cyan');

logWarning('Cliquez sur le toggle mensuel/annuel pour vérifier que les prix changent');

// Étape 4
logStep(4, 'Cliquez sur "Essayer gratuitement" (Plan Pro)');
logSuccess('Vous devriez être redirigé vers: /auth/register?plan=pro');
log('   • Le formulaire d\'inscription devrait s\'afficher', 'cyan');
log('   • Le plan "pro" devrait être pré-sélectionné', 'cyan');

// Étape 5
logStep(5, 'Créez un nouveau compte');
logSuccess('Remplissez le formulaire:');
log('   • Email: test-' + Date.now() + '@example.com (unique)', 'cyan');
log('   • Mot de passe: Test123!@# (au moins 8 caractères)', 'cyan');
log('   • Nom complet: Test User', 'cyan');
log('   • Entreprise: Test Company', 'cyan');

logWarning('Ou connectez-vous avec le compte admin:');
log('   Email: contact@wewinbid.com', 'yellow');
log('   Mot de passe: WeWinBid2026@Admin!Secure', 'yellow');

// Étape 6
logStep(6, 'Après inscription/connexion réussie');
logSuccess('Vous devriez être redirigé vers le Dashboard');
log('   • URL: /dashboard', 'cyan');
log('   • Votre profil devrait s\'afficher', 'cyan');

// Étape 7
logStep(7, 'Testez le bouton "Upgrade" ou retournez au pricing');
logSuccess('Action: Retournez sur http://localhost:3000');
log('   • Scrollez vers la section Pricing', 'cyan');
log('   • Sélectionnez le toggle "Annuel" pour tester le prix annuel', 'cyan');
log('   • Cliquez sur "Essayer gratuitement" (Plan Pro)', 'cyan');

// Étape 8
logStep(8, 'Vérifiez la redirection vers Stripe Checkout');
logSuccess('Vous devriez être redirigé vers checkout.stripe.com');
log('   • L\'URL devrait commencer par: https://checkout.stripe.com/c/pay/', 'cyan');
log('   • Le montant affiché devrait être 490,00€ (si annuel) ou 49,00€ (si mensuel)', 'cyan');
log('   • Le nom du produit: "WeWinBid Pro"', 'cyan');
log('   • Mode: Abonnement (recurring)', 'cyan');

// Étape 9
logStep(9, 'Testez le paiement avec une carte de test');
logSuccess('Utilisez les informations suivantes:');
log('   • Numéro de carte: 4242 4242 4242 4242', 'green');
log('   • Date d\'expiration: 12/28 (n\'importe quelle date future)', 'green');
log('   • CVC: 123', 'green');
log('   • Code postal: 75001', 'green');

logWarning('Autres cartes de test disponibles:');
log('   • Paiement échoué: 4000 0000 0000 0002', 'yellow');
log('   • Nécessite authentification 3DS: 4000 0025 0000 3155', 'yellow');

// Étape 10
logStep(10, 'Vérifiez la redirection après paiement réussi');
logSuccess('Après validation du paiement:');
log('   • Vous devriez être redirigé vers: /dashboard?success=true&plan=pro', 'cyan');
log('   • Un message de succès devrait s\'afficher', 'cyan');
log('   • Votre abonnement devrait être actif', 'cyan');

// Étape 11
logStep(11, 'Vérifiez dans Supabase');
logSuccess('Vérifications dans la base de données:');
log('   • Connectez-vous à Supabase: https://supabase.com', 'cyan');
log('   • Allez dans Table Editor → profiles', 'cyan');
log('   • Trouvez votre utilisateur', 'cyan');
log('   • Vérifiez que:',  'cyan');
log('     - stripe_customer_id est rempli (commence par "cus_")', 'cyan');
log('     - subscription_plan = "pro"', 'cyan');
log('     - subscription_status = "active"', 'cyan');

// Étape 12
logStep(12, 'Vérifiez dans le Dashboard Stripe');
logSuccess('Allez sur: https://dashboard.stripe.com/test/customers');
log('   • Recherchez votre email', 'cyan');
log('   • Cliquez sur le client', 'cyan');
log('   • Vérifiez l\'abonnement actif', 'cyan');
log('   • Vérifiez le montant (49€ ou 490€)', 'cyan');
log('   • Vérifiez la période (monthly ou yearly)', 'cyan');

// Étape 13
logStep(13, 'Testez l\'annulation');
logSuccess('Action: Cliquez sur "Annuler" sur la page Stripe Checkout');
log('   • Vous devriez être redirigé vers: /pricing?canceled=true', 'cyan');
log('   • Un message devrait indiquer l\'annulation', 'cyan');

// Résumé
logSection('CHECKLIST DE VALIDATION');

const checklist = [
  '[ ] Page d\'accueil se charge correctement',
  '[ ] Hero 3D Card s\'affiche avec animation',
  '[ ] Smooth scroll vers Pricing fonctionne',
  '[ ] Toggle mensuel/annuel change les prix',
  '[ ] Bouton "Essayer gratuitement" redirige vers /auth/register?plan=pro',
  '[ ] Inscription créé un compte Supabase',
  '[ ] Connexion redirige vers /dashboard',
  '[ ] Click sur pricing redirige vers Stripe Checkout',
  '[ ] Checkout affiche le bon montant (49€ ou 490€)',
  '[ ] Checkout affiche le bon produit (WeWinBid Pro)',
  '[ ] Paiement avec 4242... fonctionne',
  '[ ] Redirection vers /dashboard?success=true fonctionne',
  '[ ] stripe_customer_id est enregistré dans Supabase',
  '[ ] subscription_plan = "pro" dans Supabase',
  '[ ] L\'abonnement apparaît dans Stripe Dashboard',
  '[ ] Annulation redirige vers /pricing?canceled=true',
];

checklist.forEach(item => log(item, 'cyan'));

logSection('COMMANDES UTILES');

log('# Voir les logs du serveur Next.js:', 'cyan');
log('npm run dev', 'green');

log('\n# Tester une requête API directement:', 'cyan');
log('curl -X POST http://localhost:3000/api/stripe/create-checkout-session \\', 'green');
log('  -H "Content-Type: application/json" \\', 'green');
log('  -d \'{"priceId":"price_1SrEnxQHJBKUvrZkSbddQGhz","plan":"pro","interval":"monthly"}\'', 'green');

log('\n# Voir les événements Stripe en temps réel:', 'cyan');
log('stripe listen --forward-to localhost:3000/api/stripe/webhook', 'green');

log('\n# Lister les clients Stripe:', 'cyan');
log('stripe customers list', 'green');

log('\n# Lister les abonnements:', 'cyan');
log('stripe subscriptions list', 'green');

logSection('PROBLÈMES COURANTS');

log('❌ "No such price" → Vérifiez que les Price IDs dans .env.local sont corrects', 'yellow');
log('❌ "Unauthorized" → Vérifiez que l\'utilisateur est connecté', 'yellow');
log('❌ Pas de redirection → Vérifiez les console.log dans le navigateur', 'yellow');
log('❌ Erreur Stripe → Vérifiez STRIPE_SECRET_KEY dans .env.local', 'yellow');
log('❌ Page blanche → Vérifiez les erreurs dans le terminal Next.js', 'yellow');

logSection('TESTS AUTOMATISÉS DISPONIBLES');

log('# Tests Stripe (configuration, Price IDs, API):', 'cyan');
log('node scripts/test-stripe-integration.js', 'green');

log('\n# Tests Jest (unitaires):', 'cyan');
log('npm run test', 'green');

log('\n# Tests avec coverage:', 'cyan');
log('npm run test:coverage', 'green');

logSection('DOCUMENTATION');

log('📄 Guide Stripe détaillé: STRIPE_SETUP_GUIDE.md', 'cyan');
log('📄 Guide rapide: STRIPE_QUICK_START.md', 'cyan');
log('📄 Implementation: STRIPE_IMPLEMENTATION.md', 'cyan');

log('\n🚀 Bon test!\n', 'green');
