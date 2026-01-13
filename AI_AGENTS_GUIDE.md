# Guide des Agents IA - WeWinBid

## Vue d'ensemble

Ce document décrit les **agents IA autonomes** configurés pour maintenir et améliorer WeWinBid. Ces agents permettent une gestion automatisée avec possibilité de reprise manuelle en cas de besoin.

---

## 🤖 Agents IA Configurés

### 1. Agent Landing Page (Marketing)

**Responsabilités** :
- Optimisation du SEO et du contenu marketing
- A/B testing des CTA et messages
- Analyse des taux de conversion
- Mise à jour des témoignages clients
- Optimisation des performances (Core Web Vitals)

**Fichiers surveillés** :
```
/app/page.tsx                    # Page d'accueil principale
/app/pricing/page.tsx            # Page de tarification
/components/marketing/*          # Composants marketing
/public/images/*                 # Assets visuels
/styles/globals.css              # Styles globaux
```

**Déclencheurs automatiques** :
- ✅ Détection de baisse du taux de conversion > 10%
- ✅ Score Core Web Vitals < 90
- ✅ Nouveau feedback client (sentiment négatif)
- ✅ Mise à jour concurrentielle détectée

**Actions autorisées** :
- Modifier les textes marketing (headlines, descriptions)
- Ajuster les CTA (couleurs, positions, textes)
- Optimiser les images (compression, format WebP)
- Mettre à jour les prix affichés
- Créer des variantes A/B

**Limitations** :
- ❌ Ne peut pas modifier les tarifs réels (Stripe)
- ❌ Ne peut pas supprimer de pages
- ❌ Requiert validation humaine pour changements > 20% du contenu

---

### 2. Agent Application (Product)

**Responsabilités** :
- Maintenance du code applicatif
- Résolution des bugs non-critiques
- Optimisation des requêtes SQL
- Mise à jour des dépendances
- Amélioration de l'UX basée sur analytics

**Fichiers surveillés** :
```
/app/(dashboard)/*               # Pages tableau de bord
/app/tenders/*                   # Gestion des appels d'offres
/app/api/*                       # API routes
/components/dashboard/*          # Composants métier
/components/tenders/*            # Composants AO
/lib/*                           # Utilitaires et helpers
```

**Déclencheurs automatiques** :
- ✅ Erreur détectée dans Sentry (non-critique)
- ✅ Performance API > 2s de réponse moyenne
- ✅ Dépendance avec vulnérabilité (CVSS < 7)
- ✅ Taux d'erreur utilisateur > 5%
- ✅ Requête SQL > 500ms

**Actions autorisées** :
- Corriger les bugs de type/validation
- Optimiser les composants React (memoization)
- Ajouter des index SQL suggérés
- Mettre à jour les dépendances mineures/patch
- Améliorer les messages d'erreur utilisateur
- Ajouter des tests unitaires manquants

**Limitations** :
- ❌ Ne peut pas modifier le schéma SQL (structure)
- ❌ Ne peut pas changer les politiques RLS
- ❌ Requiert validation pour modifications > 100 lignes
- ❌ Ne peut pas déployer en production sans approbation

---

## 🚨 Mécanismes de Reprise Manuelle

### Système de Notifications

**Slack/Email automatique** :
```
🔴 CRITIQUE : Intervention manuelle requise
📋 Agent : Application
🐛 Problème : Erreur base de données (taux 25%)
⏰ Détecté : 13/01/2026 14:32
🔗 Lien : https://app.wewinbid.com/admin/errors/...
```

**Déclencheurs d'alerte** :
1. **Critique** (intervention immédiate) :
   - Taux d'erreur > 20%
   - Perte de données détectée
   - Faille de sécurité (CVSS > 7)
   - Service down > 5 minutes
   - Tentatives de paiement échouées > 50%

2. **Important** (intervention < 24h) :
   - Performance dégradée > 50%
   - Bugs affectant > 10% des utilisateurs
   - Dépendance critique obsolète
   - Test de régression échoué

3. **Informatif** (revue hebdomadaire) :
   - Optimisations suggérées
   - Nouvelles features détectées chez concurrents
   - Rapports d'analyse de code

### Dashboard de Supervision

**Route admin** : `/dashboard-admin/ai-agents`

**Métriques affichées** :
```typescript
{
  landingAgent: {
    status: 'active' | 'paused' | 'error',
    lastAction: '2026-01-13T10:30:00Z',
    totalActions: 47,
    successRate: 94.5,
    pendingApprovals: 2,
    recentChanges: [
      {
        type: 'CTA_OPTIMIZATION',
        file: '/app/page.tsx',
        impact: '+12% conversion',
        timestamp: '2026-01-13T08:15:00Z',
        approved: true
      }
    ]
  },
  appAgent: {
    status: 'active' | 'paused' | 'error',
    lastAction: '2026-01-13T11:45:00Z',
    totalActions: 156,
    successRate: 98.1,
    pendingApprovals: 0,
    recentChanges: [
      {
        type: 'BUG_FIX',
        file: '/app/api/tenders/route.ts',
        impact: 'Correction validation Zod',
        timestamp: '2026-01-13T11:45:00Z',
        approved: true
      }
    ]
  }
}
```

### Commandes de Contrôle

**Pause d'urgence** :
```bash
# Arrêter tous les agents
npm run ai:pause

# Arrêter un agent spécifique
npm run ai:pause landing
npm run ai:pause app
```

**Reprise manuelle** :
```bash
# Reprendre tous les agents
npm run ai:resume

# Reprendre avec mode supervisé (validation requise)
npm run ai:resume --supervised
```

**Rollback automatique** :
```bash
# Annuler la dernière action d'un agent
npm run ai:rollback landing --last

# Annuler toutes les actions depuis une date
npm run ai:rollback app --since "2026-01-13T10:00:00Z"
```

---

## 📋 Configuration des Agents

### Variables d'environnement

Ajoutez à votre `.env.local` :

```bash
# Agents IA
AI_AGENTS_ENABLED=true
AI_LANDING_AGENT_ENABLED=true
AI_APP_AGENT_ENABLED=true

# Niveau d'autonomie (low|medium|high)
AI_AUTONOMY_LEVEL=medium

# Notifications
AI_ALERT_EMAIL=contact@wewinbid.com
AI_ALERT_SLACK_WEBHOOK=https://hooks.slack.com/services/...

# Seuils d'intervention
AI_ERROR_RATE_THRESHOLD=20
AI_PERFORMANCE_THRESHOLD=2000
AI_APPROVAL_REQUIRED_LINES=100

# OpenAI (pour analyse et suggestions)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview

# Monitoring
SENTRY_DSN=https://...
POSTHOG_API_KEY=phc_...
```

### Fichier de configuration

Créez `/ai-agents.config.ts` :

```typescript
export const aiAgentsConfig = {
  landing: {
    enabled: true,
    autonomyLevel: 'medium',
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
      contentChange: 0.2, // > 20% du contenu
      styleChange: 0.3,   // > 30% des styles
      newFeature: true
    },
    schedule: {
      analysis: '0 */6 * * *',  // Toutes les 6h
      optimization: '0 2 * * *' // 2h du matin
    }
  },
  
  app: {
    enabled: true,
    autonomyLevel: 'medium',
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
      linesChanged: 100,
      schemaChange: true,
      securityRelated: true,
      productionDeploy: true
    },
    schedule: {
      monitoring: '*/15 * * * *', // Toutes les 15min
      maintenance: '0 3 * * 0'    // Dimanche 3h
    }
  },
  
  global: {
    maxActionsPerDay: 50,
    maxChangesWithoutApproval: 10,
    rollbackWindow: '7d',
    alertChannels: ['email', 'slack'],
    reviewRequired: ['security', 'schema', 'pricing']
  }
};
```

---

## 🔄 Workflows d'Intervention

### Scénario 1 : Bug Critique Détecté

**Automatique** :
1. ✅ Agent App détecte erreur Sentry (taux 25%)
2. ✅ Analyse des logs et stack traces
3. ✅ Crée un rapport d'incident
4. ✅ **PAUSE automatique de l'agent**
5. ✅ **ALERTE CRITIQUE** envoyée à contact@wewinbid.com
6. ⏸️ Attend intervention humaine

**Manuel** :
1. 👤 Vous recevez l'alerte
2. 👤 Accédez au dashboard `/dashboard-admin/ai-agents`
3. 👤 Consultez le rapport d'incident
4. 👤 Options :
   - **Approuver le fix proposé** par l'agent
   - **Modifier et appliquer** votre propre fix
   - **Rollback** à la version stable précédente
5. 👤 Réactivez l'agent après résolution

### Scénario 2 : Optimisation Landing Page

**Automatique** :
1. ✅ Agent Landing détecte baisse conversion (-12%)
2. ✅ Analyse heatmaps et session recordings
3. ✅ Identifie problème : CTA peu visible
4. ✅ Propose 3 variantes A/B
5. ✅ Demande approbation (email + dashboard)
6. ⏸️ Attend validation

**Manuel** :
1. 👤 Vous recevez la notification
2. 👤 Consultez les 3 variantes proposées
3. 👤 Options :
   - **Approuver toutes** → A/B test automatique
   - **Approuver une seule** → Déploiement direct
   - **Rejeter** → Agent cherche autre solution
4. 👤 Suivez les résultats dans analytics

### Scénario 3 : Mise à Jour de Dépendances

**Automatique** :
1. ✅ Agent App détecte nouvelle version Next.js 14.2.1
2. ✅ Vérifie breaking changes (changelog)
3. ✅ Lance tests en environnement staging
4. ✅ Tests passent ✅
5. ✅ Crée PR GitHub "chore: update Next.js 14.2.0 → 14.2.1"
6. ⏸️ Attend merge manuel

**Manuel** :
1. 👤 Vous recevez notification GitHub PR
2. 👤 Consultez les changements
3. 👤 Options :
   - **Merge** → Déploiement automatique en staging
   - **Commentez** → Agent ajuste
   - **Close** → Agent ignore cette version

---

## 📊 Métriques de Performance

### KPIs des Agents

**Landing Agent** :
- Taux de conversion (baseline vs optimisé)
- Score SEO (0-100)
- Core Web Vitals (LCP, FID, CLS)
- Taux de rebond
- Temps sur la page

**App Agent** :
- Taux d'erreur (%)
- Temps de réponse API (ms)
- Couverture de tests (%)
- Dette technique (heures estimées)
- Satisfaction utilisateur (NPS)

### Rapports Hebdomadaires

Envoyés chaque lundi à contact@wewinbid.com :

```
📈 Rapport Hebdomadaire Agents IA - Semaine 2, 2026

🎨 LANDING AGENT
- Actions : 47
- Succès : 94.5%
- Impact conversion : +8.2%
- Impact SEO : +12 positions moyennes
- Interventions manuelles : 2

💻 APP AGENT
- Actions : 156
- Succès : 98.1%
- Bugs résolus : 23
- Tests ajoutés : 67
- Performance améliorée : +15%
- Interventions manuelles : 1

⚠️ ALERTES
- Critiques : 0
- Importantes : 3 (toutes résolues)
- Informatives : 12

📋 ACTIONS RECOMMANDÉES
1. Revoir politique RLS buyers (agent bloqué 2x)
2. Considérer migration Postgres 16
3. Optimiser requêtes dashboard-admin (5 suggestions)
```

---

## 🛡️ Sécurité et Limites

### Règles de Sécurité

**L'agent NE PEUT JAMAIS** :
- ❌ Accéder aux clés API/secrets en production
- ❌ Modifier les politiques RLS sans approbation
- ❌ Supprimer des données utilisateur
- ❌ Changer les tarifs Stripe
- ❌ Désactiver l'authentification
- ❌ Modifier les permissions admin
- ❌ Exécuter du code arbitraire en production

**Audit Trail** :
Toutes les actions sont loggées dans `ai_actions` :

```sql
CREATE TABLE ai_actions (
  id UUID PRIMARY KEY,
  agent_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  files_modified TEXT[],
  lines_changed INTEGER,
  impact_score DECIMAL,
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rollback_available BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Environnements

**Staging** (bac à sable agent) :
- Agents testent toutes modifications ici d'abord
- Reset quotidien à partir de production
- Aucun impact utilisateurs réels

**Production** :
- Agents en mode supervisé uniquement
- Toute modification > seuil → approbation requise
- Rollback automatique si erreurs détectées

---

## 🚀 Activation des Agents

### Installation

```bash
# Installer les dépendances agents
npm install @langchain/core @langchain/openai zod-ai

# Configuration initiale
npm run ai:setup

# Vérifier la configuration
npm run ai:test
```

### Démarrage

```bash
# Démarrer en mode supervisé (recommandé)
npm run ai:start --supervised

# Démarrer en mode autonome (prudence!)
npm run ai:start --autonomous

# Démarrer un seul agent
npm run ai:start landing --supervised
```

### Monitoring en Temps Réel

```bash
# Stream des logs agents
npm run ai:logs --follow

# Dashboard CLI
npm run ai:dashboard

# Statistiques
npm run ai:stats
```

---

## 📞 Support et Escalade

### Contacts d'Urgence

**Email** : contact@wewinbid.com
**Slack** : #wewinbid-agents-alerts
**Téléphone** : +33 X XX XX XX XX (urgences seulement)

### Escalade Automatique

**Niveau 1** : Email + notification dashboard
**Niveau 2** : Email + SMS + Slack
**Niveau 3** : Appel téléphonique + pause automatique de tous les agents

### Documentation Technique

- 📖 Guide complet : `/docs/ai-agents/README.md`
- 🔧 API Reference : `/docs/ai-agents/api.md`
- 🐛 Troubleshooting : `/docs/ai-agents/troubleshooting.md`
- 📊 Analytics : `/docs/ai-agents/analytics.md`

---

## ✅ Checklist de Mise en Production

Avant d'activer les agents en production :

- [ ] Variables d'environnement configurées
- [ ] Compte admin `contact@wewinbid.com` créé
- [ ] Notifications Slack/Email testées
- [ ] Dashboard `/dashboard-admin/ai-agents` accessible
- [ ] Environnement staging configuré
- [ ] Commandes de pause/rollback testées
- [ ] Audit trail `ai_actions` table créée
- [ ] Seuils d'alerte validés
- [ ] Tests A/B framework configuré (landing)
- [ ] Sentry + PostHog intégrés (app)
- [ ] Backup automatique configuré
- [ ] Documentation lue et comprise
- [ ] Runbook d'urgence imprimé/accessible

---

**Dernière mise à jour** : 13 janvier 2026
**Contact** : contact@wewinbid.com
