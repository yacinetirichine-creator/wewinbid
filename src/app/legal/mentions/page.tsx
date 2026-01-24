'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';
import { LogoNavbar } from '@/components/ui/Logo';

export default function MentionsPage() {
  const { locale } = useLocale();

  const entries = useMemo(
    () => ({
      'legal.mentions.title': 'Legal Notice',
      'legal.mentions.lastUpdated': 'Last updated: January 19, 2026',

      'legal.mentions.publisher.title': 'Website Publisher',
      'legal.mentions.publisher.companyLabel': 'Company name:',
      'legal.mentions.publisher.companyValue': 'JARVIS SAS',
      'legal.mentions.publisher.legalFormLabel': 'Legal form:',
      'legal.mentions.publisher.legalFormValue': 'Simplified Joint-Stock Company (SAS)',
      'legal.mentions.publisher.shareCapitalLabel': 'Share capital:',
      'legal.mentions.publisher.shareCapitalValue': '€1,000',
      'legal.mentions.publisher.siretLabel': 'SIRET:',
      'legal.mentions.publisher.siretValue': 'Pending allocation',
      'legal.mentions.publisher.rcsLabel': 'RCS:',
      'legal.mentions.publisher.rcsValue': 'Créteil (pending)',
      'legal.mentions.publisher.vatLabel': 'Intra-Community VAT number:',
      'legal.mentions.publisher.vatValue': 'Pending allocation',
      'legal.mentions.publisher.hqLabel': 'Registered office:',
      'legal.mentions.publisher.hqAddr1': '64 Avenue Marinville',
      'legal.mentions.publisher.hqAddr2': '94100 Saint-Maur-des-Fossés, France',
      'legal.mentions.publisher.salesEmailLabel': 'Sales email:',
      'legal.mentions.publisher.supportEmailLabel': 'Support email:',
      'legal.mentions.publisher.publisherDirectorLabel': 'Publication director:',
      'legal.mentions.publisher.publisherDirectorValue': 'Legal representative of JARVIS SAS',

      'legal.mentions.hosting.title': 'Hosting',
      'legal.mentions.hosting.webHostLabel': 'Web host:',
      'legal.mentions.hosting.webHostValue': 'Vercel Inc.',
      'legal.mentions.hosting.webHostAddr1': '340 S Lemon Ave #4133',
      'legal.mentions.hosting.webHostAddr2': 'Walnut, CA 91789, USA',
      'legal.mentions.hosting.dbLabel': 'Database:',
      'legal.mentions.hosting.dbValue': 'Supabase Inc.',
      'legal.mentions.hosting.dbAddr1': '970 Toa Payoh North #07-04',
      'legal.mentions.hosting.dbAddr2': 'Singapore 318992',

      'legal.mentions.ip.title': 'Intellectual Property',
      'legal.mentions.ip.p1':
        'All content on this website (structure, texts, logos, images, videos, source code, etc.) is the exclusive property of JARVIS SAS, unless otherwise stated.',
      'legal.mentions.ip.p2':
        'Any reproduction, distribution, modification, adaptation, retransmission or publication of these elements is strictly prohibited without JARVIS SAS prior written consent.',
      'legal.mentions.ip.trademarkLabel': 'Registered trademarks:',
      'legal.mentions.ip.trademarkValue':
        'WeWinBid® is a registered trademark of JARVIS SAS.',

      'legal.mentions.data.title': 'Personal Data',
      'legal.mentions.data.p1':
        'In accordance with the GDPR and the French Data Protection Act, you have rights of access, rectification, erasure and objection regarding your personal data.',
      'legal.mentions.data.p2a':
        'To exercise these rights or for any question about the processing of your data, contact our DPO at:',
      'legal.mentions.data.p3a': 'To learn more, see our',
      'legal.mentions.data.privacyLink': 'Privacy Policy',

      'legal.mentions.cookies.title': 'Cookies',
      'legal.mentions.cookies.p1a':
        'This website uses cookies to improve your user experience and produce visit statistics. To learn more, see our',
      'legal.mentions.cookies.link': 'Cookie Policy',

      'legal.mentions.credits.title': 'Credits',
      'legal.mentions.credits.li1.label': 'Design & development:',
      'legal.mentions.credits.li1.value': 'JARVIS SAS',
      'legal.mentions.credits.li2.label': 'Icons:',
      'legal.mentions.credits.li2.value': 'Lucide Icons',
      'legal.mentions.credits.li3.label': 'Hosting:',
      'legal.mentions.credits.li3.value': 'Vercel, Supabase',
      'legal.mentions.credits.li4.label': 'Analytics:',
      'legal.mentions.credits.li4.value': 'PostHog',
      'legal.mentions.credits.li5.label': 'Payments:',
      'legal.mentions.credits.li5.value': 'Stripe',

      'legal.mentions.disputes.title': 'Disputes',
      'legal.mentions.disputes.p1':
        'This legal notice is governed by French law. In the event of a dispute and failing an amicable agreement, the dispute will be brought before the French courts in accordance with applicable jurisdiction rules.',
      'legal.mentions.disputes.p2':
        'In accordance with Article L. 612-1 of the French Consumer Code, you may use a consumer mediator free of charge in the event of a dispute. Contact details are available upon request.',
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
          {t('legal.mentions.title')}
        </h1>
        <p className="text-surface-500 mb-12">{t('legal.mentions.lastUpdated')}</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.mentions.publisher.title')}</h2>
            <div className="p-6 bg-white rounded-xl border border-surface-200">
              <p className="text-surface-900">
                <strong>{t('legal.mentions.publisher.companyLabel')}</strong>{' '}
                {t('legal.mentions.publisher.companyValue')}
              </p>
              <p className="text-surface-700 mt-2">
                <strong>{t('legal.mentions.publisher.legalFormLabel')}</strong>{' '}
                {t('legal.mentions.publisher.legalFormValue')}
              </p>
              <p className="text-surface-700">
                <strong>{t('legal.mentions.publisher.shareCapitalLabel')}</strong>{' '}
                {t('legal.mentions.publisher.shareCapitalValue')}
              </p>
              <p className="text-surface-700">
                <strong>{t('legal.mentions.publisher.siretLabel')}</strong>{' '}
                {t('legal.mentions.publisher.siretValue')}
              </p>
              <p className="text-surface-700">
                <strong>{t('legal.mentions.publisher.rcsLabel')}</strong>{' '}
                {t('legal.mentions.publisher.rcsValue')}
              </p>
              <p className="text-surface-700">
                <strong>{t('legal.mentions.publisher.vatLabel')}</strong>{' '}
                {t('legal.mentions.publisher.vatValue')}
              </p>
              <p className="text-surface-700 mt-4">
                <strong>{t('legal.mentions.publisher.hqLabel')}</strong>
              </p>
              <p className="text-surface-700">{t('legal.mentions.publisher.hqAddr1')}</p>
              <p className="text-surface-700">{t('legal.mentions.publisher.hqAddr2')}</p>
              <p className="text-surface-700 mt-4">
                <strong>{t('legal.mentions.publisher.salesEmailLabel')}</strong>{' '}
                <a href="mailto:commercial@wewinbid.com" className="text-primary-600 hover:underline">
                  commercial@wewinbid.com
                </a>
              </p>
              <p className="text-surface-700">
                <strong>{t('legal.mentions.publisher.supportEmailLabel')}</strong>{' '}
                <a href="mailto:contact@wewinbid.com" className="text-primary-600 hover:underline">
                  contact@wewinbid.com
                </a>
              </p>
              <p className="text-surface-700 mt-4">
                <strong>{t('legal.mentions.publisher.publisherDirectorLabel')}</strong>{' '}
                {t('legal.mentions.publisher.publisherDirectorValue')}
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.mentions.hosting.title')}</h2>
            <div className="p-6 bg-white rounded-xl border border-surface-200">
              <p className="text-surface-900">
                <strong>{t('legal.mentions.hosting.webHostLabel')}</strong>{' '}
                {t('legal.mentions.hosting.webHostValue')}
              </p>
              <p className="text-surface-700 mt-2">{t('legal.mentions.hosting.webHostAddr1')}</p>
              <p className="text-surface-700">{t('legal.mentions.hosting.webHostAddr2')}</p>
              <p className="text-surface-700 mt-4">
                <strong>{t('legal.mentions.hosting.dbLabel')}</strong>{' '}
                {t('legal.mentions.hosting.dbValue')}
              </p>
              <p className="text-surface-700">{t('legal.mentions.hosting.dbAddr1')}</p>
              <p className="text-surface-700">{t('legal.mentions.hosting.dbAddr2')}</p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.mentions.ip.title')}</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.mentions.ip.p1')}
            </p>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.mentions.ip.p2')}
            </p>
            <p className="text-surface-700 leading-relaxed mt-4">
              <strong>{t('legal.mentions.ip.trademarkLabel')}</strong> {t('legal.mentions.ip.trademarkValue')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.mentions.data.title')}</h2>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.mentions.data.p1')}
            </p>
            <p className="text-surface-700 leading-relaxed mt-4">
              {t('legal.mentions.data.p2a')}{' '}
              <a href="mailto:contact@wewinbid.com" className="text-primary-600 hover:underline">
                contact@wewinbid.com
              </a>
            </p>
            <p className="text-surface-700 leading-relaxed mt-4">
              {t('legal.mentions.data.p3a')}{' '}
              <Link href="/legal/privacy" className="text-primary-600 hover:underline">
                {t('legal.mentions.data.privacyLink')}
              </Link>
              .
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.mentions.cookies.title')}</h2>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.mentions.cookies.p1a')}{' '}
              <Link href="/legal/cookies" className="text-primary-600 hover:underline">
                {t('legal.mentions.cookies.link')}
              </Link>
              .
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.mentions.credits.title')}</h2>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>
                <strong>{t('legal.mentions.credits.li1.label')}</strong> {t('legal.mentions.credits.li1.value')}
              </li>
              <li>
                <strong>{t('legal.mentions.credits.li2.label')}</strong> {t('legal.mentions.credits.li2.value')}
              </li>
              <li>
                <strong>{t('legal.mentions.credits.li3.label')}</strong> {t('legal.mentions.credits.li3.value')}
              </li>
              <li>
                <strong>{t('legal.mentions.credits.li4.label')}</strong> {t('legal.mentions.credits.li4.value')}
              </li>
              <li>
                <strong>{t('legal.mentions.credits.li5.label')}</strong> {t('legal.mentions.credits.li5.value')}
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.mentions.disputes.title')}</h2>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.mentions.disputes.p1')}
            </p>
            <p className="text-surface-700 leading-relaxed mt-4">
              {t('legal.mentions.disputes.p2')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
