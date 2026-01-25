'use client';

import { useOffline } from '@/hooks/useOffline';
import { Wifi, WifiOff, CloudOff, RefreshCw, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface OfflineIndicatorProps {
  showAlways?: boolean;
  position?: 'top' | 'bottom';
}

export function OfflineIndicator({ showAlways = false, position = 'bottom' }: OfflineIndicatorProps) {
  const { isOnline, pendingChanges, syncPendingChanges } = useOffline();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);

  // Show banner when offline or when there are pending changes
  useEffect(() => {
    if (!isOnline || pendingChanges > 0) {
      setShowBanner(true);
    } else if (showAlways) {
      setShowBanner(true);
    }

    // Show "back online" message briefly
    if (isOnline && !showBanner) {
      setJustCameOnline(true);
      setShowBanner(true);
      const timer = setTimeout(() => {
        setJustCameOnline(false);
        if (pendingChanges === 0 && !showAlways) {
          setShowBanner(false);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingChanges, showAlways, showBanner]);

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      await syncPendingChanges();
    } finally {
      setIsSyncing(false);
    }
  };

  if (!showBanner) return null;

  const positionClasses = position === 'top'
    ? 'top-0 left-0 right-0'
    : 'bottom-0 left-0 right-0';

  // Online with no pending changes
  if (isOnline && pendingChanges === 0) {
    if (justCameOnline) {
      return (
        <div className={`fixed ${positionClasses} z-50 px-4 py-2 bg-green-500 text-white text-center text-sm font-medium flex items-center justify-center gap-2 animate-slide-up`}>
          <CheckCircle className="w-4 h-4" />
          <span>Connexion rétablie</span>
        </div>
      );
    }
    return null;
  }

  // Offline
  if (!isOnline) {
    return (
      <div className={`fixed ${positionClasses} z-50 px-4 py-3 bg-amber-500 text-white flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">Mode hors ligne</span>
          <span className="text-amber-100 text-sm">
            - Vos modifications seront synchronisées une fois connecté
          </span>
        </div>
        {pendingChanges > 0 && (
          <span className="bg-amber-600 px-2 py-1 rounded text-sm">
            {pendingChanges} modification{pendingChanges > 1 ? 's' : ''} en attente
          </span>
        )}
      </div>
    );
  }

  // Online with pending changes
  return (
    <div className={`fixed ${positionClasses} z-50 px-4 py-3 bg-blue-500 text-white flex items-center justify-between`}>
      <div className="flex items-center gap-2">
        <CloudOff className="w-5 h-5" />
        <span className="font-medium">Synchronisation en attente</span>
        <span className="text-blue-100 text-sm">
          - {pendingChanges} modification{pendingChanges > 1 ? 's' : ''} à synchroniser
        </span>
      </div>
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
      </button>
    </div>
  );
}

// Composant compact pour la barre de navigation
export function OfflineStatusBadge() {
  const { isOnline, pendingChanges } = useOffline();

  if (isOnline && pendingChanges === 0) {
    return (
      <div className="flex items-center gap-1 text-green-600" title="Connecté">
        <Wifi className="w-4 h-4" />
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1 text-amber-600" title="Hors ligne">
        <WifiOff className="w-4 h-4" />
        {pendingChanges > 0 && (
          <span className="bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 rounded-full">
            {pendingChanges}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-blue-600" title={`${pendingChanges} en attente`}>
      <CloudOff className="w-4 h-4" />
      <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
        {pendingChanges}
      </span>
    </div>
  );
}
