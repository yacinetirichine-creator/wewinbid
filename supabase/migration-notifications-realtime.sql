-- Migration: Notifications temps réel et préférences utilisateur
-- Date: 2024

-- =============================================================================
-- 1. Table user_preferences pour les paramètres utilisateur
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Paramètres de notification
    notification_settings JSONB DEFAULT '{
        "email_enabled": true,
        "push_enabled": true,
        "tender_alerts": true,
        "deadline_reminders": true,
        "deadline_days_before": [1, 3, 7],
        "team_notifications": true,
        "ai_notifications": true
    }'::jsonb,
    
    -- Préférences d'affichage
    display_settings JSONB DEFAULT '{
        "theme": "light",
        "language": "fr",
        "compact_mode": false,
        "sidebar_collapsed": false
    }'::jsonb,
    
    -- Préférences de recherche
    search_preferences JSONB DEFAULT '{
        "default_regions": [],
        "default_sectors": [],
        "min_value": null,
        "max_value": null,
        "save_history": true
    }'::jsonb,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contrainte d'unicité
    UNIQUE(user_id)
);

-- Index pour accès rapide
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- =============================================================================
-- 2. Améliorer la table notifications
-- =============================================================================

-- Ajouter les colonnes manquantes si elles n'existent pas
DO $$
BEGIN
    -- Colonne priority
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'priority') THEN
        ALTER TABLE notifications ADD COLUMN priority TEXT DEFAULT 'medium' 
            CHECK (priority IN ('low', 'medium', 'high'));
    END IF;
    
    -- Colonne data pour métadonnées
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'data') THEN
        ALTER TABLE notifications ADD COLUMN data JSONB DEFAULT '{}';
    END IF;
    
    -- Colonne expires_at pour notifications temporaires
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'expires_at') THEN
        ALTER TABLE notifications ADD COLUMN expires_at TIMESTAMPTZ;
    END IF;
END $$;

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
    ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
    ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type 
    ON notifications(type);

-- =============================================================================
-- 3. Table pour les rappels d'échéance planifiés
-- =============================================================================

CREATE TABLE IF NOT EXISTS deadline_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
    
    -- Informations du rappel
    reminder_date TIMESTAMPTZ NOT NULL,
    days_before INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    
    -- Contrainte pour éviter les doublons
    UNIQUE(user_id, tender_id, days_before)
);

CREATE INDEX IF NOT EXISTS idx_deadline_reminders_pending 
    ON deadline_reminders(reminder_date) WHERE status = 'pending';

-- =============================================================================
-- 4. Améliorer tender_responses avec les champs manquants
-- =============================================================================

DO $$
BEGIN
    -- Champ current_step
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tender_responses' AND column_name = 'current_step') THEN
        ALTER TABLE tender_responses ADD COLUMN current_step INTEGER DEFAULT 0;
    END IF;
    
    -- Champ documents_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tender_responses' AND column_name = 'documents_status') THEN
        ALTER TABLE tender_responses ADD COLUMN documents_status JSONB DEFAULT '{}';
    END IF;
    
    -- Champ notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tender_responses' AND column_name = 'notes') THEN
        ALTER TABLE tender_responses ADD COLUMN notes JSONB DEFAULT '{}';
    END IF;
    
    -- Champ checklist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tender_responses' AND column_name = 'checklist') THEN
        ALTER TABLE tender_responses ADD COLUMN checklist JSONB DEFAULT '{}';
    END IF;
    
    -- Champ form_data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tender_responses' AND column_name = 'form_data') THEN
        ALTER TABLE tender_responses ADD COLUMN form_data JSONB DEFAULT '{}';
    END IF;
END $$;

-- =============================================================================
-- 5. RLS Policies
-- =============================================================================

-- Activer RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadline_reminders ENABLE ROW LEVEL SECURITY;

-- Politiques pour user_preferences
DROP POLICY IF EXISTS "users_manage_own_preferences" ON user_preferences;
CREATE POLICY "users_manage_own_preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Politiques pour deadline_reminders
DROP POLICY IF EXISTS "users_manage_own_reminders" ON deadline_reminders;
CREATE POLICY "users_manage_own_reminders" ON deadline_reminders
    FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- 6. Fonction pour créer une notification
-- =============================================================================

CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_link TEXT DEFAULT NULL,
    p_priority TEXT DEFAULT 'medium',
    p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, link, priority, data, read, created_at)
    VALUES (p_user_id, p_type, p_title, p_message, p_link, p_priority, p_data, false, NOW())
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 7. Trigger pour créer des rappels automatiquement
-- =============================================================================

CREATE OR REPLACE FUNCTION auto_create_deadline_reminders()
RETURNS TRIGGER AS $$
DECLARE
    v_user RECORD;
    v_days INTEGER;
    v_reminder_date TIMESTAMPTZ;
BEGIN
    -- Pour chaque utilisateur suivant cet AO
    FOR v_user IN 
        SELECT DISTINCT user_id 
        FROM saved_tenders 
        WHERE tender_id = NEW.id
    LOOP
        -- Créer les rappels selon les préférences utilisateur
        FOR v_days IN 
            SELECT jsonb_array_elements_text(
                COALESCE(
                    (SELECT notification_settings->'deadline_days_before' 
                     FROM user_preferences 
                     WHERE user_id = v_user.user_id),
                    '[1, 3, 7]'::jsonb
                )
            )::integer
        LOOP
            v_reminder_date := NEW.deadline - (v_days || ' days')::interval;
            
            -- Ne créer que si la date est dans le futur
            IF v_reminder_date > NOW() THEN
                INSERT INTO deadline_reminders (user_id, tender_id, reminder_date, days_before)
                VALUES (v_user.user_id, NEW.id, v_reminder_date, v_days)
                ON CONFLICT (user_id, tender_id, days_before) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger si la table tenders existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenders') THEN
        DROP TRIGGER IF EXISTS trg_auto_create_deadline_reminders ON tenders;
        CREATE TRIGGER trg_auto_create_deadline_reminders
            AFTER INSERT OR UPDATE OF deadline ON tenders
            FOR EACH ROW
            EXECUTE FUNCTION auto_create_deadline_reminders();
    END IF;
END $$;

-- =============================================================================
-- 8. Fonction pour envoyer les rappels (à appeler par un CRON)
-- =============================================================================

CREATE OR REPLACE FUNCTION send_pending_reminders()
RETURNS INTEGER AS $$
DECLARE
    v_reminder RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR v_reminder IN 
        SELECT dr.*, t.title as tender_title, t.reference as tender_reference
        FROM deadline_reminders dr
        LEFT JOIN tenders t ON t.id = dr.tender_id
        WHERE dr.status = 'pending'
        AND dr.reminder_date <= NOW()
    LOOP
        -- Créer la notification
        PERFORM create_notification(
            v_reminder.user_id,
            'TENDER_DEADLINE',
            'Échéance proche : ' || COALESCE(v_reminder.tender_title, 'Appel d''offres'),
            'Plus que ' || v_reminder.days_before || ' jour(s) pour répondre',
            '/tenders/' || v_reminder.tender_id,
            CASE 
                WHEN v_reminder.days_before <= 1 THEN 'high'
                WHEN v_reminder.days_before <= 3 THEN 'medium'
                ELSE 'low'
            END,
            jsonb_build_object(
                'tender_id', v_reminder.tender_id,
                'days_before', v_reminder.days_before
            )
        );
        
        -- Marquer comme envoyé
        UPDATE deadline_reminders
        SET status = 'sent', sent_at = NOW()
        WHERE id = v_reminder.id;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 9. Vue pour les statistiques de notifications
-- =============================================================================

CREATE OR REPLACE VIEW notification_stats AS
SELECT 
    user_id,
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE read = false) as unread_count,
    COUNT(*) FILTER (WHERE type = 'TENDER_DEADLINE') as deadline_notifications,
    COUNT(*) FILTER (WHERE type = 'SCORE_READY') as analysis_notifications,
    COUNT(*) FILTER (WHERE priority = 'high') as high_priority_count,
    MAX(created_at) as last_notification_at
FROM notifications
GROUP BY user_id;

-- =============================================================================
-- 10. Activer Realtime pour les notifications
-- =============================================================================

-- S'assurer que la table est dans la publication realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignorer les erreurs si la publication n'existe pas
        NULL;
END $$;

COMMENT ON TABLE user_preferences IS 'Préférences utilisateur incluant notifications, affichage et recherche';
COMMENT ON TABLE deadline_reminders IS 'Rappels d''échéance planifiés pour les appels d''offres';
