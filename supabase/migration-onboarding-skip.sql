-- Migration pour ajouter la fonctionnalité d'exploration de 24h avant onboarding obligatoire

-- Ajouter la colonne onboarding_skipped_at à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_skipped_at timestamptz DEFAULT NULL;

-- Commentaire explicatif
COMMENT ON COLUMN public.profiles.onboarding_skipped_at IS 'Date à laquelle l utilisateur a choisi d explorer l application sans configurer son entreprise. L onboarding devient obligatoire 24h après cette date.';

-- Index pour les requêtes de vérification
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_skipped_at 
ON public.profiles(onboarding_skipped_at) 
WHERE onboarding_skipped_at IS NOT NULL;
