#!/bin/bash

# Script d'installation et configuration des agents IA
# WeWinBid - 13 janvier 2026

set -e

echo "🤖 Configuration des Agents IA WeWinBid"
echo "========================================"
echo ""

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de log
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Vérifier Node.js
log_info "Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    log_error "Node.js n'est pas installé"
    exit 1
fi
NODE_VERSION=$(node -v)
log_success "Node.js installé: $NODE_VERSION"

# Vérifier npm
log_info "Vérification de npm..."
if ! command -v npm &> /dev/null; then
    log_error "npm n'est pas installé"
    exit 1
fi
NPM_VERSION=$(npm -v)
log_success "npm installé: $NPM_VERSION"

# Installer les dépendances agents IA
log_info "Installation des dépendances agents IA..."
npm install --save @langchain/core@latest \
    @langchain/openai@latest \
    zod-ai@latest \
    @anthropic-ai/sdk@latest \
    eventsource-parser@latest

log_success "Dépendances installées"

# Créer les répertoires nécessaires
log_info "Création de la structure de fichiers..."
mkdir -p lib/ai-agents/{landing,app,shared}
mkdir -p lib/ai-agents/utils
mkdir -p lib/ai-agents/prompts
mkdir -p app/api/ai-agents
mkdir -p logs/ai-agents

log_success "Structure créée"

# Créer le fichier de configuration
log_info "Création du fichier de configuration..."
cat > ai-agents.config.ts << 'EOF'
export const aiAgentsConfig = {
  landing: {
    enabled: process.env.AI_LANDING_AGENT_ENABLED === 'true',
    autonomyLevel: (process.env.AI_AUTONOMY_LEVEL || 'medium') as 'low' | 'medium' | 'high',
    allowedActions: [
      'optimize_seo',
      'update_cta',
      'compress_images',
      'ab_testing',
      'update_testimonials'
    ],
    restrictedActions: [
      'modify_pricing',
      'delete_pages',
      'change_branding'
    ],
    approvalRequired: {
      contentChange: 0.2,
      styleChange: 0.3,
      newFeature: true
    },
    schedule: {
      analysis: '0 */6 * * *',
      optimization: '0 2 * * *'
    }
  },
  
  app: {
    enabled: process.env.AI_APP_AGENT_ENABLED === 'true',
    autonomyLevel: (process.env.AI_AUTONOMY_LEVEL || 'medium') as 'low' | 'medium' | 'high',
    allowedActions: [
      'fix_bug',
      'optimize_query',
      'update_dependencies',
      'add_tests',
      'improve_error_messages'
    ],
    restrictedActions: [
      'modify_schema',
      'change_rls_policies',
      'delete_data',
      'modify_auth'
    ],
    approvalRequired: {
      linesChanged: parseInt(process.env.AI_APPROVAL_REQUIRED_LINES || '100'),
      schemaChange: true,
      securityRelated: true,
      productionDeploy: true
    },
    schedule: {
      monitoring: '*/15 * * * *',
      maintenance: '0 3 * * 0'
    }
  },
  
  global: {
    maxActionsPerDay: 50,
    maxChangesWithoutApproval: 10,
    rollbackWindow: '7d',
    alertChannels: ['email', 'slack'],
    reviewRequired: ['security', 'schema', 'pricing'],
    adminEmail: process.env.AI_ALERT_EMAIL || 'contact@wewinbid.com'
  }
};

export type AIAgentConfig = typeof aiAgentsConfig;
EOF

log_success "Configuration créée"

# Créer les scripts npm
log_info "Ajout des scripts npm..."

# Lire le package.json actuel
if [ -f "package.json" ]; then
    # Utiliser Node.js pour modifier le package.json
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    pkg.scripts = pkg.scripts || {};
    pkg.scripts['ai:setup'] = 'node scripts/ai-agents-setup.js';
    pkg.scripts['ai:start'] = 'node scripts/ai-agents-start.js';
    pkg.scripts['ai:pause'] = 'node scripts/ai-agents-pause.js';
    pkg.scripts['ai:resume'] = 'node scripts/ai-agents-resume.js';
    pkg.scripts['ai:rollback'] = 'node scripts/ai-agents-rollback.js';
    pkg.scripts['ai:logs'] = 'tail -f logs/ai-agents/*.log';
    pkg.scripts['ai:stats'] = 'node scripts/ai-agents-stats.js';
    pkg.scripts['ai:test'] = 'node scripts/ai-agents-test.js';
    
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    log_success "Scripts npm ajoutés"
else
    log_error "package.json introuvable"
    exit 1
fi

# Créer la table SQL pour l'audit
log_info "Création du script SQL pour l'audit trail..."
cat > supabase/migration-ai-agents.sql << 'EOF'
-- Migration: AI Agents Audit Trail
-- Date: 2026-01-13
-- Description: Table pour tracker toutes les actions des agents IA

CREATE TABLE IF NOT EXISTS ai_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL CHECK (agent_name IN ('landing', 'app')),
  action_type TEXT NOT NULL,
  files_modified TEXT[],
  lines_changed INTEGER,
  impact_score DECIMAL CHECK (impact_score >= 0 AND impact_score <= 1),
  description TEXT,
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rollback_available BOOLEAN DEFAULT true,
  rollback_executed BOOLEAN DEFAULT false,
  rollback_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_ai_actions_agent ON ai_actions(agent_name);
CREATE INDEX IF NOT EXISTS idx_ai_actions_approved ON ai_actions(approved);
CREATE INDEX IF NOT EXISTS idx_ai_actions_created ON ai_actions(created_at DESC);

-- RLS policies
ALTER TABLE ai_actions ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all ai_actions"
  ON ai_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seuls les admins peuvent approuver
CREATE POLICY "Admins can approve ai_actions"
  ON ai_actions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Table pour les configurations agents
CREATE TABLE IF NOT EXISTS ai_agent_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL UNIQUE CHECK (agent_name IN ('landing', 'app')),
  enabled BOOLEAN DEFAULT true,
  autonomy_level TEXT DEFAULT 'medium' CHECK (autonomy_level IN ('low', 'medium', 'high')),
  allowed_actions TEXT[],
  restricted_actions TEXT[],
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS pour les configs
ALTER TABLE ai_agent_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ai_agent_configs"
  ON ai_agent_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insérer les configs par défaut
INSERT INTO ai_agent_configs (agent_name, enabled, autonomy_level, allowed_actions, restricted_actions, config)
VALUES 
  ('landing', true, 'medium', 
   ARRAY['optimize_seo', 'update_cta', 'compress_images', 'ab_testing', 'update_testimonials'],
   ARRAY['modify_pricing', 'delete_pages', 'change_branding'],
   '{"maxActionsPerDay": 50, "approvalThreshold": 0.2}'::jsonb),
  ('app', true, 'medium',
   ARRAY['fix_bug', 'optimize_query', 'update_dependencies', 'add_tests', 'improve_error_messages'],
   ARRAY['modify_schema', 'change_rls_policies', 'delete_data', 'modify_auth'],
   '{"maxActionsPerDay": 50, "approvalThreshold": 100}'::jsonb)
ON CONFLICT (agent_name) DO NOTHING;

COMMENT ON TABLE ai_actions IS 'Audit trail de toutes les actions des agents IA';
COMMENT ON TABLE ai_agent_configs IS 'Configuration des agents IA (landing, app)';
EOF

log_success "Script SQL créé"

# Créer le fichier .env.example avec les nouvelles variables
log_info "Mise à jour de .env.example..."
cat >> .env.example << 'EOF'

# ==============================================
# AGENTS IA
# ==============================================
AI_AGENTS_ENABLED=true
AI_LANDING_AGENT_ENABLED=true
AI_APP_AGENT_ENABLED=true
AI_AUTONOMY_LEVEL=medium
AI_ALERT_EMAIL=contact@wewinbid.com
AI_ALERT_SLACK_WEBHOOK=
AI_ERROR_RATE_THRESHOLD=20
AI_PERFORMANCE_THRESHOLD=2000
AI_APPROVAL_REQUIRED_LINES=100
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4-turbo-preview
EOF

log_success ".env.example mis à jour"

# Vérifier les variables d'environnement
log_info "Vérification de .env.local..."
if [ ! -f ".env.local" ]; then
    log_warning ".env.local n'existe pas. Copie depuis .env.example..."
    cp .env.example .env.local
    log_success ".env.local créé"
else
    log_warning ".env.local existe déjà. Ajoutez manuellement les variables AI_* si besoin"
fi

# Créer un script de test simple
log_info "Création du script de test..."
cat > scripts/ai-agents-test.js << 'EOF'
#!/usr/bin/env node

console.log('🧪 Test de configuration des agents IA\n');

const requiredVars = [
  'AI_AGENTS_ENABLED',
  'AI_LANDING_AGENT_ENABLED',
  'AI_APP_AGENT_ENABLED',
  'AI_AUTONOMY_LEVEL',
  'AI_ALERT_EMAIL'
];

let allGood = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✓ ${varName}: ${value}`);
  } else {
    console.log(`✗ ${varName}: NON DÉFINI`);
    allGood = false;
  }
});

console.log('');

if (allGood) {
  console.log('✅ Configuration valide!');
  process.exit(0);
} else {
  console.log('❌ Configuration incomplète. Vérifiez .env.local');
  process.exit(1);
}
EOF

chmod +x scripts/ai-agents-test.js
log_success "Script de test créé"

# Résumé final
echo ""
echo "========================================"
log_success "Installation terminée!"
echo "========================================"
echo ""
log_info "Prochaines étapes:"
echo ""
echo "  1. Configurez les variables d'environnement dans .env.local:"
echo "     - AI_ALERT_EMAIL=contact@wewinbid.com"
echo "     - OPENAI_API_KEY=sk-..."
echo "     - AI_ALERT_SLACK_WEBHOOK=https://hooks.slack.com/..."
echo ""
echo "  2. Exécutez la migration SQL:"
echo "     supabase/migration-ai-agents.sql"
echo ""
echo "  3. Testez la configuration:"
echo "     npm run ai:test"
echo ""
echo "  4. Démarrez les agents en mode supervisé:"
echo "     npm run ai:start -- --supervised"
echo ""
echo "  5. Consultez le dashboard admin:"
echo "     http://localhost:3000/dashboard-admin/ai-agents"
echo ""
log_warning "⚠️  IMPORTANT: Lisez AI_AGENTS_GUIDE.md avant d'activer les agents"
echo ""
