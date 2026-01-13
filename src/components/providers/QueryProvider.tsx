'use client';

/**
 * @fileoverview React Query provider for data caching and state management.
 * Configures global defaults for queries and mutations.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * Creates a new QueryClient with optimized defaults.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Keep unused data for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry failed requests 3 times
        retry: 3,
        // Don't refetch on window focus in development
        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      },
      mutations: {
        // Retry failed mutations once
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Get or create a QueryClient instance.
 * In browser, reuse the same instance for the session.
 * On server, create a new instance for each request.
 */
function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new instance
    return makeQueryClient();
  } else {
    // Browser: reuse the same instance
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

/**
 * React Query provider component.
 * Wrap your app with this to enable data caching.
 * 
 * @example
 * ```tsx
 * <QueryProvider>
 *   <App />
 * </QueryProvider>
 * ```
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Use useState to ensure we only create one instance per browser session
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
