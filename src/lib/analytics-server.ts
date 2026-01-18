/**
 * @fileoverview Server-side PostHog analytics (API routes only).
 * DO NOT import this in client components.
 */

import { PostHog } from 'posthog-node';

let serverPostHog: PostHog | null = null;

export function getServerPostHog(): PostHog {
  if (!serverPostHog && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    serverPostHog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    });
  }

  if (!serverPostHog) {
    throw new Error('PostHog not initialized - missing NEXT_PUBLIC_POSTHOG_KEY');
  }

  return serverPostHog;
}

/**
 * Track server-side event.
 */
export async function trackServerEvent(
  userId: string,
  eventName: string,
  properties?: Record<string, unknown>
) {
  try {
    const ph = getServerPostHog();
    ph.capture({
      distinctId: userId,
      event: eventName,
      properties,
    });
    await ph.shutdown(); // Flush events
  } catch (error) {
    console.error('PostHog server error:', error);
  }
}
