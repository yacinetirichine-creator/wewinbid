'use client';

import { useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle } from 'lucide-react';
import { Button, Input, Alert } from '@/components/ui';
import { LogoNavbar } from '@/components/ui/Logo';
import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

function ContactContent() {
  const { locale } = useLocale();
  const entries = useMemo(
    () => ({
      'contact.title': 'Contact us',
      'contact.subtitle': 'Our team is here to answer your questions and support your project.',

      'contact.info.salesEmail': 'Sales email',
      'contact.info.meeting': 'Book a meeting',
      'contact.info.meeting.cta': 'Book a slot (30min)',
      'contact.info.meeting.note': 'Talk with our sales team',
      'contact.info.phone': 'Phone',
      'contact.info.phone.hours': 'Mon–Fri 9am–6pm',
      'contact.info.address': 'Address',

      'contact.enterprise.title': 'Enterprise solution',
      'contact.enterprise.description': 'Want to discuss a tailored solution for your organization? We will schedule a discovery call with our sales team.',

      'contact.success.title': 'Message sent!',
      'contact.success.description': 'Thanks for reaching out. We will get back to you as soon as possible.',
      'contact.success.action.sendAnother': 'Send another message',

      'contact.form.fullName': 'Full name *',
      'contact.form.email': 'Email *',
      'contact.form.company': 'Company',
      'contact.form.phone': 'Phone',
      'contact.form.subject': 'Subject *',
      'contact.form.message': 'Message *',

      'contact.form.placeholder.fullName': 'Jane Doe',
      'contact.form.placeholder.email': 'jane@company.com',
      'contact.form.placeholder.company': 'My Company Ltd',
      'contact.form.placeholder.phone': '+1 555 123 4567',
      'contact.form.placeholder.subject': 'How can we help?',
      'contact.form.placeholder.message': 'Describe your needs or ask your question…',

      'contact.form.submit.sending': 'Sending…',
      'contact.form.submit.send': 'Send message',

      'contact.form.legal.prefix': 'By submitting this form, you agree to our ',
      'contact.form.legal.privacy': 'privacy policy',
      'contact.form.legal.suffix': '.',

      'contact.error.sendGeneric': 'An error occurred. Please try again.',
      'contact.error.sendFailed': 'Error while sending',

      'contact.subject.enterpriseDefault': 'Enterprise inquiry',
    }),
    []
  );
  const { t } = useUiTranslations(locale, entries);

  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'general';
  const defaultSubject = type === 'enterprise' ? t('contact.subject.enterpriseDefault') : '';
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: defaultSubject,
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('contact.error.sendFailed'));
      }

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('contact.error.sendGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
      {/* Header */}
      <header className="border-b border-surface-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center">
            <LogoNavbar />
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left: Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-display font-bold text-surface-900 mb-6">{t('contact.title')}</h1>
            <p className="text-xl text-surface-600 mb-12">{t('contact.subtitle')}</p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-surface-900 mb-1">{t('contact.info.salesEmail')}</h3>
                  <a href="mailto:commercial@wewinbid.com" className="text-primary-600 hover:underline">
                    commercial@wewinbid.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center text-success-600 flex-shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 4H5C3.89 4 3 4.9 3 6V18C3 19.1 3.89 20 5 20H19C20.11 20 21 19.1 21 18V6C21 4.9 20.11 4 19 4M19 18H5V8L12 13L19 8V18M12 11L5 6H19L12 11Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-surface-900 mb-1">{t('contact.info.meeting')}</h3>
                  <a 
                    href="https://calendly.com/commercial-wewinbid/30min" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-success-600 hover:underline font-medium"
                  >
                    {t('contact.info.meeting.cta')}
                  </a>
                  <p className="text-sm text-surface-500 mt-1">{t('contact.info.meeting.note')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-surface-900 mb-1">{t('contact.info.phone')}</h3>
                  <a href="tel:+33123456789" className="text-primary-600 hover:underline">
                    +33 1 23 45 67 89
                  </a>
                  <p className="text-sm text-surface-500 mt-1">{t('contact.info.phone.hours')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-surface-900 mb-1">{t('contact.info.address')}</h3>
                  <p className="text-surface-600">
                    JARVIS SAS<br />
                    64 Avenue Marinville<br />
                    94100 Saint-Maur-des-Fossés, France
                  </p>
                </div>
              </div>
            </div>

            {type === 'enterprise' && (
              <div className="mt-12 p-6 bg-primary-50 rounded-2xl border border-primary-200">
                <h3 className="font-bold text-primary-900 mb-2">{t('contact.enterprise.title')}</h3>
                <p className="text-primary-700 text-sm">{t('contact.enterprise.description')}</p>
              </div>
            )}
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-3xl shadow-2xl p-8 border border-surface-200"
          >
            {success ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center text-success-600 mx-auto mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-surface-900 mb-2">{t('contact.success.title')}</h3>
                <p className="text-surface-600 mb-6">{t('contact.success.description')}</p>
                <Button onClick={() => setSuccess(false)} variant="outline">
                  {t('contact.success.action.sendAnother')}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert type="error">
                    {error}
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      {t('contact.form.fullName')}
                    </label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('contact.form.placeholder.fullName')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      {t('contact.form.email')}
                    </label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t('contact.form.placeholder.email')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      {t('contact.form.company')}
                    </label>
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder={t('contact.form.placeholder.company')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      {t('contact.form.phone')}
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={t('contact.form.placeholder.phone')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    {t('contact.form.subject')}
                  </label>
                  <Input
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder={t('contact.form.placeholder.subject')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    {t('contact.form.message')}
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-surface-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
                    placeholder={t('contact.form.placeholder.message')}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t('contact.form.submit.sending')}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      {t('contact.form.submit.send')}
                    </>
                  )}
                </Button>

                <p className="text-xs text-surface-500 text-center">
                  {t('contact.form.legal.prefix')}
                  <Link href="/legal/privacy" className="text-primary-600 hover:underline">
                    {t('contact.form.legal.privacy')}
                  </Link>
                  {t('contact.form.legal.suffix')}
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>}>
      <ContactContent />
    </Suspense>
  );
}
