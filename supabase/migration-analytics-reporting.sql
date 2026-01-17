-- ============================================================
-- FEATURE #14: ANALYTICS & REPORTING
-- ============================================================
-- Description: Système d'analytics et de reporting avancé
-- Features:
--   - Tableaux de bord personnalisables
--   - KPIs et métriques
--   - Rapports automatisés
--   - Export de données
--   - Analyse comparative
--   - Prévisions IA
-- Tables: analytics_events, kpi_metrics, reports, report_schedules, analytics_dashboards
-- Created: January 2026
-- ============================================================

-- ============================================================
-- 1. ANALYTICS EVENTS TABLE
-- ============================================================

DROP TABLE IF EXISTS analytics_events CASCADE;

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL, -- 'TENDER', 'DOCUMENT', 'USER', 'SYSTEM', 'MARKETPLACE'
  event_action VARCHAR(100) NOT NULL, -- 'VIEW', 'CREATE', 'UPDATE', 'DELETE', 'SUBMIT', 'EXPORT'
  
  -- Related entities
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Event metadata
  event_properties JSONB DEFAULT '{}',
  
  -- Context
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Timing
  duration_ms INTEGER, -- Time taken for action
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  event_date DATE,
  event_hour INTEGER,
  
  -- Constraints
  CONSTRAINT valid_event_category CHECK (
    event_category IN ('TENDER', 'DOCUMENT', 'USER', 'SYSTEM', 'MARKETPLACE')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_company_id ON analytics_events(company_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_action ON analytics_events(event_action);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_date ON analytics_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_tender_id ON analytics_events(tender_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_company_date ON analytics_events(company_id, event_date DESC);

-- ============================================================
-- 2. KPI METRICS TABLE
-- ============================================================

DROP TABLE IF EXISTS kpi_metrics CASCADE;

CREATE TABLE kpi_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Metric identification
  metric_key VARCHAR(100) NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  metric_category VARCHAR(50) NOT NULL, -- 'TENDER', 'REVENUE', 'CONVERSION', 'PERFORMANCE', 'CUSTOM'
  
  -- Metric value
  metric_value DECIMAL(20,2) NOT NULL,
  previous_value DECIMAL(20,2),
  target_value DECIMAL(20,2),
  
  -- Change tracking
  change_percentage DECIMAL(10,2),
  change_direction VARCHAR(10), -- 'UP', 'DOWN', 'STABLE'
  
  -- Time period
  period_type VARCHAR(20) NOT NULL, -- 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Context
  metadata JSONB DEFAULT '{}',
  
  -- Status
  status VARCHAR(20) DEFAULT 'CURRENT', -- 'CURRENT', 'HISTORICAL', 'PROJECTED'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_metric_category CHECK (
    metric_category IN ('TENDER', 'REVENUE', 'CONVERSION', 'PERFORMANCE', 'CUSTOM')
  ),
  CONSTRAINT valid_period_type CHECK (
    period_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('CURRENT', 'HISTORICAL', 'PROJECTED')
  ),
  CONSTRAINT valid_change_direction CHECK (
    change_direction IS NULL OR change_direction IN ('UP', 'DOWN', 'STABLE')
  ),
  CONSTRAINT valid_period_dates CHECK (period_end >= period_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_company_id ON kpi_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_metric_key ON kpi_metrics(metric_key);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_category ON kpi_metrics(metric_category);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_period ON kpi_metrics(period_start DESC, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_status ON kpi_metrics(status);

-- Composite index for current metrics
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_company_current ON kpi_metrics(company_id, metric_key, period_start DESC) 
  WHERE status = 'CURRENT';

-- ============================================================
-- 3. REPORTS TABLE
-- ============================================================

DROP TABLE IF EXISTS reports CASCADE;

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Report details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL, -- 'TENDER_SUMMARY', 'REVENUE_ANALYSIS', 'WIN_RATE', 'CUSTOM'
  
  -- Configuration
  date_range_start DATE,
  date_range_end DATE,
  filters JSONB DEFAULT '{}',
  grouping VARCHAR(50), -- 'DAILY', 'WEEKLY', 'MONTHLY', 'SECTOR', 'BUYER_TYPE'
  
  -- Data
  data JSONB DEFAULT '{}',
  chart_config JSONB DEFAULT '{}',
  
  -- Format
  format VARCHAR(20) DEFAULT 'JSON', -- 'JSON', 'PDF', 'EXCEL', 'CSV', 'PPTX', 'WORD'
  
  -- Status
  status VARCHAR(20) DEFAULT 'DRAFT', -- 'DRAFT', 'GENERATED', 'SCHEDULED', 'ARCHIVED'
  
  -- File storage
  file_url TEXT,
  file_size BIGINT,
  
  -- Sharing
  is_public BOOLEAN DEFAULT FALSE,
  shared_with JSONB DEFAULT '[]', -- Array of user IDs
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_report_type CHECK (
    report_type IN ('TENDER_SUMMARY', 'REVENUE_ANALYSIS', 'WIN_RATE', 'PERFORMANCE', 'SECTOR_ANALYSIS', 'CUSTOM')
  ),
  CONSTRAINT valid_report_format CHECK (
    format IN ('JSON', 'PDF', 'EXCEL', 'CSV', 'PPTX', 'WORD')
  ),
  CONSTRAINT valid_report_status CHECK (
    status IN ('DRAFT', 'GENERATED', 'SCHEDULED', 'ARCHIVED')
  ),
  CONSTRAINT valid_date_range CHECK (
    date_range_end IS NULL OR date_range_end >= date_range_start
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_company_id ON reports(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- ============================================================
-- 4. REPORT SCHEDULES TABLE
-- ============================================================

DROP TABLE IF EXISTS report_schedules CASCADE;

CREATE TABLE report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Schedule details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Report configuration (template)
  report_type VARCHAR(50) NOT NULL,
  filters JSONB DEFAULT '{}',
  format VARCHAR(20) DEFAULT 'PDF',
  
  -- Schedule settings
  frequency VARCHAR(20) NOT NULL, -- 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'
  day_of_week INTEGER, -- 0-6 for weekly
  day_of_month INTEGER, -- 1-31 for monthly
  time_of_day TIME DEFAULT '09:00:00',
  timezone VARCHAR(50) DEFAULT 'Europe/Paris',
  
  -- Recipients
  recipients JSONB DEFAULT '[]', -- Array of email addresses
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  
  -- Error handling
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_schedule_frequency CHECK (
    frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY')
  ),
  CONSTRAINT valid_schedule_report_type CHECK (
    report_type IN ('TENDER_SUMMARY', 'REVENUE_ANALYSIS', 'WIN_RATE', 'PERFORMANCE', 'SECTOR_ANALYSIS', 'CUSTOM')
  ),
  CONSTRAINT valid_schedule_format CHECK (
    format IN ('PDF', 'EXCEL', 'CSV', 'PPTX', 'WORD')
  ),
  CONSTRAINT valid_day_of_week CHECK (
    day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)
  ),
  CONSTRAINT valid_day_of_month CHECK (
    day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_report_schedules_user_id ON report_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_company_id ON report_schedules(company_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_is_active ON report_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON report_schedules(next_run_at) WHERE is_active = TRUE;

-- ============================================================
-- 5. ANALYTICS DASHBOARDS TABLE
-- ============================================================

DROP TABLE IF EXISTS analytics_dashboards CASCADE;

CREATE TABLE analytics_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Dashboard details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Layout & Configuration
  widgets JSONB DEFAULT '[]', -- Array of widget configurations
  layout JSONB DEFAULT '{}',
  
  -- Settings
  refresh_interval INTEGER DEFAULT 300, -- Seconds
  date_range_preset VARCHAR(50) DEFAULT 'LAST_30_DAYS', -- 'TODAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'THIS_MONTH', 'CUSTOM'
  
  -- Sharing
  is_default BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  shared_with JSONB DEFAULT '[]',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_date_range_preset CHECK (
    date_range_preset IN ('TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'THIS_WEEK', 'THIS_MONTH', 'THIS_QUARTER', 'THIS_YEAR', 'CUSTOM')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_user_id ON analytics_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_company_id ON analytics_dashboards(company_id);
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_is_default ON analytics_dashboards(is_default);

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_dashboards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Users can create analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Users can view company KPI metrics" ON kpi_metrics;
DROP POLICY IF EXISTS "Users can view own and shared reports" ON reports;
DROP POLICY IF EXISTS "Users can create own reports" ON reports;
DROP POLICY IF EXISTS "Users can update own reports" ON reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON reports;
DROP POLICY IF EXISTS "Users can view own report schedules" ON report_schedules;
DROP POLICY IF EXISTS "Users can manage own report schedules" ON report_schedules;
DROP POLICY IF EXISTS "Users can view own and shared dashboards" ON analytics_dashboards;
DROP POLICY IF EXISTS "Users can manage own dashboards" ON analytics_dashboards;

-- Analytics Events: Users can view their own and company events
CREATE POLICY "Users can view own analytics events"
  ON analytics_events FOR SELECT
  USING (
    user_id = auth.uid() 
    OR company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Analytics Events: Users can create events
CREATE POLICY "Users can create analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- KPI Metrics: Users can view their company metrics
CREATE POLICY "Users can view company KPI metrics"
  ON kpi_metrics FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Reports: Users can view their own and shared reports
CREATE POLICY "Users can view own and shared reports"
  ON reports FOR SELECT
  USING (
    user_id = auth.uid() 
    OR is_public = TRUE
    OR auth.uid()::TEXT = ANY(SELECT jsonb_array_elements_text(shared_with))
  );

-- Reports: Users can create their own reports
CREATE POLICY "Users can create own reports"
  ON reports FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Reports: Users can update their own reports
CREATE POLICY "Users can update own reports"
  ON reports FOR UPDATE
  USING (user_id = auth.uid());

-- Reports: Users can delete their own reports
CREATE POLICY "Users can delete own reports"
  ON reports FOR DELETE
  USING (user_id = auth.uid());

-- Report Schedules: Users can view their own schedules
CREATE POLICY "Users can view own report schedules"
  ON report_schedules FOR SELECT
  USING (user_id = auth.uid());

-- Report Schedules: Users can manage their own schedules
CREATE POLICY "Users can manage own report schedules"
  ON report_schedules FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Analytics Dashboards: Users can view their own and shared dashboards
CREATE POLICY "Users can view own and shared dashboards"
  ON analytics_dashboards FOR SELECT
  USING (
    user_id = auth.uid() 
    OR is_public = TRUE
    OR auth.uid()::TEXT = ANY(SELECT jsonb_array_elements_text(shared_with))
  );

-- Analytics Dashboards: Users can manage their own dashboards
CREATE POLICY "Users can manage own dashboards"
  ON analytics_dashboards FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 7. HELPER FUNCTIONS
-- ============================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS track_event(VARCHAR, VARCHAR, VARCHAR, JSONB) CASCADE;
DROP FUNCTION IF EXISTS calculate_kpi_metrics(UUID, DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS get_tender_win_rate(UUID, DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS get_revenue_metrics(UUID, DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS generate_report(UUID) CASCADE;
DROP FUNCTION IF EXISTS process_scheduled_reports() CASCADE;

-- Function to track an analytics event
CREATE OR REPLACE FUNCTION track_event(
  p_event_type VARCHAR,
  p_category VARCHAR,
  p_action VARCHAR,
  p_properties JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
  v_company_id UUID;
BEGIN
  -- Get user's company
  SELECT company_id INTO v_company_id
  FROM profiles
  WHERE id = auth.uid();
  
  -- Insert event
  INSERT INTO analytics_events (
    user_id,
    company_id,
    event_type,
    event_category,
    event_action,
    event_properties
  ) VALUES (
    auth.uid(),
    v_company_id,
    p_event_type,
    p_category,
    p_action,
    p_properties
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Function to calculate KPI metrics for a period
CREATE OR REPLACE FUNCTION calculate_kpi_metrics(
  p_company_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  metric_key TEXT,
  metric_value DECIMAL,
  change_percentage DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Total tenders
  SELECT 
    'total_tenders'::TEXT,
    COUNT(*)::DECIMAL,
    NULL::DECIMAL
  FROM tenders
  WHERE company_id = p_company_id
    AND created_at::DATE BETWEEN p_start_date AND p_end_date
  
  UNION ALL
  
  -- Won tenders
  SELECT 
    'won_tenders'::TEXT,
    COUNT(*)::DECIMAL,
    NULL::DECIMAL
  FROM tenders
  WHERE company_id = p_company_id
    AND status = 'WON'
    AND result_date BETWEEN p_start_date AND p_end_date
  
  UNION ALL
  
  -- Total revenue
  SELECT 
    'total_revenue'::TEXT,
    COALESCE(SUM(winning_price), 0)::DECIMAL,
    NULL::DECIMAL
  FROM tenders
  WHERE company_id = p_company_id
    AND status = 'WON'
    AND result_date BETWEEN p_start_date AND p_end_date;
END;
$$;

-- Function to calculate tender win rate
CREATE OR REPLACE FUNCTION get_tender_win_rate(
  p_company_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total INTEGER;
  v_won INTEGER;
  v_win_rate DECIMAL;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM tenders
  WHERE company_id = p_company_id
    AND status IN ('WON', 'LOST')
    AND result_date BETWEEN p_start_date AND p_end_date;
  
  IF v_total = 0 THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*) INTO v_won
  FROM tenders
  WHERE company_id = p_company_id
    AND status = 'WON'
    AND result_date BETWEEN p_start_date AND p_end_date;
  
  v_win_rate := (v_won::DECIMAL / v_total::DECIMAL) * 100;
  
  RETURN ROUND(v_win_rate, 2);
END;
$$;

-- Function to get revenue metrics
CREATE OR REPLACE FUNCTION get_revenue_metrics(
  p_company_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_revenue DECIMAL,
  avg_deal_size DECIMAL,
  largest_deal DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(t.winning_price), 0)::DECIMAL as total_revenue,
    COALESCE(AVG(t.winning_price), 0)::DECIMAL as avg_deal_size,
    COALESCE(MAX(t.winning_price), 0)::DECIMAL as largest_deal
  FROM tenders t
  WHERE t.company_id = p_company_id
    AND t.status = 'WON'
    AND t.result_date BETWEEN p_start_date AND p_end_date;
END;
$$;

-- Function to generate a report
CREATE OR REPLACE FUNCTION generate_report(
  p_report_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report RECORD;
  v_data JSONB;
BEGIN
  -- Get report details
  SELECT * INTO v_report
  FROM reports
  WHERE id = p_report_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Generate data based on report type
  -- This is a simplified version - actual implementation would be more complex
  v_data := jsonb_build_object(
    'generated_at', NOW(),
    'report_type', v_report.report_type,
    'date_range', jsonb_build_object(
      'start', v_report.date_range_start,
      'end', v_report.date_range_end
    )
  );
  
  -- Update report
  UPDATE reports
  SET 
    status = 'GENERATED',
    data = v_data,
    generated_at = NOW(),
    updated_at = NOW()
  WHERE id = p_report_id;
  
  RETURN TRUE;
END;
$$;

-- Function to process scheduled reports
CREATE OR REPLACE FUNCTION process_scheduled_reports()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_schedule RECORD;
  v_report_id UUID;
BEGIN
  -- Get due schedules
  FOR v_schedule IN
    SELECT * FROM report_schedules
    WHERE is_active = TRUE
      AND next_run_at <= NOW()
    LIMIT 10
  LOOP
    -- Create report from schedule
    INSERT INTO reports (
      user_id,
      company_id,
      title,
      report_type,
      filters,
      format,
      status
    ) VALUES (
      v_schedule.user_id,
      v_schedule.company_id,
      v_schedule.name || ' - ' || TO_CHAR(NOW(), 'YYYY-MM-DD'),
      v_schedule.report_type,
      v_schedule.filters,
      v_schedule.format,
      'SCHEDULED'
    ) RETURNING id INTO v_report_id;
    
    -- Update schedule
    UPDATE report_schedules
    SET 
      last_run_at = NOW(),
      next_run_at = CASE v_schedule.frequency
        WHEN 'DAILY' THEN NOW() + INTERVAL '1 day'
        WHEN 'WEEKLY' THEN NOW() + INTERVAL '1 week'
        WHEN 'MONTHLY' THEN NOW() + INTERVAL '1 month'
        WHEN 'QUARTERLY' THEN NOW() + INTERVAL '3 months'
      END,
      updated_at = NOW()
    WHERE id = v_schedule.id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- ============================================================
-- 8. TRIGGERS
-- ============================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_kpi_metrics_updated_at ON kpi_metrics CASCADE;
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports CASCADE;
DROP TRIGGER IF EXISTS update_report_schedules_updated_at ON report_schedules CASCADE;
DROP TRIGGER IF EXISTS update_analytics_dashboards_updated_at ON analytics_dashboards CASCADE;

-- Update updated_at timestamp
CREATE TRIGGER update_kpi_metrics_updated_at
  BEFORE UPDATE ON kpi_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_schedules_updated_at
  BEFORE UPDATE ON report_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_dashboards_updated_at
  BEFORE UPDATE ON analytics_dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. VIEWS
-- ============================================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS v_company_analytics_summary CASCADE;
DROP VIEW IF EXISTS v_tender_performance CASCADE;

-- View for company analytics summary
CREATE OR REPLACE VIEW v_company_analytics_summary AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  COUNT(DISTINCT t.id) as total_tenders,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'WON') as won_tenders,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'LOST') as lost_tenders,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status IN ('DRAFT', 'ANALYSIS', 'IN_PROGRESS', 'REVIEW')) as active_tenders,
  ROUND(
    CASE 
      WHEN COUNT(DISTINCT t.id) FILTER (WHERE t.status IN ('WON', 'LOST')) > 0 
      THEN (COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'WON')::DECIMAL / 
            COUNT(DISTINCT t.id) FILTER (WHERE t.status IN ('WON', 'LOST'))::DECIMAL * 100)
      ELSE 0 
    END, 2
  ) as win_rate,
  COALESCE(SUM(t.winning_price) FILTER (WHERE t.status = 'WON'), 0) as total_revenue,
  COALESCE(AVG(t.winning_price) FILTER (WHERE t.status = 'WON'), 0) as avg_deal_size
FROM companies c
LEFT JOIN tenders t ON c.id = t.company_id
GROUP BY c.id, c.name;

-- View for tender performance
CREATE OR REPLACE VIEW v_tender_performance AS
SELECT 
  t.id,
  t.title,
  t.status,
  t.sector,
  t.estimated_value,
  t.winning_price,
  t.deadline,
  t.result_date,
  t.created_at,
  COUNT(DISTINCT d.id) as document_count,
  COUNT(DISTINCT ae.id) FILTER (WHERE ae.event_action = 'VIEW') as view_count,
  (t.deadline - t.created_at::DATE) as days_to_deadline,
  CASE 
    WHEN t.status = 'WON' THEN (t.result_date - t.created_at::DATE)
    ELSE NULL
  END as days_to_win
FROM tenders t
LEFT JOIN documents d ON t.id = d.tender_id
LEFT JOIN analytics_events ae ON t.id = ae.tender_id
GROUP BY t.id;

-- ============================================================
-- 10. SEED DATA: DEFAULT DASHBOARDS
-- ============================================================

-- This would be populated when a company is created
-- For now, just add comments about default widgets

COMMENT ON TABLE analytics_events IS 'Tracks user interactions and system events for analytics';
COMMENT ON TABLE kpi_metrics IS 'Stores calculated KPI metrics over time periods';
COMMENT ON TABLE reports IS 'Generated reports with data exports';
COMMENT ON TABLE report_schedules IS 'Automated report generation schedules';
COMMENT ON TABLE analytics_dashboards IS 'Customizable analytics dashboards';

COMMENT ON FUNCTION track_event(VARCHAR, VARCHAR, VARCHAR, JSONB) IS 'Track an analytics event';
COMMENT ON FUNCTION calculate_kpi_metrics(UUID, DATE, DATE) IS 'Calculate KPI metrics for a date range';
COMMENT ON FUNCTION get_tender_win_rate(UUID, DATE, DATE) IS 'Calculate tender win rate percentage';
COMMENT ON FUNCTION get_revenue_metrics(UUID, DATE, DATE) IS 'Get revenue statistics';

-- ============================================================
-- END OF MIGRATION
-- ============================================================
