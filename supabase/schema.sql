-- WeWinBid - Schéma Supabase Complet
-- Exécutez ce fichier dans l'éditeur SQL de Supabase
-- Commercialisé par JARVIS SAS

-- ===========================================
-- EXTENSIONS
-- ===========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Pour la recherche full-text

-- ===========================================
-- TYPES ENUM
-- ===========================================

-- Types d'abonnement
CREATE TYPE subscription_plan AS ENUM ('FREE', 'PRO', 'BUSINESS', 'ENTERPRISE');

-- Types de marchés
CREATE TYPE tender_type AS ENUM ('PUBLIC', 'PRIVATE');

-- Statuts des appels d'offres
CREATE TYPE tender_status AS ENUM (
  'DRAFT', 
  'ANALYSIS', 
  'IN_PROGRESS', 
  'REVIEW', 
  'SUBMITTED', 
  'WON', 
  'LOST', 
  'ABANDONED'
);

-- Secteurs d'activité
CREATE TYPE sector AS ENUM (
  'SECURITY_PRIVATE',
  'SECURITY_ELECTRONIC', 
  'CONSTRUCTION',
  'LOGISTICS',
  'IT_SOFTWARE',
  'MAINTENANCE',
  'CONSULTING',
  'CLEANING',
  'CATERING',
  'TRANSPORT',
  'ENERGY',
  'HEALTHCARE',
  'EDUCATION',
  'OTHER'
);

-- Types d'acheteurs
CREATE TYPE buyer_type AS ENUM (
  'STATE',
  'REGION',
  'DEPARTMENT',
  'MUNICIPALITY',
  'PUBLIC_ESTABLISHMENT',
  'HOSPITAL',
  'PRIVATE_COMPANY',
  'ASSOCIATION',
  'OTHER'
);

-- Types de documents
CREATE TYPE document_type AS ENUM (
  'DC1', 'DC2', 'DC4',
  'TECHNICAL_MEMO', 'DPGF', 'BPU',
  'ACTE_ENGAGEMENT', 'PLANNING', 'METHODOLOGY',
  'QUALITY_PLAN', 'SAFETY_PLAN', 'ENVIRONMENTAL_PLAN',
  'REFERENCES_LIST', 'COMMERCIAL_PROPOSAL', 'QUOTE',
  'COMPANY_PRESENTATION', 'COVER_LETTER', 'APPENDIX',
  'INSURANCE_RC', 'INSURANCE_DECENNALE',
  'TAX_ATTESTATION', 'SOCIAL_ATTESTATION',
  'KBIS', 'RIB', 'OTHER'
);

-- Statuts des documents
CREATE TYPE document_status AS ENUM ('DRAFT', 'IN_PROGRESS', 'REVIEW', 'VALIDATED', 'SUBMITTED');

-- Statuts des partenariats
CREATE TYPE partnership_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED');

-- Rôles collaborateur
CREATE TYPE collaborator_role AS ENUM ('OWNER', 'EDITOR', 'COMMENTER', 'VIEWER');

-- Types de contenu créatif
CREATE TYPE content_type AS ENUM ('LINKEDIN_POST', 'PRESS_RELEASE', 'CASE_STUDY', 'NEWSLETTER', 'TWEET');

-- Plateformes sociales
CREATE TYPE social_platform AS ENUM ('LINKEDIN', 'TWITTER', 'FACEBOOK', 'INSTAGRAM');

-- Statuts du contenu
CREATE TYPE content_status AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- Types d'activité
CREATE TYPE activity_type AS ENUM (
  'TENDER_CREATED', 'TENDER_UPDATED', 'TENDER_SUBMITTED',
  'TENDER_WON', 'TENDER_LOST',
  'DOCUMENT_CREATED', 'DOCUMENT_UPDATED', 'DOCUMENT_VALIDATED',
  'COLLABORATION_ADDED', 'COLLABORATION_REMOVED',
  'PARTNERSHIP_REQUEST', 'PARTNERSHIP_ACCEPTED',
  'SCORE_CALCULATED', 'ALERT_RECEIVED'
);

-- Types de notification
CREATE TYPE notification_type AS ENUM (
  'TENDER_DEADLINE', 'TENDER_RESULT',
  'DOCUMENT_EXPIRING', 'PARTNERSHIP_REQUEST',
  'COLLABORATION_INVITE', 'SCORE_READY',
  'NEW_OPPORTUNITY', 'SYSTEM'
);

-- ===========================================
-- TABLES PRINCIPALES
-- ===========================================

-- Profils utilisateurs (extension de auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  job_title TEXT,
  locale TEXT DEFAULT 'fr',
  timezone TEXT DEFAULT 'Europe/Paris',
  email_notifications BOOLEAN DEFAULT TRUE,
  -- Subscription fields
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'business')),
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
  subscription_interval TEXT CHECK (subscription_interval IN ('monthly', 'yearly')),
  subscription_current_period_end TIMESTAMPTZ,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entreprises
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  legal_name TEXT,
  siret TEXT UNIQUE,
  siren TEXT,
  vat_number TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'FR',
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  description TEXT,
  sectors sector[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  annual_revenue DECIMAL(15,2),
  employee_count INTEGER,
  founded_year INTEGER,
  -- Abonnement
  subscription_plan subscription_plan DEFAULT 'FREE',
  subscription_status TEXT DEFAULT 'active',
  subscription_period_end TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  -- Limites
  monthly_tenders_used INTEGER DEFAULT 0,
  monthly_tenders_limit INTEGER DEFAULT 2,
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 104857600, -- 100MB pour FREE
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relation utilisateur-entreprise
CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- owner, admin, member
  invited_by UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- Appels d'offres
CREATE TABLE IF NOT EXISTS tenders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type tender_type DEFAULT 'PUBLIC',
  status tender_status DEFAULT 'DRAFT',
  sector sector,
  -- Informations acheteur
  buyer_name TEXT,
  buyer_type buyer_type,
  buyer_contact TEXT,
  buyer_email TEXT,
  buyer_phone TEXT,
  -- Montants
  estimated_value DECIMAL(15,2),
  proposed_price DECIMAL(15,2),
  winning_price DECIMAL(15,2),
  -- Dates
  publication_date DATE,
  deadline DATE,
  submission_date TIMESTAMPTZ,
  result_date DATE,
  -- IA & Scoring
  ai_score INTEGER, -- 0-100
  ai_analysis JSONB,
  ai_recommendations TEXT[],
  -- Localisation
  region TEXT,
  department TEXT,
  -- Liens
  source_url TEXT,
  platform TEXT, -- BOAMP, TED, etc.
  -- Métadonnées
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type document_type,
  status document_status DEFAULT 'DRAFT',
  file_url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  content TEXT, -- Contenu généré par IA
  version INTEGER DEFAULT 1,
  is_template BOOLEAN DEFAULT FALSE,
  expires_at DATE,
  -- Relations
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Versions de documents (historique)
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT,
  file_url TEXT,
  changes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partenariats (Marketplace)
CREATE TABLE IF NOT EXISTS partnerships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  status partnership_status DEFAULT 'PENDING',
  message TEXT,
  sectors sector[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, partner_id)
);

-- Collaborations sur les AO
CREATE TABLE IF NOT EXISTS collaborations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role collaborator_role DEFAULT 'VIEWER',
  permissions JSONB,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tender_id, user_id)
);

-- Historique des prix
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_ref TEXT,
  tender_title TEXT,
  sector sector,
  buyer_type buyer_type,
  proposed_price DECIMAL(15,2),
  winning_price DECIMAL(15,2),
  won BOOLEAN,
  date DATE DEFAULT CURRENT_DATE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analyse des gagnants
CREATE TABLE IF NOT EXISTS winner_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_ref TEXT,
  tender_title TEXT,
  sector sector,
  buyer_name TEXT,
  buyer_type buyer_type,
  winner_name TEXT,
  winner_siret TEXT,
  winning_price DECIMAL(15,2),
  estimated_value DECIMAL(15,2),
  award_date DATE,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alertes AO
CREATE TABLE IF NOT EXISTS tender_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  sectors sector[] DEFAULT '{}',
  regions TEXT[] DEFAULT '{}',
  min_value DECIMAL(15,2),
  max_value DECIMAL(15,2),
  buyer_types buyer_type[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contenu créatif (Studio)
CREATE TABLE IF NOT EXISTS creative_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type content_type,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  platform social_platform,
  status content_status DEFAULT 'DRAFT',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activités (logs)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type activity_type NOT NULL,
  description TEXT,
  metadata JSONB,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Références clients (générées par IA)
CREATE TABLE IF NOT EXISTS client_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name TEXT NOT NULL,
  project_title TEXT NOT NULL,
  description TEXT,
  sector sector,
  start_date DATE,
  end_date DATE,
  contract_value DECIMAL(15,2),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_confidential BOOLEAN DEFAULT FALSE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- INDEXES
-- ===========================================

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_companies_siret ON companies(siret);
CREATE INDEX idx_companies_subscription ON companies(subscription_plan);
CREATE INDEX idx_tenders_company ON tenders(company_id);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_type ON tenders(type);
CREATE INDEX idx_tenders_deadline ON tenders(deadline);
CREATE INDEX idx_tenders_sector ON tenders(sector);
CREATE INDEX idx_documents_tender ON documents(tender_id);
CREATE INDEX idx_documents_company ON documents(company_id);
CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_company ON activities(company_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_price_history_company ON price_history(company_id);
CREATE INDEX idx_partnerships_company ON partnerships(company_id);

-- Full-text search sur les AO
CREATE INDEX idx_tenders_search ON tenders USING gin(to_tsvector('french', coalesce(title, '') || ' ' || coalesce(description, '')));

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_references ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité

-- Profiles: utilisateur peut voir/modifier son propre profil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Companies: membres peuvent voir leur entreprise
DROP POLICY IF EXISTS "Members can view company" ON companies;
DROP POLICY IF EXISTS "Owners can update company" ON companies;
CREATE POLICY "Members can view company" ON companies FOR SELECT 
  USING (id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));
CREATE POLICY "Owners can update company" ON companies FOR UPDATE 
  USING (id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND role = 'owner'));

-- Tenders: membres de l'entreprise peuvent voir/modifier
DROP POLICY IF EXISTS "Members can view tenders" ON tenders;
DROP POLICY IF EXISTS "Members can insert tenders" ON tenders;
DROP POLICY IF EXISTS "Members can update tenders" ON tenders;
DROP POLICY IF EXISTS "Members can delete tenders" ON tenders;
CREATE POLICY "Members can view tenders" ON tenders FOR SELECT 
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can insert tenders" ON tenders FOR INSERT 
  WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can update tenders" ON tenders FOR UPDATE 
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can delete tenders" ON tenders FOR DELETE 
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- Documents: accès via l'entreprise
DROP POLICY IF EXISTS "Members can view documents" ON documents;
DROP POLICY IF EXISTS "Members can manage documents" ON documents;
CREATE POLICY "Members can view documents" ON documents FOR SELECT 
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can manage documents" ON documents FOR ALL 
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- Notifications: utilisateur voit ses propres notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Activities: membres voient les activités de leur entreprise
DROP POLICY IF EXISTS "Members can view activities" ON activities;
CREATE POLICY "Members can view activities" ON activities FOR SELECT 
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- ===========================================
-- FONCTIONS & TRIGGERS
-- ===========================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tenders_updated_at BEFORE UPDATE ON tenders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Fonction pour créer un profil après inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil automatiquement
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Fonction pour générer une référence d'AO
CREATE OR REPLACE FUNCTION generate_tender_reference()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  year_str TEXT;
  count_num INTEGER;
BEGIN
  prefix := CASE WHEN NEW.type = 'PUBLIC' THEN 'AO' ELSE 'PRV' END;
  year_str := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COUNT(*) + 1 INTO count_num
  FROM tenders
  WHERE company_id = NEW.company_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  NEW.reference := prefix || '-' || year_str || '-' || LPAD(count_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_tender_ref
  BEFORE INSERT ON tenders
  FOR EACH ROW
  WHEN (NEW.reference IS NULL OR NEW.reference = '')
  EXECUTE FUNCTION generate_tender_reference();

-- Fonction pour incrémenter le compteur mensuel
CREATE OR REPLACE FUNCTION increment_monthly_tenders()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE companies
  SET monthly_tenders_used = monthly_tenders_used + 1
  WHERE id = NEW.company_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_tender_created
  AFTER INSERT ON tenders
  FOR EACH ROW EXECUTE FUNCTION increment_monthly_tenders();

-- Fonction pour réinitialiser les compteurs mensuels (à appeler via cron)
CREATE OR REPLACE FUNCTION reset_monthly_counters()
RETURNS void AS $$
BEGIN
  UPDATE companies SET monthly_tenders_used = 0;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- DONNÉES INITIALES
-- ===========================================

-- Insérer quelques analyses de gagnants pour la démo
INSERT INTO winner_analysis (tender_ref, tender_title, sector, buyer_name, buyer_type, winner_name, winning_price, award_date, source) VALUES
('BOAMP-2024-001234', 'Marché de gardiennage', 'SECURITY_PRIVATE', 'Mairie de Paris', 'MUNICIPALITY', 'Securitas France', 450000, '2024-06-15', 'BOAMP'),
('BOAMP-2024-002345', 'Installation vidéosurveillance', 'SECURITY_ELECTRONIC', 'Région Île-de-France', 'REGION', 'Axis Communications', 280000, '2024-07-20', 'BOAMP'),
('BOAMP-2024-003456', 'Maintenance ascenseurs', 'MAINTENANCE', 'CHU Lyon', 'HOSPITAL', 'OTIS France', 120000, '2024-08-10', 'BOAMP');
