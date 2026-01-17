-- ============================================================
-- FEATURE #10: TEAM COLLABORATION & WORKSPACES
-- ============================================================
-- Description: Multi-user team collaboration system
-- Features:
--   - Create and manage teams/workspaces
--   - Invite members with different roles (Owner, Admin, Member, Viewer)
--   - Share tenders between team members
--   - Team activity tracking
--   - Invitation system with email notifications
-- Tables: teams, team_members, team_invitations, tender_team_access
-- Created: January 2026
-- ============================================================

-- ============================================================
-- 1. TEAMS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Team info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(100) UNIQUE, -- URL-friendly identifier
  
  -- Team settings
  avatar_url TEXT,
  color VARCHAR(7) DEFAULT '#4F46E5', -- Hex color for team branding
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Ownership
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Limits
  max_members INTEGER DEFAULT 10, -- Based on subscription plan
  
  -- Metadata
  settings JSONB DEFAULT '{}', -- Custom team settings
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT valid_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);
CREATE INDEX IF NOT EXISTS idx_teams_is_active ON teams(is_active);

-- ============================================================
-- 2. TEAM MEMBERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role and permissions
  role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
  permissions JSONB DEFAULT '{}', -- Custom permissions per member
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_team_member UNIQUE(team_id, user_id),
  CONSTRAINT valid_role CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);

-- ============================================================
-- 3. TEAM INVITATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Invitee info
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
  
  -- Invitation details
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token VARCHAR(100) UNIQUE NOT NULL, -- Secure invitation token
  
  -- Status
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, EXPIRED
  
  -- Response tracking
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  
  -- Personal message
  message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_pending_invitation UNIQUE(team_id, email, status),
  CONSTRAINT valid_invitation_status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  CONSTRAINT valid_invitation_role CHECK (role IN ('ADMIN', 'MEMBER', 'VIEWER'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires_at ON team_invitations(expires_at);

-- ============================================================
-- 4. TENDER TEAM ACCESS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS tender_team_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Access level
  can_view BOOLEAN DEFAULT TRUE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  can_share BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  shared_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_tender_team_access UNIQUE(tender_id, team_id)
);

-- Add foreign key constraint to tenders if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenders') THEN
    ALTER TABLE tender_team_access
    ADD CONSTRAINT fk_tender_team_access_tender_id
    FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tender_team_access_tender_id ON tender_team_access(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_team_access_team_id ON tender_team_access(team_id);

-- ============================================================
-- 5. TEAM ACTIVITY LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS team_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Activity details
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50), -- 'team', 'member', 'tender', 'invitation'
  entity_id UUID,
  
  -- Description
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_activity_team_id ON team_activity(team_id);
CREATE INDEX IF NOT EXISTS idx_team_activity_user_id ON team_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_team_activity_created_at ON team_activity(created_at DESC);

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_team_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_activity ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view teams they belong to" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Team owners and admins can update teams" ON teams;
DROP POLICY IF EXISTS "Only team owners can delete teams" ON teams;
DROP POLICY IF EXISTS "Team members can view other members" ON team_members;
DROP POLICY IF EXISTS "Owners and admins can add members" ON team_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON team_members;
DROP POLICY IF EXISTS "Owners and admins can remove members" ON team_members;
DROP POLICY IF EXISTS "Team members can view invitations" ON team_invitations;
DROP POLICY IF EXISTS "Owners and admins can create invitations" ON team_invitations;
DROP POLICY IF EXISTS "Can update invitations" ON team_invitations;
DROP POLICY IF EXISTS "Team members can view tender access" ON tender_team_access;
DROP POLICY IF EXISTS "Tender owners can share with teams" ON tender_team_access;
DROP POLICY IF EXISTS "Team members can view activity" ON team_activity;
DROP POLICY IF EXISTS "System can log activity" ON team_activity;

-- Teams: Users can see teams they own or are members of
CREATE POLICY "Users can view teams they belong to"
  ON teams FOR SELECT
  USING (
    auth.uid() = owner_id 
    OR EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = teams.id 
        AND team_members.user_id = auth.uid()
        AND team_members.is_active = TRUE
    )
  );

-- Teams: Only owners can create teams
CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Teams: Owners and admins can update
CREATE POLICY "Team owners and admins can update teams"
  ON teams FOR UPDATE
  USING (
    auth.uid() = owner_id 
    OR EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = teams.id 
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('OWNER', 'ADMIN')
    )
  );

-- Teams: Only owners can delete
CREATE POLICY "Only team owners can delete teams"
  ON teams FOR DELETE
  USING (auth.uid() = owner_id);

-- Team Members: View if member of team
CREATE POLICY "Team members can view other members"
  ON team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id 
        AND tm.user_id = auth.uid()
    )
  );

-- Team Members: Owners and admins can add members
CREATE POLICY "Owners and admins can add members"
  ON team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id 
        AND tm.user_id = auth.uid()
        AND tm.role IN ('OWNER', 'ADMIN')
    )
  );

-- Team Members: Owners and admins can update members
CREATE POLICY "Owners and admins can update members"
  ON team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id 
        AND tm.user_id = auth.uid()
        AND tm.role IN ('OWNER', 'ADMIN')
    )
  );

-- Team Members: Owners and admins can remove members
CREATE POLICY "Owners and admins can remove members"
  ON team_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id 
        AND tm.user_id = auth.uid()
        AND tm.role IN ('OWNER', 'ADMIN')
    )
  );

-- Team Invitations: Team members can view invitations
CREATE POLICY "Team members can view invitations"
  ON team_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = team_invitations.team_id 
        AND team_members.user_id = auth.uid()
    )
  );

-- Team Invitations: Owners and admins can create invitations
CREATE POLICY "Owners and admins can create invitations"
  ON team_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = team_invitations.team_id 
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('OWNER', 'ADMIN')
    )
  );

-- Team Invitations: Can update own invitations
CREATE POLICY "Can update invitations"
  ON team_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = team_invitations.team_id 
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('OWNER', 'ADMIN')
    )
  );

-- Tender Team Access: Team members can view
CREATE POLICY "Team members can view tender access"
  ON tender_team_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = tender_team_access.team_id 
        AND team_members.user_id = auth.uid()
    )
  );

-- Tender Team Access: Tender owner can share (if tenders table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenders') THEN
    EXECUTE 'CREATE POLICY "Tender owners can share with teams"
      ON tender_team_access FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM tenders 
          WHERE tenders.id = tender_team_access.tender_id 
            AND tenders.created_by = auth.uid()
        )
      )';
  ELSE
    -- Temporary policy until tenders table is created
    EXECUTE 'CREATE POLICY "Tender owners can share with teams"
      ON tender_team_access FOR INSERT
      WITH CHECK (true)';
  END IF;
END $$;

-- Team Activity: Team members can view
CREATE POLICY "Team members can view activity"
  ON team_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = team_activity.team_id 
        AND team_members.user_id = auth.uid()
    )
  );

-- Team Activity: System can insert
CREATE POLICY "System can log activity"
  ON team_activity FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 7. HELPER FUNCTIONS
-- ============================================================

-- Function to get user's teams
CREATE OR REPLACE FUNCTION get_user_teams(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  team_id UUID,
  team_name VARCHAR,
  team_slug VARCHAR,
  team_avatar_url TEXT,
  member_role VARCHAR,
  member_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.slug,
    t.avatar_url,
    tm.role,
    (SELECT COUNT(*) FROM team_members WHERE team_id = t.id AND is_active = TRUE)
  FROM teams t
  INNER JOIN team_members tm ON tm.team_id = t.id
  WHERE tm.user_id = COALESCE(p_user_id, auth.uid())
    AND tm.is_active = TRUE
    AND t.is_active = TRUE
  ORDER BY t.created_at DESC;
END;
$$;

-- Function to check if user is team member
CREATE OR REPLACE FUNCTION is_team_member(p_team_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_member BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
      AND user_id = COALESCE(p_user_id, auth.uid())
      AND is_active = TRUE
  ) INTO is_member;
  
  RETURN is_member;
END;
$$;

-- Function to log team activity
CREATE OR REPLACE FUNCTION log_team_activity(
  p_team_id UUID,
  p_action VARCHAR,
  p_entity_type VARCHAR DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT '',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO team_activity (
    team_id,
    user_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  ) VALUES (
    p_team_id,
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_description,
    p_metadata
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- ============================================================
-- 8. TRIGGERS
-- ============================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_invitations_updated_at ON team_invitations;
CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create team member entry for team owner
CREATE OR REPLACE FUNCTION create_team_owner_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'OWNER');
  
  -- Log activity
  PERFORM log_team_activity(
    NEW.id,
    'TEAM_CREATED',
    'team',
    NEW.id,
    'Team "' || NEW.name || '" created'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_team_created ON teams;
CREATE TRIGGER on_team_created
  AFTER INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION create_team_owner_member();

-- Log member addition
CREATE OR REPLACE FUNCTION log_member_added()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_team_activity(
    NEW.team_id,
    'MEMBER_ADDED',
    'member',
    NEW.id,
    'New member added with role: ' || NEW.role
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_member_added ON team_members;
CREATE TRIGGER on_member_added
  AFTER INSERT ON team_members
  FOR EACH ROW
  WHEN (NEW.role != 'OWNER')
  EXECUTE FUNCTION log_member_added();

-- ============================================================
-- END OF MIGRATION
-- ============================================================

COMMENT ON TABLE teams IS 'Teams/Workspaces for collaborative tender management';
COMMENT ON TABLE team_members IS 'Team membership with roles and permissions';
COMMENT ON TABLE team_invitations IS 'Pending team invitations with expiration';
COMMENT ON TABLE tender_team_access IS 'Shared tender access for teams';
COMMENT ON TABLE team_activity IS 'Activity log for team actions';
