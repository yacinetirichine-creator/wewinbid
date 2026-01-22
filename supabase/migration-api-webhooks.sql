-- ===============================================
-- Migration: API Publique et Webhooks
-- Description: Système de clés API et webhooks pour intégrations tierces
-- ===============================================

-- Table des clés API
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  
  -- Informations de la clé
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- La clé elle-même (hashée pour sécurité)
  key_prefix VARCHAR(10) NOT NULL, -- Pour affichage "ww_***abc"
  key_hash VARCHAR(255) NOT NULL, -- SHA-256 de la clé complète
  
  -- Permissions
  scopes JSONB DEFAULT '["read:tenders"]',
  -- Scopes possibles:
  -- 'read:tenders', 'write:tenders'
  -- 'read:responses', 'write:responses'
  -- 'read:documents', 'write:documents'
  -- 'read:calendar', 'write:calendar'
  -- 'read:analytics'
  -- 'webhooks:manage'
  
  -- Restrictions IP (optionnel)
  allowed_ips JSONB DEFAULT '[]', -- Liste d'IPs autorisées, vide = toutes
  
  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,
  
  -- Dates
  expires_at TIMESTAMPTZ, -- NULL = n'expire jamais
  last_used_at TIMESTAMPTZ,
  
  -- Statut
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des logs d'utilisation API
CREATE TABLE IF NOT EXISTS api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Détails de la requête
  method VARCHAR(10) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  query_params JSONB DEFAULT '{}',
  request_body_size INTEGER,
  
  -- Réponse
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  response_body_size INTEGER,
  
  -- Métadonnées
  ip_address VARCHAR(50),
  user_agent TEXT,
  
  -- Erreur si présente
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des webhooks configurés
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  
  -- Configuration
  name VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(2000) NOT NULL,
  
  -- Événements déclencheurs
  events JSONB NOT NULL DEFAULT '[]',
  -- Événements possibles:
  -- 'tender.created', 'tender.updated', 'tender.deleted'
  -- 'tender.deadline_approaching', 'tender.deadline_passed'
  -- 'response.created', 'response.submitted', 'response.status_changed'
  -- 'approval.requested', 'approval.approved', 'approval.rejected'
  -- 'document.uploaded', 'document.signed'
  -- 'calendar.event_created', 'calendar.reminder'
  
  -- Authentification
  secret_hash VARCHAR(255), -- HMAC secret pour signature
  auth_header VARCHAR(500), -- Header d'authentification personnalisé
  
  -- Options
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  
  -- Filtres (optionnel)
  filters JSONB DEFAULT '{}',
  -- Ex: {"tender_types": ["PUBLIC"], "min_value": 50000}
  
  -- Statistiques
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des livraisons de webhooks
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  
  -- Événement
  event_type VARCHAR(100) NOT NULL,
  event_id UUID, -- ID de l'entité concernée
  payload JSONB NOT NULL,
  
  -- Tentative
  attempt_number INTEGER DEFAULT 1,
  
  -- Résultat
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- 'pending', 'success', 'failed', 'retrying'
  
  status_code INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,
  
  error_message TEXT,
  
  -- Timing
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_logs_key ON api_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhooks_user ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status) WHERE status IN ('pending', 'retrying');

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Policy: Utilisateurs gèrent leurs clés API
CREATE POLICY "Users manage own API keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Policy: Utilisateurs voient leurs logs API
CREATE POLICY "Users view own API logs" ON api_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Utilisateurs gèrent leurs webhooks
CREATE POLICY "Users manage own webhooks" ON webhooks
  FOR ALL USING (auth.uid() = user_id);

-- Policy: Utilisateurs voient leurs livraisons
CREATE POLICY "Users view own webhook deliveries" ON webhook_deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM webhooks w
      WHERE w.id = webhook_deliveries.webhook_id
      AND w.user_id = auth.uid()
    )
  );

-- Fonction pour générer une clé API
CREATE OR REPLACE FUNCTION generate_api_key(
  p_user_id UUID,
  p_name VARCHAR,
  p_description TEXT DEFAULT NULL,
  p_scopes JSONB DEFAULT '["read:tenders"]',
  p_expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (key_id UUID, full_key TEXT) AS $$
DECLARE
  v_key_id UUID;
  v_raw_key TEXT;
  v_prefix VARCHAR(10);
  v_key_hash VARCHAR(255);
BEGIN
  -- Générer la clé brute (32 bytes = 64 caractères hex)
  v_raw_key := 'ww_' || encode(gen_random_bytes(32), 'hex');
  v_prefix := 'ww_' || substring(v_raw_key from 4 for 4) || '...';
  v_key_hash := encode(digest(v_raw_key, 'sha256'), 'hex');
  
  -- Insérer la clé
  INSERT INTO api_keys (
    user_id,
    name,
    description,
    key_prefix,
    key_hash,
    scopes,
    expires_at
  ) VALUES (
    p_user_id,
    p_name,
    p_description,
    v_prefix,
    v_key_hash,
    p_scopes,
    p_expires_at
  ) RETURNING id INTO v_key_id;
  
  RETURN QUERY SELECT v_key_id, v_raw_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour valider une clé API
CREATE OR REPLACE FUNCTION validate_api_key(p_key TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  api_key_id UUID,
  user_id UUID,
  scopes JSONB,
  rate_limit_per_minute INTEGER
) AS $$
DECLARE
  v_key_hash VARCHAR(255);
  v_api_key api_keys%ROWTYPE;
BEGIN
  -- Hasher la clé fournie
  v_key_hash := encode(digest(p_key, 'sha256'), 'hex');
  
  -- Chercher la clé
  SELECT * INTO v_api_key
  FROM api_keys ak
  WHERE ak.key_hash = v_key_hash
    AND ak.is_active = true
    AND (ak.expires_at IS NULL OR ak.expires_at > now());
  
  IF v_api_key.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::JSONB, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Mettre à jour last_used_at
  UPDATE api_keys SET last_used_at = now() WHERE id = v_api_key.id;
  
  RETURN QUERY SELECT 
    true, 
    v_api_key.id, 
    v_api_key.user_id, 
    v_api_key.scopes,
    v_api_key.rate_limit_per_minute;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour déclencher un webhook
CREATE OR REPLACE FUNCTION trigger_webhook(
  p_event_type VARCHAR,
  p_event_id UUID,
  p_payload JSONB,
  p_user_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_webhook webhooks%ROWTYPE;
  v_count INTEGER := 0;
BEGIN
  FOR v_webhook IN
    SELECT * FROM webhooks
    WHERE is_active = true
      AND (p_user_id IS NULL OR user_id = p_user_id)
      AND events ? p_event_type
  LOOP
    INSERT INTO webhook_deliveries (
      webhook_id,
      event_type,
      event_id,
      payload,
      scheduled_at
    ) VALUES (
      v_webhook.id,
      p_event_type,
      p_event_id,
      p_payload,
      now()
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les webhooks en attente
CREATE OR REPLACE FUNCTION get_pending_webhooks(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  delivery_id UUID,
  webhook_id UUID,
  webhook_url VARCHAR(2000),
  webhook_secret_hash VARCHAR(255),
  event_type VARCHAR(100),
  payload JSONB,
  attempt_number INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wd.id AS delivery_id,
    wd.webhook_id,
    w.url AS webhook_url,
    w.secret_hash AS webhook_secret_hash,
    wd.event_type,
    wd.payload,
    wd.attempt_number
  FROM webhook_deliveries wd
  JOIN webhooks w ON w.id = wd.webhook_id
  WHERE wd.status IN ('pending', 'retrying')
    AND (wd.next_retry_at IS NULL OR wd.next_retry_at <= now())
    AND w.is_active = true
  ORDER BY wd.scheduled_at
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer une livraison comme réussie/échouée
CREATE OR REPLACE FUNCTION update_webhook_delivery(
  p_delivery_id UUID,
  p_success BOOLEAN,
  p_status_code INTEGER DEFAULT NULL,
  p_response_body TEXT DEFAULT NULL,
  p_response_time_ms INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_delivery webhook_deliveries%ROWTYPE;
  v_webhook webhooks%ROWTYPE;
BEGIN
  SELECT * INTO v_delivery FROM webhook_deliveries WHERE id = p_delivery_id;
  SELECT * INTO v_webhook FROM webhooks WHERE id = v_delivery.webhook_id;
  
  IF p_success THEN
    -- Marquer comme réussi
    UPDATE webhook_deliveries SET
      status = 'success',
      status_code = p_status_code,
      response_body = p_response_body,
      response_time_ms = p_response_time_ms,
      delivered_at = now()
    WHERE id = p_delivery_id;
    
    -- Mettre à jour les stats du webhook
    UPDATE webhooks SET
      total_deliveries = total_deliveries + 1,
      successful_deliveries = successful_deliveries + 1,
      last_delivery_at = now(),
      last_success_at = now()
    WHERE id = v_delivery.webhook_id;
  ELSE
    -- Échec
    IF v_delivery.attempt_number < v_webhook.retry_count THEN
      -- Programmer une nouvelle tentative (backoff exponentiel)
      UPDATE webhook_deliveries SET
        status = 'retrying',
        attempt_number = attempt_number + 1,
        status_code = p_status_code,
        response_body = p_response_body,
        response_time_ms = p_response_time_ms,
        error_message = p_error_message,
        next_retry_at = now() + (INTERVAL '1 minute' * power(2, v_delivery.attempt_number))
      WHERE id = p_delivery_id;
    ELSE
      -- Échec définitif
      UPDATE webhook_deliveries SET
        status = 'failed',
        status_code = p_status_code,
        response_body = p_response_body,
        response_time_ms = p_response_time_ms,
        error_message = p_error_message,
        delivered_at = now()
      WHERE id = p_delivery_id;
      
      -- Mettre à jour les stats du webhook
      UPDATE webhooks SET
        total_deliveries = total_deliveries + 1,
        failed_deliveries = failed_deliveries + 1,
        last_delivery_at = now(),
        last_failure_at = now()
      WHERE id = v_delivery.webhook_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON TABLE api_keys IS 'Clés API pour accès programmatique';
COMMENT ON TABLE api_logs IS 'Logs d''utilisation des clés API';
COMMENT ON TABLE webhooks IS 'Configuration des webhooks sortants';
COMMENT ON TABLE webhook_deliveries IS 'Historique des livraisons de webhooks';
COMMENT ON FUNCTION generate_api_key IS 'Génère une nouvelle clé API sécurisée';
COMMENT ON FUNCTION validate_api_key IS 'Valide une clé API et retourne les permissions';
COMMENT ON FUNCTION trigger_webhook IS 'Déclenche l''envoi d''un webhook pour un événement';
