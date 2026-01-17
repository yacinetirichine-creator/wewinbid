-- ============================================================
-- FEATURE #13: NOTIFICATIONS & ALERTES
-- ============================================================
-- Description: Système de notifications temps réel et alertes
-- Features:
--   - Notifications in-app temps réel
--   - Email notifications avec templates
--   - Push notifications (web push)
--   - Alertes personnalisables
--   - Préférences de notification
--   - Digest quotidien/hebdomadaire
-- Tables: notifications, notification_preferences, notification_templates, email_queue
-- Created: January 2026
-- ============================================================

-- ============================================================
-- 1. NOTIFICATIONS TABLE
-- ============================================================

DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification details
  type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'TENDER', 'DEADLINE', 'DOCUMENT', 'TEAM', 'MARKETPLACE', 'SYSTEM'
  
  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_text VARCHAR(100),
  action_url TEXT,
  
  -- Related entities
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Priority & Status
  priority VARCHAR(20) DEFAULT 'NORMAL', -- 'LOW', 'NORMAL', 'HIGH', 'URGENT'
  status VARCHAR(20) DEFAULT 'UNREAD', -- 'UNREAD', 'READ', 'ARCHIVED', 'DELETED'
  
  -- Read tracking
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  
  -- Delivery channels
  channels JSONB DEFAULT '["IN_APP"]', -- ['IN_APP', 'EMAIL', 'PUSH']
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  icon VARCHAR(50), -- Icon name or emoji
  color VARCHAR(7), -- Hex color code
  
  -- Grouping (for batching similar notifications)
  group_key VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Auto-delete after this date
  
  -- Constraints
  CONSTRAINT valid_category CHECK (
    category IN ('TENDER', 'DEADLINE', 'DOCUMENT', 'TEAM', 'MARKETPLACE', 'SYSTEM')
  ),
  CONSTRAINT valid_priority CHECK (
    priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('UNREAD', 'READ', 'ARCHIVED', 'DELETED')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_tender_id ON notifications(tender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_group_key ON notifications(group_key);

-- Composite index for fetching unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, status, created_at DESC) 
  WHERE status = 'UNREAD';

-- ============================================================
-- 2. NOTIFICATION PREFERENCES TABLE
-- ============================================================

DROP TABLE IF EXISTS notification_preferences CASCADE;

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Global settings
  enabled BOOLEAN DEFAULT TRUE,
  do_not_disturb BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone VARCHAR(50) DEFAULT 'Europe/Paris',
  
  -- Channel preferences
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  
  -- Email digest settings
  digest_enabled BOOLEAN DEFAULT FALSE,
  digest_frequency VARCHAR(20) DEFAULT 'DAILY', -- 'DAILY', 'WEEKLY', 'MONTHLY'
  digest_day_of_week INTEGER, -- 0-6 for weekly, NULL for daily
  digest_time TIME DEFAULT '09:00:00',
  
  -- Notification type preferences (JSONB for flexibility)
  tender_notifications JSONB DEFAULT '{
    "new_tender": {"email": true, "push": true, "in_app": true},
    "deadline_7d": {"email": true, "push": false, "in_app": true},
    "deadline_3d": {"email": true, "push": true, "in_app": true},
    "deadline_24h": {"email": true, "push": true, "in_app": true},
    "status_change": {"email": true, "push": false, "in_app": true},
    "won": {"email": true, "push": true, "in_app": true},
    "lost": {"email": true, "push": false, "in_app": true}
  }',
  
  document_notifications JSONB DEFAULT '{
    "document_uploaded": {"email": false, "push": false, "in_app": true},
    "document_reviewed": {"email": true, "push": false, "in_app": true},
    "document_approved": {"email": true, "push": false, "in_app": true},
    "document_rejected": {"email": true, "push": true, "in_app": true}
  }',
  
  team_notifications JSONB DEFAULT '{
    "team_invite": {"email": true, "push": true, "in_app": true},
    "member_joined": {"email": false, "push": false, "in_app": true},
    "member_left": {"email": false, "push": false, "in_app": true},
    "role_changed": {"email": true, "push": false, "in_app": true}
  }',
  
  marketplace_notifications JSONB DEFAULT '{
    "new_opportunity": {"email": true, "push": false, "in_app": true},
    "partnership_request": {"email": true, "push": true, "in_app": true},
    "partnership_accepted": {"email": true, "push": true, "in_app": true},
    "partnership_rejected": {"email": true, "push": false, "in_app": true}
  }',
  
  system_notifications JSONB DEFAULT '{
    "maintenance": {"email": true, "push": true, "in_app": true},
    "feature_update": {"email": false, "push": false, "in_app": true},
    "security_alert": {"email": true, "push": true, "in_app": true}
  }',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_digest_frequency CHECK (
    digest_frequency IN ('DAILY', 'WEEKLY', 'MONTHLY')
  ),
  CONSTRAINT valid_digest_day CHECK (
    digest_day_of_week IS NULL OR (digest_day_of_week >= 0 AND digest_day_of_week <= 6)
  ),
  CONSTRAINT one_preference_per_user UNIQUE (user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- ============================================================
-- 3. NOTIFICATION TEMPLATES TABLE
-- ============================================================

DROP TABLE IF EXISTS notification_templates CASCADE;

CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template identification
  template_key VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  
  -- Template content
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  html_template TEXT,
  
  -- Supported variables (for documentation)
  variables JSONB DEFAULT '[]', -- ['{{user_name}}', '{{tender_title}}', ...]
  
  -- Default settings
  default_channels JSONB DEFAULT '["IN_APP", "EMAIL"]',
  default_priority VARCHAR(20) DEFAULT 'NORMAL',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE, -- System templates cannot be deleted
  
  -- Localization
  language VARCHAR(5) DEFAULT 'fr',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_template_category CHECK (
    category IN ('TENDER', 'DEADLINE', 'DOCUMENT', 'TEAM', 'MARKETPLACE', 'SYSTEM')
  ),
  CONSTRAINT valid_template_priority CHECK (
    default_priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_templates_language ON notification_templates(language);

-- ============================================================
-- 4. EMAIL QUEUE TABLE
-- ============================================================

DROP TABLE IF EXISTS email_queue CASCADE;

CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_email VARCHAR(255) NOT NULL,
  to_name VARCHAR(255),
  
  -- Email content
  subject VARCHAR(500) NOT NULL,
  body_text TEXT NOT NULL,
  body_html TEXT,
  
  -- Template info (optional)
  template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
  template_data JSONB,
  
  -- Related notification
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  
  -- Sender
  from_email VARCHAR(255) DEFAULT 'notifications@wewinbid.com',
  from_name VARCHAR(255) DEFAULT 'WeWinBid',
  reply_to VARCHAR(255),
  
  -- CC/BCC
  cc_emails JSONB DEFAULT '[]',
  bcc_emails JSONB DEFAULT '[]',
  
  -- Attachments
  attachments JSONB DEFAULT '[]',
  
  -- Priority & Status
  priority VARCHAR(20) DEFAULT 'NORMAL',
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SENDING', 'SENT', 'FAILED', 'CANCELLED'
  
  -- Delivery tracking
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  -- Error handling
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  last_error_at TIMESTAMPTZ,
  
  -- Provider info
  provider VARCHAR(50) DEFAULT 'resend', -- 'resend', 'sendgrid', 'postmark'
  provider_message_id VARCHAR(255),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_email_priority CHECK (
    priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')
  ),
  CONSTRAINT valid_email_status CHECK (
    status IN ('PENDING', 'SENDING', 'SENT', 'FAILED', 'CANCELLED')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_user_id ON email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at);

-- Index for processing pending emails
CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON email_queue(scheduled_at, priority, created_at) 
  WHERE status = 'PENDING';

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Everyone can view active templates" ON notification_templates;
DROP POLICY IF EXISTS "Users can view own email queue" ON email_queue;

-- Notifications: Users can only see their own
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Notifications: System can create (service role)
CREATE POLICY "Users can create own notifications"
  ON notifications FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Notifications: Users can update their own (mark as read, archive)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Notifications: Users can delete their own
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- Notification Preferences: Users can view their own
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

-- Notification Preferences: Users can update their own
CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notification Templates: Everyone can view active templates
CREATE POLICY "Everyone can view active templates"
  ON notification_templates FOR SELECT
  USING (is_active = TRUE);

-- Email Queue: Users can view their own emails
CREATE POLICY "Users can view own email queue"
  ON email_queue FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- 6. HELPER FUNCTIONS
-- ============================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_notification(UUID, VARCHAR, VARCHAR, TEXT, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS mark_notification_as_read(UUID) CASCADE;
DROP FUNCTION IF EXISTS mark_all_notifications_as_read(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_unread_count(UUID) CASCADE;
DROP FUNCTION IF EXISTS archive_old_notifications(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS send_email_notification(UUID, VARCHAR, TEXT, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS process_email_queue(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS should_send_notification(UUID, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS create_default_notification_preferences() CASCADE;

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_category VARCHAR,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
  v_preferences RECORD;
  v_channel_config JSONB;
BEGIN
  -- Get user preferences
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;
  
  -- Create default preferences if none exist
  IF NOT FOUND THEN
    PERFORM create_default_notification_preferences();
    SELECT * INTO v_preferences
    FROM notification_preferences
    WHERE user_id = p_user_id;
  END IF;
  
  -- Check if notifications are enabled
  IF NOT v_preferences.enabled OR v_preferences.do_not_disturb THEN
    RETURN NULL;
  END IF;
  
  -- Insert notification
  INSERT INTO notifications (
    user_id,
    type,
    category,
    title,
    message,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_category,
    p_title,
    p_message,
    p_metadata
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_as_read(
  p_notification_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET 
    status = 'READ',
    read_at = NOW(),
    updated_at = NOW()
  WHERE id = p_notification_id
    AND user_id = auth.uid()
    AND status = 'UNREAD';
  
  RETURN FOUND;
END;
$$;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(
  p_user_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  UPDATE notifications
  SET 
    status = 'READ',
    read_at = NOW(),
    updated_at = NOW()
  WHERE user_id = v_user_id
    AND status = 'UNREAD';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_count(
  p_user_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM notifications
  WHERE user_id = v_user_id
    AND status = 'UNREAD';
  
  RETURN v_count;
END;
$$;

-- Function to archive old notifications
CREATE OR REPLACE FUNCTION archive_old_notifications(
  p_days_old INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET 
    status = 'ARCHIVED',
    archived_at = NOW(),
    updated_at = NOW()
  WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL
    AND status = 'READ';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Function to send email notification
CREATE OR REPLACE FUNCTION send_email_notification(
  p_user_id UUID,
  p_subject TEXT,
  p_body_text TEXT,
  p_body_html TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email_id UUID;
  v_user_email VARCHAR;
  v_user_name VARCHAR;
BEGIN
  -- Get user email
  SELECT email, raw_user_meta_data->>'full_name'
  INTO v_user_email, v_user_name
  FROM auth.users
  WHERE id = p_user_id;
  
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'User email not found';
  END IF;
  
  -- Insert into email queue
  INSERT INTO email_queue (
    user_id,
    to_email,
    to_name,
    subject,
    body_text,
    body_html,
    metadata
  ) VALUES (
    p_user_id,
    v_user_email,
    v_user_name,
    p_subject,
    p_body_text,
    p_body_html,
    p_metadata
  ) RETURNING id INTO v_email_id;
  
  RETURN v_email_id;
END;
$$;

-- Function to process email queue
CREATE OR REPLACE FUNCTION process_email_queue(
  p_batch_size INTEGER DEFAULT 10
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_email RECORD;
BEGIN
  -- Get pending emails
  FOR v_email IN
    SELECT * FROM email_queue
    WHERE status = 'PENDING'
      AND (scheduled_at IS NULL OR scheduled_at <= NOW())
      AND attempts < max_attempts
    ORDER BY priority DESC, created_at ASC
    LIMIT p_batch_size
  LOOP
    -- Mark as sending
    UPDATE email_queue
    SET 
      status = 'SENDING',
      attempts = attempts + 1,
      updated_at = NOW()
    WHERE id = v_email.id;
    
    -- Actual sending would be done by external service
    -- For now, just mark as sent
    UPDATE email_queue
    SET 
      status = 'SENT',
      sent_at = NOW(),
      updated_at = NOW()
    WHERE id = v_email.id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- Function to check if notification should be sent
CREATE OR REPLACE FUNCTION should_send_notification(
  p_user_id UUID,
  p_category VARCHAR,
  p_type VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_preferences RECORD;
  v_config JSONB;
BEGIN
  -- Get user preferences
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN TRUE; -- Default to sending if no preferences set
  END IF;
  
  -- Check global settings
  IF NOT v_preferences.enabled OR v_preferences.do_not_disturb THEN
    RETURN FALSE;
  END IF;
  
  -- Check category-specific settings
  v_config := CASE p_category
    WHEN 'TENDER' THEN v_preferences.tender_notifications
    WHEN 'DOCUMENT' THEN v_preferences.document_notifications
    WHEN 'TEAM' THEN v_preferences.team_notifications
    WHEN 'MARKETPLACE' THEN v_preferences.marketplace_notifications
    WHEN 'SYSTEM' THEN v_preferences.system_notifications
    ELSE '{}'::JSONB
  END;
  
  -- Check if type is enabled (default to true if not configured)
  RETURN COALESCE((v_config->p_type->>'in_app')::BOOLEAN, TRUE);
END;
$$;

-- Function to create default notification preferences
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pref_id UUID;
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (auth.uid())
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_pref_id;
  
  RETURN v_pref_id;
END;
$$;

-- ============================================================
-- 7. TRIGGERS
-- ============================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications CASCADE;
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences CASCADE;
DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON notification_templates CASCADE;
DROP TRIGGER IF EXISTS update_email_queue_updated_at ON email_queue CASCADE;
DROP TRIGGER IF EXISTS auto_create_notification_preferences ON auth.users CASCADE;

-- Update updated_at timestamp
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at
  BEFORE UPDATE ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. SEED DATA: NOTIFICATION TEMPLATES
-- ============================================================

-- Tender deadline notifications
INSERT INTO notification_templates (template_key, name, description, category, subject_template, body_template, variables, language) VALUES
('tender_deadline_7d', 'Deadline - 7 Days', 'Notification sent 7 days before tender deadline', 'DEADLINE',
 'Échéance dans 7 jours: {{tender_title}}',
 'L''appel d''offres "{{tender_title}}" arrive à échéance dans 7 jours ({{deadline_date}}). Assurez-vous que tous les documents sont prêts.',
 '["{{tender_title}}", "{{deadline_date}}"]', 'fr'),

('tender_deadline_3d', 'Deadline - 3 Days', 'Notification sent 3 days before tender deadline', 'DEADLINE',
 '⚠️ Échéance dans 3 jours: {{tender_title}}',
 'ATTENTION: L''appel d''offres "{{tender_title}}" arrive à échéance dans 3 jours ({{deadline_date}}). Il est temps de finaliser votre réponse.',
 '["{{tender_title}}", "{{deadline_date}}"]', 'fr'),

('tender_deadline_24h', 'Deadline - 24 Hours', 'Notification sent 24 hours before tender deadline', 'DEADLINE',
 '🚨 URGENT: Échéance demain - {{tender_title}}',
 'URGENT: L''appel d''offres "{{tender_title}}" arrive à échéance demain ({{deadline_date}}). Dernière chance de soumettre votre réponse!',
 '["{{tender_title}}", "{{deadline_date}}"]', 'fr'),

-- Tender status changes
('tender_won', 'Tender Won', 'Notification when tender is marked as won', 'TENDER',
 '🎉 Félicitations! Vous avez remporté l''appel d''offres',
 'Excellente nouvelle! Vous avez remporté l''appel d''offres "{{tender_title}}". Montant: {{amount}}€.',
 '["{{tender_title}}", "{{amount}}"]', 'fr'),

('tender_lost', 'Tender Lost', 'Notification when tender is marked as lost', 'TENDER',
 'Résultat de l''appel d''offres: {{tender_title}}',
 'L''appel d''offres "{{tender_title}}" n''a malheureusement pas été retenu. Continuez vos efforts!',
 '["{{tender_title}}"]', 'fr'),

-- Document notifications
('document_approved', 'Document Approved', 'Notification when document is approved', 'DOCUMENT',
 '✅ Document approuvé: {{document_name}}',
 'Le document "{{document_name}}" a été approuvé par {{approver_name}}.',
 '["{{document_name}}", "{{approver_name}}"]', 'fr'),

('document_rejected', 'Document Rejected', 'Notification when document is rejected', 'DOCUMENT',
 '❌ Document rejeté: {{document_name}}',
 'Le document "{{document_name}}" a été rejeté par {{reviewer_name}}. Raison: {{reason}}',
 '["{{document_name}}", "{{reviewer_name}}", "{{reason}}"]', 'fr'),

-- Team notifications
('team_invite', 'Team Invitation', 'Notification when user is invited to team', 'TEAM',
 'Invitation à rejoindre l''équipe {{team_name}}',
 '{{inviter_name}} vous a invité à rejoindre l''équipe "{{team_name}}".',
 '["{{team_name}}", "{{inviter_name}}"]', 'fr'),

('partnership_request', 'Partnership Request', 'Notification for new partnership request', 'MARKETPLACE',
 'Nouvelle demande de partenariat',
 '{{company_name}} souhaite collaborer avec vous sur l''appel d''offres "{{tender_title}}".',
 '["{{company_name}}", "{{tender_title}}"]', 'fr');

-- ============================================================
-- 9. VIEWS
-- ============================================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS v_notification_summary CASCADE;
DROP VIEW IF EXISTS v_recent_notifications CASCADE;

-- View for notification summary
CREATE OR REPLACE VIEW v_notification_summary AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE status = 'UNREAD') as unread_count,
  COUNT(*) FILTER (WHERE status = 'READ') as read_count,
  COUNT(*) FILTER (WHERE priority = 'URGENT' AND status = 'UNREAD') as urgent_count,
  MAX(created_at) FILTER (WHERE status = 'UNREAD') as latest_unread_at,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h_count
FROM notifications
WHERE status != 'DELETED'
GROUP BY user_id;

-- View for recent notifications
CREATE OR REPLACE VIEW v_recent_notifications AS
SELECT 
  n.id,
  n.user_id,
  n.type,
  n.category,
  n.title,
  n.message,
  n.priority,
  n.status,
  n.created_at,
  t.title as tender_title,
  d.name as document_name
FROM notifications n
LEFT JOIN tenders t ON n.tender_id = t.id
LEFT JOIN documents d ON n.document_id = d.id
WHERE n.status != 'DELETED'
  AND n.created_at > NOW() - INTERVAL '30 days'
ORDER BY n.created_at DESC;

-- ============================================================
-- 10. COMMENTS
-- ============================================================

COMMENT ON TABLE notifications IS 'User notifications for in-app, email, and push delivery';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification channels and types';
COMMENT ON TABLE notification_templates IS 'Templates for generating consistent notifications';
COMMENT ON TABLE email_queue IS 'Queue for processing outbound email notifications';

COMMENT ON FUNCTION create_notification(UUID, VARCHAR, VARCHAR, TEXT, TEXT, JSONB) IS 'Create a new notification respecting user preferences';
COMMENT ON FUNCTION mark_notification_as_read(UUID) IS 'Mark a single notification as read';
COMMENT ON FUNCTION mark_all_notifications_as_read(UUID) IS 'Mark all notifications as read for a user';
COMMENT ON FUNCTION get_unread_count(UUID) IS 'Get count of unread notifications for a user';
COMMENT ON FUNCTION send_email_notification(UUID, TEXT, TEXT, TEXT, JSONB) IS 'Queue an email for delivery';

-- ============================================================
-- END OF MIGRATION
-- ============================================================
