-- ===============================================
-- Migration: Workflow d'approbation multi-niveau
-- Description: Système de validation hiérarchique pour réponses aux appels d'offres
-- ===============================================

-- Table des workflows d'approbation
CREATE TABLE IF NOT EXISTS approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Conditions d'activation automatique
  auto_trigger_rules JSONB DEFAULT '{}',
  -- Ex: {"min_value": 50000, "tender_types": ["PUBLIC"], "categories": ["IT"]}
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Étapes du workflow
CREATE TABLE IF NOT EXISTS approval_workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Type d'approbation
  approval_type VARCHAR(50) NOT NULL DEFAULT 'single',
  -- 'single': un seul approbateur suffit
  -- 'all': tous doivent approuver
  -- 'majority': majorité requise
  -- 'threshold': nombre minimum
  
  threshold_count INTEGER, -- Pour type 'threshold'
  
  -- Timeout automatique (en heures)
  timeout_hours INTEGER,
  auto_approve_on_timeout BOOLEAN DEFAULT false,
  
  -- Notification
  notify_on_pending BOOLEAN DEFAULT true,
  reminder_hours INTEGER DEFAULT 24,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Approbateurs par étape
CREATE TABLE IF NOT EXISTS approval_step_approvers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES approval_workflow_steps(id) ON DELETE CASCADE,
  
  -- Type d'approbateur
  approver_type VARCHAR(50) NOT NULL DEFAULT 'user',
  -- 'user': utilisateur spécifique
  -- 'role': rôle (manager, director, etc.)
  -- 'team': équipe entière
  
  user_id UUID REFERENCES auth.users(id),
  role_name VARCHAR(100),
  team_id UUID,
  
  -- Permissions
  can_delegate BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT check_approver_type CHECK (
    (approver_type = 'user' AND user_id IS NOT NULL) OR
    (approver_type = 'role' AND role_name IS NOT NULL) OR
    (approver_type = 'team' AND team_id IS NOT NULL)
  )
);

-- Demandes d'approbation
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id),
  
  -- Objet à approuver
  entity_type VARCHAR(100) NOT NULL, -- 'tender_response', 'document', 'budget', etc.
  entity_id UUID NOT NULL,
  
  -- Statut global
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- 'pending', 'in_progress', 'approved', 'rejected', 'cancelled'
  
  current_step_id UUID REFERENCES approval_workflow_steps(id),
  
  -- Métadonnées
  title VARCHAR(500) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  -- Ex: {"tender_id": "...", "value": 150000, "deadline": "..."}
  
  -- Demandeur
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ DEFAULT now(),
  
  -- Finalisation
  completed_at TIMESTAMPTZ,
  final_decision VARCHAR(50), -- 'approved', 'rejected'
  final_comment TEXT,
  
  -- Urgence
  is_urgent BOOLEAN DEFAULT false,
  due_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Décisions d'approbation par étape
CREATE TABLE IF NOT EXISTS approval_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES approval_workflow_steps(id),
  
  -- Décisionnaire
  approver_id UUID NOT NULL REFERENCES auth.users(id),
  delegated_from UUID REFERENCES auth.users(id), -- Si délégué
  
  -- Décision
  decision VARCHAR(50) NOT NULL,
  -- 'approved', 'rejected', 'request_changes', 'delegated'
  
  comment TEXT,
  
  -- Fichiers joints à la décision
  attachments JSONB DEFAULT '[]',
  
  decided_at TIMESTAMPTZ DEFAULT now(),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Historique des actions sur les demandes
CREATE TABLE IF NOT EXISTS approval_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  
  action VARCHAR(100) NOT NULL,
  -- 'created', 'step_started', 'decision_made', 'step_completed', 
  -- 'reminder_sent', 'escalated', 'cancelled', 'completed'
  
  actor_id UUID REFERENCES auth.users(id),
  
  -- Détails de l'action
  details JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Commentaires sur les demandes
CREATE TABLE IF NOT EXISTS approval_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  
  -- Réponse à un commentaire
  parent_id UUID REFERENCES approval_comments(id),
  
  -- Mentions
  mentions JSONB DEFAULT '[]', -- Liste de user_ids mentionnés
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Délégations temporaires
CREATE TABLE IF NOT EXISTS approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  delegator_id UUID NOT NULL REFERENCES auth.users(id),
  delegate_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Période de délégation
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  
  -- Scope de la délégation
  workflow_ids UUID[] DEFAULT '{}', -- Vide = tous les workflows
  
  reason TEXT,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_by ON approval_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_approval_decisions_request ON approval_decisions(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_decisions_approver ON approval_decisions(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_audit_log_request ON approval_audit_log(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflow_steps_workflow ON approval_workflow_steps(workflow_id);

-- RLS Policies
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_step_approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_delegations ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture des workflows de l'organisation
CREATE POLICY "Users can view organization workflows" ON approval_workflows
  FOR SELECT USING (true); -- À ajuster selon la logique org

-- Policy: Lecture des demandes où l'utilisateur est impliqué
CREATE POLICY "Users can view relevant approval requests" ON approval_requests
  FOR SELECT USING (
    requested_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM approval_step_approvers asa
      JOIN approval_workflow_steps aws ON aws.id = asa.step_id
      WHERE aws.workflow_id = approval_requests.workflow_id
      AND asa.user_id = auth.uid()
    )
  );

-- Policy: Création de demandes par utilisateurs authentifiés
CREATE POLICY "Authenticated users can create approval requests" ON approval_requests
  FOR INSERT WITH CHECK (auth.uid() = requested_by);

-- Policy: Décisions par approbateurs autorisés
CREATE POLICY "Approvers can make decisions" ON approval_decisions
  FOR INSERT WITH CHECK (auth.uid() = approver_id);

-- Policy: Lecture des décisions pour les demandes visibles
CREATE POLICY "Users can view decisions for visible requests" ON approval_decisions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM approval_requests ar
      WHERE ar.id = approval_decisions.request_id
      AND (
        ar.requested_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM approval_step_approvers asa
          JOIN approval_workflow_steps aws ON aws.id = asa.step_id
          WHERE aws.workflow_id = ar.workflow_id
          AND asa.user_id = auth.uid()
        )
      )
    )
  );

-- Policy: Commentaires
CREATE POLICY "Users can view and add comments" ON approval_comments
  FOR ALL USING (true);

-- Policy: Audit log lecture
CREATE POLICY "Users can view audit log" ON approval_audit_log
  FOR SELECT USING (true);

-- Fonction pour avancer au step suivant
CREATE OR REPLACE FUNCTION advance_approval_step()
RETURNS TRIGGER AS $$
DECLARE
  v_request approval_requests%ROWTYPE;
  v_current_step approval_workflow_steps%ROWTYPE;
  v_next_step approval_workflow_steps%ROWTYPE;
  v_decision_count INTEGER;
  v_approved_count INTEGER;
  v_required_approvals INTEGER;
  v_step_complete BOOLEAN := false;
BEGIN
  -- Récupérer la demande
  SELECT * INTO v_request FROM approval_requests WHERE id = NEW.request_id;
  
  -- Récupérer l'étape courante
  SELECT * INTO v_current_step FROM approval_workflow_steps WHERE id = NEW.step_id;
  
  -- Si rejeté, terminer la demande
  IF NEW.decision = 'rejected' THEN
    UPDATE approval_requests SET
      status = 'rejected',
      completed_at = now(),
      final_decision = 'rejected',
      final_comment = NEW.comment,
      updated_at = now()
    WHERE id = NEW.request_id;
    
    -- Log
    INSERT INTO approval_audit_log (request_id, action, actor_id, details)
    VALUES (NEW.request_id, 'rejected', NEW.approver_id, 
      jsonb_build_object('step_id', NEW.step_id, 'comment', NEW.comment));
    
    RETURN NEW;
  END IF;
  
  -- Compter les décisions pour cette étape
  SELECT COUNT(*), COUNT(*) FILTER (WHERE decision = 'approved')
  INTO v_decision_count, v_approved_count
  FROM approval_decisions
  WHERE request_id = NEW.request_id AND step_id = NEW.step_id;
  
  -- Vérifier si l'étape est complète selon le type
  CASE v_current_step.approval_type
    WHEN 'single' THEN
      v_step_complete := v_approved_count >= 1;
    WHEN 'all' THEN
      SELECT COUNT(*) INTO v_required_approvals
      FROM approval_step_approvers WHERE step_id = v_current_step.id;
      v_step_complete := v_approved_count >= v_required_approvals;
    WHEN 'majority' THEN
      SELECT COUNT(*) INTO v_required_approvals
      FROM approval_step_approvers WHERE step_id = v_current_step.id;
      v_step_complete := v_approved_count > (v_required_approvals / 2);
    WHEN 'threshold' THEN
      v_step_complete := v_approved_count >= COALESCE(v_current_step.threshold_count, 1);
    ELSE
      v_step_complete := v_approved_count >= 1;
  END CASE;
  
  IF v_step_complete THEN
    -- Log completion de l'étape
    INSERT INTO approval_audit_log (request_id, action, actor_id, details)
    VALUES (NEW.request_id, 'step_completed', NEW.approver_id, 
      jsonb_build_object('step_id', NEW.step_id, 'step_name', v_current_step.name));
    
    -- Chercher l'étape suivante
    SELECT * INTO v_next_step
    FROM approval_workflow_steps
    WHERE workflow_id = v_current_step.workflow_id
    AND step_order > v_current_step.step_order
    ORDER BY step_order
    LIMIT 1;
    
    IF v_next_step.id IS NOT NULL THEN
      -- Avancer à l'étape suivante
      UPDATE approval_requests SET
        current_step_id = v_next_step.id,
        status = 'in_progress',
        updated_at = now()
      WHERE id = NEW.request_id;
      
      -- Log
      INSERT INTO approval_audit_log (request_id, action, actor_id, details)
      VALUES (NEW.request_id, 'step_started', NULL, 
        jsonb_build_object('step_id', v_next_step.id, 'step_name', v_next_step.name));
    ELSE
      -- Toutes les étapes complétées - approuver
      UPDATE approval_requests SET
        status = 'approved',
        completed_at = now(),
        final_decision = 'approved',
        updated_at = now()
      WHERE id = NEW.request_id;
      
      -- Log
      INSERT INTO approval_audit_log (request_id, action, actor_id, details)
      VALUES (NEW.request_id, 'completed', NEW.approver_id, 
        jsonb_build_object('final_decision', 'approved'));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour avancer les étapes
DROP TRIGGER IF EXISTS trigger_advance_approval_step ON approval_decisions;
CREATE TRIGGER trigger_advance_approval_step
  AFTER INSERT ON approval_decisions
  FOR EACH ROW
  EXECUTE FUNCTION advance_approval_step();

-- Fonction pour démarrer une demande d'approbation
CREATE OR REPLACE FUNCTION start_approval_request(
  p_workflow_id UUID,
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_title VARCHAR,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_is_urgent BOOLEAN DEFAULT false,
  p_due_date TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_first_step approval_workflow_steps%ROWTYPE;
BEGIN
  -- Trouver la première étape
  SELECT * INTO v_first_step
  FROM approval_workflow_steps
  WHERE workflow_id = p_workflow_id
  ORDER BY step_order
  LIMIT 1;
  
  IF v_first_step.id IS NULL THEN
    RAISE EXCEPTION 'Workflow has no steps';
  END IF;
  
  -- Créer la demande
  INSERT INTO approval_requests (
    workflow_id, entity_type, entity_id, status, current_step_id,
    title, description, metadata, requested_by, is_urgent, due_date
  ) VALUES (
    p_workflow_id, p_entity_type, p_entity_id, 'in_progress', v_first_step.id,
    p_title, p_description, p_metadata, auth.uid(), p_is_urgent, p_due_date
  ) RETURNING id INTO v_request_id;
  
  -- Log création
  INSERT INTO approval_audit_log (request_id, action, actor_id, details)
  VALUES (v_request_id, 'created', auth.uid(), 
    jsonb_build_object('workflow_id', p_workflow_id, 'title', p_title));
  
  -- Log démarrage première étape
  INSERT INTO approval_audit_log (request_id, action, actor_id, details)
  VALUES (v_request_id, 'step_started', NULL, 
    jsonb_build_object('step_id', v_first_step.id, 'step_name', v_first_step.name));
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Workflow par défaut
INSERT INTO approval_workflows (id, organization_id, name, description, is_default)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'Approbation standard',
  'Workflow standard : Manager → Directeur → Validation finale',
  true
) ON CONFLICT DO NOTHING;

-- Étapes du workflow par défaut
INSERT INTO approval_workflow_steps (workflow_id, step_order, name, description, approval_type, reminder_hours)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 1, 'Validation Manager', 'Validation par le responsable direct', 'single', 24),
  ('a0000000-0000-0000-0000-000000000001', 2, 'Validation Direction', 'Validation par la direction', 'single', 48),
  ('a0000000-0000-0000-0000-000000000001', 3, 'Approbation finale', 'Validation finale avant soumission', 'single', 24)
ON CONFLICT DO NOTHING;

-- Commentaires
COMMENT ON TABLE approval_workflows IS 'Définition des workflows d''approbation';
COMMENT ON TABLE approval_workflow_steps IS 'Étapes d''un workflow d''approbation';
COMMENT ON TABLE approval_step_approvers IS 'Approbateurs assignés à chaque étape';
COMMENT ON TABLE approval_requests IS 'Demandes d''approbation en cours ou terminées';
COMMENT ON TABLE approval_decisions IS 'Décisions prises par les approbateurs';
COMMENT ON TABLE approval_audit_log IS 'Historique complet des actions sur les demandes';
