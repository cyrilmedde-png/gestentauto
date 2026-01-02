# 🔗 API N8N - Routes Dédiées

Date: 2026-01-02

---

## 📋 ROUTES API CRÉÉES

Toutes les routes sont sous `/api/n8n/` et utilisent l'authentification par header `apikey`.

---

## 🔑 AUTHENTIFICATION

**Header requis** :
```
apikey: [votre SUPABASE_SERVICE_ROLE_KEY]
```

**Exemple avec curl** :
```bash
curl https://www.talosprimes.com/api/n8n/billing/documents/[id] \
  -H "apikey: eyJhbGc..."
```

---

## 📄 ROUTES DOCUMENTS

### 1. GET /api/n8n/billing/documents/[id]

**Description** : Récupère un document avec ses items

**Headers** :
```
apikey: eyJhbGc...
```

**Response** :
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "document_number": "FAC-2024-001",
    "document_type": "invoice",
    "customer_name": "Client Test",
    "customer_email": "client@example.com",
    "total_amount": 1200.00,
    "items": [
      {
        "id": "uuid",
        "name": "Produit 1",
        "quantity": 2,
        "unit_price": 500.00,
        "total": 1000.00
      }
    ]
  }
}
```

**Utilisé par workflows** :
- envoyer-devis.json
- envoyer-facture.json
- confirmation-paiement.json
- generer-pdf-document.json

---

### 2. PUT /api/n8n/billing/documents/[id]/status

**Description** : Met à jour le statut d'un document

**Headers** :
```
apikey: eyJhbGc...
Content-Type: application/json
```

**Body** :
```json
{
  "status": "sent",
  "sent_at": "2026-01-02T10:00:00Z"
}
```

**Response** :
```json
{
  "success": true,
  "data": { ...document },
  "message": "Statut mis à jour"
}
```

**Utilisé par workflows** :
- envoyer-facture.json (met status = "sent")

---

### 3. PUT /api/n8n/billing/documents/[id]/pdf

**Description** : Met à jour l'URL du PDF généré

**Headers** :
```
apikey: eyJhbGc...
Content-Type: application/json
```

**Body** :
```json
{
  "pdf_url": "https://example.com/pdfs/facture-001.pdf"
}
```

**Response** :
```json
{
  "success": true,
  "data": { ...document },
  "message": "URL PDF mise à jour"
}
```

**Utilisé par workflows** :
- generer-pdf-document.json

---

## ⚙️ ROUTES SETTINGS

### 4. GET /api/n8n/billing/settings/[company_id]

**Description** : Récupère les paramètres de facturation d'une entreprise

**Headers** :
```
apikey: eyJhbGc...
```

**Response** :
```json
{
  "success": true,
  "data": {
    "company_id": "uuid",
    "company_legal_name": "Talosprime",
    "company_address": "123 Rue Example, 75001 Paris",
    "company_email": "contact@talosprimes.com",
    "company_phone": "+33 1 23 45 67 89",
    "vat_number": "FR12345678901",
    "iban": "FR76...",
    "bic": "BNPAFRPP",
    "default_tax_rate": 20.00,
    "default_payment_terms": "Paiement sous 30 jours",
    "invoice_prefix": "FAC",
    "quote_prefix": "DEV"
  }
}
```

**Utilisé par workflows** :
- generer-pdf-document.json (pour afficher infos entreprise dans PDF)

---

## 📊 ROUTES CRON

### 5. GET /api/n8n/billing/quotes/expiring

**Description** : Récupère les devis expirant dans X jours

**Headers** :
```
apikey: eyJhbGc...
```

**Query params** :
```
?days=3 (optionnel, défaut: 3)
```

**Response** :
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "uuid",
      "document_number": "DEV-2024-001",
      "customer_name": "Client A",
      "customer_email": "clienta@example.com",
      "total_amount": 1500.00,
      "valid_until": "2026-01-05"
    }
  ]
}
```

**Utilisé par workflows** :
- relance-devis-j3.json (cron quotidien 9h)

---

### 6. GET /api/n8n/billing/invoices/reminders

**Description** : Récupère toutes les factures impayées pour relances

**Headers** :
```
apikey: eyJhbGc...
```

**Response** :
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "uuid",
      "document_number": "FAC-2024-001",
      "customer_name": "Client B",
      "customer_email": "clientb@example.com",
      "total_amount": 2000.00,
      "paid_amount": 0,
      "due_date": "2025-12-01",
      "status": "overdue"
    }
  ]
}
```

**Utilisé par workflows** :
- relance-factures-impayees.json (cron quotidien 10h)

---

## 🔒 SÉCURITÉ

### Authentification

Toutes les routes vérifient que :
1. ✅ Le header `apikey` est présent
2. ✅ La valeur correspond à `SUPABASE_SERVICE_ROLE_KEY`
3. ✅ Sinon : `401 Unauthorized`

### Bypass RLS

Les routes utilisent `createAdminClient()` qui :
- ✅ Bypass les Row Level Security (RLS) de Supabase
- ✅ Accède à toutes les données (comme service_role)
- ⚠️ **IMPORTANT** : Ne jamais exposer ces routes sans authentification !

---

## 📝 UTILISATION DANS N8N

### Configuration des nodes HTTP Request

Pour **TOUS** les workflows, utiliser ces URLs :

#### Récupérer un document :
```
URL : https://www.talosprimes.com/api/n8n/billing/documents/{{ $json.body.document_id }}
Method : GET
Authentication : Header Auth
Credential : Supabase Service Key
```

#### Mettre à jour statut :
```
URL : https://www.talosprimes.com/api/n8n/billing/documents/{{ $json.body.document_id }}/status
Method : PUT
Authentication : Header Auth
Credential : Supabase Service Key
Body : {
  "status": "sent",
  "sent_at": "{{ $now.toISOString() }}"
}
```

#### Récupérer settings :
```
URL : https://www.talosprimes.com/api/n8n/billing/settings/{{ $json.company_id }}
Method : GET
Authentication : Header Auth
Credential : Supabase Service Key
```

#### Récupérer devis expirants (cron) :
```
URL : https://www.talosprimes.com/api/n8n/billing/quotes/expiring?days=3
Method : GET
Authentication : Header Auth
Credential : Supabase Service Key
```

#### Récupérer factures impayées (cron) :
```
URL : https://www.talosprimes.com/api/n8n/billing/invoices/reminders
Method : GET
Authentication : Header Auth
Credential : Supabase Service Key
```

---

## 🧪 TESTS

### Test route document

```bash
# Récupérer un document
curl https://www.talosprimes.com/api/n8n/billing/documents/[uuid] \
  -H "apikey: [votre-service-role-key]"
```

### Test route settings

```bash
# Récupérer settings
curl https://www.talosprimes.com/api/n8n/billing/settings/[company-uuid] \
  -H "apikey: [votre-service-role-key]"
```

### Test route devis expirants

```bash
# Récupérer devis J-3
curl "https://www.talosprimes.com/api/n8n/billing/quotes/expiring?days=3" \
  -H "apikey: [votre-service-role-key]"
```

### Test route factures

```bash
# Récupérer factures impayées
curl https://www.talosprimes.com/api/n8n/billing/invoices/reminders \
  -H "apikey: [votre-service-role-key]"
```

---

## 📊 RÉCAPITULATIF

### Routes créées : 6

**Documents** (3) :
- ✅ `GET /api/n8n/billing/documents/[id]`
- ✅ `PUT /api/n8n/billing/documents/[id]/status`
- ✅ `PUT /api/n8n/billing/documents/[id]/pdf`

**Settings** (1) :
- ✅ `GET /api/n8n/billing/settings/[company_id]`

**Cron** (2) :
- ✅ `GET /api/n8n/billing/quotes/expiring`
- ✅ `GET /api/n8n/billing/invoices/reminders`

### Helpers créés : 7 fonctions

Fichier : `lib/services/n8n-helpers.ts`

- ✅ `verifyN8NAuth()` - Authentification
- ✅ `getDocumentForN8N()` - Récupérer document + items
- ✅ `getBillingSettingsForN8N()` - Récupérer settings
- ✅ `getExpiringQuotes()` - Devis expirants
- ✅ `getInvoicesForReminders()` - Factures impayées
- ✅ `updateDocumentStatus()` - Mettre à jour statut
- ✅ `updateDocumentPdfUrl()` - Mettre à jour PDF URL

---

## ✅ AVANTAGES

**Pour N8N** :
- ✅ Authentification simple (header apikey)
- ✅ Pas besoin de cookies/session
- ✅ Bypass RLS automatique
- ✅ Réponses JSON structurées

**Pour l'Application** :
- ✅ Routes séparées (pas de conflit avec routes utilisateurs)
- ✅ Sécurisé (vérification service_role key)
- ✅ Réutilisable pour tous les workflows
- ✅ Facile à tester

---

## 🚀 DÉPLOIEMENT

```bash
# VPS
cd /var/www/talosprime
git pull origin main
npm run build
pm2 restart talosprime
```

**Ensuite** : Mettre à jour les workflows N8N avec les nouvelles URLs !

---

**ROUTES N8N PRÊTES ! 🎉**

