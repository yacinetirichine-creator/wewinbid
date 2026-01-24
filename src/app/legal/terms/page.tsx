'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';
import Logo, { LogoNavbar } from '@/components/ui/Logo';

export default function TermsPage() {
  const { locale } = useLocale();

  const entries = useMemo(
    () => ({
      'legal.terms.title': 'Terms of Service (ToS)',
      'legal.terms.lastUpdated': 'Last updated: January 19, 2026',

      'legal.terms.s1.title': '1. Purpose',
      'legal.terms.s1.p1':
        'These Terms of Service (ToS) govern access to and use of the WeWinBid platform (hereinafter the “Platform”), published by JARVIS SAS, a simplified joint-stock company with a share capital of €1,000, whose registered office is located at 64 Avenue Marinville, 94100 Saint-Maur-des-Fossés, France. By using our services, you accept these ToS without reservation.',

      'legal.terms.s2.title': '2. Service Description',
      'legal.terms.s2.p1':
        'WeWinBid is a B2B SaaS platform that automates responses to public and private tenders, developed and marketed by JARVIS SAS. The Platform offers the following features:',
      'legal.terms.s2.li1.label': 'AI analysis and scoring',
      'legal.terms.s2.li1.desc':
        'Automatic evaluation of compatibility between your capabilities and tenders',
      'legal.terms.s2.li2.label': 'Document generation',
      'legal.terms.s2.li2.desc':
        'Automatic creation of technical proposals, pricing breakdowns and administrative documents',
      'legal.terms.s2.li3.label': 'Awardees database',
      'legal.terms.s2.li3.desc':
        'Access to price history and awarded companies',
      'legal.terms.s2.li4.label': 'Partner marketplace',
      'legal.terms.s2.li4.desc':
        'Identification of qualified co-contractors and subcontractors',
      'legal.terms.s2.li5.label': 'Custom alerts',
      'legal.terms.s2.li5.desc':
        'Real-time notifications for new opportunities matching your profile',
      'legal.terms.s2.li6.label': 'Team collaboration',
      'legal.terms.s2.li6.desc':
        'Collaborative tools to write responses as a team',
      'legal.terms.s2.li7.label': 'Response library',
      'legal.terms.s2.li7.desc': 'Store and reuse your best answers',
      'legal.terms.s2.p2':
        'JARVIS SAS reserves the right to evolve the Platform’s features at any time in order to improve the user experience and adapt to regulatory changes.',

      'legal.terms.s3.title': '3. Registration and User Account',
      'legal.terms.s3_1.title': '3.1 Registration requirements',
      'legal.terms.s3_1.p1':
        'Access to the Platform requires creating a user account. You must:',
      'legal.terms.s3_1.li1':
        'Be an adult natural person or a duly registered legal entity',
      'legal.terms.s3_1.li2':
        'Provide accurate, complete and up-to-date information (first name, last name, email, company, SIRET)',
      'legal.terms.s3_1.li3': 'Validate your email address during registration',
      'legal.terms.s3_1.li4': 'Choose a secure password compliant with our security requirements',
      'legal.terms.s3_1.li5': 'Expressly accept these ToS and the Privacy Policy',
      'legal.terms.s3_2.title': '3.2 Account security',
      'legal.terms.s3_2.p1':
        'You are fully responsible for the confidentiality of your login credentials and for all activities performed from your account. You agree to:',
      'legal.terms.s3_2.li1': 'Not share your credentials with unauthorized third parties',
      'legal.terms.s3_2.li2': 'Keep your password confidential',
      'legal.terms.s3_2.li3':
        'Notify us immediately at commercial@wewinbid.com of any unauthorized or suspicious use',
      'legal.terms.s3_2.li4':
        'Log out after each session, especially on shared computers',
      'legal.terms.s3_2.p2':
        'JARVIS SAS cannot be held liable for damages resulting from unauthorized use of your account.',

      'legal.terms.s4.title': '4. Subscriptions and Payment',
      'legal.terms.s4.p1': 'We offer several subscription plans:',
      'legal.terms.s4.li1.label': 'Free',
      'legal.terms.s4.li1.desc': '€0/month — Limited access to discover the platform',
      'legal.terms.s4.li2.label': 'Pro',
      'legal.terms.s4.li2.desc': '€49/month or €490/year — For active SMBs',
      'legal.terms.s4.li3.label': 'Business',
      'legal.terms.s4.li3.desc': '€149/month or €1490/year — For sales teams',
      'legal.terms.s4.li4.label': 'Enterprise',
      'legal.terms.s4.li4.desc': 'Quote — Tailored solution for large organizations',
      'legal.terms.s4.p2': 'Payment terms:',
      'legal.terms.s4.pay.li1': 'Payments are securely processed via Stripe',
      'legal.terms.s4.pay.li2':
        'Subscriptions automatically renew unless cancelled',
      'legal.terms.s4.pay.li3':
        'You can cancel at any time from your customer area',
      'legal.terms.s4.pay.li4':
        'No refunds are issued for periods already paid',
      'legal.terms.s4.pay.li5':
        '14-day free trial on paid plans (no commitment)',
      'legal.terms.s4.pay.li6':
        'French VAT (20%) applies according to applicable laws',

      'legal.terms.s5.title': '5. Acceptable Use of the Platform',
      'legal.terms.s5_1.title': '5.1 User commitments',
      'legal.terms.s5_1.p1': 'By using the Platform, you agree to:',
      'legal.terms.s5_1.li1':
        'Use the Platform only for lawful professional purposes and in accordance with these ToS',
      'legal.terms.s5_1.li2':
        'Comply with applicable laws and regulations, especially those relating to public procurement',
      'legal.terms.s5_1.li3':
        'Provide accurate and truthful information in your tender responses',
      'legal.terms.s5_1.li4':
        'Respect the quotas and limitations of your subscription plan',
      'legal.terms.s5_1.li5':
        'Not use the Platform for fraudulent or misleading activities',
      'legal.terms.s5_2.title': '5.2 Prohibited uses',
      'legal.terms.s5_2.p1': 'The following behaviors are strictly prohibited:',
      'legal.terms.s5_2.li1':
        'Attempting to bypass security measures or technical limitations of the Platform',
      'legal.terms.s5_2.li2':
        'Using robots, scrapers or any automated tool to massively extract data',
      'legal.terms.s5_2.li3':
        'Sharing your account with third parties or creating multiple accounts for the same entity',
      'legal.terms.s5_2.li4':
        'Reverse engineering, decompiling or disassembling the Platform’s source code',
      'legal.terms.s5_2.li5': 'Spreading viruses, malware or any malicious code',
      'legal.terms.s5_2.li6': 'Impersonating another person or company',
      'legal.terms.s5_2.li7':
        'Using the Platform to send unsolicited commercial communications (spam)',
      'legal.terms.s5_2.p2':
        'Any violation of these prohibitions may lead to immediate suspension of your account and possible legal action.',

      'legal.terms.s6.title': '6. Intellectual Property',
      'legal.terms.s6_1.title': '6.1 JARVIS SAS rights',
      'legal.terms.s6_1.p1':
        'All elements composing the WeWinBid Platform are the exclusive property of JARVIS SAS or its licensors and are protected by copyright, trademark law, database rights and any other applicable intellectual property rights.',
      'legal.terms.s6_1.p2': 'In particular, the following are protected:',
      'legal.terms.s6_1.li1':
        'Source code, software architecture and Platform algorithms',
      'legal.terms.s6_1.li2': 'The “WeWinBid” trademark, logos and related graphic elements',
      'legal.terms.s6_1.li3':
        'The database of awardees, prices and tenders',
      'legal.terms.s6_1.li4': 'Texts, images, videos and editorial content',
      'legal.terms.s6_1.li5': 'Design, user interface and user experience (UI/UX)',
      'legal.terms.s6_2.title': '6.2 License to use',
      'legal.terms.s6_2.p1':
        'JARVIS SAS grants you a non-exclusive, non-transferable, revocable license limited to the duration of your subscription to access and use the Platform in accordance with these ToS.',
      'legal.terms.s6_2.p2':
        'This license does not grant you any ownership rights over the Platform or its components.',
      'legal.terms.s6_3.title': '6.3 User-generated content',
      'legal.terms.s6_3.p1':
        'You retain full ownership of the documents and content you create or upload to the Platform (technical proposals, tender responses, company documents).',
      'legal.terms.s6_3.p2':
        'However, by using the Platform, you grant JARVIS SAS a worldwide, non-exclusive, royalty-free license to:',
      'legal.terms.s6_3.li1': 'Store and host your content',
      'legal.terms.s6_3.li2':
        'Analyze your content in an anonymized way to improve our AI algorithms',
      'legal.terms.s6_3.li3':
        'Use aggregated and anonymized data for statistical purposes',
      'legal.terms.s6_3.p3':
        'JARVIS SAS undertakes never to disclose, sell or share your content with third parties without your express authorization, except where required by law.',

      'legal.terms.s7.title': '7. Liability and Warranties',
      'legal.terms.s7_1.title': '7.1 Nature of the service',
      'legal.terms.s7_1.p1':
        'WeWinBid is a decision-support and drafting tool for tenders. It does not constitute, under any circumstances, a guarantee of being awarded public or private contracts.',
      'legal.terms.s7_1.p2': 'The user acknowledges that:',
      'legal.terms.s7_1.li1':
        'AI compatibility scores are indicative and do not replace your professional judgment',
      'legal.terms.s7_1.li2':
        'Generated documents must be reviewed, customized and validated before submission',
      'legal.terms.s7_1.li3':
        'Awardee and price data are provided for information purposes without guarantee of absolute accuracy',
      'legal.terms.s7_1.li4':
        'You remain solely responsible for responses submitted to public or private buyers',
      'legal.terms.s7_2.title': '7.2 Service availability',
      'legal.terms.s7_2.p1':
        'JARVIS SAS strives to ensure the Platform is available 24/7, but cannot guarantee uninterrupted availability due to:',
      'legal.terms.s7_2.li1': 'Scheduled maintenance operations (notified 48 hours in advance)',
      'legal.terms.s7_2.li2': 'Urgent maintenance to fix security vulnerabilities',
      'legal.terms.s7_2.li3':
        'Force majeure events (network outages, DDoS attacks, natural disasters)',
      'legal.terms.s7_2.li4':
        'Interruptions due to third-party providers (hosting, external APIs)',
      'legal.terms.s7_3.title': '7.3 Limitation of liability',
      'legal.terms.s7_3.p1':
        'To the extent permitted by law, JARVIS SAS shall not be liable for:',
      'legal.terms.s7_3.li1':
        'Indirect damages (loss of opportunity, loss of business, loss of profit, loss of customers)',
      'legal.terms.s7_3.li2': 'Inappropriate use of the Platform or generated content',
      'legal.terms.s7_3.li3': 'Decisions made based on AI scores or recommendations',
      'legal.terms.s7_3.li4':
        'Failure by the user to comply with tender specifications',
      'legal.terms.s7_3.li5':
        'Data loss in the event the user fails to back up data',
      'legal.terms.s7_3.p2':
        'In any event, JARVIS SAS total liability is limited to the amount paid by the user over the 12 months preceding the event giving rise to the damage.',

      'legal.terms.s8.title': '8. Suspension and Termination',
      'legal.terms.s8_1.title': '8.1 Termination by the user',
      'legal.terms.s8_1.p1': 'You can cancel your subscription at any time:',
      'legal.terms.s8_1.li1':
        'From your customer area, section “Billing” → “Cancel subscription”',
      'legal.terms.s8_1.li2':
        'By email to commercial@wewinbid.com, specifying your name and email address',
      'legal.terms.s8_1.p2':
        'Termination takes effect at the end of the current paid period. No pro-rata refund is issued for the remaining time. You retain access to your data for 30 days after termination; beyond that period, the data will be permanently deleted.',
      'legal.terms.s8_2.title': '8.2 Suspension by JARVIS SAS',
      'legal.terms.s8_2.p1':
        'JARVIS SAS reserves the right to immediately suspend your access in case of:',
      'legal.terms.s8_2.li1': 'Non-payment (suspension after 7 days of delay)',
      'legal.terms.s8_2.li2':
        'Violation of these ToS or fraudulent use',
      'legal.terms.s8_2.li3':
        'Suspicious activity threatening the Platform security',
      'legal.terms.s8_2.li4':
        'Excessive and repeated overruns of your subscription quotas',
      'legal.terms.s8_3.title': '8.3 Termination by JARVIS SAS',
      'legal.terms.s8_3.p1':
        'In the event of serious or repeated breach of your obligations, JARVIS SAS may terminate your account with 15 days’ notice sent by email, except in urgent cases (fraud, security breach) requiring immediate termination.',
      'legal.terms.s8_3.p2':
        'No refund will be issued in case of termination due to the user’s fault.',

      'legal.terms.s9.title': '9. Changes to the ToS',
      'legal.terms.s9.p1':
        'JARVIS SAS reserves the right to modify these Terms of Service at any time to adapt to legal, technical or commercial developments of the Platform.',
      'legal.terms.s9.p2':
        'You will be informed of any material changes via:',
      'legal.terms.s9.li1':
        'An email sent to your registered address at least 30 days before the changes take effect',
      'legal.terms.s9.li2':
        'A notification in your customer area upon your next login',
      'legal.terms.s9.li3':
        'An information banner on the Platform homepage',
      'legal.terms.s9.p3':
        'Continuing to use the Platform after the changes take effect constitutes acceptance of the new terms. If you do not accept the changes, you may terminate your subscription in accordance with Section 8.',
      'legal.terms.s9.p4':
        'The applicable ToS are those in force on the date of your connection. The updated version is always accessible at: wewinbid.com/legal/terms.',

      'legal.terms.s10.title': '10. Governing Law and Dispute Resolution',
      'legal.terms.s10_1.title': '10.1 Governing law',
      'legal.terms.s10_1.p1':
        'These Terms of Service are governed by French law, to the exclusion of any other legislation. The language of the contract is French.',
      'legal.terms.s10_2.title': '10.2 Prior mediation',
      'legal.terms.s10_2.p1':
        'In the event of a dispute or claim relating to the interpretation or execution of these ToS, the parties agree to seek an amicable solution before any legal action.',
      'legal.terms.s10_2.p2': 'You can contact our customer service at:',
      'legal.terms.s10_2.li1': 'Email: commercial@wewinbid.com',
      'legal.terms.s10_2.li2':
        'Mail: JARVIS SAS, 64 Avenue Marinville, 94100 Saint-Maur-des-Fossés',
      'legal.terms.s10_2.p3':
        'We commit to responding within a maximum of 30 days.',
      'legal.terms.s10_3.title': '10.3 Competent jurisdiction',
      'legal.terms.s10_3.p1':
        'If no amicable solution is reached within 60 days, any dispute relating to these ToS shall be subject to the exclusive jurisdiction of the competent courts of Créteil, France, except where mandatory consumer-protection provisions apply.',
      'legal.terms.s10_4.title': '10.4 Consumer mediation',
      'legal.terms.s10_4.p1':
        'In accordance with Article L612-1 of the French Consumer Code, if you are a consumer, you have the right to use a consumer mediator free of charge for an amicable dispute resolution. We adhere to the following mediation service:',
      'legal.terms.s10_4.box.title':
        'Mediator of the Federation of e-commerce and distance selling (FEVAD)',
      'legal.terms.s10_4.box.address': '60 Rue La Boétie — 75008 Paris',
      'legal.terms.s10_4.box.websiteLabel': 'Website:',

      'legal.terms.s11.title': '11. Personal Data',
      'legal.terms.s11.p1':
        'The processing of your personal data is governed by our Privacy Policy, available at wewinbid.com/legal/privacy.',
      'legal.terms.s11.p2':
        'JARVIS SAS undertakes to comply with the General Data Protection Regulation (GDPR) and the amended French Data Protection Act. For any questions relating to your data, contact our DPO at commercial@wewinbid.com.',

      'legal.terms.s12.title': '12. Contact and Support',
      'legal.terms.s12.p1':
        'For any questions regarding these ToS or use of the Platform:',
      'legal.terms.s12.box.companyName': 'JARVIS SAS',
      'legal.terms.s12.box.legalForm': 'Simplified Joint-Stock Company with a share capital of €1,000',
      'legal.terms.s12.box.hqLabel': 'Registered office:',
      'legal.terms.s12.box.hqValue': '64 Avenue Marinville',
      'legal.terms.s12.box.hqCity': '94100 Saint-Maur-des-Fossés, France',
      'legal.terms.s12.box.siret': 'SIRET: Pending allocation',
      'legal.terms.s12.box.rcs': 'RCS Créteil (pending)',
      'legal.terms.s12.box.salesEmailLabel': 'Sales email:',
      'legal.terms.s12.box.supportEmailLabel': 'Technical support:',
      'legal.terms.s12.box.meetingLabel': 'Book a meeting:',
      'legal.terms.s12.box.meetingCta': 'Book a time slot',

      'legal.terms.footer.version': 'ToS version: January 19, 2026',
      'legal.terms.footer.related': 'Additional legal documents:',
      'legal.terms.footer.cgv': 'Terms of Sale',
      'legal.terms.footer.privacy': 'Privacy Policy',
      'legal.terms.footer.cookies': 'Cookies',
      'legal.terms.footer.mentions': 'Legal Notice',
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
          {t('legal.terms.title')}
        </h1>
        <p className="text-surface-500 mb-12">{t('legal.terms.lastUpdated')}</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.terms.s1.title')}</h2>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.terms.s1.p1')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.terms.s2.title')}</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s2.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>
                <strong>{t('legal.terms.s2.li1.label')}:</strong> {t('legal.terms.s2.li1.desc')}
              </li>
              <li>
                <strong>{t('legal.terms.s2.li2.label')}:</strong> {t('legal.terms.s2.li2.desc')}
              </li>
              <li>
                <strong>{t('legal.terms.s2.li3.label')}:</strong> {t('legal.terms.s2.li3.desc')}
              </li>
              <li>
                <strong>{t('legal.terms.s2.li4.label')}:</strong> {t('legal.terms.s2.li4.desc')}
              </li>
              <li>
                <strong>{t('legal.terms.s2.li5.label')}:</strong> {t('legal.terms.s2.li5.desc')}
              </li>
              <li>
                <strong>{t('legal.terms.s2.li6.label')}:</strong> {t('legal.terms.s2.li6.desc')}
              </li>
              <li>
                <strong>{t('legal.terms.s2.li7.label')}:</strong> {t('legal.terms.s2.li7.desc')}
              </li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              {t('legal.terms.s2.p2')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.terms.s3.title')}</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.terms.s3_1.title')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s3_1.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.terms.s3_1.li1')}</li>
              <li>{t('legal.terms.s3_1.li2')}</li>
              <li>{t('legal.terms.s3_1.li3')}</li>
              <li>{t('legal.terms.s3_1.li4')}</li>
              <li>{t('legal.terms.s3_1.li5')}</li>
            </ul>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.terms.s3_2.title')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s3_2.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.terms.s3_2.li1')}</li>
              <li>{t('legal.terms.s3_2.li2')}</li>
              <li>{t('legal.terms.s3_2.li3')}</li>
              <li>{t('legal.terms.s3_2.li4')}</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              {t('legal.terms.s3_2.p2')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.terms.s4.title')}</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s4.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>
                <strong>{t('legal.terms.s4.li1.label')}:</strong> {t('legal.terms.s4.li1.desc')}
              </li>
              <li>
                <strong>{t('legal.terms.s4.li2.label')}:</strong> {t('legal.terms.s4.li2.desc')}
              </li>
              <li>
                <strong>{t('legal.terms.s4.li3.label')}:</strong> {t('legal.terms.s4.li3.desc')}
              </li>
              <li>
                <strong>{t('legal.terms.s4.li4.label')}:</strong> {t('legal.terms.s4.li4.desc')}
              </li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              <strong>{t('legal.terms.s4.p2')}</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.terms.s4.pay.li1')}</li>
              <li>{t('legal.terms.s4.pay.li2')}</li>
              <li>{t('legal.terms.s4.pay.li3')}</li>
              <li>{t('legal.terms.s4.pay.li4')}</li>
              <li>{t('legal.terms.s4.pay.li5')}</li>
              <li>{t('legal.terms.s4.pay.li6')}</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.terms.s5.title')}</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.terms.s5_1.title')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s5_1.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.terms.s5_1.li1')}</li>
              <li>{t('legal.terms.s5_1.li2')}</li>
              <li>{t('legal.terms.s5_1.li3')}</li>
              <li>{t('legal.terms.s5_1.li4')}</li>
              <li>{t('legal.terms.s5_1.li5')}</li>
            </ul>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.terms.s5_2.title')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s5_2.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.terms.s5_2.li1')}</li>
              <li>{t('legal.terms.s5_2.li2')}</li>
              <li>{t('legal.terms.s5_2.li3')}</li>
              <li>{t('legal.terms.s5_2.li4')}</li>
              <li>{t('legal.terms.s5_2.li5')}</li>
              <li>{t('legal.terms.s5_2.li6')}</li>
              <li>{t('legal.terms.s5_2.li7')}</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              {t('legal.terms.s5_2.p2')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.terms.s6.title')}</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.terms.s6_1.title')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s6_1.p1')}
            </p>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s6_1.p2')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.terms.s6_1.li1')}</li>
              <li>{t('legal.terms.s6_1.li2')}</li>
              <li>{t('legal.terms.s6_1.li3')}</li>
              <li>{t('legal.terms.s6_1.li4')}</li>
              <li>{t('legal.terms.s6_1.li5')}</li>
            </ul>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.terms.s6_2.title')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s6_2.p1')}
            </p>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s6_2.p2')}
            </p>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.terms.s6_3.title')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s6_3.p1')}
            </p>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s6_3.p2')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.terms.s6_3.li1')}</li>
              <li>{t('legal.terms.s6_3.li2')}</li>
              <li>{t('legal.terms.s6_3.li3')}</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              {t('legal.terms.s6_3.p3')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.terms.s7.title')}</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.terms.s7_1.title')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s7_1.p1')}
            </p>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s7_1.p2')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.terms.s7_1.li1')}</li>
              <li>{t('legal.terms.s7_1.li2')}</li>
              <li>{t('legal.terms.s7_1.li3')}</li>
              <li>{t('legal.terms.s7_1.li4')}</li>
            </ul>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.terms.s7_2.title')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s7_2.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.terms.s7_2.li1')}</li>
              <li>{t('legal.terms.s7_2.li2')}</li>
              <li>{t('legal.terms.s7_2.li3')}</li>
              <li>{t('legal.terms.s7_2.li4')}</li>
            </ul>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.terms.s7_3.title')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s7_3.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.terms.s7_3.li1')}</li>
              <li>{t('legal.terms.s7_3.li2')}</li>
              <li>{t('legal.terms.s7_3.li3')}</li>
              <li>{t('legal.terms.s7_3.li4')}</li>
              <li>{t('legal.terms.s7_3.li5')}</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              {t('legal.terms.s7_3.p2')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.terms.s8.title')}</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.terms.s8_1.title')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s8_1.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.terms.s8_1.li1')}</li>
              <li>{t('legal.terms.s8_1.li2')}</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              {t('legal.terms.s8_1.p2')}
            </p>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.terms.s8_2.title')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s8_2.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.terms.s8_2.li1')}</li>
              <li>{t('legal.terms.s8_2.li2')}</li>
              <li>{t('legal.terms.s8_2.li3')}</li>
              <li>{t('legal.terms.s8_2.li4')}</li>
            </ul>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.terms.s8_3.title')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s8_3.p1')}
            </p>
            <p className="text-surface-700 leading-relaxed mt-4">
              {t('legal.terms.s8_3.p2')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.terms.s9.title')}</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s9.p1')}
            </p>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s9.p2')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.terms.s9.li1')}</li>
              <li>{t('legal.terms.s9.li2')}</li>
              <li>{t('legal.terms.s9.li3')}</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              {t('legal.terms.s9.p3')}
            </p>
            <p className="text-surface-700 leading-relaxed mt-4">
              {t('legal.terms.s9.p4')}{' '}
              <Link href="/legal/terms" className="text-primary-600 hover:underline">
                wewinbid.com/legal/terms
              </Link>
              .
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.terms.s10.title')}</h2>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.terms.s10_1.title')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s10_1.p1')}
            </p>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.terms.s10_2.title')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s10_2.p1')}
            </p>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s10_2.p2')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-surface-700">
              <li>{t('legal.terms.s10_2.li1')}</li>
              <li>{t('legal.terms.s10_2.li2')}</li>
            </ul>
            <p className="text-surface-700 leading-relaxed mt-4">
              {t('legal.terms.s10_2.p3')}
            </p>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.terms.s10_3.title')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s10_3.p1')}
            </p>
            
            <h3 className="text-xl font-bold text-surface-900 mt-6 mb-3">{t('legal.terms.s10_4.title')}</h3>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s10_4.p1')}
            </p>
            <div className="p-6 bg-white rounded-xl border border-surface-200">
              <p className="text-surface-700">
                <strong>{t('legal.terms.s10_4.box.title')}</strong>
              </p>
              <p className="text-surface-700">{t('legal.terms.s10_4.box.address')}</p>
              <p className="text-surface-700">
                {t('legal.terms.s10_4.box.websiteLabel')}{' '}
                <a href="https://www.mediateurfevad.fr" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  www.mediateurfevad.fr
                </a>
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.terms.s11.title')}</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s11.p1')}{' '}
              <Link href="/legal/privacy" className="text-primary-600 hover:underline">
                wewinbid.com/legal/privacy
              </Link>
              .
            </p>
            <p className="text-surface-700 leading-relaxed">
              {t('legal.terms.s11.p2')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-surface-900 mb-4">{t('legal.terms.s12.title')}</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              {t('legal.terms.s12.p1')}
            </p>
            <div className="p-6 bg-white rounded-xl border border-surface-200">
              <p className="font-bold text-surface-900 mb-2">{t('legal.terms.s12.box.companyName')}</p>
              <p className="text-surface-700">{t('legal.terms.s12.box.legalForm')}</p>
              <p className="text-surface-700">
                {t('legal.terms.s12.box.hqLabel')} {t('legal.terms.s12.box.hqValue')}
              </p>
              <p className="text-surface-700 mb-3">{t('legal.terms.s12.box.hqCity')}</p>
              <p className="text-surface-700">{t('legal.terms.s12.box.siret')}</p>
              <p className="text-surface-700 mb-3">{t('legal.terms.s12.box.rcs')}</p>
              <p className="text-surface-700">
                <strong>{t('legal.terms.s12.box.salesEmailLabel')}</strong>{' '}
                <a href="mailto:commercial@wewinbid.com" className="text-primary-600 hover:underline">
                  commercial@wewinbid.com
                </a>
              </p>
              <p className="text-surface-700">
                <strong>{t('legal.terms.s12.box.supportEmailLabel')}</strong>{' '}
                <a href="mailto:contact@wewinbid.com" className="text-primary-600 hover:underline">
                  contact@wewinbid.com
                </a>
              </p>
              <p className="text-surface-700 mt-2">
                <strong>{t('legal.terms.s12.box.meetingLabel')}</strong>{' '}
                <a href="https://calendly.com/commercial-wewinbid/30min" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  {t('legal.terms.s12.box.meetingCta')}
                </a>
              </p>
            </div>
          </section>

          <div className="mt-16 pt-8 border-t border-surface-200">
            <p className="text-sm text-surface-500 text-center mb-4">
              {t('legal.terms.footer.version')}
            </p>
            <p className="text-sm text-surface-500 text-center">
              {t('legal.terms.footer.related')}{' '}
              <Link href="/legal/cgv" className="text-primary-600 hover:underline">
                {t('legal.terms.footer.cgv')}
              </Link>
              {' · '}
              <Link href="/legal/privacy" className="text-primary-600 hover:underline">
                {t('legal.terms.footer.privacy')}
              </Link>
              {' · '}
              <Link href="/legal/cookies" className="text-primary-600 hover:underline">
                {t('legal.terms.footer.cookies')}
              </Link>
              {' · '}
              <Link href="/legal/mentions" className="text-primary-600 hover:underline">
                {t('legal.terms.footer.mentions')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
