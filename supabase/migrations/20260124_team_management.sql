-- ============================================================================
-- TEAM MANAGEMENT SYSTEM
-- Allows business owners/directors to invite collaborators
-- Each plan includes 2 free team members, additional members cost €10/month
-- ============================================================================

-- Team roles enum
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Subscription limits
  max_free_members INTEGER DEFAULT 2, -- 2 free collaborators per plan
  extra_member_price DECIMAL(10, 2) DEFAULT 10.00, -- €10 per additional member

  -- Settings
  settings JSONB DEFAULT '{
    "allow_member_invites": false,
    "require_approval": true,
    "share_tenders": true,
    "share_documents": true,
    "share_templates": false
  }'::JSONB,

  -- Stripe
  stripe_subscription_item_id VARCHAR(255), -- For billing extra members

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role and permissions
  role team_role NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '{
    "can_view_tenders": true,
    "can_edit_tenders": false,
    "can_create_tenders": false,
    "can_delete_tenders": false,
    "can_view_documents": true,
    "can_edit_documents": false,
    "can_export_documents": false,
    "can_view_analytics": false,
    "can_manage_team": false
  }'::JSONB,

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, pending
  is_billable BOOLEAN DEFAULT true, -- Whether this member counts towards billing

  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(team_id, user_id)
);

-- Team invitations table (for pending invites)
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  -- Invitee info
  email VARCHAR(255) NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '{
    "can_view_tenders": true,
    "can_edit_tenders": false,
    "can_create_tenders": false,
    "can_delete_tenders": false,
    "can_view_documents": true,
    "can_edit_documents": false,
    "can_export_documents": false,
    "can_view_analytics": false,
    "can_manage_team": false
  }'::JSONB,

  -- Invitation details
  token VARCHAR(255) NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  message TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, declined, expired
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(team_id, email)
);

-- Team activity log
CREATE TABLE IF NOT EXISTS team_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  action VARCHAR(100) NOT NULL, -- member_invited, member_joined, member_removed, role_changed, etc.
  target_user_id UUID REFERENCES auth.users(id),
  details JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shared resources (tenders, documents shared with team)
CREATE TABLE IF NOT EXISTS team_shared_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  resource_type VARCHAR(50) NOT NULL, -- tender, document, template
  resource_id UUID NOT NULL,

  shared_by UUID NOT NULL REFERENCES auth.users(id),

  -- Access control
  access_level VARCHAR(50) DEFAULT 'view', -- view, edit, full

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_teams_owner ON teams(owner_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_status ON team_members(status);
CREATE INDEX idx_team_invitations_team ON team_invitations(team_id);
CREATE INDEX idx_team_invitations_email ON team_invitations(email);
CREATE INDEX idx_team_invitations_token ON team_invitations(token);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);
CREATE INDEX idx_team_activity_team ON team_activity_log(team_id);
CREATE INDEX idx_team_shared_resources_team ON team_shared_resources(team_id);
CREATE INDEX idx_team_shared_resources_resource ON team_shared_resources(resource_type, resource_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_shared_resources ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Team owners can manage their teams" ON teams
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Team members can view their teams" ON teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- Team members policies
CREATE POLICY "Team owners and admins can manage members" ON team_members
  FOR ALL USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
      UNION
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can view their own membership" ON team_members
  FOR SELECT USING (user_id = auth.uid());

-- Team invitations policies
CREATE POLICY "Team owners and admins can manage invitations" ON team_invitations
  FOR ALL USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
      UNION
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Invitees can view and accept their invitations" ON team_invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Activity log policies
CREATE POLICY "Team members can view activity log" ON team_activity_log
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "System can insert activity log" ON team_activity_log
  FOR INSERT WITH CHECK (true);

-- Shared resources policies
CREATE POLICY "Team members can view shared resources" ON team_shared_resources
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Team owners and admins can manage shared resources" ON team_shared_resources
  FOR ALL USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
      UNION
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to count billable team members
CREATE OR REPLACE FUNCTION count_billable_members(p_team_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM team_members
  WHERE team_id = p_team_id
    AND status = 'active'
    AND is_billable = true
    AND role != 'owner';
$$ LANGUAGE SQL STABLE;

-- Function to calculate extra members cost
CREATE OR REPLACE FUNCTION calculate_extra_members_cost(p_team_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_team teams;
  v_billable_count INTEGER;
  v_extra_count INTEGER;
BEGIN
  SELECT * INTO v_team FROM teams WHERE id = p_team_id;
  v_billable_count := count_billable_members(p_team_id);
  v_extra_count := GREATEST(0, v_billable_count - v_team.max_free_members);
  RETURN v_extra_count * v_team.extra_member_price;
END;
$$ LANGUAGE PLPGSQL STABLE;

-- Function to check if team can add more members
CREATE OR REPLACE FUNCTION can_add_team_member(p_team_id UUID, p_check_billing BOOLEAN DEFAULT false)
RETURNS JSONB AS $$
DECLARE
  v_team teams;
  v_billable_count INTEGER;
  v_extra_count INTEGER;
BEGIN
  SELECT * INTO v_team FROM teams WHERE id = p_team_id;

  IF v_team IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'team_not_found');
  END IF;

  v_billable_count := count_billable_members(p_team_id);
  v_extra_count := GREATEST(0, v_billable_count - v_team.max_free_members);

  -- If billing check and would be extra, return info about cost
  IF p_check_billing AND v_billable_count >= v_team.max_free_members THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'is_paid', true,
      'extra_cost', v_team.extra_member_price,
      'current_extra_members', v_extra_count,
      'new_total_extra_cost', (v_extra_count + 1) * v_team.extra_member_price
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'is_paid', false,
    'remaining_free', v_team.max_free_members - v_billable_count
  );
END;
$$ LANGUAGE PLPGSQL STABLE;

-- Trigger to auto-create team for new users with pro/enterprise plans
CREATE OR REPLACE FUNCTION auto_create_team_for_pro_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has pro or enterprise subscription (from profiles table)
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.id
    AND subscription_tier IN ('pro', 'enterprise')
  ) THEN
    INSERT INTO teams (name, owner_id)
    VALUES (
      COALESCE(
        (SELECT company_name FROM profiles WHERE id = NEW.id),
        'Mon équipe'
      ),
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

-- Add team_id column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN team_id UUID REFERENCES teams(id);
  END IF;
END $$;

-- ============================================================================
-- SAMPLE DATA / COMMENTS
-- ============================================================================

COMMENT ON TABLE teams IS 'Teams for collaborative work on tenders. Each team has an owner (director/CEO) who can invite collaborators.';
COMMENT ON TABLE team_members IS 'Team membership with role-based permissions. 2 free members per plan, €10/month for additional.';
COMMENT ON TABLE team_invitations IS 'Pending invitations to join a team. Expire after 7 days.';
COMMENT ON COLUMN teams.max_free_members IS 'Number of free collaborators included in the subscription plan (default: 2)';
COMMENT ON COLUMN teams.extra_member_price IS 'Monthly cost per additional team member (default: €10)';
COMMENT ON COLUMN team_members.is_billable IS 'Whether this member counts towards billing. Owners are not billable.';
