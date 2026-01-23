/**
 * Helper functions pour gérer les entreprises et l'isolation multi-tenant
 */

import { createClient } from '@/lib/supabase/client';

/**
 * Récupère le company_id de l'utilisateur connecté
 * @returns company_id ou null si non trouvé
 */
export async function getUserCompanyId(): Promise<string | null> {
  try {
    const supabase = createClient();
    
    // Vérifier l'utilisateur connecté
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Utilisateur non connecté:', userError);
      return null;
    }

    // Récupérer le company_id via company_members
    const { data, error } = await (supabase
      .from('company_members') as any)
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Erreur récupération company_id:', error);
      return null;
    }

    return data?.company_id || null;
  } catch (err) {
    console.error('Erreur getUserCompanyId:', err);
    return null;
  }
}

/**
 * Récupère les informations complètes de l'entreprise de l'utilisateur
 */
export async function getUserCompany(): Promise<{
  companyId: string;
  companyName: string;
  role: string;
} | null> {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return null;
    }

    const { data, error } = await (supabase
      .from('company_members') as any)
      .select(`
        company_id,
        role,
        companies (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      companyId: data.company_id,
      companyName: data.companies?.name || '',
      role: data.role,
    };
  } catch (err) {
    console.error('Erreur getUserCompany:', err);
    return null;
  }
}

/**
 * Vérifie si l'utilisateur a accès à un tender spécifique
 * @param tenderId ID du tender à vérifier
 * @returns true si l'utilisateur a accès, false sinon
 */
export async function canAccessTender(tenderId: string): Promise<boolean> {
  try {
    const companyId = await getUserCompanyId();
    if (!companyId) return false;

    const supabase = createClient();
    const { data, error } = await (supabase as any)
      .from('tenders')
      .select('id')
      .eq('id', tenderId)
      .eq('company_id', companyId)
      .single();

    return !error && !!data;
  } catch (err) {
    console.error('Erreur canAccessTender:', err);
    return false;
  }
}
