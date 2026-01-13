-- Migration: Add role-based access control
-- Date: 2026-01-13
-- Description: Ajoute le champ role dans profiles pour distinguer users/admins

-- Ajouter la colonne role dans profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Index pour améliorer les performances des requêtes admin
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Mettre à jour les profils existants (tous users par défaut)
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- Créer le compte admin principal
UPDATE profiles SET role = 'admin' WHERE email = 'contact@wewinbid.com';

-- Ajouter des champs supplémentaires pour les métriques company
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'business'));

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled'));

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS is_marketplace_visible BOOLEAN DEFAULT false;

-- Ajouter la relation buyer dans tenders
ALTER TABLE tenders
ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES buyers(id);

-- Créer la table buyers si elle n'existe pas
CREATE TABLE IF NOT EXISTS buyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('PUBLIC', 'PRIVATE')),
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_buyers_name ON buyers(name);
CREATE INDEX IF NOT EXISTS idx_tenders_buyer_id ON tenders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_plan ON companies(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_status ON companies(subscription_status);

-- RLS policies pour buyers
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir tous les buyers
CREATE POLICY "Users can view all buyers"
  ON buyers FOR SELECT
  USING (true);

-- Les utilisateurs peuvent créer des buyers
CREATE POLICY "Users can create buyers"
  ON buyers FOR INSERT
  WITH CHECK (true);

-- Les admins peuvent tout faire
CREATE POLICY "Admins can do everything on buyers"
  ON buyers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON COLUMN profiles.role IS 'Rôle de l''utilisateur: user (défaut) ou admin';
COMMENT ON TABLE buyers IS 'Table des acheteurs/clients des appels d''offres';
