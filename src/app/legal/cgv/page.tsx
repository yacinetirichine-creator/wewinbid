'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';
import { LogoNavbar } from '@/components/ui/Logo';

export default function CGVPage() {
  const { locale } = useLocale();

  const entries = useMemo(
    () => ({
      'legal.cgv.title': 'Terms of Sale (CGV)',
      'legal.cgv.lastUpdated': 'Last updated: January 19, 2026',

      'legal.cgv.s1.title': '1. Preamble',
      'legal.cgv.s1.p1':
        'These Terms of Sale (CGV) govern the commercial relationship between JARVIS SAS, a simplified joint-stock company with a share capital of €1,000, registered with the RCS of Créteil (pending), whose registered office is located at 64 Avenue Marinville, 94100 Saint-Maur-des-Fossés, France (hereinafter “JARVIS” or the “Seller”), and any legal entity or individual wishing to subscribe to the WeWinBid platform (hereinafter the “Client”).',

      'legal.cgv.s2.title': '2. Purpose',
      'legal.cgv.s2.p1':
        'The purpose of these CGV is to define the conditions under which JARVIS markets access to the WeWinBid SaaS platform, a solution to automate responses to public and private tenders, including in particular:',
      'legal.cgv.s2.li1': 'AI analysis of tenders',
      'legal.cgv.s2.li2': 'Automatic generation of administrative and technical documents',
      'legal.cgv.s2.li3': 'Access to an awardees database and price history',
      'legal.cgv.s2.li4': 'A marketplace to identify partners',
      'legal.cgv.s2.li5': 'Custom alerts for new opportunities',
      'legal.cgv.s2.li6': 'Team collaboration tools',

      'legal.cgv.s3.title': '3. Plans and Pricing',
      'legal.cgv.s3_1.title': '3.1 Subscription plans',
      'legal.cgv.s3_1.p1': 'JARVIS offers the following subscription plans:',
      'legal.cgv.s3_1.free.title': 'Free plan',
      'legal.cgv.s3_1.pro.title': 'Pro plan',
      'legal.cgv.s3_1.business.title': 'Business plan',
      'legal.cgv.s3_1.enterprise.title': 'Enterprise plan',
      'legal.cgv.s3_1.priceLabel': 'Price:',
      'legal.cgv.s3_1.includedLabel': 'Included:',
      'legal.cgv.s3_1.trialLabel': 'Free trial:',
      'legal.cgv.s3_1.contactLabel': 'Contact:',
      'legal.cgv.s3_1.free.price': '€0/month',
      'legal.cgv.s3_1.free.included':
        '2 tender responses/month, 1 collaborator, 100 MB storage, email support',
      'legal.cgv.s3_1.pro.price': '€49 excl. VAT/month or €490 excl. VAT/year (i.e. €41/month)',
      'legal.cgv.s3_1.pro.included':
        '20 tender responses/month, 5 collaborators, 5 GB storage, all features, priority support',
      'legal.cgv.s3_1.pro.trial': '14 days, no commitment',
      'legal.cgv.s3_1.business.price':
        '€149 excl. VAT/month or €1,490 excl. VAT/year (i.e. €124/month)',
      'legal.cgv.s3_1.business.included':
        'Unlimited responses, 20 collaborators, 50 GB storage, real-time co-authoring, API, dedicated support',
      'legal.cgv.s3_1.business.trial': '14 days, no commitment',
      'legal.cgv.s3_1.enterprise.price': 'Custom quote',
      'legal.cgv.s3_1.enterprise.included':
        'Unlimited volumes, unlimited users, unlimited storage, dedicated API, account manager, team training, custom SLA',
      'legal.cgv.s3_1.enterprise.contact':
        'commercial@wewinbid.com or book a meeting on Calendly',

      'legal.cgv.s3_2.title': '3.2 VAT and taxes',
      'legal.cgv.s3_2.p1':
        'All prices are displayed excluding taxes (excl. VAT). French VAT at the applicable rate (20% as of 01/19/2026) applies to clients established in France. For clients established in another EU Member State with a valid intra-Community VAT number, the reverse-charge mechanism applies in accordance with EU regulations.',

      'legal.cgv.s4.title': '4. Subscription and Order',
      'legal.cgv.s4_1.title': '4.1 Subscription process',
      'legal.cgv.s4_1.p1':
        'Subscribing to a plan is done online at wewinbid.com following these steps:',
      'legal.cgv.s4_1.step1': 'Create a user account and validate the email address',
      'legal.cgv.s4_1.step2': 'Select the desired subscription plan',
      'legal.cgv.s4_1.step3': 'Provide billing information',
      'legal.cgv.s4_1.step4':
        'Accept these Terms of Sale and the Privacy Policy',
      'legal.cgv.s4_1.step5': 'Secure payment via Stripe',
      'legal.cgv.s4_1.step6': 'Order confirmation by email',
      'legal.cgv.s4_2.title': '4.2 Order validation',
      'legal.cgv.s4_2.p1':
        'Validating the order implies full and unconditional acceptance of these CGV. JARVIS reserves the right to refuse any order for legitimate reasons, in particular in the event of an existing dispute with the Client.',

      'legal.cgv.s5.title': '5. Payment Terms',
      'legal.cgv.s5_1.title': '5.1 Accepted payment methods',
      'legal.cgv.s5_1.p1':
        'Payments are securely processed via Stripe. Accepted payment methods include: credit/debit card (Visa, Mastercard, American Express), SEPA transfer, and direct debit.',
      'legal.cgv.s5_2.title': '5.2 Invoicing',
      'legal.cgv.s5_2.p1':
        'Monthly subscriptions are billed on the subscription date and then each month on the anniversary date. Annual subscriptions are billed once upon subscription and then on each anniversary date. Invoices are available for download in the customer area and are also sent by email.',
      'legal.cgv.s5_3.title': '5.3 Automatic renewal',
      'legal.cgv.s5_3.p1':
        'Subscriptions renew automatically unless the Client cancels at least 48 hours before the renewal date. The Client can cancel at any time from their customer area or by contacting commercial@wewinbid.com.',
      'legal.cgv.s5_4.title': '5.4 Late payment',
      'legal.cgv.s5_4.p1':
        'In case of non-payment, access to the service will be suspended after a 7-day grace period. Late-payment penalties at a rate equal to 3 times the legal interest rate will apply, as well as a fixed compensation of €40 for collection costs.',

      'legal.cgv.s6.title': '6. Right of Withdrawal',
      'legal.cgv.s6.p1':
        'In accordance with Article L221-28 of the French Consumer Code, professional clients do not benefit from a right of withdrawal for contracts for the supply of digital content not supplied on a tangible medium, where performance has begun with the consumer’s prior express agreement and where the consumer has waived their right of withdrawal.',
      'legal.cgv.s6.p2':
        'For consumer clients, a 14-day withdrawal right applies, unless the client expressly requested immediate performance of the service during this period.',

      'legal.cgv.s7.title': '7. Term and Cancellation',
      'legal.cgv.s7_1.title': '7.1 Term',
      'legal.cgv.s7_1.p1':
        'Subscriptions are taken out for a period of one month (monthly plan) or one year (annual plan), and renew automatically.',
      'legal.cgv.s7_2.title': '7.2 Cancellation by the Client',
      'legal.cgv.s7_2.p1':
        'The Client can cancel at any time without notice or penalty. Cancellation takes effect at the end of the current paid period. No pro-rata refund is issued.',
      'legal.cgv.s7_3.title': '7.3 Cancellation by JARVIS',
      'legal.cgv.s7_3.p1':
        'JARVIS reserves the right to terminate the subscription in the event of a serious breach by the Client of its obligations, in particular in the event of fraudulent use, non-payment, or violation of the Terms of Service. Termination will be notified by email with 15 days’ notice, except in urgent cases.',

      'legal.cgv.s8.title': '8. Warranties and Liability',
      'legal.cgv.s8_1.title': '8.1 Service availability',
      'legal.cgv.s8_1.p1':
        'JARVIS undertakes to provide a service accessible 24/7, subject to scheduled maintenance operations (notified 48 hours in advance) and force majeure events. A target availability of 99.5% is pursued (excluding scheduled maintenance).',
      'legal.cgv.s8_2.title': '8.2 Limitation of liability',
      'legal.cgv.s8_2.p1':
        'JARVIS shall not be liable for indirect damages (data loss, loss of opportunity, loss of business, loss of profit) resulting from the use of or inability to use the service. JARVIS liability is limited to the amounts paid by the Client over the last 12 months.',
      'legal.cgv.s8_3.title': '8.3 Backups',
      'legal.cgv.s8_3.p1':
        'JARVIS performs daily backups of data. However, it is the Client’s responsibility to perform its own backups. JARVIS does not guarantee data recovery in the event of an incident.',

      'legal.cgv.s9.title': '9. Intellectual Property',
      'legal.cgv.s9.p1':
        'The WeWinBid platform, its source code, structure, databases and all content are the exclusive property of JARVIS and are protected by copyright, registered trademarks and other intellectual property rights. The Client benefits from a non-exclusive, non-transferable right of use limited to the duration of the subscription.',

      'legal.cgv.s10.title': '10. Personal Data',
      'legal.cgv.s10.p1a':
        'The processing of the Client’s personal data is governed by our Privacy Policy, available at',
      'legal.cgv.s10.p1b':
        'JARVIS undertakes to comply with the General Data Protection Regulation (GDPR) and the amended French Data Protection Act.',

      'legal.cgv.s11.title': '11. Changes to the CGV',
      'legal.cgv.s11.p1':
        'JARVIS reserves the right to modify these CGV at any time. Clients will be informed by email of any material changes at least 30 days before they take effect. Continued use of the service after that date constitutes acceptance of the new CGV.',

      'legal.cgv.s12.title': '12. Governing Law and Jurisdiction',
      'legal.cgv.s12.p1':
        'These CGV are governed by French law. In the event of a dispute, the parties will seek an amicable solution. Failing that, the dispute will be brought before the competent courts of Créteil, France, unless mandatory public-order provisions provide otherwise.',

      'legal.cgv.s13.title': '13. Contact',
      'legal.cgv.s13.company': 'JARVIS SAS',
      'legal.cgv.s13.addr1': '64 Avenue Marinville',
      'legal.cgv.s13.addr2': '94100 Saint-Maur-des-Fossés, France',
      'legal.cgv.s13.salesEmailLabel': 'Sales email:',
      'legal.cgv.s13.supportLabel': 'Support:',

      'legal.cgv.footer.legalDocs': 'Legal documents:',
      'legal.cgv.footer.terms': 'Terms of Service',
      'legal.cgv.footer.privacy': 'Privacy Policy',
      'legal.cgv.footer.cookies': 'Cookies',
      'legal.cgv.footer.mentions': 'Legal Notice',
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
          {t('legal.cgv.title')}
        </h1>
        <p className="text-surface-500 mb-12">{t('legal.cgv.lastUpdated')}</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.cgv.s1.title')}</h2>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cgv.s1.p1')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.cgv.s2.title')}</h2>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cgv.s2.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700 mt-4">
              <li>{t('legal.cgv.s2.li1')}</li>
              <li>{t('legal.cgv.s2.li2')}</li>
              <li>{t('legal.cgv.s2.li3')}</li>
              <li>{t('legal.cgv.s2.li4')}</li>
              <li>{t('legal.cgv.s2.li5')}</li>
              <li>{t('legal.cgv.s2.li6')}</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.cgv.s3.title')}</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.cgv.s3_1.title')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.cgv.s3_1.p1')}
            </p>
            
            <div className="bg-white p-6 rounded-xl border border-surface-200 mb-4">
              <h4 className="font-bold text-surface-900 mb-2">{t('legal.cgv.s3_1.free.title')}</h4>
              <p className="text-surface-700">
                <strong>{t('legal.cgv.s3_1.priceLabel')}</strong> {t('legal.cgv.s3_1.free.price')}
                <br />
                <strong>{t('legal.cgv.s3_1.includedLabel')}</strong> {t('legal.cgv.s3_1.free.included')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-surface-200 mb-4">
              <h4 className="font-bold text-surface-900 mb-2">{t('legal.cgv.s3_1.pro.title')}</h4>
              <p className="text-surface-700">
                <strong>{t('legal.cgv.s3_1.priceLabel')}</strong> {t('legal.cgv.s3_1.pro.price')}
                <br />
                <strong>{t('legal.cgv.s3_1.includedLabel')}</strong> {t('legal.cgv.s3_1.pro.included')}
                <br />
                <strong>{t('legal.cgv.s3_1.trialLabel')}</strong> {t('legal.cgv.s3_1.pro.trial')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-surface-200 mb-4">
              <h4 className="font-bold text-surface-900 mb-2">{t('legal.cgv.s3_1.business.title')}</h4>
              <p className="text-surface-700">
                <strong>{t('legal.cgv.s3_1.priceLabel')}</strong> {t('legal.cgv.s3_1.business.price')}
                <br />
                <strong>{t('legal.cgv.s3_1.includedLabel')}</strong> {t('legal.cgv.s3_1.business.included')}
                <br />
                <strong>{t('legal.cgv.s3_1.trialLabel')}</strong> {t('legal.cgv.s3_1.business.trial')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-surface-200 mb-4">
              <h4 className="font-bold text-surface-900 mb-2">{t('legal.cgv.s3_1.enterprise.title')}</h4>
              <p className="text-surface-700">
                <strong>{t('legal.cgv.s3_1.priceLabel')}</strong> {t('legal.cgv.s3_1.enterprise.price')}
                <br />
                <strong>{t('legal.cgv.s3_1.includedLabel')}</strong> {t('legal.cgv.s3_1.enterprise.included')}
                <br />
                <strong>{t('legal.cgv.s3_1.contactLabel')}</strong> {t('legal.cgv.s3_1.enterprise.contact')}
              </p>
            </div>

            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.cgv.s3_2.title')}</h3>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cgv.s3_2.p1')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.cgv.s4.title')}</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.cgv.s4_1.title')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.cgv.s4_1.p1')}
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-surface-700">
              <li>{t('legal.cgv.s4_1.step1')}</li>
              <li>{t('legal.cgv.s4_1.step2')}</li>
              <li>{t('legal.cgv.s4_1.step3')}</li>
              <li>{t('legal.cgv.s4_1.step4')}</li>
              <li>{t('legal.cgv.s4_1.step5')}</li>
              <li>{t('legal.cgv.s4_1.step6')}</li>
            </ol>

            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.cgv.s4_2.title')}</h3>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cgv.s4_2.p1')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.cgv.s5.title')}</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.cgv.s5_1.title')}</h3>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cgv.s5_1.p1')}
            </p>

            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.cgv.s5_2.title')}</h3>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cgv.s5_2.p1')}
            </p>

            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.cgv.s5_3.title')}</h3>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cgv.s5_3.p1')}
            </p>

            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.cgv.s5_4.title')}</h3>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cgv.s5_4.p1')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.cgv.s6.title')}</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.cgv.s6.p1')}
            </p>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cgv.s6.p2')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.cgv.s7.title')}</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.cgv.s7_1.title')}</h3>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cgv.s7_1.p1')}
            </p>

            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.cgv.s7_2.title')}</h3>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cgv.s7_2.p1')}
            </p>

            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.cgv.s7_3.title')}</h3>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cgv.s7_3.p1')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.cgv.s8.title')}</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.cgv.s8_1.title')}</h3>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cgv.s8_1.p1')}
            </p>

            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.cgv.s8_2.title')}</h3>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cgv.s8_2.p1')}
            </p>

            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.cgv.s8_3.title')}</h3>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cgv.s8_3.p1')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.cgv.s9.title')}</h2>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cgv.s9.p1')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.cgv.s10.title')}</h2>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cgv.s10.p1a')}{' '}
              <Link href="/legal/privacy" className="text-primary-600 hover:underline">
                wewinbid.com/legal/privacy
              </Link>.
              {t('legal.cgv.s10.p1b')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.cgv.s11.title')}</h2>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cgv.s11.p1')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.cgv.s12.title')}</h2>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.cgv.s12.p1')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.cgv.s13.title')}</h2>
            <div className="bg-white p-6 rounded-xl border border-surface-200">
              <p className="text-surface-900 mb-2">
                <strong>{t('legal.cgv.s13.company')}</strong>
              </p>
              <p className="text-surface-700">{t('legal.cgv.s13.addr1')}</p>
              <p className="text-surface-700 mb-4">{t('legal.cgv.s13.addr2')}</p>
              <p className="text-surface-700">
                <strong>{t('legal.cgv.s13.salesEmailLabel')}</strong>{' '}
                <a href="mailto:commercial@wewinbid.com" className="text-primary-600 hover:underline">
                  commercial@wewinbid.com
                </a>
              </p>
              <p className="text-surface-700">
                <strong>{t('legal.cgv.s13.supportLabel')}</strong>{' '}
                <a href="mailto:contact@wewinbid.com" className="text-primary-600 hover:underline">
                  contact@wewinbid.com
                </a>
              </p>
            </div>
          </section>

          <div className="mt-16 pt-8 border-t border-surface-200">
            <p className="text-sm text-surface-500 text-center">
              {t('legal.cgv.footer.legalDocs')}{' '}
              <Link href="/legal/terms" className="text-primary-600 hover:underline">
                {t('legal.cgv.footer.terms')}
              </Link>
              {' · '}
              <Link href="/legal/privacy" className="text-primary-600 hover:underline">
                {t('legal.cgv.footer.privacy')}
              </Link>
              {' · '}
              <Link href="/legal/cookies" className="text-primary-600 hover:underline">
                {t('legal.cgv.footer.cookies')}
              </Link>
              {' · '}
              <Link href="/legal/mentions" className="text-primary-600 hover:underline">
                {t('legal.cgv.footer.mentions')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
