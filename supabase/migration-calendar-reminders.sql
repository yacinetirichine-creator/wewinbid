-- ===============================================
-- Migration: Calendrier et rappels automatiques
-- Description: Système de calendrier avec synchronisation et alertes
-- ===============================================

-- Table des événements de calendrier
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations de base
  title VARCHAR(500) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL DEFAULT 'deadline',
  -- 'deadline': échéance appel d'offres
  -- 'meeting': réunion
  -- 'reminder': rappel personnalisé
  -- 'milestone': jalon projet
  -- 'task': tâche
  
  -- Dates
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  
  -- Récurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule VARCHAR(500), -- Format iCal RRULE
  -- Ex: "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10"
  
  -- Couleur et catégorie
  color VARCHAR(50) DEFAULT '#3B82F6',
  category VARCHAR(100),
  
  -- Lien avec entités
  entity_type VARCHAR(100), -- 'tender', 'project', 'task', etc.
  entity_id UUID,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  
  -- Statut
  status VARCHAR(50) DEFAULT 'active',
  -- 'active', 'completed', 'cancelled'
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des rappels
CREATE TABLE IF NOT EXISTS event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Configuration du rappel
  reminder_type VARCHAR(50) NOT NULL DEFAULT 'notification',
  -- 'notification': notification in-app
  -- 'email': email
  -- 'slack': Slack
  -- 'teams': Teams
  -- 'sms': SMS (si configuré)
  
  -- Timing du rappel (avant l'événement)
  minutes_before INTEGER NOT NULL DEFAULT 30,
  -- Ex: 30 = 30 minutes avant, 1440 = 24 heures avant
  
  -- Statut
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  
  -- Erreur si échec
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des préférences de calendrier utilisateur
CREATE TABLE IF NOT EXISTS calendar_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Fuseau horaire
  timezone VARCHAR(100) DEFAULT 'Europe/Paris',
  
  -- Premier jour de la semaine (0 = Dimanche, 1 = Lundi)
  week_start INTEGER DEFAULT 1,
  
  -- Format de l'heure
  time_format VARCHAR(10) DEFAULT '24h', -- '12h' ou '24h'
  
  -- Rappels par défaut (minutes avant)
  default_reminder_times JSONB DEFAULT '[30, 1440]',
  
  -- Canaux de notification par défaut
  default_reminder_types JSONB DEFAULT '["notification", "email"]',
  
  -- Couleurs par type d'événement
  event_colors JSONB DEFAULT '{
    "deadline": "#EF4444",
    "meeting": "#3B82F6",
    "reminder": "#F59E0B",
    "milestone": "#10B981",
    "task": "#8B5CF6"
  }',
  
  -- Synchronisation calendrier externe
  google_calendar_sync BOOLEAN DEFAULT false,
  google_calendar_id VARCHAR(500),
  outlook_calendar_sync BOOLEAN DEFAULT false,
  outlook_calendar_id VARCHAR(500),
  
  -- Paramètres d'affichage
  show_weekends BOOLEAN DEFAULT true,
  default_view VARCHAR(50) DEFAULT 'month', -- 'day', 'week', 'month', 'agenda'
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour la synchronisation des calendriers externes
CREATE TABLE IF NOT EXISTS calendar_sync_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  provider VARCHAR(50) NOT NULL, -- 'google', 'outlook'
  
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- ID du calendrier synchronisé
  external_calendar_id VARCHAR(500),
  
  -- Dernier sync
  last_sync_at TIMESTAMPTZ,
  sync_cursor VARCHAR(500), -- Pour la pagination/incremental sync
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, provider)
);

-- Table des deadlines d'appels d'offres (pour faciliter les rappels)
CREATE TABLE IF NOT EXISTS tender_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type de deadline
  deadline_type VARCHAR(50) NOT NULL DEFAULT 'submission',
  -- 'submission': soumission
  -- 'questions': date limite questions
  -- 'visit': visite site
  -- 'decision': décision attendue
  
  deadline_date TIMESTAMPTZ NOT NULL,
  
  -- Rappels configurés
  reminder_7d BOOLEAN DEFAULT true,
  reminder_3d BOOLEAN DEFAULT true,
  reminder_1d BOOLEAN DEFAULT true,
  reminder_same_day BOOLEAN DEFAULT true,
  
  -- Statut des rappels envoyés
  reminder_7d_sent BOOLEAN DEFAULT false,
  reminder_3d_sent BOOLEAN DEFAULT false,
  reminder_1d_sent BOOLEAN DEFAULT false,
  reminder_same_day_sent BOOLEAN DEFAULT false,
  
  -- Lien avec événement calendrier
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(tender_id, deadline_type, user_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON calendar_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_entity ON calendar_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_scheduled ON event_reminders(scheduled_for) WHERE NOT is_sent;
CREATE INDEX IF NOT EXISTS idx_tender_deadlines_date ON tender_deadlines(deadline_date);
CREATE INDEX IF NOT EXISTS idx_tender_deadlines_user ON tender_deadlines(user_id);

-- RLS Policies
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_deadlines ENABLE ROW LEVEL SECURITY;

-- Policy: Utilisateurs voient leurs propres événements
CREATE POLICY "Users manage own calendar events" ON calendar_events
  FOR ALL USING (auth.uid() = user_id);

-- Policy: Utilisateurs gèrent leurs rappels
CREATE POLICY "Users manage own reminders" ON event_reminders
  FOR ALL USING (auth.uid() = user_id);

-- Policy: Utilisateurs gèrent leurs préférences
CREATE POLICY "Users manage own preferences" ON calendar_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Policy: Tokens de sync privés
CREATE POLICY "Users manage own sync tokens" ON calendar_sync_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Policy: Deadlines privées
CREATE POLICY "Users manage own tender deadlines" ON tender_deadlines
  FOR ALL USING (auth.uid() = user_id);

-- Fonction pour créer automatiquement un événement calendrier pour une deadline
CREATE OR REPLACE FUNCTION create_calendar_event_for_deadline()
RETURNS TRIGGER AS $$
DECLARE
  v_event_id UUID;
  v_tender_title VARCHAR(500);
BEGIN
  -- Récupérer le titre de l'appel d'offres (à adapter selon votre schéma)
  -- SELECT title INTO v_tender_title FROM tenders WHERE id = NEW.tender_id;
  v_tender_title := COALESCE(v_tender_title, 'Appel d''offres');
  
  -- Créer l'événement calendrier
  INSERT INTO calendar_events (
    user_id,
    title,
    description,
    event_type,
    start_date,
    all_day,
    color,
    entity_type,
    entity_id
  ) VALUES (
    NEW.user_id,
    CASE NEW.deadline_type
      WHEN 'submission' THEN 'Échéance soumission: ' || v_tender_title
      WHEN 'questions' THEN 'Date limite questions: ' || v_tender_title
      WHEN 'visit' THEN 'Visite site: ' || v_tender_title
      WHEN 'decision' THEN 'Décision attendue: ' || v_tender_title
      ELSE 'Deadline: ' || v_tender_title
    END,
    NEW.notes,
    'deadline',
    NEW.deadline_date,
    false,
    '#EF4444',
    'tender',
    NEW.tender_id
  ) RETURNING id INTO v_event_id;
  
  -- Mettre à jour la référence
  NEW.calendar_event_id := v_event_id;
  
  -- Créer les rappels par défaut
  IF NEW.reminder_7d THEN
    INSERT INTO event_reminders (event_id, user_id, reminder_type, minutes_before, scheduled_for)
    VALUES (v_event_id, NEW.user_id, 'notification', 10080, NEW.deadline_date - INTERVAL '7 days');
    INSERT INTO event_reminders (event_id, user_id, reminder_type, minutes_before, scheduled_for)
    VALUES (v_event_id, NEW.user_id, 'email', 10080, NEW.deadline_date - INTERVAL '7 days');
  END IF;
  
  IF NEW.reminder_3d THEN
    INSERT INTO event_reminders (event_id, user_id, reminder_type, minutes_before, scheduled_for)
    VALUES (v_event_id, NEW.user_id, 'notification', 4320, NEW.deadline_date - INTERVAL '3 days');
    INSERT INTO event_reminders (event_id, user_id, reminder_type, minutes_before, scheduled_for)
    VALUES (v_event_id, NEW.user_id, 'email', 4320, NEW.deadline_date - INTERVAL '3 days');
  END IF;
  
  IF NEW.reminder_1d THEN
    INSERT INTO event_reminders (event_id, user_id, reminder_type, minutes_before, scheduled_for)
    VALUES (v_event_id, NEW.user_id, 'notification', 1440, NEW.deadline_date - INTERVAL '1 day');
    INSERT INTO event_reminders (event_id, user_id, reminder_type, minutes_before, scheduled_for)
    VALUES (v_event_id, NEW.user_id, 'email', 1440, NEW.deadline_date - INTERVAL '1 day');
  END IF;
  
  IF NEW.reminder_same_day THEN
    INSERT INTO event_reminders (event_id, user_id, reminder_type, minutes_before, scheduled_for)
    VALUES (v_event_id, NEW.user_id, 'notification', 120, NEW.deadline_date - INTERVAL '2 hours');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer les événements calendrier
DROP TRIGGER IF EXISTS trigger_create_calendar_event_for_deadline ON tender_deadlines;
CREATE TRIGGER trigger_create_calendar_event_for_deadline
  BEFORE INSERT ON tender_deadlines
  FOR EACH ROW
  EXECUTE FUNCTION create_calendar_event_for_deadline();

-- Fonction pour récupérer les rappels à envoyer
CREATE OR REPLACE FUNCTION get_pending_reminders()
RETURNS TABLE (
  reminder_id UUID,
  event_id UUID,
  user_id UUID,
  reminder_type VARCHAR(50),
  event_title VARCHAR(500),
  event_start TIMESTAMPTZ,
  user_email VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.id AS reminder_id,
    er.event_id,
    er.user_id,
    er.reminder_type,
    ce.title AS event_title,
    ce.start_date AS event_start,
    u.email AS user_email
  FROM event_reminders er
  JOIN calendar_events ce ON ce.id = er.event_id
  JOIN auth.users u ON u.id = er.user_id
  WHERE er.is_sent = false
    AND er.scheduled_for <= now()
    AND ce.status = 'active'
  ORDER BY er.scheduled_for
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer un rappel comme envoyé
CREATE OR REPLACE FUNCTION mark_reminder_sent(p_reminder_id UUID, p_error TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  UPDATE event_reminders SET
    is_sent = true,
    sent_at = now(),
    error_message = p_error
  WHERE id = p_reminder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vue pour les événements du mois courant
CREATE OR REPLACE VIEW current_month_events AS
SELECT 
  ce.*,
  u.email AS user_email
FROM calendar_events ce
JOIN auth.users u ON u.id = ce.user_id
WHERE ce.status = 'active'
  AND ce.start_date >= date_trunc('month', now())
  AND ce.start_date < date_trunc('month', now()) + INTERVAL '1 month';

-- Commentaires
COMMENT ON TABLE calendar_events IS 'Événements de calendrier des utilisateurs';
COMMENT ON TABLE event_reminders IS 'Rappels programmés pour les événements';
COMMENT ON TABLE calendar_preferences IS 'Préférences de calendrier par utilisateur';
COMMENT ON TABLE tender_deadlines IS 'Deadlines des appels d''offres avec configuration des rappels';
COMMENT ON FUNCTION get_pending_reminders() IS 'Récupère les rappels à envoyer maintenant';
