# 🎛️ Workflow : Gestion des Plans

## 📋 Description

Ce workflow gère les **notifications automatiques** lors de la modification d'un plan d'abonnement par un administrateur.

---

## 🎯 Objectif

Notifier les administrateurs immédiatement lorsqu'un plan est modifié (prix, quotas, fonctionnalités, statut) pour :
- ✅ Assurer la traçabilité des modifications
- ✅ Permettre une validation rapide
- ✅ Éviter les erreurs non détectées
- ✅ Tenir un historique des changements

---

## 🔄 Déclencheur

**Webhook** : `/webhook/plan-modified`

**URL complète** : `https://n8n.talosprimes.com/webhook/plan-modified`

**Méthode** : `POST`

---

## 📥 Données d'Entrée (Payload)

```json
{
  "planId": "uuid-du-plan",
  "planName": "Business",
  "changes": {
    "price": 89.00,
    "quotas": {
      "maxUsers": 25
    },
    "features": [
      "25 utilisateurs",
      "500 leads/mois"
    ]
  },
  "modifiedBy": "admin@talosprimes.com",
  "modifiedAt": "2025-12-31T12:00:00Z"
}
```

---

## ⚙️ Étapes du Workflow

### 1️⃣ **Webhook Plan Modifié**
- Reçoit les données de modification
- Valide que le payload est correct

### 2️⃣ **Valider Données**
- Vérifie que `planName` est présent
- Vérifie que `planId` est valide
- Si invalide → Erreur 400

### 3️⃣ **Notifications Parallèles**

#### A. Email Admin
```
À: admin@talosprimes.com
Sujet: 🎛️ Plan Modifié: Business
Contenu:
- Nom du plan
- Modifications effectuées (JSON)
- Auteur de la modification
- Date et heure
- Lien vers la gestion des plans
```

#### B. Slack Notification (Optionnel)
```
Canal: #admin-notifications
Format: Message formaté avec code blocks
```

#### C. Telegram (Optionnel)
```
À: Admin Telegram Bot
Format: Message court avec lien
```

### 4️⃣ **Log en BDD (Historique)**
```sql
INSERT INTO plan_modification_history (
  plan_id,
  modified_by,
  changes,
  modified_at
)
VALUES (...);
```

### 5️⃣ **Réponse Webhook**
```json
{
  "success": true,
  "message": "Notifications envoyées",
  "timestamp": "2025-12-31T12:00:00Z"
}
```

---

## 🗄️ Table BDD : `plan_modification_history`

```sql
CREATE TABLE IF NOT EXISTS plan_modification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  modified_by TEXT NOT NULL,
  changes JSONB NOT NULL,
  modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plan_mod_plan_id ON plan_modification_history(plan_id);
CREATE INDEX idx_plan_mod_modified_at ON plan_modification_history(modified_at DESC);
```

---

## 🔧 Configuration Requise

### 1. **Variables d'Environnement**

```bash
# Dans .env.production
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.talosprimes.com
```

### 2. **Credentials N8N**

#### Resend SMTP
```
Host: smtp.resend.com
Port: 465 (SSL) ou 587 (TLS)
Username: resend
Password: re_xxxxxxxxxxxxx
```

#### Slack API (Optionnel)
```
Token: xoxb-xxxxxxxxxxxxx
Channel: #admin-notifications
```

#### Telegram Bot (Optionnel)
```
Bot Token: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
Chat ID: ADMIN_USER_ID
```

#### Supabase PostgreSQL
```
Host: db.gqkfqvmvqswpqlkvdowz.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: votre-password
```

---

## 🚀 Installation

### 1. Importer dans N8N

```bash
# Copier le workflow
cp n8n-workflows/abonnements/gestion-plans.json /tmp/

# Dans N8N Dashboard:
# 1. Aller sur "Workflows"
# 2. Cliquer "Import from File"
# 3. Sélectionner gestion-plans.json
# 4. Activer le workflow
```

### 2. Configurer les Credentials

1. **Resend SMTP** :
   - Credentials → Add New → SMTP
   - Nom: "Resend SMTP"
   - Remplir les infos

2. **Slack** (optionnel) :
   - Credentials → Add New → Slack API
   - OAuth ou Bot Token

3. **Supabase PostgreSQL** :
   - Credentials → Add New → PostgreSQL
   - Remplir les infos de connexion

### 3. Créer la Table Historique

```sql
-- Exécuter dans Supabase SQL Editor
CREATE TABLE IF NOT EXISTS plan_modification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  modified_by TEXT NOT NULL,
  changes JSONB NOT NULL,
  modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plan_mod_plan_id ON plan_modification_history(plan_id);
CREATE INDEX idx_plan_mod_modified_at ON plan_modification_history(modified_at DESC);
```

### 4. Tester le Webhook

```bash
curl -X POST https://n8n.talosprimes.com/webhook/plan-modified \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "test-uuid",
    "planName": "Test Plan",
    "changes": {
      "price": 100
    },
    "modifiedBy": "test@example.com",
    "modifiedAt": "2025-12-31T12:00:00Z"
  }'
```

**Résultat attendu** :
```json
{
  "success": true,
  "message": "Notifications envoyées",
  "timestamp": "..."
}
```

---

## 📊 Cas d'Usage

### Cas 1 : Modification du Prix
```javascript
// Admin change le prix du Business de 79€ à 89€
POST /api/admin/plans/update
{
  "planId": "uuid-business",
  "updates": {
    "price": 89.00
  }
}

// Workflow déclenché automatiquement
// ✅ Email envoyé à admin@talosprimes.com
// ✅ Slack notification
// ✅ Log en BDD
```

### Cas 2 : Augmentation des Quotas
```javascript
// Admin double les quotas du Starter
POST /api/admin/plans/update
{
  "planId": "uuid-starter",
  "updates": {
    "quotas": {
      "maxUsers": 10,    // était 5
      "maxLeads": 200    // était 100
    }
  }
}

// Workflow déclenché
// ✅ Notifications envoyées
// ✅ Historique enregistré
```

### Cas 3 : Désactivation d'un Plan
```javascript
// Admin désactive temporairement une formule
POST /api/admin/plans/toggle
{
  "planId": "uuid-custom",
  "isActive": false
}

// Notification envoyée
// ⚠️ Admin averti de la désactivation
```

---

## 🧪 Tests

### Test 1 : Email Admin
```bash
# Déclencher une modification
# Vérifier:
✅ Email reçu dans les 30 secondes
✅ Contenu HTML correct
✅ Lien vers /platform/plans fonctionne
✅ JSON des changements affiché
```

### Test 2 : Historique BDD
```sql
-- Vérifier les logs
SELECT 
  ph.id,
  sp.display_name AS plan_name,
  ph.modified_by,
  ph.changes,
  ph.modified_at
FROM plan_modification_history ph
JOIN subscription_plans sp ON ph.plan_id = sp.id
ORDER BY ph.modified_at DESC
LIMIT 10;
```

### Test 3 : Notifications Slack (si activé)
```bash
# Vérifier dans #admin-notifications
✅ Message reçu
✅ Format correct
✅ Lien cliquable
```

---

## 🔍 Debugging

### Problème : Webhook ne répond pas
```bash
# Vérifier que le workflow est actif
# Dans N8N Dashboard → Workflows → gestion-plans
✅ Status: Active

# Vérifier les logs N8N
pm2 logs n8n --lines 50
```

### Problème : Email non reçu
```bash
# Vérifier les credentials Resend
# N8N → Credentials → Resend SMTP
✅ Password correct
✅ Port 465 ou 587

# Vérifier les logs du node Email
# Dans le workflow → Exécution → Email Admin
```

### Problème : Erreur BDD
```bash
# Vérifier que la table existe
SELECT * FROM plan_modification_history LIMIT 1;

# Vérifier les permissions
GRANT ALL ON plan_modification_history TO postgres;
```

---

## 📈 Améliorations Futures

- [ ] **Dashboard Analytics** : Visualiser l'historique des modifications
- [ ] **Alertes personnalisées** : Notifier seulement pour certains types de changements
- [ ] **Rollback automatique** : Annuler une modification en cas d'erreur détectée
- [ ] **Approbation en deux étapes** : Demander confirmation avant application
- [ ] **Notifications aux clients** : Avertir les clients impactés par le changement

---

## 📞 Support

**Problèmes ?** Vérifier :
1. Workflow actif dans N8N
2. Credentials configurés
3. Table `plan_modification_history` créée
4. Variable `NEXT_PUBLIC_N8N_WEBHOOK_URL` définie

**Logs** :
```bash
# N8N logs
pm2 logs n8n

# Application logs
pm2 logs talosprime
```

---

**Créé le** : 31 Décembre 2025  
**Version** : 1.0.0  
**Maintenu par** : Équipe Talos Prime

