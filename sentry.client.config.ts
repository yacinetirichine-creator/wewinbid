/**
 * @fileoverview Sentry client-side configuration for error monitoring.
 * Captures client-side errors, performance metrics, and user feedback.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // DSN from Sentry project settings
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment (production, staging, development)
  environment: process.env.NODE_ENV,

  // Adjust sampling rate for production (0.1 = 10% of errors)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay sampling
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Performance monitoring
  integrations: [
    new Sentry.BrowserTracing({
      // Track page loads and navigation
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/wewinbid\.vercel\.app/,
        /^https:\/\/.*\.supabase\.co/,
      ],
    }),
    new Sentry.Replay({
      // Mask all text and images for privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Release version for tracking deployments
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Ignore common browser errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'ChunkLoadError',
  ],

  // Don't send errors in development
  enabled: process.env.NODE_ENV === 'production',
});
