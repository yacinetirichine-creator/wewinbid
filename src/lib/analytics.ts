/**
 * @fileoverview PostHog analytics integration for user tracking.
 * Tracks events, user properties, and feature flags.
 */

import posthog from 'posthog-js';

/**
 * Initialize PostHog client-side.
 * Call this once in your app layout.
 */
export function initAnalytics() {
  if (typeof window === 'undefined') return;

  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      // Enable session recording (optional)
      capture_pageview: false, // We'll capture manually with Next.js router
      capture_pageleave: true,
      // Privacy settings
      autocapture: false, // Manual event tracking only
      disable_session_recording: false,
      // Performance
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          posthog.debug();
        }
      },
    });
  }
}

/**
 * Event names for type safety.
 */
export const EVENTS = {
  // Authentication
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',

  // Tenders
  TENDER_VIEWED: 'tender_viewed',
  TENDER_CREATED: 'tender_created',
  TENDER_SCORED: 'tender_scored',
  TENDER_WON: 'tender_won',
  TENDER_LOST: 'tender_lost',

  // AI Features
  IMAGE_GENERATED: 'image_generated',
  PRESENTATION_GENERATED: 'presentation_generated',
  DOCUMENT_GENERATED: 'document_generated',

  // Marketplace
  PARTNERSHIP_REQUESTED: 'partnership_request_sent',
  PARTNERSHIP_ACCEPTED: 'partnership_accepted',
  PARTNERSHIP_REJECTED: 'partnership_rejected',

  // Subscription
  PLAN_VIEWED: 'plan_viewed',
  PLAN_UPGRADED: 'plan_upgraded',
  PLAN_DOWNGRADED: 'plan_downgraded',

  // Documents
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_DOWNLOADED: 'document_downloaded',
} as const;

/**
 * Track an event with optional properties.
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
) {
  if (typeof window === 'undefined' || !posthog.__loaded) return;

  posthog.capture(eventName, properties);
}

/**
 * Identify a user with properties.
 */
export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>
) {
  if (typeof window === 'undefined' || !posthog.__loaded) return;

  posthog.identify(userId, properties);
}

/**
 * Set user properties.
 */
export function setUserProperties(properties: Record<string, unknown>) {
  if (typeof window === 'undefined' || !posthog.__loaded) return;

  posthog.people.set(properties);
}

/**
 * Track page view (use in Next.js router events).
 */
export function trackPageView(url: string) {
  if (typeof window === 'undefined' || !posthog.__loaded) return;

  posthog.capture('$pageview', {
    $current_url: url,
  });
}

/**
 * Reset user session (on logout).
 */
export function resetUser() {
  if (typeof window === 'undefined' || !posthog.__loaded) return;

  posthog.reset();
}

/**
 * Check if a feature flag is enabled.
 */
export function isFeatureEnabled(flagKey: string): boolean {
  if (typeof window === 'undefined' || !posthog.__loaded) return false;

  return posthog.isFeatureEnabled(flagKey) ?? false;
}

/**
 * Note: Server-side analytics moved to @/lib/analytics-server
 * Import from there in API routes to avoid bundling posthog-node on client.
 */
