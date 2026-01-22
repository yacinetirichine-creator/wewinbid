-- Fix pour Google OAuth - Correction de la table profiles
-- À exécuter dans Supabase SQL Editor

-- 1. Ajouter les colonnes manquantes si elles n'existent pas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 2. Supprimer les contraintes CHECK qui peuvent poser problème
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_interval_check;

-- 3. Recréer la fonction avec gestion d'erreur améliorée
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
  user_avatar TEXT;
BEGIN
  -- Extraire les métadonnées Google
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );
  user_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'given_name',
    ''
  );
  user_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'family_name',
    ''
  );
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    ''
  );

  -- Insérer ou mettre à jour le profil
  INSERT INTO public.profiles (id, email, full_name, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_first_name,
    user_last_name,
    user_avatar
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), profiles.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), profiles.last_name),
    avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), profiles.avatar_url),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Si l'email existe déjà, mettre à jour
    UPDATE public.profiles SET
      full_name = COALESCE(NULLIF(user_full_name, ''), full_name),
      first_name = COALESCE(NULLIF(user_first_name, ''), first_name),
      last_name = COALESCE(NULLIF(user_last_name, ''), last_name),
      avatar_url = COALESCE(NULLIF(user_avatar, ''), avatar_url),
      updated_at = NOW()
    WHERE email = NEW.email;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log l'erreur mais ne pas bloquer l'inscription
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
