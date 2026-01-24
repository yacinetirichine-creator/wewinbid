'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';
import { LogoNavbar } from '@/components/ui/Logo';

export default function PrivacyPage() {
  const { locale } = useLocale();

  const entries = useMemo(
    () => ({
      'legal.privacy.title': 'Privacy Policy (GDPR)',
      'legal.privacy.lastUpdated': 'Last updated: January 19, 2026',

      'legal.privacy.s1.title': '1. Data Controller',
      'legal.privacy.s1.p1': 'The controller of personal data processing is:',
      'legal.privacy.s1.box.company': 'JARVIS SAS',
      'legal.privacy.s1.box.legalForm': 'Simplified Joint-Stock Company with a share capital of €1,000',
      'legal.privacy.s1.box.hq':
        'Registered office: 64 Avenue Marinville, 94100 Saint-Maur-des-Fossés, France',
      'legal.privacy.s1.box.siret': 'SIRET: Pending allocation',
      'legal.privacy.s1.box.rcs': 'RCS Créteil (pending)',
      'legal.privacy.s1.box.dpoEmailLabel': 'DPO email:',
      'legal.privacy.s1.p2':
        'JARVIS SAS, publisher of the WeWinBid platform, attaches great importance to protecting your personal data in accordance with the General Data Protection Regulation (GDPR) and the amended French Data Protection Act.',

      'legal.privacy.s2.title': '2. Data Collected',
      'legal.privacy.s2.p1': 'We collect the following data:',
      'legal.privacy.s2.li1': 'Identification data: first name, last name, email, phone number',
      'legal.privacy.s2.li2': 'Professional data: company, SIRET, business sector',
      'legal.privacy.s2.li3': 'Connection data: IP address, logs, cookies',
      'legal.privacy.s2.li4': 'Usage data: tenders viewed, documents generated',
      'legal.privacy.s2.li5': 'Payment data: processed by our provider Stripe',

      'legal.privacy.s3.title': '3. Use of Data',
      'legal.privacy.s3.p1': 'Your data is used to:',
      'legal.privacy.s3.li1': 'Provide and improve our services',
      'legal.privacy.s3.li2': 'Manage your subscription and billing',
      'legal.privacy.s3.li3': 'Send you relevant notifications',
      'legal.privacy.s3.li4': 'Analyze use of the platform',
      'legal.privacy.s3.li5': 'Ensure the security of our systems',

      'legal.privacy.s4.title': '4. Data Sharing',
      'legal.privacy.s4.p1': 'We never sell your data. We only share it with:',
      'legal.privacy.s4.li1': 'Our technical providers (hosting, payment)',
      'legal.privacy.s4.li2': 'Legal authorities if required by law',

      'legal.privacy.s5.title': '5. Your Rights (GDPR)',
      'legal.privacy.s5.p1':
        'In accordance with the GDPR (Articles 15 to 22) and the French Data Protection Act, you have the following rights:',
      'legal.privacy.s5.right1.label': 'Right of access',
      'legal.privacy.s5.right1.desc':
        'obtain confirmation that your data is being processed and receive a copy',
      'legal.privacy.s5.right2.label': 'Right to rectification',
      'legal.privacy.s5.right2.desc': 'correct inaccurate or incomplete data',
      'legal.privacy.s5.right3.label': 'Right to erasure',
      'legal.privacy.s5.right3.desc':
        '(right to be forgotten) delete your data under certain conditions',
      'legal.privacy.s5.right4.label': 'Right to restriction',
      'legal.privacy.s5.right4.desc': 'limit the processing of your data',
      'legal.privacy.s5.right5.label': 'Right to data portability',
      'legal.privacy.s5.right5.desc':
        'receive your data in a structured, commonly used and machine-readable format',
      'legal.privacy.s5.right6.label': 'Right to object',
      'legal.privacy.s5.right6.desc': 'object to the processing of your data',
      'legal.privacy.s5.right7.label': 'Right to withdraw consent',
      'legal.privacy.s5.right7.desc': 'at any time',
      'legal.privacy.s5.p2a': 'To exercise these rights, contact us at',
      'legal.privacy.s5.p2b':
        'and specify your first name, last name and email address. We will respond within one month.',
      'legal.privacy.s5.p3':
        'You also have the right to lodge a complaint with the CNIL (French data protection authority):',

      'legal.privacy.s6.title': '6. Security and Retention',
      'legal.privacy.s6.p1':
        'We implement appropriate technical and organizational measures to protect your data against unauthorized access, loss, destruction or disclosure:',
      'legal.privacy.s6.li1': 'SSL/TLS encryption for all communications',
      'legal.privacy.s6.li2': 'Secure hosting with certified providers',
      'legal.privacy.s6.li3': 'Encrypted regular backups',
      'legal.privacy.s6.li4': 'Restricted access with strong authentication',
      'legal.privacy.s6.li5': 'Monitoring and logging of access',
      'legal.privacy.s6.p2':
        'Your data is retained for the duration of your subscription, then archived for 3 years for evidentiary purposes in the event of a dispute, in accordance with legal obligations. Billing data is retained for 10 years in accordance with accounting obligations.',

      'legal.privacy.s7.title': '7. Data Transfers',
      'legal.privacy.s7.p1':
        'Your data is hosted within the European Union. No transfer to third countries is carried out without appropriate safeguards (standard contractual clauses of the European Commission).',

      'legal.privacy.s8.title': '8. DPO Contact',
      'legal.privacy.s8.p1':
        'If you have any questions about this policy or exercising your rights:',
      'legal.privacy.s8.box.title': 'Data Protection Officer (DPO)',
      'legal.privacy.s8.box.company': 'JARVIS SAS',
      'legal.privacy.s8.box.addr1': '64 Avenue Marinville',
      'legal.privacy.s8.box.addr2': '94100 Saint-Maur-des-Fossés, France',
      'legal.privacy.s8.box.dpoEmailLabel': 'DPO email:',
      'legal.privacy.s8.box.supportLabel': 'Support:',

      'legal.privacy.footer.legalDocs': 'Legal documents:',
      'legal.privacy.footer.terms': 'Terms of Service',
      'legal.privacy.footer.cgv': 'Terms of Sale',
      'legal.privacy.footer.cookies': 'Cookies',
      'legal.privacy.footer.mentions': 'Legal Notice',
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
