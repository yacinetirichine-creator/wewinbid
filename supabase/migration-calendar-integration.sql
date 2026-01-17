-- ============================================================================
-- Feature #7: Calendar Integration
-- ============================================================================
-- Description: Google Calendar/Outlook sync with tender deadlines
-- Features: Calendar view, deadline reminders, export deadlines, team calendar
-- Date: 2026-01-17
-- ============================================================================

-- Cleanup section for idempotent migration
DROP INDEX IF EXISTS idx_calendar_events_user_id CASCADE;
DROP INDEX IF EXISTS idx_calendar_events_start_date CASCADE;
DROP INDEX IF EXISTS idx_calendar_events_tender_id CASCADE;
DROP INDEX IF EXISTS idx_calendar_syncs_user_id CASCADE;
DROP INDEX IF EXISTS idx_calendar_syncs_provider CASCADE;
DROP INDEX IF EXISTS idx_calendar_settings_user_id CASCADE;

DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
DROP TRIGGER IF EXISTS update_calendar_syncs_updated_at ON calendar_syncs;
DROP TRIGGER IF EXISTS update_calendar_settings_updated_at ON calendar_settings;

DROP POLICY IF EXISTS "Users can view their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can create their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Team members can view shared team events" ON calendar_events;

DROP POLICY IF EXISTS "Users can view their own calendar syncs" ON calendar_syncs;
DROP POLICY IF EXISTS "Users can manage their own calendar syncs" ON calendar_syncs;

DROP POLICY IF EXISTS "Users can view their own calendar settings" ON calendar_settings;
DROP POLICY IF EXISTS "Users can manage their own calendar settings" ON calendar_settings;

DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS calendar_syncs CASCADE;
DROP TABLE IF EXISTS calendar_settings CASCADE;

-- ============================================================================
-- Table: calendar_events
-- Purpose: Store calendar events (tender deadlines, meetings, reminders)
-- ============================================================================

CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL,
    
    -- Event details
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('deadline', 'meeting', 'reminder', 'milestone', 'custom')),
    
    -- Timing
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT false,
    timezone TEXT DEFAULT 'UTC',
    
    -- Recurrence (for recurring events)
    recurrence_rule TEXT, -- RRULE format (RFC 5545)
    recurrence_end_date TIMESTAMPTZ,
    
    -- Reminders
    reminder_minutes INTEGER[], -- Array of minutes before event [15, 60, 1440]
    
    -- Sharing & visibility
    is_team_event BOOLEAN DEFAULT false,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public')),
    
    -- External sync
    external_event_id TEXT, -- Google/Outlook event ID
    external_calendar_id TEXT, -- Google/Outlook calendar ID
    sync_provider TEXT CHECK (sync_provider IN ('google', 'outlook', 'manual')),
    last_synced_at TIMESTAMPTZ,
    
    -- Metadata
    color TEXT, -- Hex color for UI display
    attendees JSONB DEFAULT '[]'::jsonb, -- [{email, name, status}]
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_tender_id ON calendar_events(tender_id) WHERE tender_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_team_id ON calendar_events(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_external ON calendar_events(external_event_id, sync_provider) WHERE external_event_id IS NOT NULL;

-- ============================================================================
-- Table: calendar_syncs
-- Purpose: Manage external calendar sync connections (Google, Outlook)
-- ============================================================================

CREATE TABLE IF NOT EXISTS calendar_syncs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Provider details
    provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook')),
    provider_account_id TEXT NOT NULL, -- User's email/ID at provider
    provider_account_name TEXT,
    
    -- OAuth tokens (encrypted in production)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- Sync settings
    is_active BOOLEAN DEFAULT true,
    sync_direction TEXT DEFAULT 'bidirectional' CHECK (sync_direction IN ('import', 'export', 'bidirectional')),
    default_calendar_id TEXT, -- Primary calendar to sync with
    
    -- Sync status
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT CHECK (last_sync_status IN ('success', 'error', 'pending')),
    last_sync_error TEXT,
    sync_count INTEGER DEFAULT 0,
    
    -- Filters
    sync_tender_deadlines BOOLEAN DEFAULT true,
    sync_team_events BOOLEAN DEFAULT true,
    sync_custom_events BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, provider, provider_account_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_user_id ON calendar_syncs(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_provider ON calendar_syncs(provider, is_active);

-- ============================================================================
-- Table: calendar_settings
-- Purpose: User preferences for calendar display and notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS calendar_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Display preferences
    default_view TEXT DEFAULT 'month' CHECK (default_view IN ('day', 'week', 'month', 'agenda')),
    week_start_day INTEGER DEFAULT 1 CHECK (week_start_day BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday
    time_format TEXT DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
    timezone TEXT DEFAULT 'UTC',
    
    -- Color coding
    deadline_color TEXT DEFAULT '#ef4444', -- Red for deadlines
    meeting_color TEXT DEFAULT '#3b82f6', -- Blue for meetings
    reminder_color TEXT DEFAULT '#f59e0b', -- Amber for reminders
    milestone_color TEXT DEFAULT '#10b981', -- Green for milestones
    custom_color TEXT DEFAULT '#8b5cf6', -- Purple for custom events
    
    -- Notifications
    enable_browser_notifications BOOLEAN DEFAULT true,
    enable_email_notifications BOOLEAN DEFAULT true,
    default_reminder_minutes INTEGER[] DEFAULT ARRAY[15, 60], -- 15 min and 1 hour before
    
    -- Auto-create events
    auto_create_deadline_events BOOLEAN DEFAULT true,
    auto_create_submission_reminders BOOLEAN DEFAULT true,
    submission_reminder_days INTEGER[] DEFAULT ARRAY[7, 3, 1], -- 7, 3, and 1 day before deadline
    
    -- Team calendar
    show_team_events BOOLEAN DEFAULT true,
    show_teammates_events BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_calendar_settings_user_id ON calendar_settings(user_id);

-- ============================================================================
-- Triggers: Auto-update timestamps
-- ============================================================================

CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_syncs_updated_at
    BEFORE UPDATE ON calendar_syncs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_settings_updated_at
    BEFORE UPDATE ON calendar_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Trigger: Auto-create calendar settings for new users
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_calendar_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO calendar_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_calendar_settings_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_calendar_settings();

-- ============================================================================
-- Trigger: Auto-create calendar events for tender deadlines
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_create_tender_deadline_event()
RETURNS TRIGGER AS $$
DECLARE
    settings_record RECORD;
    user_record RECORD;
BEGIN
    -- For new tenders with deadlines
    IF NEW.deadline IS NOT NULL THEN
        -- Create events for all team members with auto-create enabled
        FOR user_record IN 
            SELECT DISTINCT tm.user_id
            FROM team_members tm
            WHERE tm.tender_id = NEW.id
        LOOP
            -- Check user settings
            SELECT * INTO settings_record
            FROM calendar_settings
            WHERE user_id = user_record.user_id
            AND auto_create_deadline_events = true;
            
            IF FOUND THEN
                -- Create deadline event
                INSERT INTO calendar_events (
                    user_id,
                    tender_id,
                    title,
                    description,
                    event_type,
                    start_date,
                    all_day,
                    reminder_minutes,
                    color,
                    visibility
                )
                VALUES (
                    user_record.user_id,
                    NEW.id,
                    'Deadline: ' || NEW.title,
                    'Tender deadline for ' || NEW.title,
                    'deadline',
                    NEW.deadline,
                    false,
                    settings_record.default_reminder_minutes,
                    settings_record.deadline_color,
                    'private'
                )
                ON CONFLICT DO NOTHING;
                
                -- Create submission reminders if enabled
                IF settings_record.auto_create_submission_reminders THEN
                    INSERT INTO calendar_events (
                        user_id,
                        tender_id,
                        title,
                        description,
                        event_type,
                        start_date,
                        all_day,
                        reminder_minutes,
                        color,
                        visibility
                    )
                    SELECT
                        user_record.user_id,
                        NEW.id,
                        'Reminder: ' || NEW.title || ' (in ' || days || ' days)',
                        'Submission reminder for tender: ' || NEW.title,
                        'reminder',
                        NEW.deadline - (days || ' days')::INTERVAL,
                        false,
                        settings_record.default_reminder_minutes,
                        settings_record.reminder_color,
                        'private'
                    FROM UNNEST(settings_record.submission_reminder_days) AS days
                    WHERE NEW.deadline - (days || ' days')::INTERVAL > NOW()
                    ON CONFLICT DO NOTHING;
                END IF;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_create_tender_events
    AFTER INSERT ON tenders
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_tender_deadline_event();

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;

-- Calendar events policies
CREATE POLICY "Users can view their own calendar events"
    ON calendar_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar events"
    ON calendar_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events"
    ON calendar_events FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events"
    ON calendar_events FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Team members can view shared team events"
    ON calendar_events FOR SELECT
    USING (
        is_team_event = true
        AND team_id IN (
            SELECT team_id
            FROM team_members
            WHERE user_id = auth.uid()
        )
    );

-- Calendar syncs policies
CREATE POLICY "Users can view their own calendar syncs"
    ON calendar_syncs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own calendar syncs"
    ON calendar_syncs FOR ALL
    USING (auth.uid() = user_id);

-- Calendar settings policies
CREATE POLICY "Users can view their own calendar settings"
    ON calendar_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own calendar settings"
    ON calendar_settings FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get upcoming events for a user
CREATE OR REPLACE FUNCTION get_upcoming_events(
    user_id_param UUID,
    days_ahead INTEGER DEFAULT 30,
    include_team BOOLEAN DEFAULT true
)
RETURNS TABLE (
    event_id UUID,
    title TEXT,
    event_type TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    tender_title TEXT,
    is_team_event BOOLEAN,
    color TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.id,
        ce.title,
        ce.event_type,
        ce.start_date,
        ce.end_date,
        t.title,
        ce.is_team_event,
        ce.color
    FROM calendar_events ce
    LEFT JOIN tenders t ON ce.tender_id = t.id
    WHERE ce.user_id = user_id_param
        AND ce.start_date >= NOW()
        AND ce.start_date <= NOW() + (days_ahead || ' days')::INTERVAL
        AND (include_team = true OR ce.is_team_event = false)
    ORDER BY ce.start_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Export events as ICS format data
CREATE OR REPLACE FUNCTION export_events_ics_data(
    user_id_param UUID,
    start_date_param TIMESTAMPTZ,
    end_date_param TIMESTAMPTZ
)
RETURNS TABLE (
    event_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'uid', ce.id::TEXT,
        'summary', ce.title,
        'description', ce.description,
        'dtstart', ce.start_date,
        'dtend', COALESCE(ce.end_date, ce.start_date + INTERVAL '1 hour'),
        'location', ce.location,
        'created', ce.created_at,
        'lastModified', ce.updated_at,
        'rrule', ce.recurrence_rule,
        'attendees', ce.attendees,
        'color', ce.color
    ) AS event_data
    FROM calendar_events ce
    WHERE ce.user_id = user_id_param
        AND ce.start_date >= start_date_param
        AND ce.start_date <= end_date_param
    ORDER BY ce.start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE calendar_events IS 'Calendar events including tender deadlines, meetings, and reminders';
COMMENT ON TABLE calendar_syncs IS 'External calendar sync connections (Google Calendar, Outlook)';
COMMENT ON TABLE calendar_settings IS 'User preferences for calendar display and notifications';

COMMENT ON FUNCTION get_upcoming_events IS 'Get upcoming events for a user within specified days';
COMMENT ON FUNCTION export_events_ics_data IS 'Export events in ICS-compatible format for calendar apps';
