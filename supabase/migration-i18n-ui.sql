-- ============================================================
-- FEATURE: UI I18N TRANSLATIONS (AI + HUMAN REVIEW)
-- ============================================================

DROP TABLE IF EXISTS ui_translations CASCADE;

CREATE TABLE ui_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_key TEXT NOT NULL,
  locale VARCHAR(10) NOT NULL,
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'AI', -- 'AI', 'HUMAN', 'REVIEWED'
  context TEXT,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_ui_translation UNIQUE (translation_key, locale),
  CONSTRAINT valid_ui_translation_status CHECK (status IN ('AI', 'HUMAN', 'REVIEWED'))
);

CREATE INDEX IF NOT EXISTS idx_ui_translations_key ON ui_translations(translation_key);
CREATE INDEX IF NOT EXISTS idx_ui_translations_locale ON ui_translations(locale);
CREATE INDEX IF NOT EXISTS idx_ui_translations_status ON ui_translations(status);

ALTER TABLE ui_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read translations" ON ui_translations;
DROP POLICY IF EXISTS "Admins can manage translations" ON ui_translations;

CREATE POLICY "Public can read translations"
  ON ui_translations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage translations"
  ON ui_translations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP TRIGGER IF EXISTS update_ui_translations_updated_at ON ui_translations;

CREATE TRIGGER update_ui_translations_updated_at
  BEFORE UPDATE ON ui_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
