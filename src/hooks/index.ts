/**
 * Hooks React personnalisés pour WeWinBid
 * 
 * @module hooks
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

/**
 * Hook pour gérer l'authentification Supabase
 * 
 * @returns {object} État d'authentification et méthodes
 * 
 * @example
 * ```tsx
 * const { user, loading, signOut } = useAuth();
 * 
 * if (loading) return <Loader />;
 * if (!user) return <Login />;
 * ```
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Récupérer l'utilisateur initial
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  return { user, loading, signOut, supabase };
}

/**
 * Hook pour gérer la génération d'images avec DALL-E
 * 
 * @returns {object} État et fonction de génération
 * 
 * @example
 * ```tsx
 * const { generateImage, loading, image, error } = useImageGenerator();
 * 
 * const handleGenerate = async () => {
 *   await generateImage({
 *     prompt: "Une équipe professionnelle",
 *     style: "professional"
 *   });
 * };
 * ```
 */
export function useImageGenerator() {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const generateImage = useCallback(async (data: {
    prompt: string;
    style?: string;
    size?: string;
    quality?: string;
    context?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la génération');
      }

      setImage(result);
      toast.success('Image générée avec succès !');
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la génération';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setImage(null);
    setError(null);
  }, []);

  return { generateImage, loading, image, error, reset };
}

/**
 * Hook pour gérer les appels d'offres
 * 
 * @returns {object} État et méthodes CRUD pour les tenders
 * 
 * @example
 * ```tsx
 * const { tenders, loading, fetchTenders, createTender } = useTenders();
 * 
 * useEffect(() => {
 *   fetchTenders();
 * }, []);
 * ```
 */
export function useTenders() {
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchTenders = useCallback(async (filters?: {
    status?: string;
    type?: string;
    search?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,reference.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTenders(data || []);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const createTender = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création');
      }

      toast.success('Appel d\'offres créé avec succès !');
      await fetchTenders();
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la création';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTenders]);

  return { tenders, loading, error, fetchTenders, createTender };
}

/**
 * Hook pour le debounce (optimisation des recherches)
 * 
 * @param value - Valeur à debouncer
 * @param delay - Délai en millisecondes
 * @returns Valeur debouncée
 * 
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 500);
 * 
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     fetchResults(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook pour gérer l'état local avec localStorage
 * 
 * @param key - Clé de stockage
 * @param initialValue - Valeur initiale
 * @returns [valeur, setter] comme useState
 * 
 * @example
 * ```tsx
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}
