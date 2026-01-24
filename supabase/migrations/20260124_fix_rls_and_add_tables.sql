-- Migration: Fix RLS policies and add generated_documents & company_settings tables
-- Date: 2026-01-24

-- ============================================
-- 1. Create generated_documents table
-- ============================================

CREATE TABLE IF NOT EXISTS generated_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  sections JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected')),
  version INT DEFAULT 1,
  provider VARCHAR(50),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generated_documents_tender ON generated_documents(tender_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_company ON generated_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_user ON generated_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_status ON generated_documents(status);
CREATE INDEX IF NOT EXISTS idx_generated_documents_type ON generated_documents(document_type);

-- RLS for generated_documents
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generated documents"
  ON generated_documents
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own generated documents"
  ON generated_documents
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own generated documents"
  ON generated_documents
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own generated documents"
  ON generated_documents
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- 2. Create company_settings table
-- ============================================

CREATE TABLE IF NOT EXISTS company_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  document_branding JSONB DEFAULT '{}'::jsonb,
  notification_preferences JSONB DEFAULT '{}'::jsonb,
  ai_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_company_settings_company ON company_settings(company_id);

-- RLS for company_settings
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company settings"
  ON company_settings
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their company settings"
  ON company_settings
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company settings"
  ON company_settings
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================
-- 3. Fix overly permissive RLS policies
-- ============================================

-- Fix approval_comments policy (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'approval_comments'
    AND policyname = 'Users can view approval_comments'
  ) THEN
    DROP POLICY "Users can view approval_comments" ON approval_comments;

    CREATE POLICY "Users can view approval_comments"
      ON approval_comments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM approval_requests ar
          WHERE ar.id = approval_comments.request_id
          AND (
            ar.requested_by = auth.uid()
            OR ar.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
          )
        )
      );
  END IF;
END $$;

-- Fix audit_log policy (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'audit_log'
    AND policyname = 'Users can view audit log'
  ) THEN
    DROP POLICY "Users can view audit log" ON audit_log;

    CREATE POLICY "Users can view audit log"
      ON audit_log
      FOR SELECT
      USING (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
        OR user_id = auth.uid()
      );
  END IF;
END $$;

-- Fix approval_workflows policy (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'approval_workflows'
    AND policyname = 'Users can view organization workflows'
  ) THEN
    DROP POLICY "Users can view organization workflows" ON approval_workflows;

    CREATE POLICY "Users can view organization workflows"
      ON approval_workflows
      FOR SELECT
      USING (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
      );
  END IF;
END $$;

-- ============================================
-- 4. Add version history trigger for generated_documents
-- ============================================

CREATE OR REPLACE FUNCTION update_generated_document_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    NEW.version := OLD.version + 1;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_generated_document_version ON generated_documents;
CREATE TRIGGER trigger_update_generated_document_version
  BEFORE UPDATE ON generated_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_generated_document_version();

-- ============================================
-- 5. Add index for ai_generations if not exists
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ai_generations_tender ON ai_generations(tender_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_user ON ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_company ON ai_generations(company_id);

-- ============================================
-- DONE
-- ============================================

COMMENT ON TABLE generated_documents IS 'Stores AI-generated documents with versioning';
COMMENT ON TABLE company_settings IS 'Stores company-specific settings including branding';
