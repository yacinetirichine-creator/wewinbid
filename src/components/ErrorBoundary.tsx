'use client';

/**
 * @fileoverview Error boundary component with Sentry integration.
 * Catches React errors and displays fallback UI.
 */

import React from 'react';
import * as Sentry from '@sentry/nextjs';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Default error fallback UI.
 */
function DefaultFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <div className="mb-4 text-6xl">⚠️</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Une erreur est survenue
        </h1>
        <p className="mb-6 text-gray-600">
          {error.message || "Nous n'avons pas pu charger cette page."}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

/**
 * Error boundary component that integrates with Sentry.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultFallback;
      return <FallbackComponent error={this.state.error} reset={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * Hook to capture errors manually.
 * 
 * @example
 * ```tsx
 * const captureError = useSentryCapture();
 * 
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   captureError(error, { context: 'user action' });
 * }
 * ```
 */
export function useSentryCapture() {
  return React.useCallback((error: unknown, context?: Record<string, unknown>) => {
    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
    });
  }, []);
}
