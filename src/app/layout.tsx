import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'WeWinBid - Remportez plus d\'appels d\'offres',
    template: '%s | WeWinBid',
  },
  description: 'Plateforme SaaS B2B d\'automatisation des réponses aux appels d\'offres avec score de compatibilité IA, marketplace partenaires et génération automatique de documents.',
  keywords: [
    'appels d\'offres',
    'marchés publics',
    'AO',
    'tender',
    'IA',
    'automatisation',
    'score compatibilité',
    'mémoire technique',
  ],
  authors: [{ name: 'JARVIS SAS' }],
  creator: 'JARVIS SAS',
  publisher: 'JARVIS SAS',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://wewinbid.com',
    siteName: 'WeWinBid',
    title: 'WeWinBid - Remportez plus d\'appels d\'offres',
    description: 'Automatisez vos réponses aux appels d\'offres avec l\'IA',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'WeWinBid',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WeWinBid - Remportez plus d\'appels d\'offres',
    description: 'Automatisez vos réponses aux appels d\'offres avec l\'IA',
    images: ['/images/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen bg-surface-50 antialiased">
        {children}
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
