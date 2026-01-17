-- ============================================================
-- FEATURE #12: CALENDAR & TIMELINE INTEGRATION
-- ============================================================
-- Description: Calendar and timeline views for tender deadlines
-- Features:
--   - Calendar events for tenders and milestones
--   - Timeline visualization
--   - Deadline reminders
--   - Milestone tracking
--   - iCal/Google Calendar integration
-- Tables: calendar_events, tender_milestones, deadline_reminders
-- Created: January 2026
-- ============================================================

-- ============================================================
-- 1. CALENDAR EVENTS TABLE
-- ============================================================

-- Drop table if exists to ensure clean migration
DROP TABLE IF EXISTS calendar_events CASCADE;

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Event details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Event type
  event_type VARCHAR(50) NOT NULL, -- 'TENDER_DEADLINE', 'MILESTONE', 'REMINDER', 'CUSTOM', 'MEETING'
  
  -- Related entities
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  milestone_id UUID, -- Self-reference to tender_milestones
  
  -- Timing
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT FALSE,
  timezone VARCHAR(50) DEFAULT 'Europe/Paris',
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT, -- iCal RRULE format
  recurrence_end_date TIMESTAMPTZ,
  
  -- Location
  location TEXT,
  location_url TEXT,
  
  -- Visibility
  is_public BOOLEAN DEFAULT FALSE,
  color VARCHAR(7), -- Hex color code
  
  -- Status
  status VARCHAR(20) DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'POSTPONED'
  
  -- Notifications
  notify_before INTERVAL, -- e.g., '1 day', '1 hour'
  notification_sent BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_event_type CHECK (
    event_type IN ('TENDER_DEADLINE', 'MILESTONE', 'REMINDER', 'CUSTOM', 'MEETING')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'POSTPONED')
  ),
  CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_team_id ON calendar_events(team_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_tender_id ON calendar_events(tender_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);

-- Composite index for date range queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_date_range ON calendar_events(start_date, end_date);

-- ============================================================
-- 2. TENDER MILESTONES TABLE
-- ============================================================

-- Drop table if exists to ensure clean migration
DROP TABLE IF EXISTS tender_milestones CASCADE;

CREATE TABLE tender_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Related tender
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  
  -- Milestone details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Milestone type
  milestone_type VARCHAR(50) NOT NULL, -- 'PUBLICATION', 'QUESTIONS_DEADLINE', 'SUBMISSION', 'EVALUATION', 'AWARD', 'CUSTOM'
  
  -- Timing
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'CANCELLED'
  
  -- Progress
  progress_percentage INTEGER DEFAULT 0,
  
  -- Dependencies
  depends_on UUID REFERENCES tender_milestones(id) ON DELETE SET NULL,
  
  -- Assignments
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Priority
  priority VARCHAR(10) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  
  -- Notifications
  notify_before INTERVAL DEFAULT '1 day',
  reminder_sent BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  attachments JSONB DEFAULT '[]',
  checklist JSONB DEFAULT '[]',
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_milestone_type CHECK (
    milestone_type IN ('PUBLICATION', 'QUESTIONS_DEADLINE', 'SUBMISSION', 'EVALUATION', 'AWARD', 'CUSTOM')
  ),
  CONSTRAINT valid_milestone_status CHECK (
    status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'CANCELLED')
  ),
  CONSTRAINT valid_priority CHECK (
    priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
  ),
  CONSTRAINT valid_progress CHECK (
    progress_percentage >= 0 AND progress_percentage <= 100
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tender_milestones_tender_id ON tender_milestones(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_milestones_milestone_type ON tender_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_tender_milestones_status ON tender_milestones(status);
CREATE INDEX IF NOT EXISTS idx_tender_milestones_due_date ON tender_milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_tender_milestones_assigned_to ON tender_milestones(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tender_milestones_priority ON tender_milestones(priority);

-- ============================================================
-- 3. DEADLINE REMINDERS TABLE
-- ============================================================

-- Drop table if exists to ensure clean migration
DROP TABLE IF EXISTS deadline_reminders CASCADE;

CREATE TABLE deadline_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Related entities
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES tender_milestones(id) ON DELETE CASCADE,
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  
  -- Reminder details
  reminder_type VARCHAR(50) NOT NULL, -- 'EMAIL', 'PUSH', 'SMS', 'IN_APP'
  
  -- Timing
  remind_at TIMESTAMPTZ NOT NULL,
  reminded_at TIMESTAMPTZ,
  
  -- Message
  subject VARCHAR(255),
  message TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'FAILED', 'CANCELLED'
  
  -- Delivery
  delivery_method VARCHAR(20), -- 'EMAIL', 'PUSH', 'SMS'
  delivery_metadata JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_reminder_type CHECK (
    reminder_type IN ('EMAIL', 'PUSH', 'SMS', 'IN_APP')
  ),
  CONSTRAINT valid_reminder_status CHECK (
    status IN ('PENDING', 'SENT', 'FAILED', 'CANCELLED')
  ),
  CONSTRAINT has_related_entity CHECK (
    tender_id IS NOT NULL OR milestone_id IS NOT NULL OR calendar_event_id IS NOT NULL
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deadline_reminders_user_id ON deadline_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_deadline_reminders_tender_id ON deadline_reminders(tender_id);
CREATE INDEX IF NOT EXISTS idx_deadline_reminders_milestone_id ON deadline_reminders(milestone_id);
CREATE INDEX IF NOT EXISTS idx_deadline_reminders_calendar_event_id ON deadline_reminders(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_deadline_reminders_remind_at ON deadline_reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_deadline_reminders_status ON deadline_reminders(status);

-- Index for processing pending reminders
CREATE INDEX IF NOT EXISTS idx_deadline_reminders_pending ON deadline_reminders(remind_at, status) 
  WHERE status = 'PENDING';

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadline_reminders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own and team calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can create calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can view tender milestones" ON tender_milestones;
DROP POLICY IF EXISTS "Users can create tender milestones" ON tender_milestones;
DROP POLICY IF EXISTS "Users can update tender milestones" ON tender_milestones;
DROP POLICY IF EXISTS "Users can delete tender milestones" ON tender_milestones;
DROP POLICY IF EXISTS "Users can view own reminders" ON deadline_reminders;
DROP POLICY IF EXISTS "Users can create own reminders" ON deadline_reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON deadline_reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON deadline_reminders;

-- Calendar Events: Users can view their own, team, and public events
CREATE POLICY "Users can view own and team calendar events"
  ON calendar_events FOR SELECT
  USING (
    user_id = auth.uid() 
    OR is_public = TRUE
    OR (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = calendar_events.team_id 
        AND team_members.user_id = auth.uid()
    ))
  );

-- Calendar Events: Users can create their own
CREATE POLICY "Users can create calendar events"
  ON calendar_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Calendar Events: Users can update their own
CREATE POLICY "Users can update own calendar events"
  ON calendar_events FOR UPDATE
  USING (user_id = auth.uid());

-- Calendar Events: Users can delete their own
CREATE POLICY "Users can delete own calendar events"
  ON calendar_events FOR DELETE
  USING (user_id = auth.uid());

-- Tender Milestones: Users can view milestones for accessible tenders
CREATE POLICY "Users can view tender milestones"
  ON tender_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenders 
      WHERE tenders.id = tender_milestones.tender_id 
        AND tenders.created_by = auth.uid()
    )
  );

-- Tender Milestones: Users can create milestones for their tenders
CREATE POLICY "Users can create tender milestones"
  ON tender_milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenders 
      WHERE tenders.id = tender_milestones.tender_id 
        AND tenders.created_by = auth.uid()
    )
  );

-- Tender Milestones: Users can update milestones for their tenders
CREATE POLICY "Users can update tender milestones"
  ON tender_milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tenders 
      WHERE tenders.id = tender_milestones.tender_id 
        AND tenders.created_by = auth.uid()
    )
  );

-- Tender Milestones: Users can delete milestones for their tenders
CREATE POLICY "Users can delete tender milestones"
  ON tender_milestones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tenders 
      WHERE tenders.id = tender_milestones.tender_id 
        AND tenders.created_by = auth.uid()
    )
  );

-- Deadline Reminders: Users can only see their own reminders
CREATE POLICY "Users can view own reminders"
  ON deadline_reminders FOR SELECT
  USING (user_id = auth.uid());

-- Deadline Reminders: Users can create their own
CREATE POLICY "Users can create own reminders"
  ON deadline_reminders FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Deadline Reminders: Users can update their own
CREATE POLICY "Users can update own reminders"
  ON deadline_reminders FOR UPDATE
  USING (user_id = auth.uid());

-- Deadline Reminders: Users can delete their own
CREATE POLICY "Users can delete own reminders"
  ON deadline_reminders FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- 5. HELPER FUNCTIONS
-- ============================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_calendar_events(DATE, DATE, VARCHAR[]) CASCADE;
DROP FUNCTION IF EXISTS get_upcoming_deadlines(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS create_milestone_event(UUID) CASCADE;
DROP FUNCTION IF EXISTS process_pending_reminders() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function to get calendar events in date range
CREATE OR REPLACE FUNCTION get_calendar_events(
  p_start_date DATE,
  p_end_date DATE,
  p_event_types VARCHAR[] DEFAULT NULL
)
RETURNS TABLE (
  event_id UUID,
  title TEXT,
  event_type TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  tender_title TEXT,
  color TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.id,
    ce.title,
    ce.event_type,
    ce.start_date,
    ce.end_date,
    t.title as tender_title,
    ce.color,
    ce.status
  FROM calendar_events ce
  LEFT JOIN tenders t ON ce.tender_id = t.id
  WHERE 
    ce.user_id = auth.uid()
    AND ce.start_date::DATE <= p_end_date
    AND (ce.end_date IS NULL OR ce.end_date::DATE >= p_start_date)
    AND (p_event_types IS NULL OR ce.event_type = ANY(p_event_types))
    AND ce.status != 'CANCELLED'
  ORDER BY ce.start_date ASC;
END;
$$;

-- Function to get upcoming deadlines
CREATE OR REPLACE FUNCTION get_upcoming_deadlines(
  p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
  tender_id UUID,
  tender_title TEXT,
  deadline DATE,
  days_remaining INTEGER,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.deadline,
    (t.deadline - CURRENT_DATE) as days_remaining,
    t.status::TEXT
  FROM tenders t
  WHERE 
    t.created_by = auth.uid()
    AND t.deadline >= CURRENT_DATE
    AND t.deadline <= CURRENT_DATE + p_days_ahead
    AND t.status::TEXT NOT IN ('ABANDONED', 'LOST', 'WON')
  ORDER BY t.deadline ASC;
END;
$$;

-- Function to automatically create calendar event for milestone
CREATE OR REPLACE FUNCTION create_milestone_event(
  p_milestone_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
  v_milestone RECORD;
BEGIN
  -- Get milestone details
  SELECT 
    tm.*,
    t.title as tender_title
  INTO v_milestone
  FROM tender_milestones tm
  JOIN tenders t ON tm.tender_id = t.id
  WHERE tm.id = p_milestone_id;
  
  -- Create calendar event
  INSERT INTO calendar_events (
    user_id,
    title,
    description,
    event_type,
    tender_id,
    milestone_id,
    start_date,
    all_day,
    color,
    status
  ) VALUES (
    auth.uid(),
    v_milestone.title,
    'Milestone for tender: ' || v_milestone.tender_title,
    'MILESTONE',
    v_milestone.tender_id,
    p_milestone_id,
    v_milestone.due_date::TIMESTAMPTZ,
    TRUE,
    '#FF9800', -- Orange for milestones
    'SCHEDULED'
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Function to process pending reminders
CREATE OR REPLACE FUNCTION process_pending_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_reminder RECORD;
BEGIN
  -- Get all pending reminders that should be sent
  FOR v_reminder IN
    SELECT * FROM deadline_reminders
    WHERE deadline_reminders.status = 'PENDING'
      AND deadline_reminders.remind_at <= NOW()
    LIMIT 100
  LOOP
    -- Mark as sent (actual sending would be done by external service)
    UPDATE deadline_reminders
    SET 
      status = 'SENT',
      reminded_at = NOW(),
      updated_at = NOW()
    WHERE id = v_reminder.id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- ============================================================
-- 6. TRIGGERS
-- ============================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events CASCADE;
DROP TRIGGER IF EXISTS update_tender_milestones_updated_at ON tender_milestones CASCADE;
DROP TRIGGER IF EXISTS update_deadline_reminders_updated_at ON deadline_reminders CASCADE;
DROP TRIGGER IF EXISTS auto_create_milestone_event ON tender_milestones CASCADE;

-- Update updated_at timestamp
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tender_milestones_updated_at
  BEFORE UPDATE ON tender_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deadline_reminders_updated_at
  BEFORE UPDATE ON deadline_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. VIEWS
-- ============================================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS v_calendar_overview CASCADE;
DROP VIEW IF EXISTS v_milestone_timeline CASCADE;

-- View for calendar overview with aggregations
CREATE OR REPLACE VIEW v_calendar_overview AS
SELECT 
  DATE_TRUNC('day', ce.start_date) as event_date,
  ce.event_type,
  COUNT(*) as event_count,
  ARRAY_AGG(ce.title ORDER BY ce.start_date) as event_titles
FROM calendar_events ce
WHERE ce.status != 'CANCELLED'
GROUP BY DATE_TRUNC('day', ce.start_date), ce.event_type;

-- View for milestone timeline
CREATE OR REPLACE VIEW v_milestone_timeline AS
SELECT 
  tm.id,
  tm.tender_id,
  t.title as tender_title,
  tm.title as milestone_title,
  tm.milestone_type,
  tm.due_date,
  tm.status,
  tm.priority,
  tm.progress_percentage,
  u.email as assigned_to_email,
  (tm.due_date - CURRENT_DATE) as days_until_due
FROM tender_milestones tm
JOIN tenders t ON tm.tender_id = t.id
LEFT JOIN auth.users u ON tm.assigned_to = u.id
WHERE tm.status NOT IN ('COMPLETED', 'CANCELLED')
ORDER BY tm.due_date ASC;

-- ============================================================
-- 8. AUTO-CREATE CALENDAR EVENTS FOR MILESTONES
-- ============================================================

-- Auto-create calendar event when milestone is created
CREATE OR REPLACE FUNCTION auto_create_milestone_event_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM create_milestone_event(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_create_milestone_event
  AFTER INSERT ON tender_milestones
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_milestone_event_trigger();

-- ============================================================
-- 9. SEED DATA: DEFAULT MILESTONE TYPES
-- ============================================================

-- Create default milestone presets (stored as metadata in companies table)
-- These will be used by the frontend to suggest common milestones

COMMENT ON TABLE calendar_events IS 'Calendar events for tenders, meetings, and custom events';
COMMENT ON TABLE tender_milestones IS 'Milestones and checkpoints for tender processes';
COMMENT ON TABLE deadline_reminders IS 'Automated reminders for deadlines and milestones';
COMMENT ON FUNCTION get_calendar_events(DATE, DATE, VARCHAR[]) IS 'Retrieve calendar events within date range';
COMMENT ON FUNCTION get_upcoming_deadlines(INTEGER) IS 'Get upcoming tender deadlines';
COMMENT ON FUNCTION create_milestone_event(UUID) IS 'Automatically create calendar event for milestone';
COMMENT ON FUNCTION process_pending_reminders() IS 'Process and send pending deadline reminders';

-- ============================================================
-- END OF MIGRATION
-- ============================================================
