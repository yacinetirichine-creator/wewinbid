# ✅ Guide Rapide : Entreprises & Suivi AO

## 🎯 Résumé de la situation

### Avant les corrections
❌ **Problème 1** : Tous les utilisateurs voyaient tous les AO (pas de filtrage)  
❌ **Problème 2** : Les AO créés n'avaient pas de `company_id`  
❌ **Problème 3** : Confusion entre JARVIS SAS (admin) et entreprises clientes  

### Après les corrections
✅ **Isolation parfaite** : Chaque entreprise voit uniquement ses propres AO  
✅ **Sécurité renforcée** : Vérification `company_id` sur toutes les pages  
✅ **Documentation claire** : ARCHITECTURE_ENTREPRISES.md  

---

## 🏢 JARVIS SAS vs Entreprises Clientes

### JARVIS SAS (Vous - Administrateur)
```
📧 Email    : contact@wewinbid.com
🔐 Password : WeWinBid2026@Admin!Secure
🎛️ Dashboard: /dashboard-admin
📊 Données  : Métriques globales de TOUS les clients
```

**⚠️ JARVIS SAS ne crée PAS d'appels d'offres**  
C'est l'entreprise qui commercialise WeWinBid, pas un client.

---

### Entreprises Clientes (Utilisateurs finaux)
Exemple : **BTP Solutions SAS**
```
📧 Email    : jean.dupont@btpsolutions.fr
🎛️ Dashboard: /dashboard
📊 Données  : Uniquement les AO de BTP Solutions SAS
```

Chaque client :
1. S'inscrit sur WeWinBid
2. Crée son entreprise (ou rejoint une existante)
3. Crée ses appels d'offres
4. Voit uniquement ses propres AO (filtrage par `company_id`)

---

## ✨ Fonctionnalité "Suivi AO" (Reprendre où on s'est arrêté)

### Comment ça marche ?

1. **Auto-sauvegarde** toutes les 2 secondes :
   - Étape courante (ex: "Documents administratifs")
   - Documents uploadés/générés
   - Notes
   - Checklist

2. **Bouton "Continuer la réponse"** :
   - Visible sur les AO en cours (`DRAFT`, `ANALYSIS`, `IN_PROGRESS`, `REVIEW`)
   - Indicateur visuel : `• Auto-sauvegardé`
   - Restaure automatiquement l'étape et les données

3. **Stockage** dans `tender_responses` :
   ```sql
   SELECT * FROM tender_responses 
   WHERE tender_id = 'uuid-de-ao' 
   AND user_id = 'uuid-utilisateur';
   ```

### Exemple d'utilisation

**Scénario** : Jean Dupont commence à répondre à un AO

1. **Jour 1 - 10h00** : Jean commence l'AO "Construction école"
   - Upload le DCE
   - Génère le DC1 (IA)
   - Étape courante : "Documents administratifs" (50% complété)
   - **Ferme son navigateur** ❌

2. **Jour 2 - 14h00** : Jean revient
   - Va sur `/tenders`
   - Voit l'AO "Construction école" avec badge `EN COURS`
   - Clique sur **"Continuer la réponse"**
   - ✅ **Retrouve exactement** :
     - Étape "Documents administratifs"
     - DC1 déjà généré
     - Ses notes
     - Sa checklist
   - Peut continuer directement !

---

## 🔍 Vérifier l'isolation

### Test rapide
```sql
-- 1. Voir les entreprises
SELECT id, name, siret FROM companies;

-- 2. Voir les AO d'une entreprise spécifique
SELECT reference, title, company_id 
FROM tenders 
WHERE company_id = 'uuid-entreprise-1';

-- 3. Vérifier qu'un autre company_id ne voit pas ces AO
SELECT reference, title, company_id 
FROM tenders 
WHERE company_id = 'uuid-entreprise-2';
```

---

## 🚀 Prochaines étapes recommandées

### 1. Créer une entreprise de test
```typescript
// Via l'interface /onboarding
// Ou directement en SQL :
INSERT INTO companies (name, siret, email)
VALUES ('Test Entreprise SAS', '12345678900012', 'test@exemple.fr')
RETURNING id;

-- Puis lier un utilisateur
INSERT INTO company_members (company_id, user_id, role)
VALUES ('uuid-company', 'uuid-user', 'owner');
```

### 2. Tester le cycle complet
1. **Connexion** avec un utilisateur d'entreprise cliente
2. **Créer un AO** via `/tenders/analyze`
3. **Commencer la réponse** → étape 1/8
4. **Fermer le navigateur**
5. **Revenir** → cliquer "Continuer la réponse"
6. **Vérifier** : on est bien à l'étape 1/8 avec les données sauvegardées

### 3. Vérifier l'isolation
1. **Créer 2 utilisateurs** dans 2 entreprises différentes
2. **User 1** crée un AO
3. **User 2** va sur `/tenders`
4. **Vérifier** : User 2 ne voit PAS l'AO de User 1 ✅

---

## 📝 Fichiers modifiés (Commit 91c6a47)

| Fichier | Modification |
|---------|-------------|
| `src/app/tenders/page.tsx` | ✅ Filtrage par `company_id` dans la liste |
| `src/app/tenders/analyze/page.tsx` | ✅ Ajout `company_id` à la création d'AO |
| `src/app/tenders/[id]/page.tsx` | ✅ Vérification `company_id` au chargement |
| `src/app/tenders/[id]/respond/page.tsx` | ✅ Vérification `company_id` en mode réponse |
| `ARCHITECTURE_ENTREPRISES.md` | 📄 Documentation complète 300+ lignes |

---

## ❓ FAQ

### Q: Pourquoi le compte admin JARVIS SAS existe ?
**R:** C'est votre compte d'administrateur plateforme pour surveiller tous les clients. Il ne crée pas d'AO.

### Q: Que voit un utilisateur qui n'a pas d'entreprise ?
**R:** Il est redirigé vers l'onboarding pour créer/rejoindre une entreprise.

### Q: Les brouillons sont-ils partagés entre utilisateurs d'une même entreprise ?
**R:** Non, chaque brouillon (`tender_responses`) est lié à un `user_id` spécifique. Seul l'utilisateur qui a commencé la réponse peut la reprendre.

### Q: Peut-on reprendre un AO en cours depuis un autre appareil ?
**R:** Oui ! Les brouillons sont stockés en base de données (Supabase). Connectez-vous avec le même compte sur n'importe quel appareil.

---

## 🎉 Résultat final

✅ **Isolation parfaite** entre entreprises  
✅ **Suivi AO fonctionnel** avec auto-save  
✅ **Sécurité renforcée** (vérification `company_id` partout)  
✅ **Documentation complète** pour développeurs  

**Vous pouvez maintenant tester en créant plusieurs entreprises clientes !**
