-- Migration: Document Generation System
-- Feature #6: Génération de Documents
-- Created: 2026-01-15

-- ============================================================
-- CLEANUP: Supprimer TOUS les objets existants
-- ============================================================

-- Drop ALL potentially conflicting indexes from previous runs
DROP INDEX IF EXISTS idx_document_versions_number CASCADE;
DROP INDEX IF EXISTS idx_document_versions_document CASCADE;
DROP INDEX IF EXISTS idx_document_templates_company CASCADE;
DROP INDEX IF EXISTS idx_document_templates_category CASCADE;
DROP INDEX IF EXISTS idx_generated_documents_company CASCADE;
DROP INDEX IF EXISTS idx_document_sections_company CASCADE;
DROP INDEX IF EXISTS idx_ai_generation_history_company CASCADE;

-- ============================================================
-- TABLES
-- ============================================================

-- Table: document_templates
-- Templates de documents réutilisables (propositions, CV, lettres)
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Template info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'proposal', 'cover_letter', 'technical_response', 'cv', 'other'
  
  -- Content
  content JSONB NOT NULL, -- Rich text content with variables
  -- {
  --   "sections": [
  --     {"id": "intro", "title": "Introduction", "content": "...", "order": 1, "variables": ["company_name", "tender_ref"]},
  --     {"id": "experience", "title": "Expérience", "content": "...", "order": 2}
  --   ],
  --   "styles": {"fontSize": 12, "fontFamily": "Arial", "lineHeight": 1.5},
  --   "header": {"enabled": true, "content": "..."},
  --   "footer": {"enabled": true, "content": "..."}
  -- }
  
  variables JSONB DEFAULT '[]', -- Liste des variables disponibles
  -- [{"name": "company_name", "type": "text", "default": "", "required": true}, ...]
  
  -- Metadata
  is_default BOOLEAN DEFAULT false, -- Template par défaut pour cette catégorie
  is_public BOOLEAN DEFAULT false, -- Partagé avec toute l'équipe
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Version control
  version INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT document_templates_name_check CHECK (char_length(name) >= 2),
  CONSTRAINT document_templates_category_check CHECK (category IN ('proposal', 'cover_letter', 'technical_response', 'cv', 'other'))
);

-- Table: generated_documents
-- Documents générés à partir de templates
CREATE TABLE IF NOT EXISTS generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL,
  template_id UUID REFERENCES document_templates(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Document info
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  
  -- Content
  content JSONB NOT NULL, -- Final rendered content with values filled
  variables_data JSONB, -- Values used for variables
  
  -- Files
  pdf_url TEXT, -- URL du PDF généré et stocké
  docx_url TEXT, -- URL du DOCX si généré
  file_size INTEGER, -- Taille en bytes
  
  -- AI generation
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT, -- Prompt utilisé pour la génération AI
  ai_model VARCHAR(50), -- 'gpt-4', 'claude-3', etc.
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'final', 'sent', 'signed'
  
  -- Signature
  signature_requested BOOLEAN DEFAULT false,
  signature_url TEXT, -- URL du service de signature (DocuSign, etc.)
  signed_at TIMESTAMP WITH TIME ZONE,
  signed_by UUID REFERENCES profiles(id),
  
  -- Metadata
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES generated_documents(id), -- Pour les révisions
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT generated_documents_title_check CHECK (char_length(title) >= 2),
  CONSTRAINT generated_documents_category_check CHECK (category IN ('proposal', 'cover_letter', 'technical_response', 'cv', 'other')),
  CONSTRAINT generated_documents_status_check CHECK (status IN ('draft', 'final', 'sent', 'signed'))
);

-- Table: document_sections
-- Sections de documents pour composition modulaire
CREATE TABLE IF NOT EXISTS document_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Section info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- Même que document_templates
  section_type VARCHAR(50) NOT NULL, -- 'intro', 'experience', 'methodology', 'team', 'pricing', 'conclusion'
  
  -- Content
  content JSONB NOT NULL,
  variables JSONB DEFAULT '[]',
  
  -- Metadata
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT document_sections_name_check CHECK (char_length(name) >= 2)
);

-- Table: document_versions
-- Historique des versions de documents générés
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES generated_documents(id) ON DELETE CASCADE,
  
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  change_summary TEXT,
  
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT document_versions_unique UNIQUE (document_id, version_number)
);

-- Table: ai_generation_history
-- Historique des générations AI pour analytics et amélioration
CREATE TABLE IF NOT EXISTS ai_generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL,
  
  -- Generation info
  generation_type VARCHAR(50) NOT NULL, -- 'proposal', 'section', 'improvement', 'summary'
  prompt TEXT NOT NULL,
  model VARCHAR(50) NOT NULL,
  
  -- Result
  generated_content TEXT,
  tokens_used INTEGER,
  generation_time_ms INTEGER, -- Temps de génération en ms
  
  -- Quality
  user_rating INTEGER, -- 1-5 étoiles
  user_feedback TEXT,
  content_used BOOLEAN DEFAULT false, -- L'utilisateur a-t-il utilisé le contenu ?
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT ai_generation_history_rating_check CHECK (user_rating >= 1 AND user_rating <= 5)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Document templates indexes
CREATE INDEX IF NOT EXISTS idx_document_templates_company ON document_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_category ON document_templates(category);
CREATE INDEX IF NOT EXISTS idx_document_templates_created_by ON document_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_document_templates_default ON document_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_document_templates_public ON document_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_document_templates_usage ON document_templates(usage_count DESC);

-- Generated documents indexes
CREATE INDEX IF NOT EXISTS idx_generated_documents_company ON generated_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_tender ON generated_documents(tender_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_template ON generated_documents(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_created_by ON generated_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_generated_documents_status ON generated_documents(status);
CREATE INDEX IF NOT EXISTS idx_generated_documents_category ON generated_documents(category);
CREATE INDEX IF NOT EXISTS idx_generated_documents_date ON generated_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_documents_ai ON generated_documents(ai_generated);

-- Document sections indexes
CREATE INDEX IF NOT EXISTS idx_document_sections_company ON document_sections(company_id);
CREATE INDEX IF NOT EXISTS idx_document_sections_category ON document_sections(category);
CREATE INDEX IF NOT EXISTS idx_document_sections_type ON document_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_document_sections_favorite ON document_sections(is_favorite);
CREATE INDEX IF NOT EXISTS idx_document_sections_tags ON document_sections USING GIN(tags);

-- Document versions indexes
CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_number ON document_versions(version_number DESC);

-- AI history indexes
CREATE INDEX IF NOT EXISTS idx_ai_generation_history_company ON ai_generation_history(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_history_user ON ai_generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_history_tender ON ai_generation_history(tender_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_history_type ON ai_generation_history(generation_type);
CREATE INDEX IF NOT EXISTS idx_ai_generation_history_date ON ai_generation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generation_history_used ON ai_generation_history(content_used);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function: Incrémenter le compteur d'utilisation d'un template
CREATE OR REPLACE FUNCTION increment_template_usage(p_template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE document_templates
  SET 
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Créer une nouvelle version de document
CREATE OR REPLACE FUNCTION create_document_version(
  p_document_id UUID,
  p_content JSONB,
  p_change_summary TEXT,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_new_version INTEGER;
  v_version_id UUID;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO v_new_version
  FROM document_versions
  WHERE document_id = p_document_id;
  
  -- Insert version
  INSERT INTO document_versions (
    document_id,
    version_number,
    content,
    change_summary,
    created_by
  ) VALUES (
    p_document_id,
    v_new_version,
    p_content,
    p_change_summary,
    p_user_id
  )
  RETURNING id INTO v_version_id;
  
  -- Update document version
  UPDATE generated_documents
  SET version = v_new_version
  WHERE id = p_document_id;
  
  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Obtenir les templates les plus utilisés
CREATE OR REPLACE FUNCTION get_popular_templates(
  p_company_id UUID,
  p_category VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  category VARCHAR,
  usage_count INTEGER,
  last_used_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.category,
    t.usage_count,
    t.last_used_at
  FROM document_templates t
  WHERE t.company_id = p_company_id
    AND (p_category IS NULL OR t.category = p_category)
    AND t.usage_count > 0
  ORDER BY t.usage_count DESC, t.last_used_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Statistiques de génération AI
CREATE OR REPLACE FUNCTION get_ai_generation_stats(
  p_company_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_generations INTEGER,
  avg_rating DECIMAL,
  content_used_rate DECIMAL,
  total_tokens INTEGER,
  avg_generation_time_ms INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total_generations,
    AVG(user_rating)::DECIMAL(3,2) AS avg_rating,
    (COUNT(*) FILTER (WHERE content_used = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100)::DECIMAL(5,2) AS content_used_rate,
    SUM(tokens_used)::INTEGER AS total_tokens,
    AVG(generation_time_ms)::INTEGER AS avg_generation_time_ms
  FROM ai_generation_history
  WHERE company_id = p_company_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Drop existing triggers (after tables are created)
DROP TRIGGER IF EXISTS trigger_auto_create_document_version ON generated_documents;
DROP TRIGGER IF EXISTS trigger_document_templates_updated_at ON document_templates;
DROP TRIGGER IF EXISTS trigger_generated_documents_updated_at ON generated_documents;
DROP TRIGGER IF EXISTS trigger_document_sections_updated_at ON document_sections;

-- Trigger: Auto-create version when document is updated
CREATE OR REPLACE FUNCTION auto_create_document_version()
RETURNS TRIGGER AS $$
DECLARE
  v_next_version INTEGER;
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 
    INTO v_next_version
    FROM document_versions
    WHERE document_id = NEW.id;
    
    INSERT INTO document_versions (
      document_id,
      version_number,
      content,
      change_summary,
      created_by
    ) VALUES (
      NEW.id,
      v_next_version,
      OLD.content,
      'Auto-saved version',
      NEW.created_by
    );
    
    -- Update document version
    NEW.version := v_next_version;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_document_version
  BEFORE UPDATE ON generated_documents
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_document_version();

-- Trigger: Update updated_at
CREATE TRIGGER trigger_document_templates_updated_at
  BEFORE UPDATE ON document_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_generated_documents_updated_at
  BEFORE UPDATE ON generated_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_document_sections_updated_at
  BEFORE UPDATE ON document_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_history ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "document_templates_select_policy" ON document_templates;
DROP POLICY IF EXISTS "document_templates_insert_policy" ON document_templates;
DROP POLICY IF EXISTS "document_templates_update_policy" ON document_templates;
DROP POLICY IF EXISTS "document_templates_delete_policy" ON document_templates;
DROP POLICY IF EXISTS "generated_documents_select_policy" ON generated_documents;
DROP POLICY IF EXISTS "generated_documents_insert_policy" ON generated_documents;
DROP POLICY IF EXISTS "generated_documents_update_policy" ON generated_documents;
DROP POLICY IF EXISTS "generated_documents_delete_policy" ON generated_documents;
DROP POLICY IF EXISTS "document_sections_select_policy" ON document_sections;
DROP POLICY IF EXISTS "document_sections_insert_policy" ON document_sections;
DROP POLICY IF EXISTS "document_sections_update_policy" ON document_sections;
DROP POLICY IF EXISTS "document_sections_delete_policy" ON document_sections;
DROP POLICY IF EXISTS "document_versions_select_policy" ON document_versions;
DROP POLICY IF EXISTS "ai_generation_history_select_policy" ON ai_generation_history;
DROP POLICY IF EXISTS "ai_generation_history_insert_policy" ON ai_generation_history;

-- Document templates policies
CREATE POLICY document_templates_select_policy ON document_templates
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY document_templates_insert_policy ON document_templates
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
        AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY document_templates_update_policy ON document_templates
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
  );

CREATE POLICY document_templates_delete_policy ON document_templates
  FOR DELETE
  USING (
    created_by = auth.uid() OR
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
  );

-- Generated documents policies
CREATE POLICY generated_documents_select_policy ON generated_documents
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY generated_documents_insert_policy ON generated_documents
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY generated_documents_update_policy ON generated_documents
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
        AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY generated_documents_delete_policy ON generated_documents
  FOR DELETE
  USING (
    created_by = auth.uid() OR
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
  );

-- Document sections policies
CREATE POLICY document_sections_select_policy ON document_sections
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY document_sections_insert_policy ON document_sections
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY document_sections_update_policy ON document_sections
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
        AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY document_sections_delete_policy ON document_sections
  FOR DELETE
  USING (
    created_by = auth.uid() OR
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
  );

-- Document versions policies
CREATE POLICY document_versions_select_policy ON document_versions
  FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM generated_documents 
      WHERE company_id IN (
        SELECT company_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

-- AI generation history policies
CREATE POLICY ai_generation_history_select_policy ON ai_generation_history
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY ai_generation_history_insert_policy ON ai_generation_history
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM team_members WHERE user_id = auth.uid()
    )
  );
