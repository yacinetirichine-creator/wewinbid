-- ============================================================
-- FEATURE #11: ADVANCED SEARCH & FILTERS
-- ============================================================
-- Description: Advanced search system with filters and saved searches
-- Features:
--   - Multi-criteria search (full-text, filters)
--   - Save and share search queries
--   - Search history tracking
--   - Auto-suggestions
--   - Filter presets
-- Tables: saved_searches, search_history, search_filters
-- Created: January 2026
-- ============================================================

-- ============================================================
-- 1. SAVED SEARCHES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE, -- Optional: shared team search
  
  -- Search details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Search query
  query_text TEXT, -- Free text search
  filters JSONB NOT NULL DEFAULT '{}', -- Structured filters
  
  -- Settings
  is_public BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  
  -- Notifications
  notify_new_results BOOLEAN DEFAULT FALSE, -- Alert when new tenders match
  notification_frequency VARCHAR(20) DEFAULT 'DAILY', -- INSTANT, DAILY, WEEKLY
  
  -- Usage stats
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_notification_frequency CHECK (
    notification_frequency IN ('INSTANT', 'DAILY', 'WEEKLY', 'NEVER')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_team_id ON saved_searches(team_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_is_favorite ON saved_searches(is_favorite);
CREATE INDEX IF NOT EXISTS idx_saved_searches_notify ON saved_searches(notify_new_results);

-- ============================================================
-- 2. SEARCH HISTORY TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Search details
  query_text TEXT,
  filters JSONB DEFAULT '{}',
  
  -- Results
  results_count INTEGER DEFAULT 0,
  
  -- Metadata
  search_duration_ms INTEGER, -- Performance tracking
  user_agent TEXT,
  ip_address INET,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);

-- ============================================================
-- 3. SEARCH FILTERS PRESETS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS search_filter_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = system preset
  
  -- Preset details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'COUNTRY', 'SECTOR', 'AMOUNT', 'DEADLINE', 'CUSTOM'
  
  -- Filter configuration
  filters JSONB NOT NULL DEFAULT '{}',
  
  -- Visibility
  is_system BOOLEAN DEFAULT FALSE, -- System-wide preset
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Usage
  use_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_filter_presets_user_id ON search_filter_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_search_filter_presets_category ON search_filter_presets(category);
CREATE INDEX IF NOT EXISTS idx_search_filter_presets_is_system ON search_filter_presets(is_system);

-- ============================================================
-- 4. SEARCH SUGGESTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS search_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Suggestion text
  term VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(50), -- 'COUNTRY', 'SECTOR', 'ORGANIZATION', 'KEYWORD'
  
  -- Metadata
  language VARCHAR(10) DEFAULT 'fr',
  
  -- Popularity
  search_count INTEGER DEFAULT 0,
  result_count INTEGER DEFAULT 0, -- Average results for this term
  
  -- Quality score
  relevance_score DECIMAL(3, 2) DEFAULT 1.0, -- 0.00 to 1.00
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_suggestions_term ON search_suggestions(term);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_category ON search_suggestions(category);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_search_count ON search_suggestions(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_language ON search_suggestions(language);

-- Full-text search index for suggestions
CREATE INDEX IF NOT EXISTS idx_search_suggestions_term_fts ON search_suggestions 
  USING gin(to_tsvector('french', term));

-- ============================================================
-- 5. FULL-TEXT SEARCH CONFIGURATION (if tenders table exists)
-- ============================================================

-- Add tsvector column to tenders for better search performance
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenders') THEN
    -- Add search vector column if not exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'tenders' AND column_name = 'search_vector'
    ) THEN
      EXECUTE 'ALTER TABLE tenders ADD COLUMN search_vector tsvector';
      
      -- Create GIN index for full-text search
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_tenders_search_vector ON tenders USING gin(search_vector)';
      
      -- Update existing records
      EXECUTE '
        UPDATE tenders SET search_vector = 
          setweight(to_tsvector(''french'', COALESCE(title, '''')), ''A'') ||
          setweight(to_tsvector(''french'', COALESCE(description, '''')), ''B'') ||
          setweight(to_tsvector(''french'', COALESCE(buyer_name, '''')), ''C'') ||
          setweight(to_tsvector(''french'', COALESCE(region, '''') || '' '' || COALESCE(department, '''')), ''D'')
      ';
    END IF;
    
    -- Always recreate the function and trigger (drop first if exists)
    EXECUTE 'DROP TRIGGER IF EXISTS tenders_search_vector_trigger ON tenders';
    EXECUTE 'DROP FUNCTION IF EXISTS tenders_search_vector_update()';
    
    -- Create trigger function
    EXECUTE '
      CREATE FUNCTION tenders_search_vector_update()
      RETURNS TRIGGER AS $func$
      BEGIN
        NEW.search_vector := 
          setweight(to_tsvector(''french'', COALESCE(NEW.title, '''')), ''A'') ||
          setweight(to_tsvector(''french'', COALESCE(NEW.description, '''')), ''B'') ||
          setweight(to_tsvector(''french'', COALESCE(NEW.buyer_name, '''')), ''C'') ||
          setweight(to_tsvector(''french'', COALESCE(NEW.region, '''') || '' '' || COALESCE(NEW.department, '''')), ''D'');
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql
    ';
    
    -- Create trigger
    EXECUTE '
      CREATE TRIGGER tenders_search_vector_trigger
      BEFORE INSERT OR UPDATE ON tenders
      FOR EACH ROW
      EXECUTE FUNCTION tenders_search_vector_update()
    ';
  END IF;
END $$;

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_filter_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_suggestions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own and public saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can create saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can update own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can delete own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can view own search history" ON search_history;
DROP POLICY IF EXISTS "System can log search history" ON search_history;
DROP POLICY IF EXISTS "Users can view filter presets" ON search_filter_presets;
DROP POLICY IF EXISTS "Users can create custom filter presets" ON search_filter_presets;
DROP POLICY IF EXISTS "Users can update own filter presets" ON search_filter_presets;
DROP POLICY IF EXISTS "Users can delete own filter presets" ON search_filter_presets;
DROP POLICY IF EXISTS "Everyone can view search suggestions" ON search_suggestions;
DROP POLICY IF EXISTS "System can manage search suggestions" ON search_suggestions;

-- Saved Searches: Users can view their own and public searches
CREATE POLICY "Users can view own and public saved searches"
  ON saved_searches FOR SELECT
  USING (
    user_id = auth.uid() 
    OR is_public = TRUE
    OR (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = saved_searches.team_id 
        AND team_members.user_id = auth.uid()
    ))
  );

-- Saved Searches: Users can create their own
CREATE POLICY "Users can create saved searches"
  ON saved_searches FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Saved Searches: Users can update their own
CREATE POLICY "Users can update own saved searches"
  ON saved_searches FOR UPDATE
  USING (user_id = auth.uid());

-- Saved Searches: Users can delete their own
CREATE POLICY "Users can delete own saved searches"
  ON saved_searches FOR DELETE
  USING (user_id = auth.uid());

-- Search History: Users can only see their own history
CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  USING (user_id = auth.uid());

-- Search History: System can insert
CREATE POLICY "System can log search history"
  ON search_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Search Filter Presets: Everyone can view active presets
CREATE POLICY "Users can view filter presets"
  ON search_filter_presets FOR SELECT
  USING (
    is_active = TRUE 
    AND (is_system = TRUE OR user_id = auth.uid())
  );

-- Search Filter Presets: Users can create custom presets
CREATE POLICY "Users can create custom filter presets"
  ON search_filter_presets FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_system = FALSE);

-- Search Filter Presets: Users can update their own
CREATE POLICY "Users can update own filter presets"
  ON search_filter_presets FOR UPDATE
  USING (user_id = auth.uid() AND is_system = FALSE);

-- Search Filter Presets: Users can delete their own
CREATE POLICY "Users can delete own filter presets"
  ON search_filter_presets FOR DELETE
  USING (user_id = auth.uid() AND is_system = FALSE);

-- Search Suggestions: Everyone can view active suggestions
CREATE POLICY "Everyone can view search suggestions"
  ON search_suggestions FOR SELECT
  USING (is_active = TRUE);

-- Search Suggestions: System can manage suggestions
CREATE POLICY "System can manage search suggestions"
  ON search_suggestions FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 7. HELPER FUNCTIONS
-- ============================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS search_tenders(TEXT, JSONB, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_search_suggestions(TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS log_search(TEXT, JSONB, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS tenders_search_vector_update() CASCADE;

-- Function to search tenders with filters
CREATE OR REPLACE FUNCTION search_tenders(
  p_query TEXT DEFAULT NULL,
  p_filters JSONB DEFAULT '{}',
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  tender_id UUID,
  title TEXT,
  buyer_name TEXT,
  region TEXT,
  estimated_value NUMERIC,
  deadline DATE,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
  has_tenders BOOLEAN;
BEGIN
  -- Check if tenders table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'tenders'
  ) INTO has_tenders;
  
  IF NOT has_tenders THEN
    RETURN;
  END IF;
  
  -- Build dynamic query
  sql_query := 'SELECT id, title, buyer_name, region, estimated_value, deadline, ';
  
  IF p_query IS NOT NULL AND p_query != '' THEN
    sql_query := sql_query || 'ts_rank(search_vector, plainto_tsquery(''french'', $1)) as rank ';
    sql_query := sql_query || 'FROM tenders WHERE search_vector @@ plainto_tsquery(''french'', $1) ';
  ELSE
    sql_query := sql_query || '1.0 as rank FROM tenders WHERE 1=1 ';
  END IF;
  
  -- Apply filters from JSONB
  IF p_filters ? 'region' THEN
    sql_query := sql_query || 'AND region = ANY(ARRAY(SELECT jsonb_array_elements_text($2->''region''))) ';
  END IF;
  
  IF p_filters ? 'sector' THEN
    sql_query := sql_query || 'AND sector = ANY(ARRAY(SELECT jsonb_array_elements_text($2->''sector''))) ';
  END IF;
  
  IF p_filters ? 'min_budget' THEN
    sql_query := sql_query || 'AND estimated_value >= ($2->>''min_budget'')::NUMERIC ';
  END IF;
  
  IF p_filters ? 'max_budget' THEN
    sql_query := sql_query || 'AND estimated_value <= ($2->>''max_budget'')::NUMERIC ';
  END IF;
  
  IF p_filters ? 'deadline_from' THEN
    sql_query := sql_query || 'AND deadline >= ($2->>''deadline_from'')::DATE ';
  END IF;
  
  IF p_filters ? 'deadline_to' THEN
    sql_query := sql_query || 'AND deadline <= ($2->>''deadline_to'')::DATE ';
  END IF;
  
  -- Order by rank and limit
  sql_query := sql_query || 'ORDER BY rank DESC, deadline ASC LIMIT $3 OFFSET $4';
  
  -- Execute dynamic query
  RETURN QUERY EXECUTE sql_query USING p_query, p_filters, p_limit, p_offset;
END;
$$;

-- Function to get search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(
  p_prefix TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  term VARCHAR,
  category VARCHAR,
  search_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.term,
    s.category,
    s.search_count
  FROM search_suggestions s
  WHERE 
    s.is_active = TRUE
    AND s.term ILIKE p_prefix || '%'
  ORDER BY s.search_count DESC, s.relevance_score DESC
  LIMIT p_limit;
END;
$$;

-- Function to log search
CREATE OR REPLACE FUNCTION log_search(
  p_query TEXT,
  p_filters JSONB DEFAULT '{}',
  p_results_count INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  history_id UUID;
BEGIN
  INSERT INTO search_history (
    user_id,
    query_text,
    filters,
    results_count
  ) VALUES (
    auth.uid(),
    p_query,
    p_filters,
    p_results_count
  ) RETURNING id INTO history_id;
  
  -- Update suggestion counts
  IF p_query IS NOT NULL AND p_query != '' THEN
    INSERT INTO search_suggestions (term, category, search_count)
    VALUES (LOWER(TRIM(p_query)), 'KEYWORD', 1)
    ON CONFLICT (term) 
    DO UPDATE SET 
      search_count = search_suggestions.search_count + 1,
      updated_at = NOW();
  END IF;
  
  RETURN history_id;
END;
$$;

-- ============================================================
-- 8. TRIGGERS
-- ============================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_saved_searches_updated_at ON saved_searches;
DROP TRIGGER IF EXISTS update_search_filter_presets_updated_at ON search_filter_presets;
DROP TRIGGER IF EXISTS update_search_suggestions_updated_at ON search_suggestions;
DROP TRIGGER IF EXISTS tenders_search_vector_trigger ON tenders;

-- Update updated_at timestamp
CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_search_filter_presets_updated_at
  BEFORE UPDATE ON search_filter_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_search_suggestions_updated_at
  BEFORE UPDATE ON search_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. SEED DATA: SYSTEM FILTER PRESETS
-- ============================================================

INSERT INTO search_filter_presets (name, description, category, filters, is_system, user_id)
VALUES
  ('Europe Occidentale', 'Appels d''offres en Europe Occidentale', 'COUNTRY', 
   '{"country": ["France", "Allemagne", "Belgique", "Pays-Bas", "Espagne", "Italie"]}', TRUE, NULL),
  
  ('Budget > 1M€', 'Grands projets (budget supérieur à 1 million d''euros)', 'AMOUNT',
   '{"min_budget": 1000000}', TRUE, NULL),
  
  ('Tech & IT', 'Secteur technologie et informatique', 'SECTOR',
   '{"sector": ["IT", "Technology", "Software", "Digital"]}', TRUE, NULL),
  
  ('Construction & BTP', 'Secteur construction et travaux publics', 'SECTOR',
   '{"sector": ["Construction", "BTP", "Infrastructure", "Génie Civil"]}', TRUE, NULL),
  
  ('Urgents (< 30 jours)', 'Deadlines dans moins de 30 jours', 'DEADLINE',
   '{"deadline_to": "30_days"}', TRUE, NULL),
  
  ('Moyen terme (30-90 jours)', 'Deadlines entre 30 et 90 jours', 'DEADLINE',
   '{"deadline_from": "30_days", "deadline_to": "90_days"}', TRUE, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. COMMON SEARCH SUGGESTIONS
-- ============================================================

INSERT INTO search_suggestions (term, category, language, search_count, relevance_score)
VALUES
  ('infrastructure', 'KEYWORD', 'fr', 100, 0.95),
  ('construction', 'KEYWORD', 'fr', 95, 0.95),
  ('informatique', 'KEYWORD', 'fr', 90, 0.92),
  ('conseil', 'KEYWORD', 'fr', 85, 0.90),
  ('maintenance', 'KEYWORD', 'fr', 80, 0.88),
  ('formation', 'KEYWORD', 'fr', 75, 0.85),
  ('fourniture', 'KEYWORD', 'fr', 70, 0.83),
  ('développement', 'KEYWORD', 'fr', 65, 0.80),
  ('équipement', 'KEYWORD', 'fr', 60, 0.78),
  ('services', 'KEYWORD', 'fr', 55, 0.75)
ON CONFLICT (term) DO NOTHING;

-- ============================================================
-- END OF MIGRATION
-- ============================================================

COMMENT ON TABLE saved_searches IS 'User-saved search queries with filters';
COMMENT ON TABLE search_history IS 'Search history for analytics and suggestions';
COMMENT ON TABLE search_filter_presets IS 'Reusable filter configurations';
COMMENT ON TABLE search_suggestions IS 'Auto-complete suggestions for search';
