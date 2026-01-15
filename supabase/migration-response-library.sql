-- Migration: Response Library (Templates & Snippets)
-- Feature #3: Bibliothèque de Réponses
-- Created: 2026-01-15

-- ============================================================
-- TABLES
-- ============================================================

-- Table: templates
-- Stocke les templates de réponses complètes pour les appels d'offres
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category VARCHAR(100),
  
  -- Metadata
  tags TEXT[], -- Array de tags pour recherche
  sector VARCHAR(100), -- Secteur d'activité
  tender_type VARCHAR(50), -- Type d'AO (PUBLIC, PRIVATE)
  language VARCHAR(10) DEFAULT 'fr',
  
  -- Statistics
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT templates_title_check CHECK (char_length(title) >= 3),
  CONSTRAINT templates_content_check CHECK (char_length(content) >= 10)
);

-- Table: template_versions
-- Historique des versions pour chaque template
CREATE TABLE IF NOT EXISTS template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  content TEXT NOT NULL,
  change_summary TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT template_versions_unique UNIQUE (template_id, version_number),
  CONSTRAINT template_versions_number_check CHECK (version_number > 0)
);

-- Table: snippets
-- Petits blocs de texte réutilisables (paragraphes, clauses, etc.)
CREATE TABLE IF NOT EXISTS snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES snippet_categories(id) ON DELETE SET NULL,
  
  -- Metadata
  tags TEXT[],
  shortcut VARCHAR(50), -- Raccourci pour insertion rapide (ex: "intro-exp")
  
  -- Statistics
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT snippets_title_check CHECK (char_length(title) >= 3),
  CONSTRAINT snippets_content_check CHECK (char_length(content) >= 5),
  CONSTRAINT snippets_shortcut_check CHECK (shortcut ~ '^[a-z0-9-]+$')
);

-- Table: snippet_categories
-- Catégories pour organiser les snippets
CREATE TABLE IF NOT EXISTS snippet_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7), -- Hex color (ex: "#3B82F6")
  icon VARCHAR(50), -- Nom d'icône (ex: "document-text")
  
  -- Order
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT snippet_categories_unique UNIQUE (company_id, name),
  CONSTRAINT snippet_categories_name_check CHECK (char_length(name) >= 2)
);

-- Table: template_shares
-- Partage de templates entre utilisateurs/équipes
CREATE TABLE IF NOT EXISTS template_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  permission VARCHAR(20) DEFAULT 'view', -- 'view', 'edit', 'admin'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT template_shares_unique UNIQUE (template_id, shared_with_user_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Templates indexes
CREATE INDEX idx_templates_company ON templates(company_id);
CREATE INDEX idx_templates_created_by ON templates(created_by);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_sector ON templates(sector);
CREATE INDEX idx_templates_tags ON templates USING GIN(tags);
CREATE INDEX idx_templates_is_active ON templates(is_active);
CREATE INDEX idx_templates_is_favorite ON templates(is_favorite);
CREATE INDEX idx_templates_usage_count ON templates(usage_count DESC);
CREATE INDEX idx_templates_updated_at ON templates(updated_at DESC);

-- Template versions indexes
CREATE INDEX idx_template_versions_template ON template_versions(template_id);
CREATE INDEX idx_template_versions_created_at ON template_versions(created_at DESC);

-- Snippets indexes
CREATE INDEX idx_snippets_company ON snippets(company_id);
CREATE INDEX idx_snippets_created_by ON snippets(created_by);
CREATE INDEX idx_snippets_category ON snippets(category_id);
CREATE INDEX idx_snippets_tags ON snippets USING GIN(tags);
CREATE INDEX idx_snippets_shortcut ON snippets(shortcut);
CREATE INDEX idx_snippets_is_active ON snippets(is_active);
CREATE INDEX idx_snippets_is_favorite ON snippets(is_favorite);
CREATE INDEX idx_snippets_usage_count ON snippets(usage_count DESC);

-- Categories indexes
CREATE INDEX idx_snippet_categories_company ON snippet_categories(company_id);
CREATE INDEX idx_snippet_categories_order ON snippet_categories(display_order);

-- Shares indexes
CREATE INDEX idx_template_shares_template ON template_shares(template_id);
CREATE INDEX idx_template_shares_user ON template_shares(shared_with_user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function: Créer une nouvelle version de template
CREATE OR REPLACE FUNCTION create_template_version()
RETURNS TRIGGER AS $$
DECLARE
  v_version_number INTEGER;
BEGIN
  -- Obtenir le dernier numéro de version
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version_number
  FROM template_versions
  WHERE template_id = NEW.id;
  
  -- Créer la version si le contenu a changé
  IF OLD IS NULL OR OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO template_versions (template_id, version_number, content, created_by)
    VALUES (NEW.id, v_version_number, NEW.content, NEW.created_by);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Incrémenter le compteur d'utilisation
CREATE OR REPLACE FUNCTION increment_usage_count(
  p_table_name TEXT,
  p_id UUID
)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('
    UPDATE %I 
    SET usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = $1
  ', p_table_name)
  USING p_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Recherche full-text dans templates
CREATE OR REPLACE FUNCTION search_templates(
  p_company_id UUID,
  p_query TEXT,
  p_category VARCHAR DEFAULT NULL,
  p_sector VARCHAR DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  category VARCHAR,
  sector VARCHAR,
  tags TEXT[],
  usage_count INTEGER,
  is_favorite BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.category,
    t.sector,
    t.tags,
    t.usage_count,
    t.is_favorite,
    t.created_at,
    -- Score de pertinence basé sur la recherche
    ts_rank(
      to_tsvector('french', COALESCE(t.title, '') || ' ' || COALESCE(t.description, '') || ' ' || COALESCE(t.content, '')),
      plainto_tsquery('french', p_query)
    )::REAL AS relevance
  FROM templates t
  WHERE t.company_id = p_company_id
    AND t.is_active = true
    AND (
      p_query IS NULL OR
      to_tsvector('french', COALESCE(t.title, '') || ' ' || COALESCE(t.description, '') || ' ' || COALESCE(t.content, ''))
      @@ plainto_tsquery('french', p_query)
    )
    AND (p_category IS NULL OR t.category = p_category)
    AND (p_sector IS NULL OR t.sector = p_sector)
    AND (p_tags IS NULL OR t.tags && p_tags)
  ORDER BY 
    CASE WHEN t.is_favorite THEN 0 ELSE 1 END,
    relevance DESC,
    t.usage_count DESC,
    t.updated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger: Créer version lors de la modification d'un template
CREATE TRIGGER trigger_create_template_version
  AFTER INSERT OR UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION create_template_version();

-- Trigger: Mettre à jour updated_at pour templates
CREATE TRIGGER trigger_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Mettre à jour updated_at pour snippets
CREATE TRIGGER trigger_snippets_updated_at
  BEFORE UPDATE ON snippets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Mettre à jour updated_at pour categories
CREATE TRIGGER trigger_snippet_categories_updated_at
  BEFORE UPDATE ON snippet_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippet_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_shares ENABLE ROW LEVEL SECURITY;

-- Templates policies
CREATE POLICY templates_select_policy ON templates
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM team_members WHERE user_id = auth.uid()
    )
    OR id IN (
      SELECT template_id FROM template_shares WHERE shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY templates_insert_policy ON templates
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND role IN ('editor', 'admin')
      AND status = 'active'
    )
  );

CREATE POLICY templates_update_policy ON templates
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND status = 'active'
    )
  );

CREATE POLICY templates_delete_policy ON templates
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- Template versions policies
CREATE POLICY template_versions_select_policy ON template_versions
  FOR SELECT
  USING (
    template_id IN (SELECT id FROM templates)
  );

CREATE POLICY template_versions_insert_policy ON template_versions
  FOR INSERT
  WITH CHECK (
    template_id IN (SELECT id FROM templates)
  );

-- Snippets policies (similar to templates)
CREATE POLICY snippets_select_policy ON snippets
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY snippets_insert_policy ON snippets
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND role IN ('editor', 'admin')
      AND status = 'active'
    )
  );

CREATE POLICY snippets_update_policy ON snippets
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND status = 'active'
    )
  );

CREATE POLICY snippets_delete_policy ON snippets
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- Categories policies
CREATE POLICY snippet_categories_select_policy ON snippet_categories
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY snippet_categories_insert_policy ON snippet_categories
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND role IN ('editor', 'admin')
      AND status = 'active'
    )
  );

CREATE POLICY snippet_categories_update_policy ON snippet_categories
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND role IN ('editor', 'admin')
      AND status = 'active'
    )
  );

CREATE POLICY snippet_categories_delete_policy ON snippet_categories
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- Shares policies
CREATE POLICY template_shares_select_policy ON template_shares
  FOR SELECT
  USING (
    shared_with_user_id = auth.uid()
    OR shared_by = auth.uid()
    OR template_id IN (
      SELECT id FROM templates WHERE created_by = auth.uid()
    )
  );

CREATE POLICY template_shares_insert_policy ON template_shares
  FOR INSERT
  WITH CHECK (
    template_id IN (
      SELECT id FROM templates WHERE created_by = auth.uid()
    )
  );

CREATE POLICY template_shares_delete_policy ON template_shares
  FOR DELETE
  USING (
    shared_by = auth.uid()
    OR template_id IN (
      SELECT id FROM templates WHERE created_by = auth.uid()
    )
  );

-- ============================================================
-- INITIAL DATA (Optional)
-- ============================================================

-- Exemple de catégories par défaut (à insérer après création d'une company)
-- INSERT INTO snippet_categories (company_id, name, description, color, icon, display_order) VALUES
-- ('company-uuid', 'Introduction', 'Paragraphes d''introduction', '#3B82F6', 'document-text', 1),
-- ('company-uuid', 'Compétences', 'Descriptions de compétences', '#10B981', 'star', 2),
-- ('company-uuid', 'Références', 'Projets de référence', '#F59E0B', 'briefcase', 3),
-- ('company-uuid', 'Clauses légales', 'Clauses contractuelles', '#EF4444', 'scale', 4);
