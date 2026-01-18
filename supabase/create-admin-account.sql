-- Script de création du compte administrateur WeWinBid
-- Email: contact@wewinbid.com
-- Mot de passe généré: WeWinBid2026@Admin!Secure

-- IMPORTANT: Exécutez ce script dans le SQL Editor de Supabase Dashboard
-- Ce script crée:
-- 1. Un utilisateur auth avec le rôle admin
-- 2. Un profil utilisateur lié
-- 3. Une entreprise JARVIS SAS
-- 4. Lie l'utilisateur à l'entreprise avec le rôle owner

BEGIN;

-- 1. Créer l'utilisateur dans auth.users
-- Note: On utilise une approche qui évite les conflits

-- Vérifier si l'utilisateur existe déjà
DO $$
DECLARE
  existing_user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_user_count
  FROM auth.users
  WHERE email = 'contact@wewinbid.com';
  
  IF existing_user_count = 0 THEN
    -- L'utilisateur n'existe pas, on le crée
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'contact@wewinbid.com',
      crypt('WeWinBid2026@Admin!Secure', gen_salt('bf')), -- Mot de passe hashé
      NOW(),
      NULL,
      NULL,
      '{"provider":"email","providers":["email"],"role":"admin"}',
      '{"full_name":"WeWinBid Admin","role":"admin"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
    RAISE NOTICE 'Utilisateur créé avec succès';
  ELSE
    RAISE NOTICE 'Utilisateur existe déjà - script ignoré pour auth.users';
  END IF;
END $$;

-- Stocker l'ID de l'utilisateur créé
DO $$
DECLARE
  admin_user_id UUID;
  jarvis_company_id UUID;
BEGIN
  -- Récupérer l'ID de l'utilisateur admin
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'contact@wewinbid.com';

  -- 2. Créer le profil utilisateur
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    job_title,
    locale,
    timezone,
    email_notifications,
    subscription_plan,
    subscription_status,
    stripe_customer_id,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    'contact@wewinbid.com',
    'WeWinBid Administrator',
    '+33 1 23 45 67 89',
    'Administrator',
    'fr',
    'Europe/Paris',
    true,
    'business', -- Plan Business pour l'admin
    'active',
    NULL, -- Pas de Stripe pour le compte admin
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    job_title = EXCLUDED.job_title,
    subscription_plan = EXCLUDED.subscription_plan,
    updated_at = NOW();

  -- 3. Créer l'entreprise JARVIS SAS
  INSERT INTO public.companies (
    id,
    name,
    legal_name,
    siret,
    siren,
    address,
    city,
    postal_code,
    country,
    phone,
    email,
    website,
    description,
    sectors,
    subscription_plan,
    subscription_status,
    monthly_tenders_limit,
    storage_limit,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'JARVIS SAS',
    'JARVIS Société par Actions Simplifiée',
    '12345678901234', -- SIRET fictif - à remplacer
    '123456789', -- SIREN fictif - à remplacer
    '123 Avenue des Champs-Élysées',
    'Paris',
    '75008',
    'FR',
    '+33 1 23 45 67 89',
    'contact@wewinbid.com',
    'https://wewinbid.com',
    'Éditeur de la plateforme SaaS B2B d''automatisation des réponses aux appels d''offres WeWinBid',
    ARRAY['IT_SOFTWARE', 'CONSULTING']::sector[],
    'BUSINESS',
    'active',
    999999, -- Illimité
    1099511627776, -- 1TB
    NOW(),
    NOW()
  ) ON CONFLICT (siret) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW()
  RETURNING id INTO jarvis_company_id;

  -- 4. Lier l'utilisateur admin à l'entreprise JARVIS
  INSERT INTO public.company_members (
    id,
    company_id,
    user_id,
    role,
    invited_by,
    joined_at
  ) VALUES (
    gen_random_uuid(),
    jarvis_company_id,
    admin_user_id,
    'owner',
    NULL,
    NOW()
  ) ON CONFLICT (company_id, user_id) DO UPDATE SET
    role = 'owner',
    joined_at = NOW();

  -- Afficher un message de confirmation
  RAISE NOTICE 'Compte administrateur créé avec succès!';
  RAISE NOTICE 'Email: contact@wewinbid.com';
  RAISE NOTICE 'Mot de passe: WeWinBid2026@Admin!Secure';
  RAISE NOTICE 'User ID: %', admin_user_id;
  RAISE NOTICE 'Company ID: %', jarvis_company_id;
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Changez le mot de passe après la première connexion!';
  RAISE NOTICE 'IMPORTANT: Remplacez le SIRET/SIREN fictif par les vrais numéros de JARVIS SAS';

END $$;

-- 5. Confirmer l'email automatiquement
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'contact@wewinbid.com';

COMMIT;

-- ============================================
-- INFORMATIONS DE CONNEXION
-- ============================================
-- Email: contact@wewinbid.com
-- Mot de passe: WeWinBid2026@Admin!Secure
-- 
-- Ce mot de passe contient:
-- - 26 caractères
-- - Majuscules, minuscules, chiffres, symboles
-- - Nom de marque + année + indication admin + sécurité
-- 
-- IMPORTANT: Changez ce mot de passe après la première connexion!
-- ============================================
