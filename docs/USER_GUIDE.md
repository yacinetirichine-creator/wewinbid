# WeWinBid - Guide Utilisateur

<div align="center">

**Guide Complet pour les Utilisateurs**

*Version 2.0 - Janvier 2026*

</div>

---

## Table des Matières

1. [Premiers Pas](#premiers-pas)
2. [Tableau de Bord](#tableau-de-bord)
3. [Gestion des Appels d'Offres](#gestion-des-appels-doffres)
4. [Studio Créatif](#studio-créatif)
5. [Gestion Documentaire](#gestion-documentaire)
6. [Équipe & Collaboration](#équipe--collaboration)
7. [Marketplace Partenaires](#marketplace-partenaires)
8. [Analytics & Rapports](#analytics--rapports)
9. [Paramètres](#paramètres)
10. [FAQ](#faq)

---

## Premiers Pas

### Création de Compte

1. Rendez-vous sur [wewinbid.com](https://wewinbid.com)
2. Cliquez sur **S'inscrire**
3. Remplissez le formulaire en 3 étapes:

   **Étape 1 - Informations personnelles:**
   - Email professionnel
   - Mot de passe (min. 8 caractères)
   - Prénom et Nom

   **Étape 2 - Informations entreprise:**
   - Nom de l'entreprise
   - SIRET (14 chiffres)
   - Secteur d'activité
   - Effectif

   **Étape 3 - Préférences:**
   - Langue de l'interface
   - Types d'appels d'offres ciblés
   - Régions d'intervention

4. Confirmez votre email
5. Accédez à votre tableau de bord

### Configuration Initiale

Après inscription, nous recommandons de:

1. **Compléter le profil entreprise** (/settings/company)
   - Logo entreprise
   - Description détaillée
   - Certifications (ISO, Qualibat, etc.)
   - Références clients

2. **Uploader les documents obligatoires** (/documents)
   - KBIS de moins de 3 mois
   - Attestation fiscale
   - Attestation URSSAF
   - Attestation d'assurance RC Pro

3. **Configurer les alertes** (/alerts)
   - Mots-clés à surveiller
   - Secteurs d'activité
   - Budget min/max
   - Régions

---

## Tableau de Bord

### Vue d'Ensemble

Le tableau de bord affiche en temps réel:

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 STATISTIQUES                                                │
├─────────────┬─────────────┬─────────────┬─────────────┐        │
│ AO en cours │ Soumis      │ Gagnés      │ Taux réuss. │        │
│    12       │    8        │    5        │   62.5%     │        │
└─────────────┴─────────────┴─────────────┴─────────────┘        │
│                                                                 │
│  📋 DOSSIERS EN COURS (Urgents en premier)                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔴 Marché vidéosurveillance     │ 2 jours  │ 65% │     │   │
│  │ 🟠 Travaux rénovation           │ 5 jours  │ 40% │     │   │
│  │ 🟢 Fourniture informatique      │ 14 jours │ 20% │     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📅 ÉCHÉANCES CETTE SEMAINE                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Lun 27/01 - Dépôt candidature Ville de Lyon            │   │
│  │ Mer 29/01 - Date limite questions Région IDF           │   │
│  │ Ven 31/01 - Soumission finale Ministère                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Widgets Disponibles

| Widget | Description |
|--------|-------------|
| **Statistiques** | KPIs clés (AO, taux, revenus) |
| **Dossiers en cours** | AO avec statut DRAFT/ANALYSIS/IN_PROGRESS/REVIEW |
| **Échéances** | Calendrier des deadlines |
| **Score IA récent** | Derniers scores calculés |
| **Activité équipe** | Actions récentes des membres |
| **Alertes** | Nouvelles opportunités matchées |

### Personnalisation

Cliquez sur ⚙️ pour:
- Réorganiser les widgets (drag & drop)
- Masquer/afficher des widgets
- Changer la période des statistiques

---

## Gestion des Appels d'Offres

### Pipeline Kanban

Le pipeline visualise vos AO en 8 colonnes:

```
DRAFT → IDENTIFIED → ANALYZING → QUALIFIED → PREPARING → SUBMITTED → WON/LOST
```

| Statut | Description | Actions |
|--------|-------------|---------|
| **DRAFT** | Brouillon initial | Compléter les infos |
| **IDENTIFIED** | Opportunité détectée | Analyser la pertinence |
| **ANALYZING** | En cours d'analyse | Lancer score IA |
| **QUALIFIED** | Qualifié pour réponse | Décider Go/No-Go |
| **PREPARING** | Préparation en cours | Rédiger les documents |
| **SUBMITTED** | Soumis | Attendre résultat |
| **WON** | Gagné | Célébrer! |
| **LOST** | Perdu | Analyser les raisons |

### Créer un Appel d'Offres

1. Cliquez sur **+ Nouvel AO**
2. Remplissez les informations:
   - Titre et référence
   - Acheteur (créer ou sélectionner)
   - Budget estimé (min/max)
   - Date limite de soumission
   - Type (public FR, privé, européen)
   - Secteur et sous-secteur

3. Uploadez les documents du DCE:
   - Règlement de consultation (RC)
   - Cahier des charges (CCTP)
   - Acte d'engagement
   - Autres pièces

4. Cliquez sur **Créer**

### Score IA de Compatibilité

Pour chaque AO, obtenez un score de 0 à 100%:

1. Ouvrez l'AO
2. Cliquez sur **Calculer le Score IA**
3. Attendez l'analyse (10-30 secondes)

**Critères analysés:**

| Critère | Poids | Description |
|---------|-------|-------------|
| Correspondance sectorielle | 30% | Match avec votre secteur |
| Certifications | 20% | Certifications requises vs détenues |
| Expérience | 20% | Références similaires |
| Capacité financière | 15% | CA vs budget du marché |
| Couverture géographique | 15% | Présence dans la zone |

**Interprétation:**

| Score | Catégorie | Recommandation |
|-------|-----------|----------------|
| 80-100% | Excellent | Répondre en priorité |
| 60-79% | Bon | Répondre si capacité |
| 40-59% | Moyen | Analyser en détail |
| 20-39% | Faible | Probablement passer |
| 0-19% | Très faible | Ne pas répondre |

### Assistant de Réponse (Wizard)

L'assistant vous guide étape par étape:

**Étape 1 - Documents administratifs**
- DC1 - Lettre de candidature
- DC2 - Déclaration du candidat
- KBIS, attestations...

**Étape 2 - Offre technique**
- Mémoire technique
- Méthodologie proposée
- Références similaires

**Étape 3 - Équipe proposée**
- CV des intervenants
- Organigramme projet
- Planning prévisionnel

**Étape 4 - Offre financière**
- Acte d'engagement
- BPU / DQE / DPGF
- Sous-détail de prix

**Étape 5 - Documents complémentaires**
- Attestations spécifiques
- Plans, schémas
- Annexes

**Étape 6 - Révision & Soumission**
- Vérification checklist
- Génération PDF final
- Soumission électronique

---

## Studio Créatif

### Génération de Contenu

Le Studio permet de créer du contenu professionnel:

#### Posts LinkedIn

1. Sélectionnez le template (ex: "Annonce de victoire")
2. Renseignez le contexte:
   - Nom du marché gagné
   - Client
   - Montant (optionnel)
3. Cliquez **Générer**
4. Personnalisez le texte
5. Cliquez **Copier** ou **Publier**

#### Images DALL-E 3

1. Cliquez sur **Générer une image**
2. Décrivez votre besoin:
   ```
   Exemple: Une équipe de techniciens installant
   des caméras de surveillance dans un bâtiment moderne
   ```
3. Choisissez le style:
   - Professional (recommandé pour LinkedIn)
   - Corporate
   - Modern
   - Creative

4. Sélectionnez le format:
   - Carré (1024x1024) - Posts
   - Paysage (1792x1024) - Headers
   - Portrait (1024x1792) - Stories

5. Cliquez **Générer** (qualité HD)

#### Présentations

1. Sélectionnez **Nouvelle présentation**
2. Renseignez:
   - Sujet principal
   - Nombre de slides (5-15)
   - Style visuel
3. Activez **Inclure les images**
4. Cliquez **Générer**
5. Téléchargez en PDF ou PPTX

### Templates Disponibles

| Template | Usage |
|----------|-------|
| Annonce de victoire | Célébrer un marché gagné |
| Présentation entreprise | Présentation générale |
| Étude de cas | Success story client |
| Communiqué de presse | Annonce officielle |
| Nouvelle certification | Annoncer une certification |
| Recrutement | Offre d'emploi |

---

## Gestion Documentaire

### Bibliothèque de Documents

Centralisez tous vos documents administratifs:

#### Types de Documents

| Type | Exemples | Validité |
|------|----------|----------|
| **Juridiques** | KBIS, Statuts | 3 mois |
| **Fiscaux** | Attestation fiscale, liasse | 1 an |
| **Sociaux** | Attestation URSSAF | 6 mois |
| **Assurances** | RC Pro, Décennale | 1 an |
| **Certifications** | ISO, Qualibat, APSAD | Variable |
| **Techniques** | Références, CV | - |

#### Upload de Documents

1. Cliquez **+ Ajouter un document**
2. Sélectionnez le fichier (PDF, DOC, XLS, images)
3. Renseignez:
   - Type de document
   - Date d'expiration (si applicable)
   - Notes (optionnel)
4. Cliquez **Uploader**

#### Alertes d'Expiration

Le système vous alerte automatiquement:
- **30 jours avant** : Alerte email
- **15 jours avant** : Notification in-app
- **7 jours avant** : Alerte urgente
- **Expiré** : Badge rouge

### Génération Automatique

WeWinBid peut générer automatiquement:

| Document | Description |
|----------|-------------|
| DC1 | Lettre de candidature pré-remplie |
| DC2 | Déclaration du candidat |
| DC4 | Déclaration de sous-traitance |
| Mémoire technique | Structure selon le CCTP |
| Acte d'engagement | Formulaire pré-rempli |

---

## Équipe & Collaboration

### Gestion de l'Équipe

#### Ajouter un Membre

1. Allez dans **Équipe** (/team)
2. Cliquez **Inviter un membre**
3. Renseignez:
   - Email
   - Rôle (Admin, Membre, Lecteur)
   - Permissions spécifiques
4. Cliquez **Envoyer l'invitation**

L'invité reçoit un email avec un lien valable 7 jours.

#### Rôles et Permissions

| Rôle | Permissions |
|------|-------------|
| **Propriétaire** | Toutes les permissions + facturation |
| **Admin** | Toutes sauf suppression AO et facturation |
| **Membre** | Création, édition, visualisation |
| **Lecteur** | Visualisation uniquement |

**Permissions détaillées:**

| Permission | Propriétaire | Admin | Membre | Lecteur |
|------------|:------------:|:-----:|:------:|:-------:|
| Voir les AO | ✅ | ✅ | ✅ | ✅ |
| Créer des AO | ✅ | ✅ | ✅ | ❌ |
| Modifier les AO | ✅ | ✅ | ✅ | ❌ |
| Supprimer les AO | ✅ | ❌ | ❌ | ❌ |
| Voir documents | ✅ | ✅ | ✅ | ✅ |
| Gérer documents | ✅ | ✅ | ✅ | ❌ |
| Exporter données | ✅ | ✅ | ❌ | ❌ |
| Voir analytics | ✅ | ✅ | ❌ | ❌ |
| Gérer équipe | ✅ | ✅ | ❌ | ❌ |

#### Tarification Équipe

| Membres | Coût mensuel |
|---------|--------------|
| 1-2 | Inclus dans l'abonnement |
| 3 | +10€/mois |
| 4 | +20€/mois |
| 5 | +30€/mois |
| ... | +10€ par membre supplémentaire |

### Collaboration en Temps Réel

- **Modifications en direct** : Voir les modifications des autres membres
- **Commentaires** : Ajouter des notes sur les AO
- **Assignation** : Assigner un AO à un membre
- **Historique** : Voir qui a fait quoi

---

## Marketplace Partenaires

### Trouver des Partenaires

1. Allez dans **Marketplace** (/marketplace)
2. Utilisez les filtres:
   - Secteur d'activité
   - Localisation
   - Certifications requises
   - Note minimum
3. Consultez les profils
4. Envoyez une demande de partenariat

### Types de Collaboration

| Type | Description |
|------|-------------|
| **Sous-traitance** | Confier une partie du marché |
| **Co-traitance** | Réponse conjointe (groupement) |
| **Groupement solidaire** | Responsabilité partagée |
| **Groupement conjoint** | Responsabilités séparées |

### Évaluer un Partenaire

Après collaboration, notez votre partenaire:
- Note globale (1-5 étoiles)
- Qualité technique
- Respect des délais
- Communication
- Commentaire (visible publiquement)

---

## Analytics & Rapports

### Tableau de Bord Analytics

Accédez aux statistiques détaillées:

#### KPIs Principaux

| KPI | Description |
|-----|-------------|
| **Taux de réussite** | AO gagnés / AO soumis |
| **Pipeline** | Valeur totale des AO en cours |
| **Revenus** | Total des marchés gagnés |
| **Temps moyen** | Durée moyenne de préparation |

#### Graphiques Disponibles

- **Évolution mensuelle** : AO soumis, gagnés, perdus
- **Répartition par secteur** : Pie chart des secteurs
- **Taux par statut** : Funnel de conversion
- **Comparaison période** : vs mois/trimestre précédent

### Rapport ROI

Calculez votre retour sur investissement:

```
ROI = (Revenus des marchés gagnés - Coût abonnement) / Coût abonnement × 100

Exemple:
- Abonnement Pro: 49€/mois × 12 = 588€
- Marchés gagnés: 250 000€
- ROI = (250 000 - 588) / 588 × 100 = 42 417%
```

### Export des Données

Exportez vos données au format:
- **CSV** : Pour Excel/Google Sheets
- **PDF** : Rapport formaté
- **JSON** : Pour intégration API

---

## Paramètres

### Paramètres du Compte

| Section | Options |
|---------|---------|
| **Profil** | Nom, email, photo, mot de passe |
| **Entreprise** | Infos, logo, description |
| **Notifications** | Email, push, fréquence |
| **Langue** | Interface (8 langues) |
| **Sécurité** | 2FA, sessions actives |

### Paramètres de l'Abonnement

- Voir le plan actuel
- Historique des factures
- Changer de plan
- Gérer les moyens de paiement
- Annuler l'abonnement

### Export RGPD

Conformément au RGPD, vous pouvez:
1. **Exporter vos données** : Télécharger toutes vos données
2. **Supprimer votre compte** : Effacement sous 30 jours

---

## FAQ

### Questions Générales

**Q: Puis-je essayer gratuitement?**
> Oui, le plan Gratuit permet de tester toutes les fonctionnalités de base sans limite de temps.

**Q: Comment fonctionne le scoring IA?**
> L'IA analyse 5 critères (secteur, certifications, expérience, capacité financière, géographie) et calcule un score de compatibilité de 0 à 100%.

**Q: Mes données sont-elles sécurisées?**
> Oui, nous utilisons le chiffrement AES-256, les serveurs sont en Europe (conformité RGPD), et nous avons un score de sécurité de 9.5/10.

### Questions Techniques

**Q: Quels formats de fichiers sont acceptés?**
> PDF, DOC, DOCX, XLS, XLSX, JPG, PNG. Taille max: 10 MB par fichier.

**Q: L'IA peut-elle générer des documents en anglais?**
> Oui, 8 langues sont supportées : français, anglais, allemand, espagnol, italien, portugais, néerlandais, arabe.

**Q: Comment synchroniser avec Google Calendar?**
> Allez dans Paramètres > Intégrations > Google Calendar, et autorisez l'accès.

### Questions Facturation

**Q: Quels moyens de paiement acceptez-vous?**
> Carte bancaire (Visa, Mastercard), prélèvement SEPA, et virement pour les abonnements Enterprise.

**Q: Puis-je changer de plan à tout moment?**
> Oui, l'upgrade est immédiat. Le downgrade prend effet à la fin de la période en cours.

**Q: Y a-t-il un engagement?**
> Non, les abonnements sont mensuels sans engagement. L'abonnement annuel offre 2 mois gratuits.

---

## Support

### Contact

- **Email**: support@wewinbid.com
- **Chat**: Disponible dans l'application (heures ouvrées)
- **Documentation**: docs.wewinbid.com

### Ressources

- [Centre d'aide](https://help.wewinbid.com)
- [Tutoriels vidéo](https://youtube.com/@wewinbid)
- [Blog](https://blog.wewinbid.com)
- [Changelog](https://changelog.wewinbid.com)

---

*Guide utilisateur - WeWinBid v2.0 - Janvier 2026*
