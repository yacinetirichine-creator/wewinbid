const { withSentryConfig } = require('@sentry/nextjs');
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /^https:\/\/api\.openai\.com\/.*/i,
      handler: 'NetworkOnly', // Don't cache AI responses
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net', // DALL-E images
      },
    ],
  },

  // Variables d'environnement publiques
  env: {
    NEXT_PUBLIC_APP_NAME: 'WeWinBid',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Headers de sécurité enterprise-grade
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions policy (restrictif)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
          },
          // Content Security Policy (CSP) - Enterprise grade
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts - strictement contrôlés
              isDev 
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.vercel-insights.com https://vercel.live"
                : "script-src 'self' 'unsafe-inline' https://js.stripe.com https://cdn.vercel-insights.com",
              // Styles
              "style-src 'self' 'unsafe-inline'",
              // Images - sources autorisées uniquement
              "img-src 'self' data: blob: https://*.supabase.co https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://oaidalleapiprodscus.blob.core.windows.net",
              // Fonts
              "font-src 'self' data:",
              // Connexions - API autorisées
              "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.stripe.com https://vitals.vercel-insights.com wss://*.supabase.co https://*.sentry.io",
              // Frames - paiement uniquement
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              // Objets interdits
              "object-src 'none'",
              // Base URI restreint
              "base-uri 'self'",
              // Forms restreints
              "form-action 'self' https://checkout.stripe.com",
              // Frames ancestors - empêche l'embedding
              "frame-ancestors 'none'",
              // Workers
              "worker-src 'self' blob:",
              // Manifests
              "manifest-src 'self'",
              // Media
              "media-src 'self' blob:",
              // Mise à niveau automatique vers HTTPS
              "upgrade-insecure-requests",
              // Block mixed content
              "block-all-mixed-content",
            ].join('; '),
          },
          // HTTP Strict Transport Security (HSTS) - Max security
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // XSS Protection (legacy browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Empêcher le téléchargement automatique de fichiers
          {
            key: 'X-Download-Options',
            value: 'noopen',
          },
          // Contrôle du prefetch DNS
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off',
          },
          // Politique cross-domain restrictive
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
          // Cross-Origin policies
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
      // Headers spécifiques pour les API
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },

  // Redirections
  async redirects() {
    return [
      {
        source: '/app',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },

  // Webpack optimization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Add fallbacks for Node.js core modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'async_hooks': false,
        'fs': false,
        'net': false,
        'tls': false,
        'dns': false,
        'child_process': false,
        'http2': false,
      };

      // Code splitting optimization
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk for node_modules
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk for shared modules
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      };
    }
    return config;
  },
};

// Wrap with PWA
const configWithPWA = withPWA(nextConfig);

// Wrap with Sentry
module.exports = withSentryConfig(
  configWithPWA,
  {
    // Sentry configuration options
    silent: true, // Suppresses Sentry logs during build
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    // Upload source maps for better error tracking
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: '/monitoring',
    hideSourceMaps: true,
    disableLogger: true,
  }
);
