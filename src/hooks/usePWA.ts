'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
}

interface UsePWAReturn {
  state: PWAState;
  install: () => Promise<boolean>;
  update: () => void;
  checkForUpdates: () => Promise<void>;
}

/**
 * Hook pour gérer les fonctionnalités PWA
 */
export function usePWA(): UsePWAReturn {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isInstallable: false,
    isOnline: true,
    isUpdateAvailable: false,
    installPrompt: null,
  });

  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Détecter si l'app est déjà installée
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      
      setState(prev => ({
        ...prev,
        isInstalled: isStandalone || isInWebAppiOS,
      }));
    };

    checkInstalled();

    // Écouter les changements de mode d'affichage
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalled);

    return () => mediaQuery.removeEventListener('change', checkInstalled);
  }, []);

  // Gérer l'événement beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: e as BeforeInstallPromptEvent,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Gérer le statut en ligne/hors ligne
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    setState(prev => ({ ...prev, isOnline: navigator.onLine }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Enregistrer le Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => {
          setRegistration(reg);

          // Vérifier les mises à jour
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setState(prev => ({ ...prev, isUpdateAvailable: true }));
                }
              });
            }
          });
        })
        .catch(err => console.error('SW registration failed:', err));

      // Écouter les messages du SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'UPDATE_AVAILABLE') {
          setState(prev => ({ ...prev, isUpdateAvailable: true }));
        }
      });
    }
  }, []);

  // Installer l'application
  const install = useCallback(async (): Promise<boolean> => {
    if (!state.installPrompt) return false;

    try {
      await state.installPrompt.prompt();
      const { outcome } = await state.installPrompt.userChoice;
      
      setState(prev => ({
        ...prev,
        isInstallable: false,
        installPrompt: null,
        isInstalled: outcome === 'accepted',
      }));

      return outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt error:', error);
      return false;
    }
  }, [state.installPrompt]);

  // Mettre à jour l'application
  const update = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  // Vérifier les mises à jour manuellement
  const checkForUpdates = useCallback(async () => {
    if (registration) {
      await registration.update();
    }
  }, [registration]);

  return {
    state,
    install,
    update,
    checkForUpdates,
  };
}

/**
 * Hook pour gérer le stockage hors ligne
 */
export function useOfflineStorage() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('caches' in window);
  }, []);

  // Sauvegarder des données pour utilisation hors ligne
  const saveOffline = useCallback(async (key: string, data: any) => {
    if (!isSupported) return false;

    try {
      const cache = await caches.open('wewinbid-offline-data');
      const response = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      });
      await cache.put(`/offline-data/${key}`, response);
      return true;
    } catch (error) {
      console.error('Offline save error:', error);
      return false;
    }
  }, [isSupported]);

  // Récupérer des données hors ligne
  const loadOffline = useCallback(async <T>(key: string): Promise<T | null> => {
    if (!isSupported) return null;

    try {
      const cache = await caches.open('wewinbid-offline-data');
      const response = await cache.match(`/offline-data/${key}`);
      
      if (response) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Offline load error:', error);
      return null;
    }
  }, [isSupported]);

  // Supprimer des données hors ligne
  const deleteOffline = useCallback(async (key: string) => {
    if (!isSupported) return false;

    try {
      const cache = await caches.open('wewinbid-offline-data');
      await cache.delete(`/offline-data/${key}`);
      return true;
    } catch (error) {
      console.error('Offline delete error:', error);
      return false;
    }
  }, [isSupported]);

  // Lister toutes les clés hors ligne
  const listOfflineKeys = useCallback(async (): Promise<string[]> => {
    if (!isSupported) return [];

    try {
      const cache = await caches.open('wewinbid-offline-data');
      const keys = await cache.keys();
      return keys.map(req => req.url.replace(/.*\/offline-data\//, ''));
    } catch (error) {
      console.error('Offline list error:', error);
      return [];
    }
  }, [isSupported]);

  return {
    isSupported,
    saveOffline,
    loadOffline,
    deleteOffline,
    listOfflineKeys,
  };
}

/**
 * Hook pour les notifications push
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window && 'PushManager' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Demander la permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }, [isSupported]);

  // S'abonner aux notifications push
  const subscribe = useCallback(async (vapidPublicKey: string): Promise<PushSubscription | null> => {
    if (!isSupported || permission !== 'granted') return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      setSubscription(sub);

      // Envoyer la subscription au serveur
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });

      return sub;
    } catch (error) {
      console.error('Push subscription error:', error);
      return null;
    }
  }, [isSupported, permission]);

  // Se désabonner
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscription) return false;

    try {
      await subscription.unsubscribe();
      
      // Notifier le serveur
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      setSubscription(null);
      return true;
    } catch (error) {
      console.error('Push unsubscribe error:', error);
      return false;
    }
  }, [subscription]);

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}

// Helper pour convertir la clé VAPID
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}
