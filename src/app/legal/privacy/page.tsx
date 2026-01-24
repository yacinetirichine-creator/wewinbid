'use client';

import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { useLegalTranslations } from '@/lib/i18n/legal-translations';
import { LogoNavbar } from '@/components/ui/Logo';

export default function PrivacyPage() {
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
          {t('legal.privacy.title')}
        </h1>
        <p className="text-surface-500 mb-12">{t('legal.privacy.lastUpdated')}</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.privacy.s1.title')}</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.privacy.s1.p1')}
            </p>
            <div className="p-6 bg-white rounded-xl border border-surface-200">
              <p className="font-bold text-surface-900">{t('legal.privacy.s1.box.company')}</p>
              <p className="text-surface-700">{t('legal.privacy.s1.box.legalForm')}</p>
              <p className="text-surface-700">{t('legal.privacy.s1.box.hq')}</p>
              <p className="text-surface-700">{t('legal.privacy.s1.box.siret')}</p>
              <p className="text-surface-700">{t('legal.privacy.s1.box.rcs')}</p>
              <p className="text-surface-700 mt-2">
                {t('legal.privacy.s1.box.dpoEmailLabel')}{' '}
                <a href="mailto:commercial@wewinbid.com" className="text-primary-600 hover:underline">
                  commercial@wewinbid.com
                </a>
              </p>
            </div>
            <p className="text-surface-700 leading-relaxed mt-4">
              {t('legal.privacy.s1.p2')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.privacy.s2.title')}</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.privacy.s2.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.privacy.s2.li1')}</li>
              <li>{t('legal.privacy.s2.li2')}</li>
              <li>{t('legal.privacy.s2.li3')}</li>
              <li>{t('legal.privacy.s2.li4')}</li>
              <li>{t('legal.privacy.s2.li5')}</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.privacy.s3.title')}</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.privacy.s3.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.privacy.s3.li1')}</li>
              <li>{t('legal.privacy.s3.li2')}</li>
              <li>{t('legal.privacy.s3.li3')}</li>
              <li>{t('legal.privacy.s3.li4')}</li>
              <li>{t('legal.privacy.s3.li5')}</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.privacy.s4.title')}</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.privacy.s4.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.privacy.s4.li1')}</li>
              <li>{t('legal.privacy.s4.li2')}</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.privacy.s5.title')}</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.privacy.s5.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>
                <strong>{t('legal.privacy.s5.right1.label')}</strong>: {t('legal.privacy.s5.right1.desc')}
              </li>
              <li>
                <strong>{t('legal.privacy.s5.right2.label')}</strong>: {t('legal.privacy.s5.right2.desc')}
              </li>
              <li>
                <strong>{t('legal.privacy.s5.right3.label')}</strong> {t('legal.privacy.s5.right3.desc')}
              </li>
              <li>
                <strong>{t('legal.privacy.s5.right4.label')}</strong>: {t('legal.privacy.s5.right4.desc')}
              </li>
              <li>
                <strong>{t('legal.privacy.s5.right5.label')}</strong>: {t('legal.privacy.s5.right5.desc')}
              </li>
              <li>
                <strong>{t('legal.privacy.s5.right6.label')}</strong>: {t('legal.privacy.s5.right6.desc')}
              </li>
              <li>
                <strong>{t('legal.privacy.s5.right7.label')}</strong> {t('legal.privacy.s5.right7.desc')}
              </li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              {t('legal.privacy.s5.p2a')}{' '}
              <a href="mailto:commercial@wewinbid.com" className="text-primary-600 hover:underline">
                commercial@wewinbid.com
              </a>{' '}
              {t('legal.privacy.s5.p2b')}
            </p>
            <p className="text-surface-700 leading-relaxed mt-4">
              {t('legal.privacy.s5.p3')}{' '}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                www.cnil.fr
              </a>
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.privacy.s6.title')}</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.privacy.s6.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.privacy.s6.li1')}</li>
              <li>{t('legal.privacy.s6.li2')}</li>
              <li>{t('legal.privacy.s6.li3')}</li>
              <li>{t('legal.privacy.s6.li4')}</li>
              <li>{t('legal.privacy.s6.li5')}</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              {t('legal.privacy.s6.p2')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.privacy.s7.title')}</h2>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.privacy.s7.p1')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.privacy.s8.title')}</h2>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.privacy.s8.p1')}
            </p>
            <div className="mt-4 p-6 bg-white rounded-xl border border-surface-200">
              <p className="font-bold text-surface-900">{t('legal.privacy.s8.box.title')}</p>
              <p className="text-surface-700">{t('legal.privacy.s8.box.company')}</p>
              <p className="text-surface-700">{t('legal.privacy.s8.box.addr1')}</p>
              <p className="text-surface-700">{t('legal.privacy.s8.box.addr2')}</p>
              <p className="text-surface-700 mt-2">
                {t('legal.privacy.s8.box.dpoEmailLabel')}{' '}
                <a href="mailto:commercial@wewinbid.com" className="text-primary-600 hover:underline">
                  commercial@wewinbid.com
                </a>
              </p>
              <p className="text-surface-700">
                {t('legal.privacy.s8.box.supportLabel')}{' '}
                <a href="mailto:contact@wewinbid.com" className="text-primary-600 hover:underline">
                  contact@wewinbid.com
                </a>
              </p>
            </div>
          </section>

          <div className="mt-16 pt-8 border-t border-surface-200">
            <p className="text-sm text-surface-500 text-center">
              {t('legal.privacy.footer.legalDocs')}{' '}
              <Link href="/legal/terms" className="text-primary-600 hover:underline">
                {t('legal.privacy.footer.terms')}
              </Link>
              {' · '}
              <Link href="/legal/cgv" className="text-primary-600 hover:underline">
                {t('legal.privacy.footer.cgv')}
              </Link>
              {' · '}
              <Link href="/legal/cookies" className="text-primary-600 hover:underline">
                {t('legal.privacy.footer.cookies')}
              </Link>
              {' · '}
              <Link href="/legal/mentions" className="text-primary-600 hover:underline">
                {t('legal.privacy.footer.mentions')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
