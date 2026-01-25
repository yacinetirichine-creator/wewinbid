/**
 * Lighthouse CI Configuration
 * Docs: https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
 */
module.exports = {
  ci: {
    collect: {
      // URL à tester (modifier selon l'environnement)
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/auth/login',
        'http://localhost:3000/pricing',
        'http://localhost:3000/contact',
      ],
      // Nombre de runs par URL (pour moyenner les résultats)
      numberOfRuns: 3,
      // Configuration du serveur de développement
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 30000,
      // Configuration de Chrome
      settings: {
        preset: 'desktop',
        // Throttling pour simuler une connexion 4G
        throttlingMethod: 'simulate',
      },
    },
    assert: {
      // Assertions pour les métriques clés
      assertions: {
        // Performance
        'categories:performance': ['warn', { minScore: 0.7 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'interactive': ['warn', { maxNumericValue: 3500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],

        // Accessibilité
        'categories:accessibility': ['error', { minScore: 0.9 }],

        // Bonnes pratiques
        'categories:best-practices': ['warn', { minScore: 0.9 }],

        // SEO
        'categories:seo': ['warn', { minScore: 0.9 }],

        // PWA
        'categories:pwa': ['warn', { minScore: 0.5 }],

        // Audits spécifiques
        'color-contrast': 'off', // Géré par a11y
        'image-alt': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'meta-description': 'warn',
        'viewport': 'error',
      },
    },
    upload: {
      // Configuration pour sauvegarder les résultats
      target: 'temporary-public-storage',
      // Ou utiliser un serveur LHCI
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.example.com',
    },
  },
};
