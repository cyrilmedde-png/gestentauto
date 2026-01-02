# 🚀 DÉPLOIEMENT MODULE FACTURATION - Instructions Complètes

Date: 2026-01-01

---

## 📋 ÉTAPES DE DÉPLOIEMENT

### ÉTAPE 1 : Migrations SQL (Supabase)
### ÉTAPE 2 : Déploiement VPS (Code)
### ÉTAPE 3 : Configuration N8N (Workflows)
### ÉTAPE 4 : Tests de Vérification

---

## 🗄️ ÉTAPE 1 : MIGRATIONS SQL (15 min)

### 1.1 Connexion Supabase

```
1. Ouvrir : https://supabase.com
2. Se connecter
3. Sélectionner projet Talosprime
4. Menu : SQL Editor
```

### 1.2 Exécuter Migration 1 - Tables Facturation

```sql
-- Copier-coller le contenu de:
-- database/create_billing_module.sql

-- OU exécuter via terminal:
```

**Fichier**: `database/create_billing_module.sql` (879 lignes)

**Contenu**: 
- 7 tables (billing_documents, billing_document_items, billing_sequences, billing_payments, billing_settings, billing_ereporting, billing_platform_logs)
- 6 fonctions SQL
- 5 triggers
- RLS policies

**Vérification**:
```sql
-- Vérifier tables créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'billing%';

-- Devrait afficher 7 tables
```

### 1.3 Exécuter Migration 2 - Facturation Électronique

**Fichier**: `database/add_electronic_invoicing.sql` (472 lignes)

**Contenu**:
- Nouvelles colonnes (customer_siren, operation_category, electronic_format...)
- Table billing_ereporting
- Table billing_platform_logs
- Fonctions validation SIREN
- Triggers validation

**Vérification**:
```sql
-- Vérifier colonnes ajoutées
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'billing_documents' 
AND column_name IN ('customer_siren', 'electronic_format');

-- Devrait afficher 2 colonnes
```

### 1.4 Insérer Settings par Défaut

```sql
-- Insérer billing_settings pour votre entreprise
INSERT INTO billing_settings (
  company_id,
  quote_prefix,
  invoice_prefix,
  credit_note_prefix,
  proforma_prefix,
  purchase_invoice_prefix,
  default_tax_rate,
  default_payment_terms,
  default_due_days,
  default_quote_validity_days,
  company_legal_name,
  company_address,
  company_email,
  edp_enabled,
  edp_default_format,
  ereporting_enabled
)
SELECT 
  id,
  'DEV',
  'FAC',
  'AVO',
  'PRO',
  'ACH',
  20.00,
  'Paiement sous 30 jours',
  30,
  30,
  'Talosprime',
  '123 Rue Example, 75001 Paris',
  'contact@talosprimes.com',
  true,
  'factur-x',
  true
FROM companies
WHERE id = (SELECT company_id FROM users WHERE email = 'groupemclem@gmail.com')
ON CONFLICT (company_id) DO NOTHING;
```

**✅ Migrations SQL Terminées !**

---

## 💻 ÉTAPE 2 : DÉPLOIEMENT VPS (10 min)

### 2.1 SSH Connexion

```bash
ssh root@62.171.152.132
```

### 2.2 Naviguer vers le Projet

```bash
cd /var/www/talosprime
```

### 2.3 Pull Derniers Changements

```bash
git pull origin main
```

**Output attendu**:
```
From github.com:cyrilmedde-png/gestentauto
 * branch            main       -> FETCH_HEAD
Updating bf45123..af30249
Fast-forward
 [Liste des fichiers modifiés]
```

### 2.4 Vérifier Fichiers Reçus

```bash
# Vérifier API routes
ls -la app/api/billing/
ls -la app/api/billing/documents/
ls -la app/api/billing/items/
ls -la app/api/billing/payments/

# Vérifier service
ls -la lib/services/billing.ts

# Vérifier workflows N8N
ls -la n8n-workflows/facturation/

# Vérifier SQL
ls -la database/create_billing_module.sql
ls -la database/add_electronic_invoicing.sql
```

### 2.5 Installer Dépendances (si nouvelles)

```bash
npm install
```

### 2.6 Build Production

```bash
npm run build
```

**⚠️ Vérifier qu'il n'y a pas d'erreurs !**

**Output attendu**:
```
✓ Compiled successfully
Route (app)                              Size     First Load JS
...
✓ Built in XXs
```

### 2.7 Redémarrer PM2

```bash
pm2 restart talosprime
```

### 2.8 Vérifier Logs

```bash
pm2 logs talosprime --lines 50
```

**✅ Vérifier aucune erreur !**

### 2.9 Vérifier Status

```bash
pm2 status
```

**Output attendu**:
```
┌─────┬──────────────┬─────────┬─────────┬─────────┐
│ id  │ name         │ status  │ restart │ uptime  │
├─────┼──────────────┼─────────┼─────────┼─────────┤
│ 0   │ talosprime   │ online  │ 0       │ 0s      │
└─────┴──────────────┴─────────┴─────────┴─────────┘
```

**✅ Déploiement VPS Terminé !**

---

## 🔄 ÉTAPE 3 : CONFIGURATION N8N (20 min)

### 3.1 Connexion N8N

```
URL: https://n8n.talosprimes.com
User: [votre email]
Pass: [votre mot de passe]
```

### 3.2 Configurer Credentials

#### A. Supabase Service Key

```
1. Menu : Credentials > New
2. Type : "HTTP Header Auth"
3. Name : "Supabase Service Key"
4. Header Name : "apikey"
5. Header Value : [Votre supabase service_role key]
   - Récupérer dans Supabase > Settings > API > service_role key
6. Save
```

#### B. Resend SMTP

```
1. Menu : Credentials > New
2. Type : "SMTP"
3. Name : "Resend SMTP"
4. Host : smtp.resend.com
5. Port : 465
6. Secure : true (SSL/TLS)
7. User : resend
8. Password : [Votre clé API Resend]
   - Récupérer dans https://resend.com/api-keys
9. From Email : noreply@talosprimes.com
10. Save
```

### 3.3 Importer Workflows (6 workflows)

**Pour chaque workflow** :

#### Workflow 1 : Envoyer Devis

```
1. Menu : Workflows > Import from File
2. Sélectionner : n8n-workflows/facturation/envoyer-devis.json
3. Une fois importé :
   - Vérifier node "Envoyer Email Devis" : credentials = "Resend SMTP"
   - Vérifier node "Récupérer Document" : credentials = "Supabase Service Key"
4. Save (Ctrl+S)
5. Toggle "Active" en haut à droite
6. Copier URL webhook : https://n8n.talosprimes.com/webhook/envoyer-devis
```

#### Workflow 2 : Envoyer Facture

```
1. Import : n8n-workflows/facturation/envoyer-facture.json
2. Vérifier credentials (SMTP + Supabase)
3. Save + Active
4. URL : https://n8n.talosprimes.com/webhook/envoyer-facture
```

#### Workflow 3 : Confirmation Paiement

```
1. Import : n8n-workflows/facturation/confirmation-paiement.json
2. Vérifier credentials
3. Save + Active
4. URL : https://n8n.talosprimes.com/webhook/confirmation-paiement
```

#### Workflow 4 : Relance Devis J-3

```
1. Import : n8n-workflows/facturation/relance-devis-j3.json
2. Vérifier credentials
3. Vérifier Cron : "0 9 * * *" (tous les jours à 9h)
4. Save + Active ⚠️ IMPORTANT
```

#### Workflow 5 : Relances Factures

```
1. Import : n8n-workflows/facturation/relance-factures-impayees.json
2. Vérifier credentials
3. Vérifier Cron : "0 10 * * *" (tous les jours à 10h)
4. Save + Active ⚠️ IMPORTANT
```

#### Workflow 6 : Générer PDF

```
1. Import : n8n-workflows/facturation/generer-pdf-document.json
2. Vérifier credentials
3. Save + Active
4. URL : https://n8n.talosprimes.com/webhook/generer-pdf
```

### 3.4 Vérifier Tous les Workflows

```
Menu : Workflows
Vérifier que les 6 workflows sont :
✅ Active (toggle vert)
✅ Sans erreur (pas d'icône rouge)
```

**✅ N8N Configuré !**

---

## 🧪 ÉTAPE 4 : TESTS DE VÉRIFICATION (15 min)

### 4.1 Test API Documents

```bash
# Créer un devis de test
curl -X POST https://www.talosprimes.com/api/billing/documents/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [votre-token]" \
  -d '{
    "document_type": "quote",
    "customer_name": "Client Test",
    "customer_email": "test@example.com",
    "customer_siren": "123456789",
    "operation_category": "both",
    "subtotal": 1000,
    "tax_rate": 20,
    "tax_amount": 200,
    "total_amount": 1200
  }'
```

**✅ Vérifier réponse** : `{ success: true, data: {...}, message: "..." }`

### 4.2 Test Envoi Devis (N8N)

```bash
# Remplacer [document_id] par l'ID reçu ci-dessus
curl -X POST https://n8n.talosprimes.com/webhook/envoyer-devis \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "[document_id]",
    "customer_email": "meddecyril@icloud.com",
    "customer_name": "Test Client"
  }'
```

**✅ Vérifier** :
- Réponse : `{ success: true, message: "..." }`
- Email reçu dans boîte mail
- Log créé dans `/platform/logs`

### 4.3 Test Génération PDF (N8N)

```bash
curl -X POST https://n8n.talosprimes.com/webhook/generer-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "[document_id]"
  }'
```

**✅ Vérifier** :
- Réponse : `{ success: true, pdf_url: "...", document_number: "..." }`
- Log créé

### 4.4 Test Paiement

```bash
# Créer une facture d'abord
curl -X POST https://www.talosprimes.com/api/billing/documents/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [votre-token]" \
  -d '{
    "document_type": "invoice",
    "customer_name": "Client Test",
    "customer_email": "test@example.com",
    "total_amount": 1500,
    "due_date": "2026-02-01"
  }'

# Enregistrer paiement
curl -X POST https://www.talosprimes.com/api/billing/payments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [votre-token]" \
  -d '{
    "document_id": "[invoice_id]",
    "amount": 1500,
    "payment_method": "bank_transfer"
  }'
```

**✅ Vérifier** :
- Paiement enregistré
- Statut facture = 'paid'
- paid_at mis à jour

### 4.5 Test Stats

```bash
curl https://www.talosprimes.com/api/billing/stats \
  -H "Authorization: Bearer [votre-token]"
```

**✅ Vérifier** :
- Réponse avec statistiques complètes
- Revenue, pending invoices, quotes, etc.

### 4.6 Vérifier Logs Application

```
1. Ouvrir : https://www.talosprimes.com/platform/logs
2. Filtrer : action contient "devis" ou "facture"
3. Vérifier présence des logs de test
```

### 4.7 Vérifier Base de Données

```sql
-- Supabase SQL Editor

-- Compter documents créés
SELECT document_type, COUNT(*) 
FROM billing_documents 
GROUP BY document_type;

-- Vérifier dernier document
SELECT * FROM billing_documents 
ORDER BY created_at DESC 
LIMIT 5;

-- Vérifier séquences
SELECT * FROM billing_sequences;

-- Vérifier settings
SELECT * FROM billing_settings;
```

**✅ Tests Terminés !**

---

## ✅ CHECKLIST FINALE

### Base de Données
- [ ] Tables billing créées (7 tables)
- [ ] Fonctions SQL créées (6 fonctions)
- [ ] Triggers créés (5 triggers)
- [ ] RLS activé
- [ ] billing_settings inséré

### VPS
- [ ] Code déployé (git pull)
- [ ] Build réussi (npm run build)
- [ ] PM2 redémarré
- [ ] Logs PM2 sans erreur
- [ ] Status PM2 = online

### N8N
- [ ] Credentials Supabase configurées
- [ ] Credentials Resend configurées
- [ ] 6 workflows importés
- [ ] 6 workflows actifs (toggle vert)
- [ ] 2 crons actifs (9h et 10h)
- [ ] URLs webhooks notées

### Tests
- [ ] API create document OK
- [ ] Workflow envoi devis OK
- [ ] Email reçu
- [ ] Workflow génération PDF OK
- [ ] API paiement OK
- [ ] API stats OK
- [ ] Logs visibles dans /platform/logs
- [ ] Base de données cohérente

---

## 🎉 DÉPLOIEMENT TERMINÉ !

**Module Facturation 100% Opérationnel !** ✅

### 📊 Fonctionnalités Disponibles

✅ **Backend API** (12 routes)
✅ **Workflows N8N** (6 workflows)
✅ **Emails Automatiques** (8 templates)
✅ **Relances Automatiques** (4 niveaux)
✅ **Génération PDF** (template A4)
✅ **Logs Centralisés**
✅ **Conformité E-invoicing**

---

## 📞 SUPPORT

### En Cas de Problème

**Logs PM2** :
```bash
pm2 logs talosprime --lines 100
```

**Logs N8N** :
Menu N8N > Executions > Voir détails

**Logs SQL** :
Supabase > Logs > Database

**Contact** :
Copier logs + screenshot + envoyer

---

## 📚 DOCUMENTATION

- **API Routes** : `docs/MODULE_FACTURATION_PLAN_COMPLET.md`
- **E-invoicing** : `docs/FACTURATION_ELECTRONIQUE_OBLIGATOIRE.md`
- **Workflows N8N** : `docs/WORKFLOWS_N8N_FACTURATION.md`
- **Récapitulatif** : `docs/RECAPITULATIF_FACTURATION_COMPLETE.md`

---

**TOUT EST PRÊT ! 🚀**

