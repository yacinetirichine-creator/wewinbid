'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle } from 'lucide-react';
import { Button, Input, Alert } from '@/components/ui';
import Logo, { LogoNavbar } from '@/components/ui/Logo';
import Link from 'next/link';

function ContactContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'general';
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: type === 'enterprise' ? 'Demande Enterprise' : '',
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
        throw new Error(data.error || 'Erreur lors de l\'envoi');
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
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.');
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
            <h1 className="text-5xl font-display font-bold text-surface-900 mb-6">
              Contactez-nous
            </h1>
            <p className="text-xl text-surface-600 mb-12">
              Notre équipe est là pour répondre à toutes vos questions et vous accompagner dans votre projet.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-surface-900 mb-1">Email Commercial</h3>
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
                  <h3 className="font-bold text-surface-900 mb-1">Prise de rendez-vous</h3>
                  <a 
                    href="https://calendly.com/commercial-wewinbid/30min" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-success-600 hover:underline font-medium"
                  >
                    Réserver un créneau (30min)
                  </a>
                  <p className="text-sm text-surface-500 mt-1">Échange avec notre équipe commerciale</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-surface-900 mb-1">Téléphone</h3>
                  <a href="tel:+33123456789" className="text-primary-600 hover:underline">
                    +33 1 23 45 67 89
                  </a>
                  <p className="text-sm text-surface-500 mt-1">Lun-Ven 9h-18h</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-surface-900 mb-1">Adresse</h3>
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
                <h3 className="font-bold text-primary-900 mb-2">Solution Enterprise</h3>
                <p className="text-primary-700 text-sm">
                  Vous souhaitez discuter d'une solution sur mesure pour votre organisation ? 
                  Nous programmerons un appel de découverte avec notre équipe commerciale.
                </p>
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
                <h3 className="text-2xl font-bold text-surface-900 mb-2">Message envoyé !</h3>
                <p className="text-surface-600 mb-6">
                  Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
                </p>
                <Button onClick={() => setSuccess(false)} variant="outline">
                  Envoyer un autre message
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
                      Nom complet *
                    </label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jean Dupont"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jean@entreprise.fr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Entreprise
                    </label>
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Mon Entreprise SAS"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Téléphone
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    Sujet *
                  </label>
                  <Input
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Comment puis-je vous aider ?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-surface-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
                    placeholder="Décrivez votre besoin ou posez votre question..."
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
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Envoyer le message
                    </>
                  )}
                </Button>

                <p className="text-xs text-surface-500 text-center">
                  En envoyant ce formulaire, vous acceptez notre{' '}
                  <Link href="/legal/privacy" className="text-primary-600 hover:underline">
                    politique de confidentialité
                  </Link>
                  .
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
