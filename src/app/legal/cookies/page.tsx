'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';
import { LogoNavbar } from '@/components/ui/Logo';

export default function CookiesPage() {
  const { locale } = useLocale();

  const entries = useMemo(
    () => ({
      'legal.cookies.title': 'Cookie Policy',
      'legal.cookies.lastUpdated': 'Last updated: January 19, 2026',

      'legal.cookies.s1.title': 'What is a cookie?',
      'legal.cookies.s1.p1':
        'A cookie is a small text file stored on your device (computer, smartphone, tablet) when you visit a website. It helps remember information related to your browsing.',

      'legal.cookies.s2.title': 'Cookies used on WeWinBid',

      'legal.cookies.s2.h1': '1. Essential cookies (always active)',
      'legal.cookies.s2.h1.p1': 'These cookies are necessary for the platform to function:',
      'legal.cookies.s2.h1.li1.label': 'Session',
      'legal.cookies.s2.h1.li1.desc': 'keeps you signed in',
      'legal.cookies.s2.h1.li2.label': 'CSRF',
      'legal.cookies.s2.h1.li2.desc': 'protection against attacks',
      'legal.cookies.s2.h1.li3.label': 'Preferences',
      'legal.cookies.s2.h1.li3.desc': 'language, theme',

      'legal.cookies.s2.h2': '2. Analytics cookies',
      'legal.cookies.s2.h2.p1': 'We use PostHog to understand how you use the platform:',
      'legal.cookies.s2.h2.li1': 'Visited pages',
      'legal.cookies.s2.h2.li2': 'Session duration',
      'legal.cookies.s2.h2.li3': 'Features used',
      'legal.cookies.s2.h2.p2':
        'This data is anonymized and helps us improve the user experience.',

      'legal.cookies.s2.h3': '3. Third-party cookies',
      'legal.cookies.s2.h3.li1.label': 'Stripe',
      'legal.cookies.s2.h3.li1.desc': 'secure payment processing',
      'legal.cookies.s2.h3.li2.label': 'Supabase',
      'legal.cookies.s2.h3.li2.desc': 'authentication and storage',

      'legal.cookies.s3.title': 'Managing cookies',
      'legal.cookies.s3.p1': 'You can manage your cookie preferences:',
      'legal.cookies.s3.li1': 'Via the banner shown on your first visit',
      'legal.cookies.s3.li2': "In your browser settings",
      'legal.cookies.s3.li3': 'By contacting us at contact@wewinbid.com',
      'legal.cookies.s3.p2.strong': 'Warning:',
      'legal.cookies.s3.p2':
        'Disabling certain cookies may affect how the platform works.',

      'legal.cookies.s4.title': 'Retention period',
      'legal.cookies.s4.li1': 'Session cookies: deleted when you close the browser',
      'legal.cookies.s4.li2': 'Preference cookies: 12 months',
      'legal.cookies.s4.li3': 'Analytics cookies: up to 13 months',

      'legal.cookies.s5.title': 'Contact',
      'legal.cookies.s5.box.company': 'JARVIS SAS',
      'legal.cookies.s5.box.address1': '64 Avenue Marinville',
      'legal.cookies.s5.box.address2': '94100 Saint-Maur-des-Fossés, France',
      'legal.cookies.s5.box.dpoLabel': 'DPO email:',
      'legal.cookies.s5.box.supportLabel': 'Support:',

      'legal.cookies.footer.label': 'Legal documents:',
      'legal.cookies.footer.privacy': 'Privacy',
      'legal.cookies.footer.terms': 'Terms',
      'legal.cookies.footer.cgv': 'Terms of Sale',
      'legal.cookies.footer.mentions': 'Legal Notice',
    }),
    []
  );

  const { t } = useUiTranslations(locale, entries);

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="border-b border-surface-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="flex items-center">
            <LogoNavbar />
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-display font-bold text-surface-900 mb-4">
          {t('legal.cookies.title')}
        </h1>
        <p className="text-surface-500 mb-12">{t('legal.cookies.lastUpdated')}</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.cookies.s1.title')}</h2>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cookies.s1.p1')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.cookies.s2.title')}</h2>

            <h3 className="text-xl font-bold text-surface-900 mb-3 mt-6">{t('legal.cookies.s2.h1')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.cookies.s2.h1.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>
                <strong>{t('legal.cookies.s2.h1.li1.label')}</strong>: {t('legal.cookies.s2.h1.li1.desc')}
              </li>
              <li>
                <strong>{t('legal.cookies.s2.h1.li2.label')}</strong>: {t('legal.cookies.s2.h1.li2.desc')}
              </li>
              <li>
                <strong>{t('legal.cookies.s2.h1.li3.label')}</strong>: {t('legal.cookies.s2.h1.li3.desc')}
              </li>
            </ul>

            <h3 className="text-xl font-bold text-surface-900 mb-3 mt-6">{t('legal.cookies.s2.h2')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.cookies.s2.h2.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.cookies.s2.h2.li1')}</li>
              <li>{t('legal.cookies.s2.h2.li2')}</li>
              <li>{t('legal.cookies.s2.h2.li3')}</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              {t('legal.cookies.s2.h2.p2')}
            </p>

            <h3 className="text-xl font-bold text-surface-900 mb-3 mt-6">{t('legal.cookies.s2.h3')}</h3>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>
                <strong>{t('legal.cookies.s2.h3.li1.label')}</strong>: {t('legal.cookies.s2.h3.li1.desc')}
              </li>
              <li>
                <strong>{t('legal.cookies.s2.h3.li2.label')}</strong>: {t('legal.cookies.s2.h3.li2.desc')}
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.cookies.s3.title')}</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.cookies.s3.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.cookies.s3.li1')}</li>
              <li>{t('legal.cookies.s3.li2')}</li>
              <li>{t('legal.cookies.s3.li3')}</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              <strong>{t('legal.cookies.s3.p2.strong')}</strong> {t('legal.cookies.s3.p2')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.cookies.s4.title')}</h2>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.cookies.s4.li1')}</li>
              <li>{t('legal.cookies.s4.li2')}</li>
              <li>{t('legal.cookies.s4.li3')}</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.cookies.s5.title')}</h2>
            <div className="p-6 bg-white rounded-xl border border-surface-200">
              <p className="font-bold text-surface-900">{t('legal.cookies.s5.box.company')}</p>
              <p className="text-surface-700">{t('legal.cookies.s5.box.address1')}</p>
              <p className="text-surface-700">{t('legal.cookies.s5.box.address2')}</p>
              <p className="text-surface-700 mt-2">
                {t('legal.cookies.s5.box.dpoLabel')}{' '}
                <a href="mailto:commercial@wewinbid.com" className="text-primary-600 hover:underline">
                  commercial@wewinbid.com
                </a>
              </p>
              <p className="text-surface-700">
                {t('legal.cookies.s5.box.supportLabel')}{' '}
                <a href="mailto:contact@wewinbid.com" className="text-primary-600 hover:underline">
                  contact@wewinbid.com
                </a>
              </p>
            </div>
          </section>

          <div className="mt-16 pt-8 border-t border-surface-200">
            <p className="text-sm text-surface-500 text-center">
              {t('legal.cookies.footer.label')}{' '}
              <Link href="/legal/privacy" className="text-primary-600 hover:underline">
                {t('legal.cookies.footer.privacy')}
              </Link>
              {' · '}
              <Link href="/legal/terms" className="text-primary-600 hover:underline">
                {t('legal.cookies.footer.terms')}
              </Link>
              {' · '}
              <Link href="/legal/cgv" className="text-primary-600 hover:underline">
                {t('legal.cookies.footer.cgv')}
              </Link>
              {' · '}
              <Link href="/legal/mentions" className="text-primary-600 hover:underline">
                {t('legal.cookies.footer.mentions')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
