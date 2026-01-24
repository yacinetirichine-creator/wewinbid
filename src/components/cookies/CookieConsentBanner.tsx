'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Settings, Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

const COOKIE_CONSENT_KEY = 'wewinbid_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'wewinbid_cookie_preferences';

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    personalization: false,
  });

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPrefs) {
        try {
          setPreferences(JSON.parse(savedPrefs));
        } catch {
          // Invalid saved preferences, use defaults
        }
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
    };
    saveConsent(allAccepted);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
    };
    saveConsent(necessaryOnly);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, new Date().toISOString());
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setIsVisible(false);

    // Dispatch event for analytics/tracking scripts to listen to
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: prefs }));

    // Enable/disable tracking based on preferences
    if (prefs.analytics && typeof window !== 'undefined') {
      // Enable PostHog if analytics accepted
      (window as any).posthog?.opt_in_capturing?.();
    } else {
      // Disable PostHog if analytics rejected
      (window as any).posthog?.opt_out_capturing?.();
    }
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Can't toggle necessary cookies
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6"
        >
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-surface-200 overflow-hidden">
            {/* Main Banner */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Cookie className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-surface-900 mb-2">
                    Nous respectons votre vie privée
                  </h3>
                  <p className="text-surface-600 text-sm leading-relaxed mb-4">
                    Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu.
                    Vous pouvez choisir les cookies que vous acceptez.{' '}
                    <Link href="/legal/cookies" className="text-primary-600 hover:underline">
                      En savoir plus
                    </Link>
                  </p>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={handleAcceptAll}
                      className="bg-primary-600 hover:bg-primary-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Tout accepter
                    </Button>
                    <Button
                      onClick={handleAcceptNecessary}
                      variant="outline"
                      className="border-surface-300"
                    >
                      Nécessaires uniquement
                    </Button>
                    <Button
                      onClick={() => setShowDetails(!showDetails)}
                      variant="ghost"
                      className="text-surface-600"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Personnaliser
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Settings */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-surface-200 overflow-hidden"
                >
                  <div className="p-6 bg-surface-50 space-y-4">
                    {/* Necessary Cookies */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-surface-200">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-success-600" />
                        <div>
                          <h4 className="font-semibold text-surface-900">Cookies nécessaires</h4>
                          <p className="text-sm text-surface-500">
                            Essentiels au fonctionnement du site (authentification, sécurité)
                          </p>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-success-100 text-success-700 text-sm font-medium rounded-full">
                        Toujours actifs
                      </div>
                    </div>

                    {/* Analytics Cookies */}
                    <CookieToggle
                      title="Cookies analytiques"
                      description="Nous aident à comprendre comment vous utilisez le site (PostHog)"
                      enabled={preferences.analytics}
                      onChange={() => togglePreference('analytics')}
                    />

                    {/* Marketing Cookies */}
                    <CookieToggle
                      title="Cookies marketing"
                      description="Utilisés pour vous montrer des publicités pertinentes"
                      enabled={preferences.marketing}
                      onChange={() => togglePreference('marketing')}
                    />

                    {/* Personalization Cookies */}
                    <CookieToggle
                      title="Cookies de personnalisation"
                      description="Permettent de mémoriser vos préférences (langue, thème)"
                      enabled={preferences.personalization}
                      onChange={() => togglePreference('personalization')}
                    />

                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSavePreferences} className="bg-primary-600 hover:bg-primary-700 text-white">
                        Enregistrer mes préférences
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CookieToggle({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-surface-200">
      <div>
        <h4 className="font-semibold text-surface-900">{title}</h4>
        <p className="text-sm text-surface-500">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative w-12 h-7 rounded-full transition-colors ${
          enabled ? 'bg-primary-600' : 'bg-surface-300'
        }`}
      >
        <span
          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            enabled ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}

export default CookieConsentBanner;
