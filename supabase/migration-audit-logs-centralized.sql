-- =====================================================
-- MIGRATION: Audit Logs Centralisés
-- Description: Table centralisée pour tous les logs d'audit (RGPD, sécurité)
-- Date: 2025-01-19
-- =====================================================

-- 1. Créer la table audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Qui a fait l'action
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Quelle action
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100), -- Ex: 'tender', 'document', 'user', 'subscription'
  resource_id UUID, -- ID de la ressource concernée
  
  -- Détails de l'action
  details JSONB, -- Données supplémentaires (ancien/nouveau état, etc.)
  severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
  
  -- Contexte technique
  ip_address VARCHAR(45), -- IPv4 ou IPv6
  user_agent TEXT,
  request_method VARCHAR(10), -- GET, POST, PUT, DELETE
  request_path TEXT,
  
  -- Résultat
  status_code INTEGER, -- HTTP status code
  error_message TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_created ON audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);

-- 3. Row Level Security (RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir les logs de leur entreprise
DROP POLICY IF EXISTS "Users can view their company audit logs" ON audit_logs;
CREATE POLICY "Users can view their company audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- Seuls les admins peuvent voir tous les logs
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Seul le système peut insérer des logs (via service role)
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true); -- Service role bypasse RLS

-- Personne ne peut modifier ou supprimer les logs (immutabilité)
-- Pas de policy DELETE/UPDATE = interdit pour tous les utilisateurs

-- 4. Fonction helper pour créer un log
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_user_id UUID,
  p_company_id UUID,
  p_action VARCHAR,
  p_resource VARCHAR DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_severity VARCHAR DEFAULT 'info',
  p_ip_address VARCHAR DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_request_method VARCHAR DEFAULT NULL,
  p_request_path TEXT DEFAULT NULL,
  p_status_code INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Exécuté avec les droits du créateur (bypasse RLS)
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    company_id,
    action,
    resource,
    resource_id,
    details,
    severity,
    ip_address,
    user_agent,
    request_method,
    request_path,
    status_code,
    error_message
  ) VALUES (
    p_user_id,
    p_company_id,
    p_action,
    p_resource,
    p_resource_id,
    p_details,
    p_severity,
    p_ip_address,
    p_user_agent,
    p_request_method,
    p_request_path,
    p_status_code,
    p_error_message
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 5. Fonction pour nettoyer les anciens logs (RGPD - conservation 2 ans)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Supprimer les logs de plus de 2 ans (conformité RGPD)
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '2 years';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

-- 6. Trigger automatique pour logger les modifications de tenders
CREATE OR REPLACE FUNCTION public.log_tender_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id UUID;
  v_action VARCHAR;
  v_details JSONB;
BEGIN
  -- Déterminer l'action
  IF TG_OP = 'INSERT' THEN
    v_action := 'tender_created';
    v_details := jsonb_build_object(
      'tender_id', NEW.id,
      'title', NEW.title,
      'status', NEW.status
    );
    v_company_id := NEW.company_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'tender_updated';
    v_details := jsonb_build_object(
      'tender_id', NEW.id,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'changed_fields', (
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_each(to_jsonb(NEW))
        WHERE to_jsonb(NEW)->key IS DISTINCT FROM to_jsonb(OLD)->key
      )
    );
    v_company_id := NEW.company_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'tender_deleted';
    v_details := jsonb_build_object(
      'tender_id', OLD.id,
      'title', OLD.title
    );
    v_company_id := OLD.company_id;
  END IF;
  
  -- Créer le log
  PERFORM create_audit_log(
    p_user_id := auth.uid(),
    p_company_id := v_company_id,
    p_action := v_action,
    p_resource := 'tender',
    p_resource_id := COALESCE(NEW.id, OLD.id),
    p_details := v_details
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attacher le trigger sur la table tenders
DROP TRIGGER IF EXISTS trigger_log_tender_changes ON tenders;
CREATE TRIGGER trigger_log_tender_changes
  AFTER INSERT OR UPDATE OR DELETE ON tenders
  FOR EACH ROW
  EXECUTE FUNCTION log_tender_changes();

-- 7. Commenter la table
COMMENT ON TABLE audit_logs IS 'Logs d''audit centralisés pour la conformité RGPD et la sécurité. Conservation 2 ans.';
COMMENT ON COLUMN audit_logs.action IS 'Actions: tender_created, document_uploaded, user_login, account_deleted, subscription_changed, etc.';
COMMENT ON COLUMN audit_logs.severity IS 'Niveaux: info (normal), warning (attention), error (erreur), critical (critique)';
COMMENT ON COLUMN audit_logs.details IS 'Détails JSON de l''action (old/new values, metadata)';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

-- Exemple d'utilisation:
-- SELECT create_audit_log(
--   p_user_id := auth.uid(),
--   p_company_id := 'xxx-xxx-xxx',
--   p_action := 'document_uploaded',
--   p_resource := 'document',
--   p_resource_id := 'yyy-yyy-yyy',
--   p_details := '{"file_name": "memo.pdf", "size_mb": 2.5}'::jsonb,
--   p_severity := 'info'
-- );
