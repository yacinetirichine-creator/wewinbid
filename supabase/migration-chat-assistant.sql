-- ============================================================================
-- Feature #8: Chat IA Assistant
-- ============================================================================
-- Description: AI chatbot for tender assistance and Q&A support
-- Features: Tender analysis, intelligent Q&A, document suggestions, conversation history
-- Date: 2026-01-17
-- ============================================================================

-- Cleanup section for idempotent migration
DROP FUNCTION IF EXISTS create_default_chat_session() CASCADE;
DROP FUNCTION IF EXISTS get_user_chat_sessions(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_session_messages(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_tender_chat_context(UUID) CASCADE;

-- Drop tables with CASCADE to automatically drop all dependent objects
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS chat_context CASCADE;

-- ============================================================================
-- Table: chat_sessions
-- Purpose: Store chat conversation sessions
-- ============================================================================

CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Session metadata
    title TEXT NOT NULL DEFAULT 'New conversation',
    session_type TEXT DEFAULT 'general' CHECK (session_type IN ('general', 'tender_analysis', 'document_help', 'qa')),
    
    -- Related tender (if applicable)
    tender_id UUID, -- Nullable, will add FK constraint if tenders table exists
    
    -- Session status
    is_active BOOLEAN DEFAULT true,
    message_count INTEGER DEFAULT 0,
    
    -- AI settings for this session
    ai_model TEXT DEFAULT 'gpt-4' CHECK (ai_model IN ('gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet')),
    temperature NUMERIC(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    
    -- Session summary (AI-generated)
    summary TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_tender_id ON chat_sessions(tender_id) WHERE tender_id IS NOT NULL;
CREATE INDEX idx_chat_sessions_active ON chat_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_chat_sessions_last_message ON chat_sessions(user_id, last_message_at DESC);

-- Add FK constraint to tenders if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenders') THEN
        ALTER TABLE chat_sessions ADD CONSTRAINT fk_chat_sessions_tender 
            FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- Table: chat_messages
-- Purpose: Store individual chat messages
-- ============================================================================

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    
    -- Message details
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    
    -- AI response metadata
    model_used TEXT,
    tokens_used INTEGER,
    response_time_ms INTEGER,
    
    -- Message context
    context_used JSONB DEFAULT '[]'::jsonb, -- Array of document IDs, tender data used
    confidence_score NUMERIC(3,2), -- AI confidence in response (0-1)
    
    -- Citations and sources
    sources JSONB DEFAULT '[]'::jsonb, -- [{type, id, title, excerpt}]
    
    -- Feedback
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    user_feedback TEXT,
    is_helpful BOOLEAN,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(session_id, created_at);
CREATE INDEX idx_chat_messages_role ON chat_messages(session_id, role);

-- ============================================================================
-- Table: chat_context
-- Purpose: Store tender analysis and context for AI conversations
-- ============================================================================

CREATE TABLE chat_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    
    -- Context type
    context_type TEXT NOT NULL CHECK (context_type IN ('tender_summary', 'document_analysis', 'qa_reference', 'user_preference')),
    
    -- Context data
    tender_id UUID, -- Nullable
    document_id UUID, -- Nullable
    
    -- Analyzed content
    title TEXT,
    content_summary TEXT,
    key_points JSONB DEFAULT '[]'::jsonb, -- Array of key insights
    entities JSONB DEFAULT '{}'::jsonb, -- {companies, dates, requirements, etc.}
    
    -- AI analysis
    analysis_result JSONB DEFAULT '{}'::jsonb, -- Full AI analysis output
    relevance_score NUMERIC(3,2), -- How relevant to current conversation (0-1)
    
    -- Usage tracking
    times_referenced INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_context_session_id ON chat_context(session_id);
CREATE INDEX idx_chat_context_tender_id ON chat_context(tender_id) WHERE tender_id IS NOT NULL;
CREATE INDEX idx_chat_context_type ON chat_context(context_type);
CREATE INDEX idx_chat_context_relevance ON chat_context(session_id, relevance_score DESC);

-- Add FK constraints if tables exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenders') THEN
        ALTER TABLE chat_context ADD CONSTRAINT fk_chat_context_tender 
            FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
        ALTER TABLE chat_context ADD CONSTRAINT fk_chat_context_document 
            FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- Helper Function: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Triggers: Auto-update timestamps
-- ============================================================================

CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_context_updated_at
    BEFORE UPDATE ON chat_context
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Trigger: Update session last_message_at when message added
-- ============================================================================

CREATE OR REPLACE FUNCTION update_session_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions
    SET 
        last_message_at = NEW.created_at,
        message_count = message_count + 1,
        updated_at = NOW()
    WHERE id = NEW.session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_session_on_new_message
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_session_on_message();

-- ============================================================================
-- Trigger: Auto-create first chat session for new users
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_chat_session()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO chat_sessions (user_id, title, session_type)
    VALUES (NEW.id, 'Welcome! How can I help you with tenders today?', 'general')
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_chat_session_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_chat_session();

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_context ENABLE ROW LEVEL SECURITY;

-- Chat sessions policies
CREATE POLICY "Users can view their own chat sessions"
    ON chat_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat sessions"
    ON chat_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions"
    ON chat_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions"
    ON chat_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view messages from their sessions"
    ON chat_messages FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM chat_sessions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their sessions"
    ON chat_messages FOR INSERT
    WITH CHECK (
        session_id IN (
            SELECT id FROM chat_sessions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update messages in their sessions"
    ON chat_messages FOR UPDATE
    USING (
        session_id IN (
            SELECT id FROM chat_sessions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete messages in their sessions"
    ON chat_messages FOR DELETE
    USING (
        session_id IN (
            SELECT id FROM chat_sessions WHERE user_id = auth.uid()
        )
    );

-- Chat context policies
CREATE POLICY "Users can view context from their sessions"
    ON chat_context FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM chat_sessions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage context in their sessions"
    ON chat_context FOR ALL
    USING (
        session_id IN (
            SELECT id FROM chat_sessions WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get user's chat sessions with latest message preview
CREATE OR REPLACE FUNCTION get_user_chat_sessions(
    user_id_param UUID,
    limit_param INTEGER DEFAULT 50
)
RETURNS TABLE (
    session_id UUID,
    title TEXT,
    session_type TEXT,
    tender_id UUID,
    message_count INTEGER,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id,
        cs.title,
        cs.session_type,
        cs.tender_id,
        cs.message_count,
        cs.last_message_at,
        (
            SELECT content
            FROM chat_messages cm
            WHERE cm.session_id = cs.id
            ORDER BY cm.created_at DESC
            LIMIT 1
        ) AS last_message_preview,
        cs.is_active,
        cs.created_at
    FROM chat_sessions cs
    WHERE cs.user_id = user_id_param
    ORDER BY cs.last_message_at DESC
    LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get messages for a specific session
CREATE OR REPLACE FUNCTION get_session_messages(
    session_id_param UUID,
    limit_param INTEGER DEFAULT 100
)
RETURNS TABLE (
    message_id UUID,
    role TEXT,
    content TEXT,
    model_used TEXT,
    sources JSONB,
    user_rating INTEGER,
    is_helpful BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.id,
        cm.role,
        cm.content,
        cm.model_used,
        cm.sources,
        cm.user_rating,
        cm.is_helpful,
        cm.created_at
    FROM chat_messages cm
    WHERE cm.session_id = session_id_param
    ORDER BY cm.created_at ASC
    LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get tender analysis context for AI
CREATE OR REPLACE FUNCTION get_tender_chat_context(
    tender_id_param UUID
)
RETURNS TABLE (
    context_summary TEXT,
    key_points JSONB,
    analysis_result JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.content_summary,
        cc.key_points,
        cc.analysis_result
    FROM chat_context cc
    WHERE cc.tender_id = tender_id_param
        AND cc.context_type = 'tender_summary'
    ORDER BY cc.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE chat_sessions IS 'AI chat conversation sessions for tender assistance';
COMMENT ON TABLE chat_messages IS 'Individual messages in chat conversations';
COMMENT ON TABLE chat_context IS 'Analyzed tender and document context for AI conversations';

COMMENT ON FUNCTION get_user_chat_sessions IS 'Get user chat sessions with message previews';
COMMENT ON FUNCTION get_session_messages IS 'Get all messages for a specific chat session';
COMMENT ON FUNCTION get_tender_chat_context IS 'Get AI analysis context for a specific tender';
