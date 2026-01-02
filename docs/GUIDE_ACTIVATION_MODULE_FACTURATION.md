# 📋 GUIDE D'ACTIVATION - Module Facturation

**Date** : 2 Janvier 2026  
**Durée** : 30 minutes  
**Niveau** : Facile

---

## 🎯 OBJECTIF

Activer le module Facturation pour pouvoir créer des devis et factures directement dans l'application.

---

## 📦 CE QUE VOUS ALLEZ ACTIVER

✅ **Interface de facturation** : `/facturation`  
✅ **Création de devis** automatique  
✅ **Création de factures** automatique  
✅ **Envoi automatique par email** (via N8N)  
✅ **Génération PDF** automatique  
✅ **Relances automatiques** (J-3 pour devis, multi-niveaux pour factures)  
✅ **Statistiques en temps réel**

---

## 📋 PRÉ-REQUIS

### Vérifier que vous avez :
- ✅ Accès à Supabase (https://supabase.com)
- ✅ Accès à N8N (https://n8n.talosprimes.com)
- ✅ Accès à l'interface Modules (`/platform/modules`)

---

## 🚀 ÉTAPE 1 : INSTALLATION BASE DE DONNÉES (10 min)

### 1.1 Connexion Supabase

```
1. Ouvrir : https://supabase.com
2. Se connecter
3. Sélectionner projet "Talosprime"
4. Menu gauche : SQL Editor
5. Cliquer : "New query"
```

### 1.2 Exécuter Migration

**Copier-coller le contenu complet du fichier** :  
`database/create_billing_module.sql`

Puis cliquer **"Run"** (ou `Ctrl + Enter`)

**✅ Vérification** :

```sql
-- Vérifier que les tables sont créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'billing%'
ORDER BY table_name;
```

**Résultat attendu** : 7 tables
- `billing_documents`
- `billing_document_items`
- `billing_payments`
- `billing_sequences`
- `billing_settings`
- `billing_ereporting`
- `billing_platform_logs`

### 1.3 Insérer Paramètres par Défaut

```sql
-- Insérer les paramètres de facturation pour votre entreprise
INSERT INTO billing_settings (
  company_id,
  quote_prefix,
  invoice_prefix,
  credit_note_prefix,
  default_tax_rate,
  default_payment_terms,
  default_due_days,
  default_quote_validity_days,
  company_legal_name,
  company_email
)
SELECT 
  id,
  'DEV',
  'FAC',
  'AVO',
  20.00,
  'Paiement sous 30 jours',
  30,
  30,
  name,
  'contact@talosprimes.com'
FROM companies
WHERE id NOT IN (SELECT company_id FROM billing_settings)
ON CONFLICT (company_id) DO NOTHING;
```

**✅ Base de données installée !**

---

## 🔌 ÉTAPE 2 : ACTIVATION N8N WORKFLOWS (15 min)

### 2.1 Connexion N8N

```
URL: https://n8n.talosprimes.com
Se connecter avec vos identifiants
```

### 2.2 Configurer Credentials (Une seule fois)

#### A. Supabase Service Key

```
1. N8N > Menu utilisateur (en haut à droite) > Credentials
2. Cliquer "Add Credential"
3. Rechercher : "HTTP Header"
4. Sélectionner : "HTTP Header Auth"
5. Remplir :
   Name : Supabase Service Key
   Header Name : apikey
   Header Value : [COLLER votre clé]
   
   Pour récupérer la clé :
   - Aller sur Supabase > Settings > API
   - Copier "service_role" (secret key)
   - Commence par : eyJ...
   
6. Save
```

#### B. Resend SMTP

```
1. Credentials > Add Credential
2. Rechercher : "SMTP"
3. Remplir :
   Name : Resend SMTP
   Host : smtp.resend.com
   Port : 465
   Secure : ✅ (cocher SSL/TLS)
   User : resend
   Password : [Votre clé API Resend]
   From Email : noreply@talosprimes.com
   
   Pour récupérer la clé :
   - Aller sur https://resend.com/api-keys
   - Copier votre clé (commence par re_...)
   
4. Save
```

### 2.3 Importer les 6 Workflows

**Localisation des fichiers** : `n8n-workflows/facturation/`

#### Workflow 1/6 : Envoyer Devis

```
1. Menu : Workflows > Add Workflow > Import from File
2. Fichier : n8n-workflows/facturation/envoyer-devis.json
3. Configurer les nodes :
   - Node "Récupérer Document" → Credentials : Supabase Service Key
   - Node "Envoyer Email Devis" → Credentials : Resend SMTP
4. Save (Ctrl+S)
5. Toggle "Inactive" → "Active" (en haut à droite, doit être VERT)
```

#### Workflow 2/6 : Envoyer Facture

```
1. Import : n8n-workflows/facturation/envoyer-facture.json
2. Configurer credentials (Supabase + Resend)
3. Save + Active
```

#### Workflow 3/6 : Confirmation Paiement

```
1. Import : n8n-workflows/facturation/confirmation-paiement.json
2. Configurer credentials
3. Save + Active
```

#### Workflow 4/6 : Relance Devis J-3

```
1. Import : n8n-workflows/facturation/relance-devis-j3.json
2. Configurer credentials
3. Vérifier Cron : "0 9 * * *" (9h tous les jours)
4. Save + Active ⚠️ IMPORTANT
```

#### Workflow 5/6 : Relances Factures

```
1. Import : n8n-workflows/facturation/relance-factures-impayees.json
2. Configurer credentials (4 nodes email)
3. Vérifier Cron : "0 10 * * *" (10h tous les jours)
4. Save + Active ⚠️ IMPORTANT
```

#### Workflow 6/6 : Générer PDF

```
1. Import : n8n-workflows/facturation/generer-pdf-document.json
2. Configurer credentials
3. Save + Active
```

### 2.4 Vérification

**Dans N8N, Menu Workflows, vous devez voir** :

```
✅ Envoyer Devis (Active)
✅ Envoyer Facture (Active)
✅ Confirmation Paiement (Active)
✅ Relance Devis J-3 (Active)
✅ Relances Factures (Active)
✅ Générer PDF (Active)
```

**✅ Workflows configurés !**

---

## 🎛️ ÉTAPE 3 : ACTIVATION MODULE DANS L'APPLICATION (5 min)

### 3.1 Accéder à l'interface Modules

```
1. Se connecter à https://www.talosprimes.com
2. Aller dans : Menu > Modules
   OU directement : https://www.talosprimes.com/platform/modules
```

### 3.2 Activer le Module Facturation

```
1. Trouver le client (ou votre entreprise)
2. Chercher la carte "Facturation"
   Description : "Gestion des devis, factures et paiements"
3. Cliquer sur le bouton Toggle (à droite)
4. Le statut doit passer de "Inactif" à "Actif" (vert)
```

**✅ Module activé !**

### 3.3 Accéder au Module

```
1. Menu de navigation > Facturation
   OU directement : https://www.talosprimes.com/facturation
```

**Vous devriez voir** :
- 📊 Statistiques (CA, en attente, devis, factures)
- 📝 Liste des documents (vide au début)
- ➕ Bouton "Nouveau" pour créer

**✅ Module accessible !**

---

## 🧪 ÉTAPE 4 : TEST COMPLET (5 min)

### 4.1 Créer un Devis de Test (via API)

```bash
curl -X POST https://www.talosprimes.com/api/billing/documents/create \
  -H "Content-Type: application/json" \
  -H "Cookie: [votre-cookie-session]" \
  -d '{
    "document_type": "quote",
    "customer_name": "Client Test",
    "customer_email": "meddecyril@icloud.com",
    "customer_address": "123 Rue Test, 75001 Paris",
    "customer_siren": "123456789",
    "operation_category": "both",
    "subtotal": 1000,
    "tax_rate": 20,
    "tax_amount": 200,
    "total_amount": 1200,
    "notes": "Devis de test"
  }'
```

**Résultat attendu** :

```json
{
  "success": true,
  "data": {
    "id": "xxx-xxx-xxx",
    "document_number": "DEV-2026-0001",
    "status": "draft",
    ...
  },
  "message": "Devis DEV-2026-0001 créé avec succès"
}
```

### 4.2 Vérifier dans l'Interface

```
1. Aller sur /facturation
2. Vous devriez voir le devis "DEV-2026-0001"
3. Statut : Brouillon
```

### 4.3 Envoyer le Devis (Test N8N)

```bash
# Remplacer [document_id] par l'ID reçu ci-dessus
curl -X POST https://n8n.talosprimes.com/webhook/envoyer-devis \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "[document_id]",
    "customer_email": "meddecyril@icloud.com",
    "customer_name": "Client Test"
  }'
```

**✅ Vérifications** :
- ✉️ Email reçu dans votre boîte mail
- 📄 Email contient le devis en pièce jointe (ou lien PDF)
- 📊 Statut du devis passe à "Envoyé" dans l'interface

### 4.4 Vérifier les Logs

```
1. Aller sur /platform/logs
2. Filtrer : action contient "devis"
3. Vous devriez voir :
   - ✅ "Document créé : DEV-2026-0001"
   - ✅ "Devis envoyé : DEV-2026-0001"
```

**✅ Module 100% Fonctionnel !**

---

## 📊 CE QUI EST MAINTENANT ACTIF

### Fonctionnalités Disponibles

#### 1. Interface Web (`/facturation`)
- ✅ Tableau de bord avec statistiques
- ✅ Liste des documents (devis, factures, avoirs)
- ✅ Filtres par type et statut
- ✅ Recherche par client/numéro
- ✅ Envoi direct depuis l'interface

#### 2. API Routes
- ✅ `POST /api/billing/documents/create` - Créer document
- ✅ `GET /api/billing/documents` - Lister documents
- ✅ `GET /api/billing/documents/[id]` - Détails document
- ✅ `PATCH /api/billing/documents/[id]` - Modifier document
- ✅ `DELETE /api/billing/documents/[id]` - Supprimer document
- ✅ `POST /api/billing/documents/[id]/convert` - Convertir devis en facture
- ✅ `POST /api/billing/payments/create` - Enregistrer paiement
- ✅ `GET /api/billing/stats` - Statistiques

#### 3. Workflows N8N (Automatisations)
- ✅ Envoi automatique devis par email
- ✅ Envoi automatique factures par email
- ✅ Confirmation paiement par email
- ✅ Génération PDF automatique
- ✅ Relance devis J-3 (cron 9h)
- ✅ Relances factures impayées (cron 10h, 4 niveaux)

#### 4. Base de Données
- ✅ `billing_documents` - Documents principaux
- ✅ `billing_document_items` - Lignes de détail
- ✅ `billing_payments` - Historique paiements
- ✅ `billing_sequences` - Numérotation automatique
- ✅ `billing_settings` - Paramètres par entreprise
- ✅ Triggers auto-calcul
- ✅ RLS (sécurité multi-tenant)

---

## 🎯 PROCHAINES ÉTAPES

### Développement Interface (Optionnel)

1. **Modal de création** : Formulaire complet pour créer devis/factures
2. **Gestion des items** : Ajouter lignes de produits/services
3. **Vue PDF** : Prévisualisation avant envoi
4. **Paramètres** : Interface pour modifier `billing_settings`

### Utilisation Quotidienne

1. **Créer devis** → Client reçoit email automatiquement
2. **Convertir en facture** → Un clic
3. **Enregistrer paiement** → Statut mis à jour automatiquement
4. **Relances** → 100% automatiques via N8N

---

## 🆘 SUPPORT

### Erreurs Fréquentes

#### "Erreur lors de l'envoi"
- Vérifier credentials N8N (Resend SMTP)
- Vérifier workflow est bien "Active"

#### "Document non créé"
- Vérifier base de données installée
- Vérifier `billing_settings` existe pour votre company

#### "Email non reçu"
- Vérifier spam/courrier indésirable
- Vérifier logs N8N (Executions)
- Vérifier clé API Resend valide

### Logs à Consulter

**N8N** :
```
Menu Workflows > [Workflow] > Executions
```

**Base de données** :
```
Supabase > Logs > Database
```

**Application** :
```
/platform/logs (filtre: "billing" ou "factur")
```

---

## 📞 CONTACT

**Email** : support@talosprimes.com  
**Documentation complète** : `/docs/MODULE_FACTURATION_PLAN_COMPLET.md`

---

## ✅ CHECKLIST FINALE

- [ ] Base de données installée (7 tables)
- [ ] `billing_settings` inséré
- [ ] Credentials N8N configurées (Supabase + Resend)
- [ ] 6 workflows importés et actifs
- [ ] Module activé dans `/platform/modules`
- [ ] Interface `/facturation` accessible
- [ ] Test création devis réussi
- [ ] Test envoi email réussi
- [ ] Logs visibles dans `/platform/logs`

---

**🎉 MODULE FACTURATION 100% OPÉRATIONNEL !**

**Temps total** : ~30 minutes  
**Complexité** : ⭐⭐☆☆☆ (Facile)


