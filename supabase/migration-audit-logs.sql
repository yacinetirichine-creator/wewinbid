-- ============================================================
-- FEATURE #15: AUDIT LOGS & ACTIVITY TRACKING
-- ============================================================
-- Description: Système de logs d'audit et traçabilité complète
-- Features:
--   - Logs d'audit pour toutes les actions
--   - Traçabilité des modifications
--   - Historique des connexions
--   - Détection d'activités suspectes
--   - Export des logs
--   - Conformité RGPD
-- Tables: audit_logs, activity_logs, login_history, data_export_requests
-- Created: January 2026
-- ============================================================

-- ============================================================
-- 1. AUDIT LOGS TABLE
-- ============================================================

DROP TABLE IF EXISTS audit_logs CASCADE;

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor (who performed the action)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  
  -- Action details
  action VARCHAR(100) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'LOGIN', 'LOGOUT'
  entity_type VARCHAR(100) NOT NULL, -- 'TENDER', 'DOCUMENT', 'USER', 'COMPANY', 'REPORT', etc.
  entity_id UUID,
  
  -- Changes tracking
  old_values JSONB,
  new_values JSONB,
  changes JSONB, -- Computed diff
  
  -- Context
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  
  -- Request details
  request_method VARCHAR(10), -- 'GET', 'POST', 'PUT', 'DELETE'
  request_url TEXT,
  request_params JSONB,
  
  -- Response
  status_code INTEGER,
  error_message TEXT,
  
  -- Security
  is_suspicious BOOLEAN DEFAULT FALSE,
  risk_level VARCHAR(20) DEFAULT 'LOW', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_action CHECK (
    action IN ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'LOGIN', 'LOGOUT', 'DOWNLOAD', 'SHARE', 'ARCHIVE')
  ),
  CONSTRAINT valid_risk_level CHECK (
    risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_is_suspicious ON audit_logs(is_suspicious) WHERE is_suspicious = TRUE;

-- Composite index for user activity
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_activity ON audit_logs(user_id, created_at DESC);

-- Index for entity history
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_history ON audit_logs(entity_type, entity_id, created_at DESC);

-- ============================================================
-- 2. ACTIVITY LOGS TABLE (Simplified for performance)
-- ============================================================

DROP TABLE IF EXISTS activity_logs CASCADE;

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Activity
  activity_type VARCHAR(100) NOT NULL,
  activity_category VARCHAR(50) NOT NULL, -- 'TENDER', 'DOCUMENT', 'COLLABORATION', 'SYSTEM'
  
  -- Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Related entities
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Visibility
  is_public BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  icon VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_activity_category CHECK (
    activity_category IN ('TENDER', 'DOCUMENT', 'COLLABORATION', 'SYSTEM', 'NOTIFICATION', 'REPORT')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_company_id ON activity_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tender_id ON activity_logs(tender_id);

-- ============================================================
-- 3. LOGIN HISTORY TABLE
-- ============================================================

DROP TABLE IF EXISTS login_history CASCADE;

CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  
  -- Login details
  login_method VARCHAR(50) NOT NULL, -- 'EMAIL', 'OAUTH_GOOGLE', 'OAUTH_GITHUB', 'SSO'
  login_status VARCHAR(20) NOT NULL, -- 'SUCCESS', 'FAILED', 'BLOCKED'
  
  -- Context
  ip_address INET NOT NULL,
  user_agent TEXT,
  device_type VARCHAR(50), -- 'DESKTOP', 'MOBILE', 'TABLET'
  browser VARCHAR(100),
  os VARCHAR(100),
  
  -- Location (from IP)
  country VARCHAR(100),
  city VARCHAR(100),
  
  -- Session
  session_id VARCHAR(255),
  session_duration INTEGER, -- Seconds
  logout_at TIMESTAMPTZ,
  
  -- Security
  is_suspicious BOOLEAN DEFAULT FALSE,
  failure_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_login_method CHECK (
    login_method IN ('EMAIL', 'OAUTH_GOOGLE', 'OAUTH_GITHUB', 'OAUTH_LINKEDIN', 'SSO', 'MAGIC_LINK')
  ),
  CONSTRAINT valid_login_status CHECK (
    login_status IN ('SUCCESS', 'FAILED', 'BLOCKED', 'MFA_REQUIRED')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_user_email ON login_history(user_email);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_ip_address ON login_history(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_history_login_status ON login_history(login_status);

-- Index for suspicious logins
CREATE INDEX IF NOT EXISTS idx_login_history_suspicious ON login_history(is_suspicious, created_at DESC) 
  WHERE is_suspicious = TRUE;

-- ============================================================
-- 4. DATA EXPORT REQUESTS TABLE (GDPR Compliance)
-- ============================================================

DROP TABLE IF EXISTS data_export_requests CASCADE;

CREATE TABLE data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Requester
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Request details
  request_type VARCHAR(50) NOT NULL, -- 'EXPORT', 'DELETE', 'PORTABILITY'
  data_types JSONB DEFAULT '[]', -- ['profile', 'tenders', 'documents', 'activity']
  
  -- Status
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'
  
  -- Export details
  export_format VARCHAR(20), -- 'JSON', 'CSV', 'PDF'
  file_url TEXT,
  file_size BIGINT,
  expires_at TIMESTAMPTZ,
  
  -- Processing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_request_type CHECK (
    request_type IN ('EXPORT', 'DELETE', 'PORTABILITY', 'RECTIFICATION')
  ),
  CONSTRAINT valid_export_status CHECK (
    status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')
  ),
  CONSTRAINT valid_export_format CHECK (
    export_format IS NULL OR export_format IN ('JSON', 'CSV', 'PDF', 'ZIP')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_created_at ON data_export_requests(created_at DESC);

-- Index for processing queue
CREATE INDEX IF NOT EXISTS idx_data_export_requests_pending ON data_export_requests(created_at) 
  WHERE status = 'PENDING';

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can view own login history" ON login_history;
DROP POLICY IF EXISTS "Users can view own data export requests" ON data_export_requests;
DROP POLICY IF EXISTS "Users can create data export requests" ON data_export_requests;
DROP POLICY IF EXISTS "Users can update own export requests" ON data_export_requests;

-- Audit Logs: Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- Activity Logs: Users can view their own and company activity
CREATE POLICY "Users can view own activity logs"
  ON activity_logs FOR SELECT
  USING (
    user_id = auth.uid() 
    OR company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Login History: Users can only view their own login history
CREATE POLICY "Users can view own login history"
  ON login_history FOR SELECT
  USING (user_id = auth.uid());

-- Data Export Requests: Users can view their own requests
CREATE POLICY "Users can view own data export requests"
  ON data_export_requests FOR SELECT
  USING (user_id = auth.uid());

-- Data Export Requests: Users can create requests
CREATE POLICY "Users can create data export requests"
  ON data_export_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Data Export Requests: Users can update their own requests (cancel)
CREATE POLICY "Users can update own export requests"
  ON data_export_requests FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- 6. HELPER FUNCTIONS
-- ============================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS log_audit(VARCHAR, VARCHAR, UUID, JSONB, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS log_activity(VARCHAR, VARCHAR, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS log_login(VARCHAR, VARCHAR, INET, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_activity_summary(UUID, DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS detect_suspicious_login(UUID, INET) CASCADE;
DROP FUNCTION IF EXISTS process_data_export_request(UUID) CASCADE;

-- Function to log audit trail
CREATE OR REPLACE FUNCTION log_audit(
  p_action VARCHAR,
  p_entity_type VARCHAR,
  p_entity_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_audit_id UUID;
  v_user_email VARCHAR;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Insert audit log
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    description
  ) VALUES (
    auth.uid(),
    v_user_email,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_description
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_activity_type VARCHAR,
  p_category VARCHAR,
  p_title TEXT,
  p_tender_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id UUID;
  v_company_id UUID;
BEGIN
  -- Get user's company
  SELECT company_id INTO v_company_id
  FROM profiles
  WHERE id = auth.uid();
  
  -- Insert activity log
  INSERT INTO activity_logs (
    user_id,
    company_id,
    activity_type,
    activity_category,
    title,
    tender_id
  ) VALUES (
    auth.uid(),
    v_company_id,
    p_activity_type,
    p_category,
    p_title,
    p_tender_id
  ) RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;

-- Function to log login
CREATE OR REPLACE FUNCTION log_login(
  p_method VARCHAR,
  p_status VARCHAR,
  p_ip_address INET,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_login_id UUID;
  v_user_email VARCHAR;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Insert login history
  INSERT INTO login_history (
    user_id,
    user_email,
    login_method,
    login_status,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    v_user_email,
    p_method,
    p_status,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_login_id;
  
  RETURN v_login_id;
END;
$$;

-- Function to get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity_summary(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_actions BIGINT,
  actions_by_type JSONB,
  most_active_day DATE,
  activity_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH action_counts AS (
    SELECT 
      COUNT(*) as total,
      jsonb_object_agg(action, action_count) as by_type
    FROM (
      SELECT 
        action,
        COUNT(*) as action_count
      FROM audit_logs
      WHERE user_id = p_user_id
        AND created_at::DATE BETWEEN p_start_date AND p_end_date
      GROUP BY action
    ) counts
  ),
  daily_activity AS (
    SELECT 
      created_at::DATE as day,
      COUNT(*) as count
    FROM audit_logs
    WHERE user_id = p_user_id
      AND created_at::DATE BETWEEN p_start_date AND p_end_date
    GROUP BY created_at::DATE
    ORDER BY count DESC
    LIMIT 1
  )
  SELECT 
    ac.total,
    ac.by_type,
    da.day,
    da.count
  FROM action_counts ac
  CROSS JOIN daily_activity da;
END;
$$;

-- Function to detect suspicious login
CREATE OR REPLACE FUNCTION detect_suspicious_login(
  p_user_id UUID,
  p_ip_address INET
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recent_ips INTEGER;
  v_failed_attempts INTEGER;
BEGIN
  -- Check for multiple IPs in last hour
  SELECT COUNT(DISTINCT ip_address) INTO v_recent_ips
  FROM login_history
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Check for recent failed attempts
  SELECT COUNT(*) INTO v_failed_attempts
  FROM login_history
  WHERE user_id = p_user_id
    AND login_status = 'FAILED'
    AND created_at > NOW() - INTERVAL '15 minutes';
  
  -- Flag as suspicious if multiple IPs or many failures
  RETURN (v_recent_ips > 3 OR v_failed_attempts > 5);
END;
$$;

-- Function to process data export request
CREATE OR REPLACE FUNCTION process_data_export_request(
  p_request_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_data JSONB;
BEGIN
  -- Get request details
  SELECT * INTO v_request
  FROM data_export_requests
  WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update status to processing
  UPDATE data_export_requests
  SET 
    status = 'PROCESSING',
    started_at = NOW()
  WHERE id = p_request_id;
  
  -- This is a placeholder - actual export would be done by backend service
  -- For now, just mark as completed
  UPDATE data_export_requests
  SET 
    status = 'COMPLETED',
    completed_at = NOW(),
    expires_at = NOW() + INTERVAL '30 days'
  WHERE id = p_request_id;
  
  RETURN TRUE;
END;
$$;

-- ============================================================
-- 7. TRIGGERS
-- ============================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_data_export_requests_updated_at ON data_export_requests CASCADE;

-- Update updated_at timestamp
CREATE TRIGGER update_data_export_requests_updated_at
  BEFORE UPDATE ON data_export_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. VIEWS
-- ============================================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS v_recent_activity CASCADE;
DROP VIEW IF EXISTS v_audit_trail CASCADE;

-- View for recent activity
CREATE OR REPLACE VIEW v_recent_activity AS
SELECT 
  al.id,
  al.user_id,
  al.activity_type,
  al.activity_category,
  al.title,
  al.description,
  al.created_at,
  u.email as user_email,
  t.title as tender_title
FROM activity_logs al
LEFT JOIN auth.users u ON al.user_id = u.id
LEFT JOIN tenders t ON al.tender_id = t.id
WHERE al.created_at > NOW() - INTERVAL '30 days'
ORDER BY al.created_at DESC;

-- View for audit trail
CREATE OR REPLACE VIEW v_audit_trail AS
SELECT 
  a.id,
  a.user_email,
  a.action,
  a.entity_type,
  a.entity_id,
  a.description,
  a.ip_address,
  a.created_at,
  a.is_suspicious,
  a.risk_level
FROM audit_logs a
WHERE a.created_at > NOW() - INTERVAL '90 days'
ORDER BY a.created_at DESC;

-- ============================================================
-- 9. COMMENTS
-- ============================================================

COMMENT ON TABLE audit_logs IS 'Complete audit trail of all system actions with change tracking';
COMMENT ON TABLE activity_logs IS 'User activity feed for timeline and notifications';
COMMENT ON TABLE login_history IS 'Login attempts and session tracking for security monitoring';
COMMENT ON TABLE data_export_requests IS 'GDPR-compliant data export and deletion requests';

COMMENT ON FUNCTION log_audit(VARCHAR, VARCHAR, UUID, JSONB, JSONB, TEXT) IS 'Log an audit trail entry';
COMMENT ON FUNCTION log_activity(VARCHAR, VARCHAR, TEXT, UUID) IS 'Log a user activity for the feed';
COMMENT ON FUNCTION log_login(VARCHAR, VARCHAR, INET, TEXT) IS 'Log a login attempt';
COMMENT ON FUNCTION detect_suspicious_login(UUID, INET) IS 'Detect potentially suspicious login patterns';

-- ============================================================
-- END OF MIGRATION
-- ============================================================
