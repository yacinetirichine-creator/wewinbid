# Guide de Configuration des Dashboards Client & Admin

## Vue d'ensemble

WeWinBid dispose maintenant de **deux tableaux de bord** distincts avec des métriques adaptées :

### 1. Dashboard Client (`/dashboard-client`)
Interface CRM pour les utilisateurs normaux avec métriques personnalisées extraites des appels d'offres.

### 2. Dashboard Admin (`/dashboard-admin`)
Vue globale de la plateforme réservée aux administrateurs avec métriques business.

---

## Installation et Configuration

### Étape 1 : Exécuter la migration SQL

Connectez-vous à votre console Supabase et exécutez le fichier de migration :

```bash
# Chemin du fichier de migration
supabase/migration-roles-buyers.sql
```

Cette migration va :
- ✅ Ajouter le champ `role` dans la table `profiles` (`user` ou `admin`)
- ✅ Créer la table `buyers` pour les clients des appels d'offres
- ✅ Ajouter les champs `subscription_plan` et `subscription_status` aux companies
- ✅ Créer les index et politiques RLS appropriées

### Étape 2 : Créer votre premier compte admin

Dans la console Supabase SQL Editor, exécutez :

```sql
-- Remplacez par votre email
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'votre-email-admin@example.com';
```

### Étape 3 : Accéder aux dashboards

**Dashboard Client** (utilisateurs normaux) :
```
http://localhost:3000/dashboard-client
```

**Dashboard Admin** (administrateurs uniquement) :
```
http://localhost:3000/dashboard-admin
```

---

## Dashboard Client - Métriques disponibles

### 📊 Métriques principales

| Métrique | Description | Source |
|----------|-------------|--------|
| **Total des réponses** | Nombre total d'appels d'offres | `tenders.count()` |
| **Appels d'offres gagnés** | Nombre d'AO avec status `WON` | `tenders.filter(status='WON')` |
| **Clients actifs** | Nombre de buyers uniques | `buyers.distinct(name)` |
| **CA gagné** | Valeur totale des AO gagnés | `tenders.filter(status='WON').sum(estimated_value)` |

### 🎯 Métriques secondaires

- **Taux de conversion** : `(AO gagnés / AO soumis) * 100`
- **Échéances à venir** : AO avec deadline dans les 30 prochains jours
- **Réponses soumises** : AO avec status `SUBMITTED`
- **Appels d'offres urgents** : Deadline < 7 jours (alerte rouge)

### 📈 Répartition par statut

- Brouillons (`DRAFT`)
- En analyse (`ANALYSIS`)
- En cours (`IN_PROGRESS`)
- En révision (`REVIEW`)
- Soumis (`SUBMITTED`)
- Gagnés (`WON`)
- Perdus (`LOST`)
- Abandonnés (`ABANDONED`)

### 📋 Tableau des appels d'offres récents

Fonctionnalités :
- ✅ Tri par date limite, valeur, ou création
- ✅ Badges de statut colorés
- ✅ Indicateur d'urgence (J-X)
- ✅ Clic pour voir le détail
- ✅ Affichage du client (buyer)

---

## Dashboard Admin - Métriques disponibles

### 💼 Métriques globales

| Métrique | Description | Calcul |
|----------|-------------|--------|
| **Entreprises clientes** | Nombre total de companies | `companies.count()` |
| **AO traités** | Total des appels d'offres | `tenders.count()` |
| **CA généré** | Valeur des AO gagnés | `tenders.filter(status='WON').sum(estimated_value)` |
| **Taux de conversion** | Succès global | `(AO gagnés / AO soumis) * 100` |

### 💰 Revenus récurrents

- **MRR** (Monthly Recurring Revenue) :
  - Pro : €49/mois × nombre d'abonnés Pro
  - Business : €149/mois × nombre d'abonnés Business
  
- **ARR** (Annual Recurring Revenue) :
  - ARR = MRR × 12

### 📊 Répartition des abonnements

Vue détaillée :
- **Plan Free** : Nombre + pourcentage
- **Plan Pro** : Nombre + pourcentage (€49/mois)
- **Plan Business** : Nombre + pourcentage (€149/mois)

### 🏆 Classements

**Top 5 Secteurs** :
- Liste des secteurs d'activité les plus représentés
- Nombre d'AO par secteur

**Top 5 Pays** :
- Répartition géographique
- Nombre d'AO par pays

**Top 10 Entreprises** :
- Classement par nombre d'AO
- Plan d'abonnement
- CA généré

### 📈 Évolution mensuelle (6 mois)

Tableau avec :
- Nouvelles entreprises inscrites
- Appels d'offres créés
- CA généré

---

## Système de Rôles

### Configuration des rôles

**Rôle User** (par défaut) :
- Accès à `/dashboard-client`
- Accès à `/api/metrics/client`
- Voit uniquement ses propres données

**Rôle Admin** :
- Accès à `/dashboard-admin`
- Accès à `/api/metrics/admin`
- Voit toutes les données de la plateforme
- Redirigé automatiquement depuis `/dashboard-client`

### Middleware de protection

Le middleware (`src/middleware.ts`) protège automatiquement :
- ✅ Routes admin (`/dashboard-admin`, `/api/metrics/admin`)
- ✅ Vérification du rôle avant accès
- ✅ Redirection des non-admins
- ✅ Rate limiting (100 requêtes/minute)

### Hook useAuth

Utilisez le hook pour détecter le rôle :

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) return <Skeleton />;
  
  if (isAdmin) {
    return <AdminView />;
  }
  
  return <UserView />;
}
```

---

## API Endpoints

### GET /api/metrics/client

**Authentification** : Requise (utilisateur)

**Retourne** :
```json
{
  "overview": {
    "totalTenders": 42,
    "submittedTenders": 30,
    "wonTenders": 12,
    "lostTenders": 8,
    "inProgressTenders": 10,
    "conversionRate": 40,
    "totalValue": 500000,
    "wonValue": 200000,
    "totalClients": 15,
    "upcomingDeadlines": 5,
    "urgentTenders": 2
  },
  "statusDistribution": { ... },
  "trends": {
    "tendersGrowth": 15,
    "tendersLastMonth": 8
  },
  "recentTenders": [ ... ]
}
```

### GET /api/metrics/admin

**Authentification** : Requise (admin uniquement)

**Retourne** :
```json
{
  "overview": {
    "totalCompanies": 150,
    "activeCompanies": 120,
    "totalTenders": 1250,
    "conversionRate": 45,
    "totalRevenue": 5000000,
    "mrr": 5000,
    "arr": 60000
  },
  "subscriptions": {
    "free": 100,
    "pro": 40,
    "business": 10
  },
  "topSectors": [ ... ],
  "topCountries": [ ... ],
  "monthlyStats": [ ... ],
  "topCompanies": [ ... ]
}
```

---

## Composants Réutilisables

### StatsCard

Carte de statistique avec icône, valeur, et tendance :

```tsx
<StatsCard
  title="Total des réponses"
  value={42}
  icon={<FileText className="h-6 w-6" />}
  color="blue"
  trend={{
    value: 15,
    label: 'vs mois dernier',
    isPositive: true,
  }}
  subtitle="10 en cours"
/>
```

**Props** :
- `title` : Titre de la métrique
- `value` : Valeur principale (number | string)
- `icon` : Icône React (Lucide)
- `color` : `'blue' | 'green' | 'yellow' | 'red' | 'purple'`
- `trend` : Objet avec `value`, `label`, `isPositive`
- `subtitle` : Texte secondaire

### TendersTable

Tableau des appels d'offres avec tri et filtres :

```tsx
<TendersTable
  tenders={recentTenders}
  onTenderClick={(id) => router.push(`/tenders/${id}`)}
  showActions={true}
/>
```

**Props** :
- `tenders` : Array d'objets tender
- `onTenderClick` : Callback au clic sur une ligne
- `showActions` : Afficher la colonne Actions

---

## Déploiement

### Variables d'environnement

Aucune nouvelle variable requise ! Les dashboards utilisent :
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

### Checklist de déploiement

1. ✅ Exécuter `migration-roles-buyers.sql` en production
2. ✅ Créer au moins un compte admin
3. ✅ Vérifier les politiques RLS sur `buyers`
4. ✅ Tester `/dashboard-client` et `/dashboard-admin`
5. ✅ Vérifier le middleware de protection
6. ✅ Configurer les indexes pour les performances

---

## Personnalisation

### Ajouter une métrique client

Éditez `/api/metrics/client/route.ts` :

```typescript
// Exemple: Calculer le délai moyen de réponse
const avgResponseTime = tenders?.reduce((sum, t) => {
  const created = new Date(t.created_at);
  const submitted = t.submitted_at ? new Date(t.submitted_at) : null;
  if (submitted) {
    return sum + (submitted.getTime() - created.getTime());
  }
  return sum;
}, 0) / submittedTenders;

// Ajouter au retour
return NextResponse.json({
  overview: {
    ...existing,
    avgResponseTime: Math.round(avgResponseTime / (1000 * 60 * 60 * 24)), // en jours
  },
  ...
});
```

### Ajouter une métrique admin

Éditez `/api/metrics/admin/route.ts` pour ajouter des calculs globaux.

---

## Troubleshooting

### Erreur 403 sur /dashboard-admin

**Cause** : L'utilisateur n'a pas le rôle `admin`

**Solution** :
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'votre-email@example.com';
```

### Métriques vides

**Cause** : Pas de données dans `tenders` ou `companies`

**Solution** : Créez quelques appels d'offres de test

### Erreur "company_id not found"

**Cause** : L'utilisateur n'a pas de company associée

**Solution** :
```sql
UPDATE profiles SET company_id = 'uuid-de-votre-company' WHERE id = auth.uid();
```

---

## Prochaines Étapes

### Améliorations possibles

1. **Graphiques interactifs** : Intégrer Chart.js ou Recharts pour visualiser les tendances
2. **Filtres temporels** : Permettre de sélectionner la période (7j, 30j, 3m, 1an)
3. **Export PDF/Excel** : Exporter les métriques en rapports
4. **Notifications temps réel** : WebSockets pour les alertes urgentes
5. **Comparaison périodes** : Comparer les métriques mois N vs mois N-1
6. **Goals tracking** : Définir et suivre des objectifs

### Exemples de métriques avancées

- Temps moyen de réponse (création → soumission)
- Taux d'abandon par phase
- Valeur moyenne des AO gagnés
- Score de satisfaction client
- Prévisions de CA (ML)

---

## Support

Pour toute question :
- 📧 Email : support@wewinbid.com
- 📖 Documentation : `/docs`
- 🐛 Issues : GitHub Issues

---

**Dernière mise à jour** : 13 janvier 2026
