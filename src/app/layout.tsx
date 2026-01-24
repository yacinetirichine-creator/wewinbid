import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider';
import { LocaleHtmlUpdater } from '@/components/providers/LocaleHtmlUpdater';
import { ThemeProvider, themeScript } from '@/components/providers/ThemeProvider';
import { LazyAIChatWidget } from '@/components/chat/LazyAIChatWidget';
import '@/styles/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://wewinbid.com'),
  title: {
    default: 'WeWinBid - L\'IA pour Gagner vos Appels d\'Offres Publics et Privés',
    template: '%s | WeWinBid',
  },
  description: 'Automatisez la détection, l\'analyse et la réponse aux appels d\'offres. Score de compatibilité IA, rédaction de mémoires techniques et bibliothèque de modèles. Gagnez du temps et remportez plus de marchés.',
  keywords: [
    'appels d\'offres',
    'marchés publics',
    'AO',
    'tender',
    'IA appels d\'offres',
    'logiciel appels d\'offres',
    'automatisation réponse AO',
    'mémoire technique automatique',
    'veille marchés publics',
    'WeWinBid',
    'SaaS B2B',
    'Gagner appel d\'offre'
  ],
  authors: [{ name: 'WeWinBid Team', url: 'https://wewinbid.com' }],
  creator: 'WeWinBid',
  publisher: 'WeWinBid',
  alternates: {
    canonical: '/',
    languages: {
      'fr-FR': '/fr',
      'en-US': '/en',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://wewinbid.com',
    siteName: 'WeWinBid',
    title: 'WeWinBid - L\'Intelligence Artificielle au service de vos Appels d\'Offres',
    description: 'Boostez votre taux de réussite avec notre IA : détection ciblée, analyse prédictive (Go/No-Go) et rédaction automatisée de mémoires techniques.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'WeWinBid Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WeWinBid - Gagnez vos Appels d\'Offres avec l\'IA',
    description: 'La solution tout-en-un pour détecter, analyser et répondre aux marchés publics et privés plus efficacement.',
    images: ['/images/og-image.png'],
    creator: '@wewinbid',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  category: 'business',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      'name': 'WeWinBid',
      'applicationCategory': 'BusinessApplication',
      'operatingSystem': 'Web, Cloud',
      'url': 'https://wewinbid.com',
      'description': 'Plateforme SaaS B2B d\'automatisation des réponses aux appels d\'offres avec score de compatibilité IA et génération de documents.',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'EUR'
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.9',
        'ratingCount': '85'
      }
    },
    {
      '@type': 'Organization',
      'url': 'https://wewinbid.com',
      'name': 'WeWinBid',
      'logo': 'https://wewinbid.com/logo.png',
      'sameAs': [
        'https://www.linkedin.com/company/wewinbid',
        'https://twitter.com/wewinbid'
      ]
    }
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WeWinBid" />

        {/* DNS Prefetch & Preconnect pour performance optimale */}
        <link rel="dns-prefetch" href="https://supabase.co" />
        <link rel="dns-prefetch" href="https://api.openai.com" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Enterprise Trust Signals */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-surface-50 dark:bg-surface-900 antialiased theme-transition">
        <LocaleHtmlUpdater />
        <ErrorBoundary>
          <ThemeProvider defaultTheme="system" enableSystem>
            <QueryProvider>
              <AnalyticsProvider>
                {children}
                <LazyAIChatWidget />
              </AnalyticsProvider>
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: '12px',
              padding: '16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#f8fafc',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#f8fafc',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
