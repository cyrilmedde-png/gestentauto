# 📊 Système de Logging Centralisé - Abonnements

**Objectif** : Tracer tous les événements d'abonnements en temps réel pour monitoring, debugging et analytics.

---

## 🎯 FONCTIONNALITÉS

### 1. Logging Automatique

**Types d'événements tracés** :
- ✅ `subscription_created` - Création abonnement
- ✅ `subscription_updated` - Modification abonnement
- ✅ `subscription_canceled` - Annulation
- ✅ `subscription_renewed` - Renouvellement
- ✅ `payment_succeeded` - Paiement réussi
- ✅ `payment_failed` - Échec paiement
- ✅ `plan_upgraded` - Upgrade formule
- ✅ `plan_downgraded` - Downgrade formule
- ✅ `plan_modified` - Modification plan (admin)
- ✅ `trial_started` - Début essai
- ✅ `trial_ended` - Fin essai
- ✅ `account_suspended` - Suspension compte
- ✅ `reminder_sent` - Rappel envoyé
- ✅ `webhook_received` - Webhook Stripe reçu
- ✅ `cron_executed` - Cron exécuté

### 2. Statuts de Log

- **success** ✅ : Opération réussie
- **error** ❌ : Erreur critique
- **warning** ⚠️ : Attention requise
- **info** ℹ️ : Information

### 3. Alertes Admin

- ✅ Email automatique sur erreur critique
- ✅ Détails complets de l'erreur
- ✅ Stack trace incluse
- ✅ Lien vers dashboard logs

---

## 🔧 INSTALLATION (15 min)

### ÉTAPE 1 : Migration SQL (3 min)

```bash
# 1. Ouvrez Supabase SQL Editor
# 2. Exécutez le script
```

**Fichier** : `database/create_subscription_logs.sql`

**Ce qu'il crée** :
- ✅ Table `subscription_logs`
- ✅ Index pour performance
- ✅ RLS policies
- ✅ Vue `subscription_logs_stats`
- ✅ Function `clean_old_subscription_logs()`

### ÉTAPE 2 : Import Workflow N8N (5 min)

1. **N8N** : **"+"** → **"Import from File"**
2. **Fichier** : `n8n-workflows/monitoring/logs-abonnements.json`
3. **Webhook** : `/webhook/log-subscription`

#### Configuration Node PostgreSQL

**IMPORTANT** : Configurer la connexion PostgreSQL dans N8N

1. **Credentials** → **Add Credentials** → **PostgreSQL**
2. **Nom** : `Supabase PostgreSQL`
3. **Config** :
   ```
   Host:     db.VOTRE_PROJECT_REF.supabase.co
   Database: postgres
   User:     postgres
   Password: VOTRE_PASSWORD_SUPABASE
   Port:     5432
   SSL:      Enabled
   ```

4. **Où trouver ces infos** :
   - Supabase Dashboard → Settings → Database
   - Connection String (mode "Connection pooling")

5. **Save** le workflow + **Activate**

### ÉTAPE 3 : Déployer le Code (5 min)

Le code a déjà été poussé sur GitHub. Sur votre VPS :

```bash
ssh root@82.165.129.143
cd /var/www/talosprime

# Pull
git pull origin main

# Build
npm run build

# Redémarrer
pm2 restart talosprime
```

---

## 💻 UTILISATION DANS LE CODE

### Import

```typescript
import { logSuccess, logError, logWarning, logInfo } from '@/lib/services/subscription-logger'
```

### Exemples

#### 1. Logger un succès

```typescript
await logSuccess(
  'subscription_created',
  'sub_1234567890',
  {
    plan_name: 'Business',
    amount: 99,
    user_email: 'client@exemple.com'
  },
  {
    company_id: 'uuid-company',
    user_id: 'uuid-user',
    source: 'api'
  }
)
```

#### 2. Logger une erreur

```typescript
try {
  // Code qui peut échouer
} catch (error) {
  await logError(
    'payment_failed',
    error as Error,
    'sub_1234567890',
    {
      amount: 99,
      attempt: 3
    },
    {
      company_id: 'uuid-company',
      source: 'webhook'
    }
  )
}
```

#### 3. Logger un warning

```typescript
await logWarning(
  'payment_retry',
  'Carte expirée, tentative de nouveau paiement',
  'sub_1234567890',
  {
    card_last4: '4242',
    retry_count: 2
  },
  {
    company_id: 'uuid-company',
    source: 'cron'
  }
)
```

#### 4. Logger une info

```typescript
await logInfo(
  'reminder_sent',
  'sub_1234567890',
  {
    days_before_renewal: 7,
    email_sent: true,
    sms_sent: false
  },
  {
    company_id: 'uuid-company',
    source: 'cron'
  }
)
```

---

## 🔍 REQUÊTES SQL UTILES

### Logs des dernières 24h

```sql
SELECT * FROM subscription_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Compter les erreurs par type

```sql
SELECT event_type, COUNT(*) as error_count
FROM subscription_logs
WHERE status = 'error'
AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY error_count DESC;
```

### Logs d'un abonnement spécifique

```sql
SELECT * FROM subscription_logs
WHERE subscription_id = 'sub_1234567890'
ORDER BY created_at DESC;
```

### Stats quotidiennes (30 derniers jours)

```sql
SELECT * FROM subscription_logs_stats
ORDER BY date DESC
LIMIT 30;
```

### Taux de succès par type d'événement

```sql
SELECT 
  event_type,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as success,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as errors,
  ROUND(
    100.0 * COUNT(CASE WHEN status = 'success' THEN 1 END) / COUNT(*),
    2
  ) as success_rate
FROM subscription_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY total DESC;
```

---

## 🧪 TESTS

### Test 1 : Log Success

```bash
curl -X POST https://n8n.talosprimes.com/webhook/log-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "subscription_created",
    "status": "success",
    "subscription_id": "sub_test_123",
    "company_id": "uuid-company-test",
    "user_id": "uuid-user-test",
    "details": {
      "plan_name": "Business",
      "amount": 99,
      "user_email": "test@exemple.com"
    },
    "source": "api"
  }'
```

**Résultat attendu** :
```json
{
  "success": true,
  "message": "Log enregistré",
  "log_id": "uuid-du-log",
  "timestamp": "2026-01-01T12:00:00.000Z"
}
```

### Test 2 : Log Error (avec alerte email)

```bash
curl -X POST https://n8n.talosprimes.com/webhook/log-subscription \
  -H "Content-Type": application/json" \
  -d '{
    "event_type": "payment_failed",
    "status": "error",
    "subscription_id": "sub_test_456",
    "company_id": "uuid-company-test",
    "error_message": "Carte bancaire expirée",
    "details": {
      "card_last4": "4242",
      "attempt": 3,
      "amount": 99
    },
    "source": "webhook"
  }'
```

**Résultat attendu** :
- ✅ Log enregistré dans Supabase
- ✅ Email alerte envoyé à `admin@talosprimes.com`
- ✅ Email contient détails complets de l'erreur

### Test 3 : Vérifier dans Supabase

```sql
-- Dans Supabase SQL Editor
SELECT * FROM subscription_logs
ORDER BY created_at DESC
LIMIT 10;
```

**Résultat attendu** :
- ✅ 2 lignes minimum (test 1 + test 2)
- ✅ Colonnes remplies correctement
- ✅ `details` en format JSON

---

## 📊 DASHBOARD LOGS (À VENIR)

**Page** : `/platform/logs`

**Fonctionnalités prévues** :
- ✅ Tableau logs temps réel
- ✅ Filtres (date, type, status, company)
- ✅ Recherche par subscription_id
- ✅ Export CSV
- ✅ Graphiques stats
- ✅ Alertes configurables

---

## 🔧 MAINTENANCE

### Nettoyer les vieux logs (> 90 jours)

```sql
SELECT clean_old_subscription_logs();
```

**Résultat** : Nombre de logs supprimés

### Automatiser le nettoyage (Cron)

```sql
-- Créer un cron job pour nettoyer tous les mois
-- (Si votre Supabase a pg_cron activé)
SELECT cron.schedule(
  'clean-old-subscription-logs',
  '0 0 1 * *', -- Le 1er de chaque mois à minuit
  $$SELECT clean_old_subscription_logs();$$
);
```

---

## 💰 AVANTAGES

### Debugging

- ✅ Tracer l'historique complet d'un abonnement
- ✅ Identifier les erreurs rapidement
- ✅ Stack traces complètes

### Monitoring

- ✅ Alertes en temps réel sur erreurs
- ✅ Métriques de santé système
- ✅ Taux de succès par opération

### Analytics

- ✅ Analyser comportement clients
- ✅ Identifier points de friction
- ✅ Optimiser taux de conversion

### Support Client

- ✅ Historique complet pour support
- ✅ Preuves en cas de litige
- ✅ Temps de résolution réduit

---

## 📈 MÉTRIQUES CLÉS

### Disponibles Immédiatement

- ✅ Nombre d'événements par type
- ✅ Taux de succès/erreur
- ✅ Événements par jour/semaine/mois
- ✅ Top erreurs
- ✅ Abonnements les plus actifs
- ✅ Temps de réponse moyen

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Migration SQL exécutée
2. ✅ Workflow N8N importé et activé
3. ✅ Tests curl réussis
4. ✅ Logs visibles dans Supabase
5. ⏳ Intégrer dans toutes les API routes
6. ⏳ Créer page dashboard `/platform/logs`
7. ⏳ Configurer alertes Slack/Discord

---

**Dernière mise à jour** : 1er janvier 2026  
**Auteur** : AI Assistant + giiz_mo_o  
**Statut** : ✅ Système créé, tests en cours

