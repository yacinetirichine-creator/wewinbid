'use client';

import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { useLegalTranslations } from '@/lib/i18n/legal-translations';
import { LogoNavbar } from '@/components/ui/Logo';

export default function MentionsPage() {
  const { locale } = useLocale();
  const { t } = useLegalTranslations(locale);

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
