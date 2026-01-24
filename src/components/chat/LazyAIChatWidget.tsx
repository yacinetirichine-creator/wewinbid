'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';

// Dynamically import the AI Chat Widget only when needed
const AIChatWidget = dynamic(
  () => import('@/components/chat/AIChatWidget'),
  {
    ssr: false,
    loading: () => null, // Don't show anything while loading
  }
);

// Routes where the chat widget should NOT appear
const EXCLUDED_ROUTES = [
  '/',
  '/auth',
  '/legal',
  '/pricing',
];

export function LazyAIChatWidget() {
  const pathname = usePathname();

  // Don't render on public pages (landing, auth, legal, pricing)
  const shouldShow = !EXCLUDED_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!shouldShow) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <AIChatWidget />
    </Suspense>
  );
}

export default LazyAIChatWidget;
