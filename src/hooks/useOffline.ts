'use client';

import { useState, useEffect, useCallback } from 'react';

interface OfflineData {
  key: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

interface UseOfflineReturn {
  isOnline: boolean;
  isOfflineCapable: boolean;
  pendingChanges: number;
  saveOffline: (key: string, data: any) => Promise<void>;
  getOffline: <T>(key: string) => Promise<T | null>;
  syncPendingChanges: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
}

const DB_NAME = 'wewinbid-offline';
const DB_VERSION = 1;
const STORE_NAME = 'offline-data';

// IndexedDB helper functions
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

async function dbPut(data: OfflineData): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function dbGet<T>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result?.data || null);
  });
}

async function dbGetUnsynced(): Promise<OfflineData[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('synced');
    const request = index.getAll(IDBKeyRange.only(false));
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

async function dbClear(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function dbCountUnsynced(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('synced');
    const request = index.count(IDBKeyRange.only(false));
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineCapable, setIsOfflineCapable] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(0);

  // Check online status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    setIsOfflineCapable('indexedDB' in window && 'serviceWorker' in navigator);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending changes
    dbCountUnsynced().then(setPendingChanges).catch(console.error);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save data for offline use
  const saveOffline = useCallback(async (key: string, data: any) => {
    try {
      await dbPut({
        key,
        data,
        timestamp: Date.now(),
        synced: false,
      });
      const count = await dbCountUnsynced();
      setPendingChanges(count);
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }, []);

  // Get offline data
  const getOffline = useCallback(async <T>(key: string): Promise<T | null> => {
    try {
      return await dbGet<T>(key);
    } catch (error) {
      console.error('Error getting offline data:', error);
      return null;
    }
  }, []);

  // Sync pending changes when online
  const syncPendingChanges = useCallback(async () => {
    if (!isOnline) return;

    try {
      const unsyncedData = await dbGetUnsynced();

      for (const item of unsyncedData) {
        try {
          // Try to sync based on key pattern
          if (item.key.startsWith('draft:tender:')) {
            await fetch('/api/tenders/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data),
            });
          } else if (item.key.startsWith('draft:response:')) {
            await fetch('/api/responses/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data),
            });
          }

          // Mark as synced
          await dbPut({ ...item, synced: true });
        } catch (syncError) {
          console.error(`Error syncing ${item.key}:`, syncError);
        }
      }

      const count = await dbCountUnsynced();
      setPendingChanges(count);
    } catch (error) {
      console.error('Error syncing pending changes:', error);
    }
  }, [isOnline]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingChanges > 0) {
      syncPendingChanges();
    }
  }, [isOnline, pendingChanges, syncPendingChanges]);

  // Clear all offline data
  const clearOfflineData = useCallback(async () => {
    try {
      await dbClear();
      setPendingChanges(0);
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }, []);

  return {
    isOnline,
    isOfflineCapable,
    pendingChanges,
    saveOffline,
    getOffline,
    syncPendingChanges,
    clearOfflineData,
  };
}

// Export offline storage helpers
export { dbPut, dbGet, dbClear };
