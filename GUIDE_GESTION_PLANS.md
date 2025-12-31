# 🎛️ GUIDE : Gestion des Plans d'Abonnement

Date : 31 Décembre 2025

---

## 🎯 VUE D'ENSEMBLE

La page **Gestion des Plans** vous permet de modifier facilement tous les aspects de vos formules d'abonnement :
- Prix mensuel
- Quotas (utilisateurs, leads, stockage, workflows)
- Fonctionnalités incluses
- Activer/Désactiver un plan

**URL** : `https://www.talosprimes.com/platform/plans`

---

## 🚀 ACCÈS RAPIDE

### 1. Via la Sidebar
```
Dashboard → Gestion des Plans (🎛️)
```

### 2. URL Directe
```
https://www.talosprimes.com/platform/plans
```

---

## 📖 FONCTIONNALITÉS

### ✏️ 1. MODIFIER UN PLAN

#### A. Modifier le Prix
```
1. Cliquer sur l'icône ✏️ (Edit) du plan
2. Changer le champ "Prix mensuel"
3. Cliquer sur ✅ (Save)
```

**⚠️ IMPORTANT** :
- Les clients existants **gardent leur ancien prix**
- Seuls les **nouveaux abonnements** utilisent le nouveau prix
- Si vous voulez migrer les clients existants, changez manuellement dans Stripe

#### B. Modifier les Quotas
```
1. Cliquer sur ✏️ (Edit)
2. Modifier :
   - Max Utilisateurs
   - Max Leads/mois
   - Stockage (GB)
   - Max Workflows
3. Laisser vide pour "Illimité"
4. Cliquer sur ✅ (Save)
```

**✅ IMPACT IMMÉDIAT** :
- Les clients existants profitent **immédiatement** des nouveaux quotas

#### C. Modifier les Fonctionnalités
```
1. Cliquer sur ✏️ (Edit)
2. Modifier chaque fonctionnalité
3. Cliquer sur 🗑️ pour supprimer
4. Cliquer sur "+ Ajouter une fonctionnalité"
5. Cliquer sur ✅ (Save)
```

### 👁️ 2. ACTIVER/DÉSACTIVER UN PLAN

```
Cliquer sur l'icône 👁️ (Eye) ou 👁️‍🗨️ (Eye Off)
```

**Statuts** :
- ✅ **Actif** (Eye ouvert) : Plan disponible pour les nouveaux clients
- ❌ **Inactif** (Eye fermé) : Plan masqué, non disponible

**⚠️ NOTE** :
- Les clients déjà abonnés **gardent leur accès**
- Le plan n'apparaît plus dans la liste pour les nouveaux clients

### ❌ 3. ANNULER UNE MODIFICATION

```
Pendant l'édition :
- Cliquer sur ❌ (X) pour annuler
- Les modifications ne sont pas sauvegardées
```

---

## 📊 INTERFACE

```
┌────────────────────────────────────────────────────────────┐
│  🎛️ Gestion des Plans                                     │
│  Modifier les formules d'abonnement, quotas et fonctionnalités │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐ │
│  │  📦 Starter (29€/mois)        [👁️] [✏️]            │ │
│  │  Pour les petites entreprises                        │ │
│  │                                                       │ │
│  │  Prix mensuel: 29.00 € / mois                       │ │
│  │                                                       │ │
│  │  Max Utilisateurs: 5                                 │ │
│  │  Max Leads/mois: 100                                 │ │
│  │  Stockage (GB): 5                                    │ │
│  │  Max Workflows: 5                                    │ │
│  │                                                       │ │
│  │  ✓ 5 utilisateurs                                    │ │
│  │  ✓ 100 leads/mois                                    │ │
│  │  ✓ Support email                                     │ │
│  │                                                       │ │
│  │  Stripe Product ID: prod_xxxxx                       │ │
│  │  Stripe Price ID: price_xxxxx                        │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  📦 Business (79€/mois)       [👁️] [✏️]            │ │
│  │  ... (même structure)                                 │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 🔄 WORKFLOW AUTOMATIQUE

Chaque modification déclenche automatiquement :

### 1. Notification Email Admin
```
À: admin@talosprimes.com
Sujet: 🎛️ Plan Modifié: Business

Contenu:
- Plan modifié
- Modifications effectuées
- Auteur
- Date et heure
- Lien vers la gestion
```

### 2. Log en Base de Données
```sql
-- Historique enregistré dans:
plan_modification_history

-- Contient:
- Plan ID
- Modifications (JSON)
- Auteur
- Date
```

### 3. Notifications Optionnelles
- Slack (#admin-notifications)
- Telegram (bot admin)

---

## 📋 EXEMPLES D'UTILISATION

### Exemple 1 : Augmenter le Prix du Business

**Contexte** : Passer le Business de 79€ à 89€

**Étapes** :
```
1. Aller sur /platform/plans
2. Trouver "Business"
3. Cliquer ✏️ (Edit)
4. Changer "79.00" → "89.00"
5. Cliquer ✅ (Save)
6. ✅ Confirmation "Plan modifié avec succès"
7. 📧 Email admin reçu
```

**Résultat** :
- ✅ Nouveaux clients paieront 89€
- ⚠️ Anciens clients gardent 79€ (leur abonnement Stripe existant)

**Pour migrer les anciens clients** :
```
Option 1: Manuellement dans Stripe Dashboard
Option 2: Via l'API /api/stripe/subscriptions/change-plan
```

---

### Exemple 2 : Doubler les Quotas du Starter

**Contexte** : Passer de 5 à 10 utilisateurs et 100 à 200 leads

**Étapes** :
```
1. Aller sur /platform/plans
2. Trouver "Starter"
3. Cliquer ✏️ (Edit)
4. Modifier:
   - Max Utilisateurs: 5 → 10
   - Max Leads/mois: 100 → 200
5. Cliquer ✅ (Save)
```

**Résultat** :
- ✅ **TOUS** les clients Starter profitent **immédiatement**
- ✅ Pas besoin de migration
- ✅ Changement pris en compte en temps réel

---

### Exemple 3 : Ajouter une Fonctionnalité

**Contexte** : Ajouter "Support prioritaire" au Business

**Étapes** :
```
1. Aller sur /platform/plans
2. Trouver "Business"
3. Cliquer ✏️ (Edit)
4. Scroller jusqu'à "Fonctionnalités"
5. Cliquer "+ Ajouter une fonctionnalité"
6. Taper "Support prioritaire 24/7"
7. Cliquer ✅ (Save)
```

**Résultat** :
- ✅ Fonctionnalité visible sur `/billing`
- ✅ Affichée pour tous les clients Business

---

### Exemple 4 : Désactiver une Formule Custom

**Contexte** : Un client custom a résilié, masquer sa formule

**Étapes** :
```
1. Aller sur /platform/plans
2. Trouver "Custom - Client ABC"
3. Cliquer 👁️ (Eye)
4. Statut change : Actif → Inactif
5. Badge "Inactif" apparaît
```

**Résultat** :
- ❌ Plan non disponible pour nouveaux clients
- ✅ Plan toujours en BDD (historique conservé)
- ⚠️ Si client existant, il garde son accès

---

## 🧪 APRÈS UNE MODIFICATION

### Vérifications Recommandées

#### 1. Vérifier dans la BDD
```sql
SELECT 
  name,
  display_name,
  price_monthly,
  max_users,
  max_leads,
  is_active
FROM subscription_plans
WHERE name = 'business';
```

#### 2. Vérifier l'Historique
```sql
SELECT * FROM plan_modifications_detail
WHERE plan_name = 'business'
ORDER BY modified_at DESC
LIMIT 5;
```

#### 3. Vérifier dans l'Interface Client
```
1. Aller sur /billing (en tant que client)
2. Vérifier que les changements sont visibles
3. Tester "Changer de formule"
```

---

## 🔧 DÉPANNAGE

### Problème : Modifications Non Sauvegardées

**Symptômes** :
- Cliquer sur ✅ mais rien ne change
- Message d'erreur rouge

**Solutions** :
```
1. Vérifier la console navigateur (F12)
2. Vérifier que vous êtes admin plateforme
3. Vérifier les logs API:
   - /api/admin/plans/update
4. Tester avec un autre plan
```

**Vérifier les permissions** :
```sql
SELECT 
  u.email,
  r.name AS role
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.id = auth.uid();

-- Doit retourner:
-- role: "Administrateur Plateforme"
```

---

### Problème : Notification Email Non Reçue

**Solutions** :
```
1. Vérifier N8N est actif:
   pm2 list | grep n8n

2. Vérifier le workflow est actif:
   N8N Dashboard → Workflows → gestion-plans
   Status: ✅ Active

3. Vérifier les credentials Resend:
   N8N → Credentials → Resend SMTP

4. Tester manuellement le webhook:
   curl -X POST https://n8n.talosprimes.com/webhook/plan-modified \
     -H "Content-Type: application/json" \
     -d '{"planId":"test","planName":"Test","changes":{},"modifiedBy":"test@test.com","modifiedAt":"2025-12-31T12:00:00Z"}'
```

---

### Problème : Changements Non Visibles Côté Client

**Si quotas non mis à jour** :
```
1. Vérifier en BDD que les quotas sont bien modifiés
2. Rafraîchir la page /billing (Ctrl+F5)
3. Vider le cache navigateur
4. Vérifier l'API:
   GET /api/stripe/subscriptions/current
```

**Si prix non mis à jour** :
```
⚠️ NORMAL: Les clients existants gardent leur ancien prix

Pour mettre à jour un client existant:
1. Aller dans Stripe Dashboard
2. Trouver l'abonnement du client
3. Update subscription → Changer le price
4. Ou utiliser l'API change-plan
```

---

## 📊 STATISTIQUES ET HISTORIQUE

### Voir l'Historique des Modifications

```sql
-- Dernières 10 modifications
SELECT * FROM plan_modifications_detail 
ORDER BY modified_at DESC 
LIMIT 10;

-- Historique d'un plan spécifique
SELECT * FROM get_plan_history('uuid-du-plan');

-- Stats des 30 derniers jours
SELECT * FROM get_modification_stats(30);
```

### Dashboard Visuel (À VENIR)

```
Future fonctionnalité:
- Graphique des modifications par mois
- Top plans modifiés
- Top admins modificateurs
- Timeline des changements
```

---

## 🎯 BONNES PRATIQUES

### ✅ À FAIRE

1. **Documenter chaque modification importante**
   - Pourquoi ?
   - Impact attendu
   - Clients concernés

2. **Tester en sandbox Stripe d'abord**
   - Créer un plan test
   - Modifier les prix/quotas
   - Vérifier l'impact

3. **Prévenir les clients des changements majeurs**
   - Augmentation de prix → Email 30 jours avant
   - Réduction de quotas → Email + offre migration

4. **Vérifier l'historique régulièrement**
   - Qui modifie ?
   - Quoi ?
   - Quand ?

5. **Utiliser des noms explicites pour les formules custom**
   - ✅ `Custom - Client ABC`
   - ❌ `custom_12345`

### ❌ À ÉVITER

1. ❌ Modifier un prix sans prévenir les clients
2. ❌ Désactiver un plan avec des clients actifs sans migration
3. ❌ Supprimer des fonctionnalités importantes sans compensation
4. ❌ Modifier drastiquement les quotas à la baisse
5. ❌ Changer plusieurs plans en même temps sans test

---

## 🚀 PROCHAINES ÉTAPES

### Fonctionnalités à Venir

- [ ] **Dashboard Analytics** : Visualiser l'impact des modifications
- [ ] **Templates de Plans** : Dupliquer un plan existant
- [ ] **Preview Mode** : Prévisualiser avant de sauvegarder
- [ ] **Bulk Actions** : Modifier plusieurs plans en une fois
- [ ] **Approval Workflow** : Validation à deux avant modification
- [ ] **Client Communication** : Notifier automatiquement les clients impactés

---

## 📞 SUPPORT

**Problème technique ?**
1. Consulter les logs : `pm2 logs talosprime`
2. Vérifier la console navigateur (F12)
3. Tester l'API directement avec Postman/cURL

**Besoin d'aide ?**
- Email : support@talosprimes.com
- Slack : #admin-support
- Documentation : `/docs/GUIDE_GESTION_PLANS.md`

---

## 📚 RESSOURCES

- **Guide Modification Abonnements** : `/GUIDE_MODIFIER_ABONNEMENTS.md`
- **Documentation Workflow** : `/n8n-workflows/abonnements/README_GESTION_PLANS.md`
- **SQL Historique** : `/database/create_plan_history_table.sql`
- **API Documentation** : `/docs/API_PLANS.md`

---

**Créé le** : 31 Décembre 2025  
**Version** : 1.0.0  
**Auteur** : Équipe Talos Prime

