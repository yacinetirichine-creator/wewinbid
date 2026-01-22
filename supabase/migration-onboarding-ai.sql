-- Migration: Ajout des colonnes d'onboarding pour l'IA
-- Exécutez ce fichier dans l'éditeur SQL de Supabase

-- Ajouter les colonnes manquantes pour le ciblage IA dans companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS geographic_zones TEXT[] DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS market_types TEXT[] DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS min_budget DECIMAL(15,2);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS max_budget DECIMAL(15,2);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS competencies TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS ai_profile_summary TEXT; -- Résumé généré par l'IA
ALTER TABLE companies ADD COLUMN IF NOT EXISTS ai_last_analysis TIMESTAMPTZ; -- Dernière analyse IA

-- Ajouter les colonnes d'onboarding dans profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_skipped_at TIMESTAMPTZ;

-- Index pour améliorer les recherches
CREATE INDEX IF NOT EXISTS idx_companies_geographic_zones ON companies USING GIN(geographic_zones);
CREATE INDEX IF NOT EXISTS idx_companies_keywords ON companies USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_companies_market_types ON companies USING GIN(market_types);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed);

-- Commentaires pour la documentation
COMMENT ON COLUMN companies.geographic_zones IS 'Zones géographiques ciblées: local, regional, national, european, international';
COMMENT ON COLUMN companies.market_types IS 'Types de marchés ciblés: public, private, both';
COMMENT ON COLUMN companies.keywords IS 'Mots-clés pour le matching IA des appels d''offres';
COMMENT ON COLUMN companies.ai_profile_summary IS 'Résumé du profil entreprise généré par l''IA';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Indique si l''onboarding a été complété';
