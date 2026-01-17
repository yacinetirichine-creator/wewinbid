-- ============================================================
-- FEATURE #25: DASHBOARD PERSONNALISÉ & MULTI-LANGUES
-- ============================================================
-- Description: Dashboard avec filtres multi-domaines, traduction de projets, intégrations API
-- Features:
--   - Profils enrichis (secteurs multiples, mots-clés, langues)
--   - Traduction de tenders (AI ou manuelle)
--   - Dashboard personnalisé avec matching intelligent
--   - Intégrations API externes (BOAMP, TED, etc.)
--   - Sync automatique des marchés publics
-- Tables: tender_translations, external_sources, source_sync_logs, user_preferences
-- Created: January 2026
-- ============================================================

-- ============================================================
-- 1. ENRICHIR LA TABLE PROFILES
-- ============================================================

-- Ajouter les colonnes de préférences utilisateur
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_sectors TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_countries TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{fr}',
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "email": true,
  "push": true,
  "frequency": "daily",
  "match_threshold": 70
}'::jsonb;

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_sectors ON profiles USING GIN(preferred_sectors);
CREATE INDEX IF NOT EXISTS idx_profiles_keywords ON profiles USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_profiles_target_countries ON profiles USING GIN(target_countries);
CREATE INDEX IF NOT EXISTS idx_profiles_languages ON profiles USING GIN(languages);

COMMENT ON COLUMN profiles.preferred_sectors IS 'Secteurs d''activité ciblés (multiples)';
COMMENT ON COLUMN profiles.keywords IS 'Mots-clés de veille pour matching automatique';
COMMENT ON COLUMN profiles.target_countries IS 'Pays ciblés pour les appels d''offres';
COMMENT ON COLUMN profiles.languages IS 'Langues maîtrisées par l''utilisateur/entreprise';

-- ============================================================
-- 2. TABLE TENDER TRANSLATIONS
-- ============================================================

DROP TABLE IF EXISTS tender_translations CASCADE;

CREATE TABLE tender_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source tender
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  
  -- Translation details
  source_language VARCHAR(10) NOT NULL, -- 'fr', 'en', 'de', 'es', etc.
  target_language VARCHAR(10) NOT NULL,
  
  -- Translated content
  title_translated TEXT NOT NULL,
  description_translated TEXT,
  
  -- Full content translation
  content JSONB DEFAULT '{}', -- Stocke toutes les traductions de champs
  
  -- Translation method
  translation_method VARCHAR(20) NOT NULL DEFAULT 'AI', -- 'AI', 'MANUAL', 'HYBRID'
  ai_model VARCHAR(50), -- 'gpt-4', 'deepl', 'google-translate'
  
  -- Quality
  quality_score DECIMAL(3,2), -- 0.00 to 1.00
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'DRAFT', -- 'DRAFT', 'PUBLISHED', 'ARCHIVED'
  
  -- Metadata
  translation_notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_tender_translation UNIQUE(tender_id, target_language),
  CONSTRAINT valid_translation_method CHECK (translation_method IN ('AI', 'MANUAL', 'HYBRID')),
  CONSTRAINT valid_translation_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  CONSTRAINT valid_quality_score CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 1))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tender_translations_tender_id ON tender_translations(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_translations_target_language ON tender_translations(target_language);
CREATE INDEX IF NOT EXISTS idx_tender_translations_status ON tender_translations(status);
CREATE INDEX IF NOT EXISTS idx_tender_translations_created_at ON tender_translations(created_at DESC);

-- ============================================================
-- 3. TABLE EXTERNAL SOURCES (Intégrations API)
-- ============================================================

DROP TABLE IF EXISTS external_sources CASCADE;

CREATE TABLE external_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source info
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  country VARCHAR(10), -- 'FR', 'DE', 'EU', etc.
  
  -- Source type
  source_type VARCHAR(50) NOT NULL, -- 'API', 'SCRAPER', 'RSS', 'WEBHOOK'
  
  -- Connection details
  base_url TEXT NOT NULL,
  api_key_encrypted TEXT, -- Encrypted API key
  auth_type VARCHAR(20) DEFAULT 'API_KEY', -- 'API_KEY', 'OAUTH', 'BASIC', 'NONE'
  
  -- Configuration
  config JSONB DEFAULT '{}', -- Headers, params, mapping, etc.
  field_mapping JSONB DEFAULT '{}', -- Map external fields to internal schema
  
  -- Sync settings
  sync_enabled BOOLEAN DEFAULT TRUE,
  sync_frequency VARCHAR(20) DEFAULT 'DAILY', -- 'HOURLY', 'DAILY', 'WEEKLY', 'MANUAL'
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Stats
  total_synced INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2), -- Percentage
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_source_type CHECK (source_type IN ('API', 'SCRAPER', 'RSS', 'WEBHOOK')),
  CONSTRAINT valid_sync_frequency CHECK (sync_frequency IN ('HOURLY', 'DAILY', 'WEEKLY', 'MANUAL'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_external_sources_country ON external_sources(country);
CREATE INDEX IF NOT EXISTS idx_external_sources_sync_enabled ON external_sources(sync_enabled);
CREATE INDEX IF NOT EXISTS idx_external_sources_next_sync_at ON external_sources(next_sync_at);

-- ============================================================
-- 4. TABLE SOURCE SYNC LOGS
-- ============================================================

DROP TABLE IF EXISTS source_sync_logs CASCADE;

CREATE TABLE source_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source
  source_id UUID NOT NULL REFERENCES external_sources(id) ON DELETE CASCADE,
  
  -- Sync details
  sync_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_ended_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'RUNNING', -- 'RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL'
  
  -- Results
  items_fetched INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  
  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  
  -- Performance
  duration_ms INTEGER,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_sync_status CHECK (status IN ('RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_source_sync_logs_source_id ON source_sync_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_source_sync_logs_status ON source_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_source_sync_logs_created_at ON source_sync_logs(created_at DESC);

-- ============================================================
-- 5. TABLE USER DASHBOARD PREFERENCES
-- ============================================================

DROP TABLE IF EXISTS user_dashboard_preferences CASCADE;

CREATE TABLE user_dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dashboard layout
  layout JSONB DEFAULT '{
    "widgets": ["matched_tenders", "deadlines", "stats", "recent_activity"],
    "columns": 2
  }'::jsonb,
  
  -- Filters
  default_filters JSONB DEFAULT '{}',
  
  -- Display preferences
  tenders_per_page INTEGER DEFAULT 20,
  sort_by VARCHAR(50) DEFAULT 'deadline_asc', -- 'deadline_asc', 'match_score_desc', 'created_desc'
  
  -- Matching settings
  auto_match_enabled BOOLEAN DEFAULT TRUE,
  min_match_score INTEGER DEFAULT 70, -- 0-100
  
  -- Notifications
  notify_new_matches BOOLEAN DEFAULT TRUE,
  notify_deadlines BOOLEAN DEFAULT TRUE,
  deadline_alert_days INTEGER DEFAULT 7, -- Alert X days before deadline
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_dashboard_preferences_user_id ON user_dashboard_preferences(user_id);

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE tender_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view translations for accessible tenders" ON tender_translations;
DROP POLICY IF EXISTS "Users can create translations for own tenders" ON tender_translations;
DROP POLICY IF EXISTS "Users can update own translations" ON tender_translations;
DROP POLICY IF EXISTS "Everyone can view active external sources" ON external_sources;
DROP POLICY IF EXISTS "Admins can manage external sources" ON external_sources;
DROP POLICY IF EXISTS "Admins can view sync logs" ON source_sync_logs;
DROP POLICY IF EXISTS "System can create sync logs" ON source_sync_logs;
DROP POLICY IF EXISTS "Users can view own dashboard preferences" ON user_dashboard_preferences;
DROP POLICY IF EXISTS "Users can manage own dashboard preferences" ON user_dashboard_preferences;

-- Tender Translations: Users can view translations for accessible tenders
CREATE POLICY "Users can view translations for accessible tenders"
  ON tender_translations FOR SELECT
  USING (
    tender_id IN (
      SELECT id FROM tenders 
      WHERE created_by = auth.uid()
        OR company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  );

-- Tender Translations: Users can create translations
CREATE POLICY "Users can create translations for own tenders"
  ON tender_translations FOR INSERT
  WITH CHECK (
    tender_id IN (
      SELECT id FROM tenders WHERE created_by = auth.uid()
    )
  );

-- Tender Translations: Users can update own translations
CREATE POLICY "Users can update own translations"
  ON tender_translations FOR UPDATE
  USING (
    tender_id IN (
      SELECT id FROM tenders WHERE created_by = auth.uid()
    )
  );

-- External Sources: Everyone can view active sources
CREATE POLICY "Everyone can view active external sources"
  ON external_sources FOR SELECT
  USING (is_active = TRUE);

-- External Sources: Admins can manage
CREATE POLICY "Admins can manage external sources"
  ON external_sources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sync Logs: Admins can view
CREATE POLICY "Admins can view sync logs"
  ON source_sync_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sync Logs: System can create
CREATE POLICY "System can create sync logs"
  ON source_sync_logs FOR INSERT
  WITH CHECK (true);

-- Dashboard Preferences: Users can view own
CREATE POLICY "Users can view own dashboard preferences"
  ON user_dashboard_preferences FOR SELECT
  USING (user_id = auth.uid());

-- Dashboard Preferences: Users can manage own
CREATE POLICY "Users can manage own dashboard preferences"
  ON user_dashboard_preferences FOR ALL
  USING (user_id = auth.uid());

-- ============================================================
-- 7. HELPER FUNCTIONS
-- ============================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS calculate_tender_match_score(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_matched_tenders(UUID, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS translate_tender(UUID, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_dashboard_stats(UUID) CASCADE;

-- Function: Calculate match score between user and tender
CREATE OR REPLACE FUNCTION calculate_tender_match_score(
  p_user_id UUID,
  p_tender_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score INTEGER := 0;
  v_user_sectors TEXT[];
  v_user_keywords TEXT[];
  v_user_countries TEXT[];
  v_tender RECORD;
BEGIN
  -- Get user preferences
  SELECT preferred_sectors, keywords, target_countries
  INTO v_user_sectors, v_user_keywords, v_user_countries
  FROM profiles
  WHERE id = p_user_id;
  
  -- Get tender details
  SELECT sector, country, title, description
  INTO v_tender
  FROM tenders
  WHERE id = p_tender_id;
  
  -- Score by sector match (40 points)
  IF v_tender.sector = ANY(v_user_sectors) THEN
    v_score := v_score + 40;
  END IF;
  
  -- Score by country match (30 points)
  IF v_tender.country = ANY(v_user_countries) THEN
    v_score := v_score + 30;
  END IF;
  
  -- Score by keywords match (30 points)
  IF v_user_keywords IS NOT NULL AND array_length(v_user_keywords, 1) > 0 THEN
    DECLARE
      keyword TEXT;
      matches INTEGER := 0;
    BEGIN
      FOREACH keyword IN ARRAY v_user_keywords
      LOOP
        IF v_tender.title ILIKE '%' || keyword || '%' 
          OR v_tender.description ILIKE '%' || keyword || '%' THEN
          matches := matches + 1;
        END IF;
      END LOOP;
      
      -- Proportional score based on keyword matches
      v_score := v_score + LEAST(30, matches * 10);
    END;
  END IF;
  
  RETURN LEAST(100, v_score);
END;
$$;

-- Function: Get matched tenders for user dashboard
CREATE OR REPLACE FUNCTION get_user_matched_tenders(
  p_user_id UUID DEFAULT NULL,
  p_min_score INTEGER DEFAULT 70,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  tender_id UUID,
  title TEXT,
  buyer_name TEXT,
  country VARCHAR,
  sector VARCHAR,
  deadline DATE,
  match_score INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.buyer_name,
    t.country,
    t.sector,
    t.deadline,
    calculate_tender_match_score(COALESCE(p_user_id, auth.uid()), t.id) as match_score,
    t.created_at
  FROM tenders t
  WHERE t.deadline >= CURRENT_DATE
    AND calculate_tender_match_score(COALESCE(p_user_id, auth.uid()), t.id) >= p_min_score
  ORDER BY match_score DESC, t.deadline ASC
  LIMIT p_limit;
END;
$$;

-- Function: Auto-translate tender using AI
CREATE OR REPLACE FUNCTION translate_tender(
  p_tender_id UUID,
  p_source_lang VARCHAR,
  p_target_lang VARCHAR,
  p_ai_model VARCHAR DEFAULT 'gpt-4'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_translation_id UUID;
  v_tender RECORD;
BEGIN
  -- Get tender content
  SELECT title, description INTO v_tender
  FROM tenders
  WHERE id = p_tender_id;
  
  -- Create translation entry (actual translation done by backend)
  INSERT INTO tender_translations (
    tender_id,
    source_language,
    target_language,
    title_translated,
    description_translated,
    translation_method,
    ai_model,
    status
  ) VALUES (
    p_tender_id,
    p_source_lang,
    p_target_lang,
    '[TO BE TRANSLATED: ' || v_tender.title || ']',
    '[TO BE TRANSLATED: ' || v_tender.description || ']',
    'AI',
    p_ai_model,
    'DRAFT'
  )
  ON CONFLICT (tender_id, target_language) 
  DO UPDATE SET
    updated_at = NOW(),
    status = 'DRAFT'
  RETURNING id INTO v_translation_id;
  
  RETURN v_translation_id;
END;
$$;

-- Function: Get dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_matched_tenders INTEGER,
  upcoming_deadlines INTEGER,
  active_searches INTEGER,
  win_rate DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER 
     FROM tenders t
     WHERE calculate_tender_match_score(v_user_id, t.id) >= 70
       AND t.deadline >= CURRENT_DATE) as total_matched,
    
    (SELECT COUNT(*)::INTEGER
     FROM tenders t
     WHERE calculate_tender_match_score(v_user_id, t.id) >= 70
       AND t.deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + 7) as upcoming,
    
    (SELECT COUNT(*)::INTEGER
     FROM saved_searches
     WHERE user_id = v_user_id
       AND notify_new_results = TRUE) as active_searches,
    
    (SELECT COALESCE(
       (COUNT(*) FILTER (WHERE status = 'WON')::DECIMAL / NULLIF(COUNT(*), 0) * 100),
       0
     )
     FROM tenders
     WHERE created_by = v_user_id) as win_rate;
END;
$$;

-- ============================================================
-- 8. TRIGGERS
-- ============================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_tender_translations_updated_at ON tender_translations;
DROP TRIGGER IF EXISTS update_external_sources_updated_at ON external_sources;
DROP TRIGGER IF EXISTS update_user_dashboard_preferences_updated_at ON user_dashboard_preferences;

-- Update updated_at timestamps
CREATE TRIGGER update_tender_translations_updated_at
  BEFORE UPDATE ON tender_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_sources_updated_at
  BEFORE UPDATE ON external_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_dashboard_preferences_updated_at
  BEFORE UPDATE ON user_dashboard_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. VIEWS
-- ============================================================

-- Drop existing views
DROP VIEW IF EXISTS v_user_dashboard_overview CASCADE;

-- View: User dashboard overview
CREATE OR REPLACE VIEW v_user_dashboard_overview AS
SELECT 
  p.id as user_id,
  p.email,
  p.preferred_sectors,
  p.keywords,
  p.target_countries,
  p.languages,
  (SELECT COUNT(*) FROM tenders t 
   WHERE calculate_tender_match_score(p.id, t.id) >= 70 
     AND t.deadline >= CURRENT_DATE) as matched_tenders_count,
  (SELECT COUNT(*) FROM saved_searches s 
   WHERE s.user_id = p.id AND s.notify_new_results = TRUE) as active_alerts_count
FROM profiles p;

-- ============================================================
-- 10. SEED DATA: DEFAULT EXTERNAL SOURCES
-- ============================================================

INSERT INTO external_sources (name, description, country, source_type, base_url, sync_frequency, is_active)
VALUES
  ('BOAMP - France', 'Bulletin Officiel des Annonces des Marchés Publics', 'FR', 'API', 'https://www.boamp.fr/api', 'DAILY', FALSE),
  ('TED - Europe', 'Tenders Electronic Daily (Union Européenne)', 'EU', 'API', 'https://ted.europa.eu/api', 'DAILY', FALSE),
  ('Bund.de - Allemagne', 'Plateforme fédérale allemande des marchés publics', 'DE', 'API', 'https://www.evergabe-online.de/api', 'DAILY', FALSE),
  ('BOE - Espagne', 'Boletín Oficial del Estado', 'ES', 'SCRAPER', 'https://www.boe.es', 'DAILY', FALSE),
  ('Gazzetta Ufficiale - Italie', 'Marchés publics italiens', 'IT', 'SCRAPER', 'https://www.gazzettaufficiale.it', 'DAILY', FALSE)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- END OF MIGRATION
-- ============================================================

COMMENT ON TABLE tender_translations IS 'Traductions multilingues des appels d''offres (AI ou manuelles)';
COMMENT ON TABLE external_sources IS 'Sources externes API pour import automatique d''AO';
COMMENT ON TABLE source_sync_logs IS 'Logs de synchronisation avec sources externes';
COMMENT ON TABLE user_dashboard_preferences IS 'Préférences d''affichage du dashboard utilisateur';

COMMENT ON FUNCTION calculate_tender_match_score IS 'Calcule le score de correspondance entre un utilisateur et un AO (0-100)';
COMMENT ON FUNCTION get_user_matched_tenders IS 'Retourne les AO correspondant aux critères utilisateur pour le dashboard';
COMMENT ON FUNCTION translate_tender IS 'Initie la traduction d''un AO vers une langue cible';
COMMENT ON FUNCTION get_dashboard_stats IS 'Statistiques du dashboard utilisateur';
