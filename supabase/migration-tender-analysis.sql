-- Migration: Analyse IA des appels d'offres
-- Description: Tables pour stocker les analyses IA et les réponses aux AO

-- =====================================================
-- TABLE: tender_analyses
-- Stocke les résultats d'analyse IA des documents d'AO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tender_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tender_id UUID REFERENCES public.tenders(id) ON DELETE SET NULL,
    
    -- Données de l'analyse
    analysis_data JSONB NOT NULL DEFAULT '{}',
    
    -- Métadonnées
    documents_count INTEGER DEFAULT 0,
    confidence_score INTEGER DEFAULT 0,
    match_score INTEGER DEFAULT 0,
    
    -- Statut
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_tender_analyses_user_id ON public.tender_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_tender_analyses_tender_id ON public.tender_analyses(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_analyses_created_at ON public.tender_analyses(created_at DESC);

-- =====================================================
-- TABLE: tender_responses
-- Stocke les réponses en cours de rédaction aux AO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tender_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tender_id UUID REFERENCES public.tenders(id) ON DELETE SET NULL,
    analysis_id UUID REFERENCES public.tender_analyses(id) ON DELETE SET NULL,
    
    -- Informations de base
    reference VARCHAR(100),
    title TEXT,
    
    -- État du workflow
    current_step VARCHAR(50) DEFAULT 'administrative',
    workflow_data JSONB DEFAULT '{}',
    
    -- Documents
    documents JSONB DEFAULT '[]', -- Liste des documents avec leur statut
    
    -- Notes
    notes JSONB DEFAULT '{}',
    
    -- Statut global
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'ready', 'submitted', 'archived')),
    completion_percentage INTEGER DEFAULT 0,
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_tender_responses_user_id ON public.tender_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_tender_responses_tender_id ON public.tender_responses(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_responses_status ON public.tender_responses(status);

-- =====================================================
-- TABLE: tender_response_documents
-- Stocke les documents générés/uploadés pour les réponses
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tender_response_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES public.tender_responses(id) ON DELETE CASCADE,
    
    -- Identification
    document_key VARCHAR(100) NOT NULL, -- ex: 'dc1', 'memoire_technique', etc.
    document_name TEXT NOT NULL,
    document_category VARCHAR(50) NOT NULL, -- 'administrative', 'technical', 'team', 'financial'
    
    -- Type et source
    document_type VARCHAR(20) DEFAULT 'required' CHECK (document_type IN ('required', 'optional', 'generated')),
    is_ai_generated BOOLEAN DEFAULT FALSE,
    
    -- Fichier
    file_url TEXT,
    file_size INTEGER,
    file_type VARCHAR(50),
    
    -- Contenu généré (si IA)
    generated_content TEXT,
    generation_prompt TEXT,
    
    -- Statut
    status VARCHAR(20) DEFAULT 'missing' CHECK (status IN ('missing', 'generating', 'uploaded', 'ready', 'error')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_response_documents_response_id ON public.tender_response_documents(response_id);
CREATE INDEX IF NOT EXISTS idx_response_documents_status ON public.tender_response_documents(status);

-- =====================================================
-- TABLE: company_profiles
-- Profil d'entreprise pour le calcul de compatibilité
-- =====================================================
CREATE TABLE IF NOT EXISTS public.company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Informations générales
    company_name TEXT,
    siret VARCHAR(20),
    legal_form VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    country VARCHAR(100) DEFAULT 'France',
    
    -- Contact
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website VARCHAR(255),
    
    -- Capacités
    annual_revenue DECIMAL(15,2),
    employee_count INTEGER,
    years_experience INTEGER,
    
    -- Qualifications
    sectors TEXT[], -- Secteurs d'activité
    certifications TEXT[], -- ISO, Qualibat, etc.
    qualifications TEXT[], -- Qualifications métier
    
    -- Documents standards
    kbis_url TEXT,
    kbis_valid_until DATE,
    insurance_rc_url TEXT,
    insurance_decennale_url TEXT,
    
    -- Références
    company_references JSONB DEFAULT '[]', -- Liste des références passées
    
    -- Préférences
    preferred_regions TEXT[],
    min_contract_value DECIMAL(15,2),
    max_contract_value DECIMAL(15,2),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id ON public.company_profiles(user_id);

-- =====================================================
-- RLS Policies
-- =====================================================

-- Activer RLS
ALTER TABLE public.tender_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_response_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

-- Policies pour tender_analyses
DROP POLICY IF EXISTS "Users can view own analyses" ON public.tender_analyses;
CREATE POLICY "Users can view own analyses" ON public.tender_analyses
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analyses" ON public.tender_analyses;
CREATE POLICY "Users can insert own analyses" ON public.tender_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own analyses" ON public.tender_analyses;
CREATE POLICY "Users can update own analyses" ON public.tender_analyses
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own analyses" ON public.tender_analyses;
CREATE POLICY "Users can delete own analyses" ON public.tender_analyses
    FOR DELETE USING (auth.uid() = user_id);

-- Policies pour tender_responses
DROP POLICY IF EXISTS "Users can view own responses" ON public.tender_responses;
CREATE POLICY "Users can view own responses" ON public.tender_responses
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own responses" ON public.tender_responses;
CREATE POLICY "Users can insert own responses" ON public.tender_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own responses" ON public.tender_responses;
CREATE POLICY "Users can update own responses" ON public.tender_responses
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own responses" ON public.tender_responses;
CREATE POLICY "Users can delete own responses" ON public.tender_responses
    FOR DELETE USING (auth.uid() = user_id);

-- Policies pour tender_response_documents
DROP POLICY IF EXISTS "Users can view own response documents" ON public.tender_response_documents;
CREATE POLICY "Users can view own response documents" ON public.tender_response_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tender_responses tr 
            WHERE tr.id = response_id AND tr.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own response documents" ON public.tender_response_documents;
CREATE POLICY "Users can insert own response documents" ON public.tender_response_documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tender_responses tr 
            WHERE tr.id = response_id AND tr.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own response documents" ON public.tender_response_documents;
CREATE POLICY "Users can update own response documents" ON public.tender_response_documents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.tender_responses tr 
            WHERE tr.id = response_id AND tr.user_id = auth.uid()
        )
    );

-- Policies pour company_profiles
DROP POLICY IF EXISTS "Users can view own company profile" ON public.company_profiles;
CREATE POLICY "Users can view own company profile" ON public.company_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own company profile" ON public.company_profiles;
CREATE POLICY "Users can insert own company profile" ON public.company_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own company profile" ON public.company_profiles;
CREATE POLICY "Users can update own company profile" ON public.company_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- Triggers pour updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tender_analyses_updated_at ON public.tender_analyses;
CREATE TRIGGER update_tender_analyses_updated_at
    BEFORE UPDATE ON public.tender_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tender_responses_updated_at ON public.tender_responses;
CREATE TRIGGER update_tender_responses_updated_at
    BEFORE UPDATE ON public.tender_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tender_response_documents_updated_at ON public.tender_response_documents;
CREATE TRIGGER update_tender_response_documents_updated_at
    BEFORE UPDATE ON public.tender_response_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_profiles_updated_at ON public.company_profiles;
CREATE TRIGGER update_company_profiles_updated_at
    BEFORE UPDATE ON public.company_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Commentaires
-- =====================================================
COMMENT ON TABLE public.tender_analyses IS 'Résultats des analyses IA des documents d''appels d''offres';
COMMENT ON TABLE public.tender_responses IS 'Réponses en cours aux appels d''offres';
COMMENT ON TABLE public.tender_response_documents IS 'Documents associés aux réponses AO';
COMMENT ON TABLE public.company_profiles IS 'Profils d''entreprise pour le calcul de compatibilité';
