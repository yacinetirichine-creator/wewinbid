-- Migration: Response Templates System
-- Version: 1.0.0
-- Description: Templates de réponses réutilisables

-- Table des templates de réponse
CREATE TABLE IF NOT EXISTS response_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Informations de base
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    
    -- Contenu
    content TEXT NOT NULL,
    content_html TEXT,
    
    -- Variables (JSON avec les placeholders)
    variables JSONB DEFAULT '[]'::jsonb,
    
    -- Tags et recherche
    tags TEXT[] DEFAULT '{}',
    keywords TEXT[],
    
    -- Métadonnées
    is_public BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des sections de template (pour templates composites)
CREATE TABLE IF NOT EXISTS template_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES response_templates(id) ON DELETE CASCADE,
    
    -- Informations
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    
    -- Options
    is_optional BOOLEAN DEFAULT false,
    is_default_included BOOLEAN DEFAULT true,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des catégories de templates
CREATE TABLE IF NOT EXISTS template_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#3b82f6',
    icon VARCHAR(50) DEFAULT 'document',
    order_index INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des favoris de templates
CREATE TABLE IF NOT EXISTS template_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES response_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, template_id)
);

-- Table de l'historique d'utilisation
CREATE TABLE IF NOT EXISTS template_usage_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES response_templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tender_id UUID,
    
    -- Variables utilisées
    variables_used JSONB,
    
    -- Métadonnées
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_response_templates_org ON response_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_response_templates_category ON response_templates(category);
CREATE INDEX IF NOT EXISTS idx_response_templates_tags ON response_templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_template_sections_template ON template_sections(template_id);
CREATE INDEX IF NOT EXISTS idx_template_favorites_user ON template_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_history_template ON template_usage_history(template_id);

-- Fonction pour mettre à jour le compteur d'utilisation
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE response_templates 
    SET usage_count = usage_count + 1, 
        last_used_at = NOW()
    WHERE id = NEW.template_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour incrémenter automatiquement
DROP TRIGGER IF EXISTS trigger_increment_template_usage ON template_usage_history;
CREATE TRIGGER trigger_increment_template_usage
    AFTER INSERT ON template_usage_history
    FOR EACH ROW
    EXECUTE FUNCTION increment_template_usage();

-- RLS Policies
ALTER TABLE response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage_history ENABLE ROW LEVEL SECURITY;

-- Policies pour response_templates
CREATE POLICY "Users can view templates" ON response_templates
    FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can insert templates" ON response_templates
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own templates" ON response_templates
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own templates" ON response_templates
    FOR DELETE USING (created_by = auth.uid());

-- Policies pour template_sections
CREATE POLICY "Users can view template sections" ON template_sections
    FOR SELECT USING (true);

CREATE POLICY "Users can manage template sections" ON template_sections
    FOR ALL USING (true);

-- Policies pour template_categories
CREATE POLICY "Users can view categories" ON template_categories
    FOR SELECT USING (true);

CREATE POLICY "Users can manage categories" ON template_categories
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Policies pour template_favorites
CREATE POLICY "Users can manage own favorites" ON template_favorites
    FOR ALL USING (user_id = auth.uid());

-- Policies pour template_usage_history
CREATE POLICY "Users can view usage history" ON template_usage_history
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert usage history" ON template_usage_history
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Insert des catégories par défaut
INSERT INTO template_categories (organization_id, name, description, color, icon, order_index) VALUES
(NULL, 'Technique', 'Sections techniques et méthodologiques', '#3b82f6', 'cog', 1),
(NULL, 'Financier', 'Éléments financiers et budgétaires', '#10b981', 'currency-euro', 2),
(NULL, 'Administratif', 'Documents administratifs et juridiques', '#8b5cf6', 'document', 3),
(NULL, 'Commercial', 'Argumentaires commerciaux', '#f59e0b', 'shopping-bag', 4),
(NULL, 'Références', 'Expériences et références clients', '#ec4899', 'star', 5)
ON CONFLICT DO NOTHING;

-- Insert des templates par défaut
INSERT INTO response_templates (organization_id, name, description, category, content, variables, tags, is_public) VALUES
(NULL, 'Présentation entreprise standard', 'Template de présentation générale de l''entreprise', 'commercial', 
'# Présentation de {{company_name}}

## Notre entreprise

{{company_name}} est une entreprise spécialisée dans {{domain}} depuis {{years_experience}} ans. 

Notre expertise nous permet d''accompagner nos clients dans {{services}}.

## Nos valeurs

- Excellence opérationnelle
- Innovation continue
- Engagement client
- Développement durable

## Chiffres clés

- **{{employees_count}}** collaborateurs
- **{{revenue}}** de chiffre d''affaires
- **{{clients_count}}** clients satisfaits
- **{{certifications}}** certifications obtenues

## Contact

Pour plus d''informations, n''hésitez pas à nous contacter.',
'[{"name": "company_name", "label": "Nom de l''entreprise", "type": "text", "default": ""}, {"name": "domain", "label": "Domaine d''activité", "type": "text", "default": ""}, {"name": "years_experience", "label": "Années d''expérience", "type": "number", "default": "10"}, {"name": "services", "label": "Services proposés", "type": "textarea", "default": ""}, {"name": "employees_count", "label": "Nombre d''employés", "type": "number", "default": ""}, {"name": "revenue", "label": "Chiffre d''affaires", "type": "text", "default": ""}, {"name": "clients_count", "label": "Nombre de clients", "type": "number", "default": ""}, {"name": "certifications", "label": "Certifications", "type": "text", "default": ""}]',
ARRAY['présentation', 'entreprise', 'introduction'],
true),

(NULL, 'Méthodologie projet', 'Template de présentation de méthodologie', 'technique',
'# Méthodologie de projet

## 1. Phase de cadrage

Durée estimée : {{cadrage_duration}}

- Analyse des besoins
- Définition du périmètre
- Identification des parties prenantes
- Validation du planning

### Livrables
- Note de cadrage
- Planning prévisionnel

## 2. Phase de conception

Durée estimée : {{conception_duration}}

- Étude technique détaillée
- Spécifications fonctionnelles
- Architecture solution
- Validation technique

### Livrables
- Dossier de spécifications
- Architecture technique

## 3. Phase de réalisation

Durée estimée : {{realisation_duration}}

- Développement/Mise en œuvre
- Tests unitaires
- Documentation technique
- Recette interne

### Livrables
- Solution opérationnelle
- Documentation technique

## 4. Phase de déploiement

Durée estimée : {{deploiement_duration}}

- Formation des utilisateurs
- Mise en production
- Support au démarrage
- Transfert de compétences

### Livrables
- Guide utilisateur
- PV de recette

## 5. Garantie et maintenance

{{garantie_description}}',
'[{"name": "cadrage_duration", "label": "Durée du cadrage", "type": "text", "default": "2 semaines"}, {"name": "conception_duration", "label": "Durée de la conception", "type": "text", "default": "3 semaines"}, {"name": "realisation_duration", "label": "Durée de la réalisation", "type": "text", "default": "8 semaines"}, {"name": "deploiement_duration", "label": "Durée du déploiement", "type": "text", "default": "2 semaines"}, {"name": "garantie_description", "label": "Description garantie", "type": "textarea", "default": "Garantie de 12 mois incluse avec support réactif."}]',
ARRAY['méthodologie', 'projet', 'phases'],
true),

(NULL, 'Références clients', 'Template pour présenter des références', 'références',
'# Références similaires

## {{client_name_1}}

**Secteur :** {{client_sector_1}}
**Projet :** {{project_name_1}}
**Période :** {{project_period_1}}

### Contexte
{{project_context_1}}

### Solution mise en œuvre
{{project_solution_1}}

### Résultats obtenus
{{project_results_1}}

---

## {{client_name_2}}

**Secteur :** {{client_sector_2}}
**Projet :** {{project_name_2}}
**Période :** {{project_period_2}}

### Contexte
{{project_context_2}}

### Solution mise en œuvre
{{project_solution_2}}

### Résultats obtenus
{{project_results_2}}',
'[{"name": "client_name_1", "label": "Nom client 1", "type": "text", "default": ""}, {"name": "client_sector_1", "label": "Secteur client 1", "type": "text", "default": ""}, {"name": "project_name_1", "label": "Nom projet 1", "type": "text", "default": ""}, {"name": "project_period_1", "label": "Période projet 1", "type": "text", "default": ""}, {"name": "project_context_1", "label": "Contexte projet 1", "type": "textarea", "default": ""}, {"name": "project_solution_1", "label": "Solution projet 1", "type": "textarea", "default": ""}, {"name": "project_results_1", "label": "Résultats projet 1", "type": "textarea", "default": ""}, {"name": "client_name_2", "label": "Nom client 2", "type": "text", "default": ""}, {"name": "client_sector_2", "label": "Secteur client 2", "type": "text", "default": ""}, {"name": "project_name_2", "label": "Nom projet 2", "type": "text", "default": ""}, {"name": "project_period_2", "label": "Période projet 2", "type": "text", "default": ""}, {"name": "project_context_2", "label": "Contexte projet 2", "type": "textarea", "default": ""}, {"name": "project_solution_2", "label": "Solution projet 2", "type": "textarea", "default": ""}, {"name": "project_results_2", "label": "Résultats projet 2", "type": "textarea", "default": ""}]',
ARRAY['références', 'clients', 'expériences'],
true)
ON CONFLICT DO NOTHING;
