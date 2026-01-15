-- Migration: Collaboration en Équipe
-- Date: 2026-01-15
-- Description: Tables pour la collaboration multi-utilisateurs et gestion des rôles

-- Table des membres d'équipe
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  permissions JSONB DEFAULT '{"canCreateTenders": false, "canEditTenders": false, "canDeleteTenders": false, "canInviteMembers": false, "canManageTeam": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- Table des invitations en attente
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
  invited_by UUID NOT NULL REFERENCES profiles(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, email)
);

-- Table des commentaires sur les appels d'offres
CREATE TABLE IF NOT EXISTS tender_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES tender_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de l'historique des modifications (audit trail)
CREATE TABLE IF NOT EXISTS tender_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL CHECK (action IN ('CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED', 'ASSIGNED', 'COMMENT_ADDED')),
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des mentions/tags
CREATE TABLE IF NOT EXISTS tender_mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES tender_comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentioned_by_user_id UUID NOT NULL REFERENCES profiles(id),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_team_members_company ON team_members(company_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_company ON team_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_tender_comments_tender ON tender_comments(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_comments_user ON tender_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_tender_comments_parent ON tender_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_tender_history_tender ON tender_history(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_history_created ON tender_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tender_mentions_user ON tender_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_tender_mentions_read ON tender_mentions(read);

-- RLS Policies pour team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view own team"
  ON team_members FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage team members"
  ON team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.company_id = team_members.company_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'admin'
      AND tm.status = 'active'
    )
  );

-- RLS Policies pour team_invitations
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view company invitations"
  ON team_invitations FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage invitations"
  ON team_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.company_id = team_invitations.company_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('admin', 'editor')
      AND tm.status = 'active'
    )
  );

-- RLS Policies pour tender_comments
ALTER TABLE tender_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view comments on company tenders"
  ON tender_comments FOR SELECT
  USING (
    tender_id IN (
      SELECT id FROM tenders WHERE company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Team members can create comments"
  ON tender_comments FOR INSERT
  WITH CHECK (
    tender_id IN (
      SELECT id FROM tenders WHERE company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own comments"
  ON tender_comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON tender_comments FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies pour tender_history
ALTER TABLE tender_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view history of company tenders"
  ON tender_history FOR SELECT
  USING (
    tender_id IN (
      SELECT id FROM tenders WHERE company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies pour tender_mentions
ALTER TABLE tender_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mentions"
  ON tender_mentions FOR SELECT
  USING (mentioned_user_id = auth.uid());

CREATE POLICY "Users can update own mentions"
  ON tender_mentions FOR UPDATE
  USING (mentioned_user_id = auth.uid());

-- Fonction pour nettoyer les invitations expirées
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  DELETE FROM team_invitations
  WHERE expires_at < NOW() AND accepted = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour logger les changements de tender
CREATE OR REPLACE FUNCTION log_tender_change()
RETURNS TRIGGER AS $$
DECLARE
  changes jsonb;
BEGIN
  -- Construire le JSON des changements
  changes := jsonb_build_object(
    'old', row_to_json(OLD),
    'new', row_to_json(NEW)
  );

  -- Insérer dans l'historique
  INSERT INTO tender_history (
    tender_id,
    user_id,
    action,
    changes
  ) VALUES (
    NEW.id,
    auth.uid(),
    'UPDATED',
    changes
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour logger les modifications de tenders
DROP TRIGGER IF EXISTS log_tender_updates ON tenders;
CREATE TRIGGER log_tender_updates
  AFTER UPDATE ON tenders
  FOR EACH ROW
  EXECUTE FUNCTION log_tender_change();

-- Fonction pour notifier les mentions
CREATE OR REPLACE FUNCTION notify_mentions()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_user_id UUID;
BEGIN
  -- Extraire les user IDs depuis le JSON mentions
  IF NEW.mentions IS NOT NULL THEN
    FOR mentioned_user_id IN 
      SELECT (value::text)::uuid FROM jsonb_array_elements(NEW.mentions)
    LOOP
      INSERT INTO tender_mentions (
        tender_id,
        comment_id,
        mentioned_user_id,
        mentioned_by_user_id
      ) VALUES (
        NEW.tender_id,
        NEW.id,
        mentioned_user_id,
        NEW.user_id
      );

      -- Créer une notification
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link,
        tender_id
      ) VALUES (
        mentioned_user_id,
        'COMMENT',
        'Vous avez été mentionné',
        'Vous avez été mentionné dans un commentaire',
        '/tenders/' || NEW.tender_id,
        NEW.tender_id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour les mentions
DROP TRIGGER IF EXISTS notify_comment_mentions ON tender_comments;
CREATE TRIGGER notify_comment_mentions
  AFTER INSERT ON tender_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_mentions();

COMMENT ON TABLE team_members IS 'Membres de l''équipe avec leurs rôles et permissions';
COMMENT ON TABLE team_invitations IS 'Invitations en attente pour rejoindre une équipe';
COMMENT ON TABLE tender_comments IS 'Commentaires et discussions sur les appels d''offres';
COMMENT ON TABLE tender_history IS 'Historique complet des modifications (audit trail)';
COMMENT ON TABLE tender_mentions IS 'Mentions d''utilisateurs dans les commentaires';
