-- Migration: Enhanced Marketplace
-- Feature #5: Marketplace Amélioré
-- Created: 2026-01-15

-- ============================================================
-- TABLES
-- ============================================================

-- Table: saved_searches
-- Stocke les recherches sauvegardées par les utilisateurs
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Critères de recherche (JSON)
  filters JSONB NOT NULL DEFAULT '{}',
  -- {
  --   "query": "string",
  --   "sectors": ["IT", "Construction"],
  --   "countries": ["FR", "BE"],
  --   "min_value": 10000,
  --   "max_value": 500000,
  --   "deadline_from": "2024-01-01",
  --   "deadline_to": "2024-12-31",
  --   "tender_type": "PUBLIC",
  --   "status": ["OPEN", "ACTIVE"]
  -- }
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  notification_enabled BOOLEAN DEFAULT false, -- Recevoir alertes pour nouvelles correspondances
  last_run_at TIMESTAMP WITH TIME ZONE,
  results_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT saved_searches_name_check CHECK (char_length(name) >= 2)
);

-- Table: tender_favorites
-- Appels d'offres mis en favoris par les utilisateurs
CREATE TABLE IF NOT EXISTS tender_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  
  -- Organisation
  folder VARCHAR(100), -- Dossier pour organiser les favoris
  notes TEXT, -- Notes personnelles
  tags TEXT[], -- Tags personnalisés
  
  -- Tracking
  reminder_date TIMESTAMP WITH TIME ZONE, -- Rappel pour cet AO
  priority INTEGER DEFAULT 0, -- 0=normal, 1=high, 2=urgent
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT tender_favorites_unique UNIQUE (user_id, tender_id)
);

-- Table: search_alerts
-- Alertes pour être notifié de nouveaux AO correspondant aux critères
CREATE TABLE IF NOT EXISTS search_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Critères de recherche (même structure que saved_searches)
  criteria JSONB NOT NULL DEFAULT '{}',
  
  -- Configuration des alertes
  frequency VARCHAR(20) DEFAULT 'daily', -- 'instant', 'daily', 'weekly'
  notification_channels JSONB DEFAULT '{"email": true, "in_app": true}',
  
  -- Tracking
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  last_notified_at TIMESTAMP WITH TIME ZONE,
  total_matches INTEGER DEFAULT 0,
  new_matches_since_last_check INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT search_alerts_name_check CHECK (char_length(name) >= 2),
  CONSTRAINT search_alerts_frequency_check CHECK (frequency IN ('instant', 'daily', 'weekly'))
);

-- Table: tender_views
-- Tracking des vues d'appels d'offres (analytics)
CREATE TABLE IF NOT EXISTS tender_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  
  -- Analytics
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Engagement
  time_spent_seconds INTEGER, -- Temps passé sur la page
  actions_taken JSONB, -- Actions effectuées (download, share, etc.)
  
  CONSTRAINT tender_views_time_check CHECK (time_spent_seconds >= 0)
);

-- Table: tender_recommendations
-- Recommandations AI d'appels d'offres pour les utilisateurs
CREATE TABLE IF NOT EXISTS tender_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  
  -- Score de recommandation
  match_score DECIMAL(5,2) NOT NULL, -- 0.00 à 100.00
  confidence_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
  
  -- Raisons de la recommandation
  reasons JSONB, -- ["sector_match", "budget_fit", "past_success", "location_proximity"]
  explanation TEXT, -- Explication textuelle générée par l'IA
  
  -- Interaction utilisateur
  shown_to_user BOOLEAN DEFAULT false,
  shown_at TIMESTAMP WITH TIME ZONE,
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMP WITH TIME ZONE,
  dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  feedback VARCHAR(20), -- 'helpful', 'not_relevant', 'already_seen'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Recommandation expire après un certain temps
  
  CONSTRAINT tender_recommendations_unique UNIQUE (user_id, tender_id),
  CONSTRAINT tender_recommendations_score_check CHECK (match_score >= 0 AND match_score <= 100),
  CONSTRAINT tender_recommendations_confidence_check CHECK (confidence_level IN ('low', 'medium', 'high'))
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Saved searches indexes
CREATE INDEX idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX idx_saved_searches_company ON saved_searches(company_id);
CREATE INDEX idx_saved_searches_active ON saved_searches(is_active);
CREATE INDEX idx_saved_searches_notification ON saved_searches(notification_enabled);
CREATE INDEX idx_saved_searches_filters ON saved_searches USING GIN(filters);

-- Favorites indexes
CREATE INDEX idx_tender_favorites_user ON tender_favorites(user_id);
CREATE INDEX idx_tender_favorites_tender ON tender_favorites(tender_id);
CREATE INDEX idx_tender_favorites_folder ON tender_favorites(folder);
CREATE INDEX idx_tender_favorites_priority ON tender_favorites(priority DESC);
CREATE INDEX idx_tender_favorites_reminder ON tender_favorites(reminder_date) WHERE reminder_date IS NOT NULL;
CREATE INDEX idx_tender_favorites_tags ON tender_favorites USING GIN(tags);

-- Alerts indexes
CREATE INDEX idx_search_alerts_user ON search_alerts(user_id);
CREATE INDEX idx_search_alerts_company ON search_alerts(company_id);
CREATE INDEX idx_search_alerts_active ON search_alerts(is_active);
CREATE INDEX idx_search_alerts_frequency ON search_alerts(frequency);
CREATE INDEX idx_search_alerts_criteria ON search_alerts USING GIN(criteria);

-- Views indexes
CREATE INDEX idx_tender_views_tender ON tender_views(tender_id);
CREATE INDEX idx_tender_views_user ON tender_views(user_id);
CREATE INDEX idx_tender_views_company ON tender_views(company_id);
CREATE INDEX idx_tender_views_date ON tender_views(viewed_at DESC);

-- Recommendations indexes
CREATE INDEX idx_tender_recommendations_user ON tender_recommendations(user_id);
CREATE INDEX idx_tender_recommendations_tender ON tender_recommendations(tender_id);
CREATE INDEX idx_tender_recommendations_score ON tender_recommendations(match_score DESC);
CREATE INDEX idx_tender_recommendations_shown ON tender_recommendations(shown_to_user, shown_at);
CREATE INDEX idx_tender_recommendations_expires ON tender_recommendations(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function: Nettoyer les anciennes vues (plus de 90 jours)
CREATE OR REPLACE FUNCTION cleanup_old_tender_views()
RETURNS void AS $$
BEGIN
  DELETE FROM tender_views
  WHERE viewed_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function: Nettoyer les recommandations expirées
CREATE OR REPLACE FUNCTION cleanup_expired_recommendations()
RETURNS void AS $$
BEGIN
  DELETE FROM tender_recommendations
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function: Obtenir les AO recommandés pour un utilisateur
CREATE OR REPLACE FUNCTION get_recommended_tenders(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  tender_id UUID,
  title VARCHAR,
  match_score DECIMAL,
  reasons JSONB,
  explanation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id AS tender_id,
    t.title,
    tr.match_score,
    tr.reasons,
    tr.explanation
  FROM tender_recommendations tr
  JOIN tenders t ON t.id = tr.tender_id
  WHERE tr.user_id = p_user_id
    AND tr.dismissed = false
    AND (tr.expires_at IS NULL OR tr.expires_at > NOW())
  ORDER BY tr.match_score DESC, tr.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Enregistrer une vue d'AO
CREATE OR REPLACE FUNCTION track_tender_view(
  p_tender_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_company_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_view_id UUID;
BEGIN
  INSERT INTO tender_views (
    tender_id,
    user_id,
    company_id,
    ip_address,
    user_agent
  ) VALUES (
    p_tender_id,
    p_user_id,
    p_company_id,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_view_id;
  
  RETURN v_view_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Recherche avancée d'appels d'offres
CREATE OR REPLACE FUNCTION search_marketplace_tenders(
  p_company_id UUID,
  p_query TEXT DEFAULT NULL,
  p_sectors TEXT[] DEFAULT NULL,
  p_countries TEXT[] DEFAULT NULL,
  p_min_value DECIMAL DEFAULT NULL,
  p_max_value DECIMAL DEFAULT NULL,
  p_deadline_from DATE DEFAULT NULL,
  p_deadline_to DATE DEFAULT NULL,
  p_tender_type VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  sector VARCHAR,
  country VARCHAR,
  estimated_value DECIMAL,
  deadline DATE,
  tender_type VARCHAR,
  buyer_name VARCHAR,
  relevance_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.sector,
    t.country,
    t.estimated_value,
    t.deadline,
    t.type AS tender_type,
    t.buyer_name,
    CASE 
      WHEN p_query IS NOT NULL THEN
        ts_rank(
          to_tsvector('french', COALESCE(t.title, '') || ' ' || COALESCE(t.description, '')),
          plainto_tsquery('french', p_query)
        )::REAL
      ELSE 1.0
    END AS relevance_score
  FROM tenders t
  WHERE t.company_id = p_company_id
    AND (p_query IS NULL OR 
         to_tsvector('french', COALESCE(t.title, '') || ' ' || COALESCE(t.description, ''))
         @@ plainto_tsquery('french', p_query))
    AND (p_sectors IS NULL OR t.sector = ANY(p_sectors))
    AND (p_countries IS NULL OR t.country = ANY(p_countries))
    AND (p_min_value IS NULL OR t.estimated_value >= p_min_value)
    AND (p_max_value IS NULL OR t.estimated_value <= p_max_value)
    AND (p_deadline_from IS NULL OR t.deadline >= p_deadline_from)
    AND (p_deadline_to IS NULL OR t.deadline <= p_deadline_to)
    AND (p_tender_type IS NULL OR t.type = p_tender_type)
  ORDER BY relevance_score DESC, t.deadline ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger: Mettre à jour updated_at
CREATE TRIGGER trigger_saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_tender_favorites_updated_at
  BEFORE UPDATE ON tender_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_search_alerts_updated_at
  BEFORE UPDATE ON search_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_recommendations ENABLE ROW LEVEL SECURITY;

-- Saved searches policies
CREATE POLICY saved_searches_select_policy ON saved_searches
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY saved_searches_insert_policy ON saved_searches
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY saved_searches_update_policy ON saved_searches
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY saved_searches_delete_policy ON saved_searches
  FOR DELETE
  USING (user_id = auth.uid());

-- Favorites policies
CREATE POLICY tender_favorites_select_policy ON tender_favorites
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY tender_favorites_insert_policy ON tender_favorites
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY tender_favorites_update_policy ON tender_favorites
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY tender_favorites_delete_policy ON tender_favorites
  FOR DELETE
  USING (user_id = auth.uid());

-- Alerts policies
CREATE POLICY search_alerts_select_policy ON search_alerts
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY search_alerts_insert_policy ON search_alerts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY search_alerts_update_policy ON search_alerts
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY search_alerts_delete_policy ON search_alerts
  FOR DELETE
  USING (user_id = auth.uid());

-- Views policies (allow all authenticated users to insert)
CREATE POLICY tender_views_select_policy ON tender_views
  FOR SELECT
  USING (user_id = auth.uid() OR company_id IN (
    SELECT company_id FROM team_members WHERE user_id = auth.uid()
  ));

CREATE POLICY tender_views_insert_policy ON tender_views
  FOR INSERT
  WITH CHECK (true); -- Allow anonymous tracking

-- Recommendations policies
CREATE POLICY tender_recommendations_select_policy ON tender_recommendations
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY tender_recommendations_update_policy ON tender_recommendations
  FOR UPDATE
  USING (user_id = auth.uid());
