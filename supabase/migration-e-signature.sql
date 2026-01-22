-- Migration: E-Signature System
-- Version: 1.0.0
-- Description: Système de signature électronique

-- Table des demandes de signature
CREATE TABLE IF NOT EXISTS signature_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tender_id UUID,
    
    -- Informations de base
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- draft, pending, partially_signed, completed, cancelled, expired
    
    -- Document
    document_url TEXT,
    document_name VARCHAR(255),
    document_type VARCHAR(50), -- pdf, docx, etc.
    document_hash VARCHAR(128), -- SHA-512 pour intégrité
    
    -- Configuration
    expires_at TIMESTAMPTZ,
    reminder_frequency_days INTEGER DEFAULT 3,
    last_reminder_at TIMESTAMPTZ,
    
    -- Provider externe (optionnel)
    external_provider VARCHAR(50), -- yousign, docusign, hello_sign
    external_request_id VARCHAR(255),
    external_status VARCHAR(50),
    
    -- Métadonnées
    signed_document_url TEXT,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES auth.users(id),
    cancellation_reason TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des signataires
CREATE TABLE IF NOT EXISTS signature_signers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    signature_request_id UUID REFERENCES signature_requests(id) ON DELETE CASCADE,
    
    -- Informations du signataire
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    
    -- Ordre de signature (pour workflow séquentiel)
    order_index INTEGER DEFAULT 0,
    
    -- Statut
    status VARCHAR(50) DEFAULT 'pending', -- pending, notified, viewed, signed, declined, expired
    
    -- Dates
    notified_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    signed_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,
    decline_reason TEXT,
    
    -- Signature
    signature_data TEXT, -- Base64 de la signature dessinée
    signature_type VARCHAR(50), -- draw, upload, typed
    ip_address INET,
    user_agent TEXT,
    
    -- Token d'accès unique
    access_token UUID DEFAULT gen_random_uuid(),
    token_expires_at TIMESTAMPTZ,
    
    -- Provider externe
    external_signer_id VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de l'historique des actions
CREATE TABLE IF NOT EXISTS signature_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    signature_request_id UUID REFERENCES signature_requests(id) ON DELETE CASCADE,
    signer_id UUID REFERENCES signature_signers(id) ON DELETE SET NULL,
    
    action VARCHAR(100) NOT NULL, -- created, sent, viewed, signed, declined, reminder_sent, expired, cancelled
    actor_id UUID REFERENCES auth.users(id),
    actor_type VARCHAR(50), -- user, system, signer
    
    -- Détails
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des modèles de signature
CREATE TABLE IF NOT EXISTS signature_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Document modèle
    template_document_url TEXT,
    
    -- Positions des champs de signature (JSON)
    signature_fields JSONB DEFAULT '[]'::jsonb,
    -- Format: [{"page": 1, "x": 100, "y": 500, "width": 200, "height": 50, "signer_index": 0}]
    
    -- Configuration par défaut
    default_expiry_days INTEGER DEFAULT 30,
    default_reminder_days INTEGER DEFAULT 3,
    
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_signature_requests_org ON signature_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_signature_requests_tender ON signature_requests(tender_id);
CREATE INDEX IF NOT EXISTS idx_signature_requests_status ON signature_requests(status);
CREATE INDEX IF NOT EXISTS idx_signature_requests_external ON signature_requests(external_provider, external_request_id);
CREATE INDEX IF NOT EXISTS idx_signature_signers_request ON signature_signers(signature_request_id);
CREATE INDEX IF NOT EXISTS idx_signature_signers_email ON signature_signers(email);
CREATE INDEX IF NOT EXISTS idx_signature_signers_token ON signature_signers(access_token);
CREATE INDEX IF NOT EXISTS idx_signature_signers_status ON signature_signers(status);
CREATE INDEX IF NOT EXISTS idx_signature_audit_request ON signature_audit_log(signature_request_id);
CREATE INDEX IF NOT EXISTS idx_signature_templates_org ON signature_templates(organization_id);

-- RLS Policies
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_templates ENABLE ROW LEVEL SECURITY;

-- Policies pour signature_requests
CREATE POLICY "Users can view own org signature requests" ON signature_requests
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create signature requests" ON signature_requests
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own org signature requests" ON signature_requests
    FOR UPDATE USING (created_by = auth.uid());

-- Policies pour signature_signers
CREATE POLICY "Users can view signers" ON signature_signers
    FOR SELECT USING (
        signature_request_id IN (
            SELECT id FROM signature_requests WHERE created_by = auth.uid()
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Users can manage signers" ON signature_signers
    FOR ALL USING (
        signature_request_id IN (
            SELECT id FROM signature_requests WHERE created_by = auth.uid()
        )
    );

-- Signers can update their own signature
CREATE POLICY "Signers can sign" ON signature_signers
    FOR UPDATE USING (user_id = auth.uid());

-- Policies pour audit_log
CREATE POLICY "Users can view audit log" ON signature_audit_log
    FOR SELECT USING (
        signature_request_id IN (
            SELECT id FROM signature_requests WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "System can insert audit log" ON signature_audit_log
    FOR INSERT WITH CHECK (true);

-- Policies pour templates
CREATE POLICY "Users can view templates" ON signature_templates
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can manage templates" ON signature_templates
    FOR ALL USING (created_by = auth.uid());

-- Fonction pour mettre à jour le statut de la requête
CREATE OR REPLACE FUNCTION update_signature_request_status()
RETURNS TRIGGER AS $$
DECLARE
    total_signers INTEGER;
    signed_count INTEGER;
    declined_count INTEGER;
    new_status VARCHAR(50);
BEGIN
    -- Compter les signataires
    SELECT COUNT(*), 
           COUNT(*) FILTER (WHERE status = 'signed'),
           COUNT(*) FILTER (WHERE status = 'declined')
    INTO total_signers, signed_count, declined_count
    FROM signature_signers
    WHERE signature_request_id = NEW.signature_request_id;
    
    -- Déterminer le nouveau statut
    IF declined_count > 0 THEN
        new_status := 'cancelled';
    ELSIF signed_count = total_signers THEN
        new_status := 'completed';
    ELSIF signed_count > 0 THEN
        new_status := 'partially_signed';
    ELSE
        new_status := 'pending';
    END IF;
    
    -- Mettre à jour la requête
    UPDATE signature_requests 
    SET status = new_status,
        completed_at = CASE WHEN new_status = 'completed' THEN NOW() ELSE completed_at END,
        updated_at = NOW()
    WHERE id = NEW.signature_request_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement
DROP TRIGGER IF EXISTS trigger_update_signature_status ON signature_signers;
CREATE TRIGGER trigger_update_signature_status
    AFTER UPDATE OF status ON signature_signers
    FOR EACH ROW
    EXECUTE FUNCTION update_signature_request_status();

-- Fonction pour créer une entrée d'audit
CREATE OR REPLACE FUNCTION create_signature_audit_entry()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO signature_audit_log (signature_request_id, action, details)
        VALUES (NEW.id, 'created', jsonb_build_object('title', NEW.title));
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            INSERT INTO signature_audit_log (signature_request_id, action, details)
            VALUES (NEW.id, 'status_changed', jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status
            ));
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_signature_audit ON signature_requests;
CREATE TRIGGER trigger_signature_audit
    AFTER INSERT OR UPDATE ON signature_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_signature_audit_entry();
