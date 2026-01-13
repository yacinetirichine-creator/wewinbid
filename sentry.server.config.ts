/**
 * @fileoverview Sentry server-side configuration for error monitoring.
 * Captures API errors, server-side rendering errors, and background jobs.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // DSN from Sentry project settings
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment (production, staging, development)
  environment: process.env.NODE_ENV,

  // Sampling rate for server-side traces
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Performance monitoring
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],

  // Release version for tracking deployments
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Don't send errors in development
  enabled: process.env.NODE_ENV === 'production',

  // Server-specific configuration
  beforeSend(event, hint) {
    // Filter out Supabase auth errors (handled by app)
    if (event.exception?.values?.[0]?.type === 'AuthError') {
      return null;
    }

    // Add custom context
    if (hint.originalException) {
      event.contexts = {
        ...event.contexts,
        runtime: {
          name: 'Node.js',
          version: process.version,
        },
      };
    }

    return event;
  },
});
