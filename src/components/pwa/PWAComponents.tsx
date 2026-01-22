'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Wifi,
  WifiOff,
  RefreshCw,
  X,
  Smartphone,
  Bell,
  BellOff,
  CheckCircle,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { usePWA, usePushNotifications } from '@/hooks/usePWA';
import { cn } from '@/lib/utils';

/**
 * Bannière d'installation PWA
 */
export function InstallBanner({ className }: { className?: string }) {
  const { state, install } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  // Vérifier si déjà dismissed
  useEffect(() => {
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      const dismissedDate = new Date(wasDismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      // Remontrer après 7 jours
      if (daysSinceDismissed < 7) {
        setDismissed(true);
      }
    }
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    const success = await install();
    setInstalling(false);
    
    if (success) {
      // Track installation
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'pwa_install');
      }
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (state.isInstalled || !state.isInstallable || dismissed) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className={cn(
        'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md',
        'bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-xl p-4',
        'z-50',
        className
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-white/70 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="p-3 bg-white/10 rounded-xl flex-shrink-0">
          <Smartphone className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white mb-1">
            Installez WeWinBid
          </h3>
          <p className="text-sm text-white/80 mb-3">
            Accédez rapidement à l'app depuis votre écran d'accueil, même hors ligne.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleInstall}
            disabled={installing}
            className="bg-white text-primary-700 hover:bg-white/90"
          >
            {installing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Installation...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Installer
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Indicateur de statut réseau
 */
export function NetworkStatus({ className }: { className?: string }) {
  const { state } = usePWA();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Afficher quand on passe hors ligne
    if (!state.isOnline) {
      setShow(true);
    } else {
      // Afficher brièvement quand on revient en ligne
      setShow(true);
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.isOnline]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className={cn(
            'fixed top-0 left-0 right-0 z-50',
            state.isOnline ? 'bg-green-500' : 'bg-orange-500',
            className
          )}
        >
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-white text-sm">
            {state.isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                Connexion rétablie
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                Vous êtes hors ligne - Certaines fonctionnalités peuvent être limitées
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Bannière de mise à jour disponible
 */
export function UpdateBanner({ className }: { className?: string }) {
  const { state, update } = usePWA();
  const [updating, setUpdating] = useState(false);

  if (!state.isUpdateAvailable) {
    return null;
  }

  const handleUpdate = () => {
    setUpdating(true);
    update();
  };

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        'bg-blue-500 text-white py-3 px-4',
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          <span className="text-sm font-medium">
            Une nouvelle version est disponible
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleUpdate}
          disabled={updating}
          className="bg-white text-blue-600 hover:bg-white/90"
        >
          {updating ? 'Mise à jour...' : 'Mettre à jour'}
        </Button>
      </div>
    </motion.div>
  );
}

/**
 * Toggle pour les notifications push
 */
export function NotificationToggle({ 
  vapidPublicKey,
  className 
}: { 
  vapidPublicKey: string;
  className?: string;
}) {
  const { 
    isSupported, 
    permission, 
    subscription, 
    requestPermission, 
    subscribe, 
    unsubscribe 
  } = usePushNotifications();

  const [loading, setLoading] = useState(false);

  if (!isSupported) {
    return (
      <div className={cn('flex items-center gap-2 text-surface-500 text-sm', className)}>
        <BellOff className="w-4 h-4" />
        Notifications non supportées
      </div>
    );
  }

  const handleToggle = async () => {
    setLoading(true);

    if (subscription) {
      await unsubscribe();
    } else {
      if (permission === 'default') {
        const granted = await requestPermission();
        if (!granted) {
          setLoading(false);
          return;
        }
      }
      
      if (permission !== 'denied') {
        await subscribe(vapidPublicKey);
      }
    }

    setLoading(false);
  };

  const isEnabled = !!subscription;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <button
        onClick={handleToggle}
        disabled={loading || permission === 'denied'}
        className={cn(
          'relative w-12 h-6 rounded-full transition-colors duration-200',
          isEnabled ? 'bg-primary-500' : 'bg-surface-300',
          loading && 'opacity-50 cursor-wait',
          permission === 'denied' && 'opacity-50 cursor-not-allowed'
        )}
      >
        <motion.div
          animate={{ x: isEnabled ? 24 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn(
            'absolute top-1 w-4 h-4 rounded-full bg-white shadow',
            loading && 'animate-pulse'
          )}
        />
      </button>
      <div className="flex items-center gap-2">
        {isEnabled ? (
          <>
            <Bell className="w-4 h-4 text-primary-500" />
            <span className="text-sm text-surface-700">Notifications activées</span>
          </>
        ) : permission === 'denied' ? (
          <>
            <BellOff className="w-4 h-4 text-surface-400" />
            <span className="text-sm text-surface-500">Notifications bloquées</span>
          </>
        ) : (
          <>
            <BellOff className="w-4 h-4 text-surface-400" />
            <span className="text-sm text-surface-500">Notifications désactivées</span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Badge PWA installé
 */
export function PWABadge({ className }: { className?: string }) {
  const { state } = usePWA();

  if (!state.isInstalled) {
    return null;
  }

  return (
    <Badge variant="success" className={cn('flex items-center gap-1', className)}>
      <CheckCircle className="w-3 h-3" />
      App installée
    </Badge>
  );
}
