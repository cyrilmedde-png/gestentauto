# 🔄 Configuration N8N - Module Facturation

Date: 2026-01-02

---

## 📋 ÉTAPES

### ÉTAPE 1 : Credentials (Supabase + Resend)
### ÉTAPE 2 : Import 6 Workflows
### ÉTAPE 3 : Activation & Tests

**Temps total**: ~20 minutes

---

## 🔑 ÉTAPE 1 : CONFIGURER LES CREDENTIALS (5 min)

### 1.1 Connexion N8N

```
URL: https://n8n.talosprimes.com
Email: [votre email admin]
Password: [votre mot de passe]
```

### 1.2 Créer Credential Supabase

```
1. Cliquer en haut à droite : Credentials > New
2. Rechercher : "HTTP Header Auth"
3. Cliquer dessus
4. Remplir :
   - Credential name: Supabase Service Key
   - Header Name: apikey
   - Header Value: [Votre service_role key]
5. Cliquer "Create"
```

**🔍 Où trouver la service_role key ?**
```
1. Ouvrir : https://supabase.com
2. Sélectionner projet Talosprime
3. Menu gauche : Settings > API
4. Section "Project API keys"
5. Copier "service_role key" (commence par eyJ...)
```

### 1.3 Créer Credential Resend SMTP

```
1. Credentials > New
2. Rechercher : "SMTP"
3. Cliquer dessus
4. Remplir :
   - Credential name: Resend SMTP
   - Host: smtp.resend.com
   - Port: 465
   - Secure Connection: ✅ (coché)
   - User: resend
   - Password: [Votre clé API Resend]
   - From Email: noreply@talosprimes.com
5. Cliquer "Create"
```

**🔍 Où trouver la clé API Resend ?**
```
1. Ouvrir : https://resend.com/api-keys
2. Copier votre clé API (commence par re_...)
```

**✅ Credentials configurées !**

---

## 📥 ÉTAPE 2 : IMPORTER LES 6 WORKFLOWS (10 min)

### Workflow 1 : 📋 Envoyer Devis

```
1. Menu : Workflows > Import from File
2. Sélectionner : n8n-workflows/facturation/envoyer-devis.json
3. Le workflow s'ouvre
4. Vérifier les nodes :
   
   Node "Envoyer Email Devis" :
   - Cliquer dessus
   - Section "Credentials"
   - Sélectionner : "Resend SMTP"
   
   Node "Récupérer Document" :
   - Cliquer dessus
   - Section "Credentials"
   - Sélectionner : "Supabase Service Key"
   
5. Save (Ctrl+S ou bouton "Save")
6. Toggle "Active" en haut à droite (doit devenir vert)
7. Copier URL webhook affichée : 
   https://n8n.talosprimes.com/webhook/envoyer-devis
```

### Workflow 2 : 💰 Envoyer Facture

```
1. Workflows > Import from File
2. Sélectionner : n8n-workflows/facturation/envoyer-facture.json
3. Vérifier nodes :
   - "Envoyer Email Facture" → Resend SMTP
   - "Récupérer Document" → Supabase Service Key
   - "Mettre à jour statut" → Supabase Service Key
4. Save
5. Toggle "Active"
6. URL : https://n8n.talosprimes.com/webhook/envoyer-facture
```

### Workflow 3 : ✅ Confirmation Paiement

```
1. Workflows > Import from File
2. Sélectionner : n8n-workflows/facturation/confirmation-paiement.json
3. Vérifier nodes :
   - "Envoyer Confirmation" → Resend SMTP
   - "Récupérer Document" → Supabase Service Key
4. Save
5. Toggle "Active"
6. URL : https://n8n.talosprimes.com/webhook/confirmation-paiement
```

### Workflow 4 : ⏰ Relance Devis J-3

```
1. Workflows > Import from File
2. Sélectionner : n8n-workflows/facturation/relance-devis-j3.json
3. Vérifier nodes :
   - "Récupérer Devis" → Supabase Service Key
   - "Email Relance" → Resend SMTP
4. Vérifier CRON :
   - Node "Cron Quotidien 9h"
   - Cliquer dessus
   - Mode: "Every Day"
   - Hour: 9
   - Minute: 0
5. Save
6. Toggle "Active" ⚠️ IMPORTANT
7. Le workflow se déclenchera automatiquement tous les jours à 9h
```

### Workflow 5 : 🔔 Relances Factures Multi-niveaux

```
1. Workflows > Import from File
2. Sélectionner : n8n-workflows/facturation/relance-factures-impayees.json
3. Vérifier nodes :
   - "Récupérer Factures" → Supabase Service Key
   - "Email Niveau 0" → Resend SMTP
   - "Email Niveau 1" → Resend SMTP
   - "Email Niveau 2" → Resend SMTP
   - "Email Niveau 3" → Resend SMTP
4. Vérifier CRON :
   - Node "Cron Quotidien 10h"
   - Mode: "Every Day"
   - Hour: 10
   - Minute: 0
5. Save
6. Toggle "Active" ⚠️ IMPORTANT
7. Le workflow se déclenchera automatiquement tous les jours à 10h
```

### Workflow 6 : 📄 Générer PDF

```
1. Workflows > Import from File
2. Sélectionner : n8n-workflows/facturation/generer-pdf-document.json
3. Vérifier nodes :
   - "Récupérer Document + Items" → Supabase Service Key
   - "Récupérer Paramètres" → Supabase Service Key
   - "Sauvegarder URL PDF" → Supabase Service Key
4. Save
5. Toggle "Active"
6. URL : https://n8n.talosprimes.com/webhook/generer-pdf
```

**✅ 6 Workflows importés et actifs !**

---

## ✅ ÉTAPE 3 : VÉRIFICATION (5 min)

### 3.1 Vérifier Liste Workflows

```
1. Menu : Workflows
2. Vous devez voir 6 workflows :
   ✅ envoyer-devis (Active)
   ✅ envoyer-facture (Active)
   ✅ confirmation-paiement (Active)
   ✅ relance-devis-j3 (Active)
   ✅ relance-factures-impayees (Active)
   ✅ generer-pdf-document (Active)
```

### 3.2 Vérifier Credentials

```
Menu : Credentials
Vous devez voir :
✅ Supabase Service Key (HTTP Header Auth)
✅ Resend SMTP (SMTP)
```

### 3.3 Test Rapide - Envoi Devis

**Option A : Via N8N (Recommandé)**

```
1. Ouvrir workflow "envoyer-devis"
2. Cliquer "Execute Workflow" (bouton en haut)
3. Dans le panneau "Webhook" à gauche
4. Cliquer "Test URL" (ou "Listen for Test Event")
5. Copier l'URL de test
6. Depuis un terminal local ou VPS :
```

```bash
curl -X POST https://n8n.talosprimes.com/webhook-test/envoyer-devis \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "test-id",
    "customer_email": "meddecyril@icloud.com",
    "customer_name": "Test Client"
  }'
```

**Option B : Test Production (après avoir créé un vrai devis)**

```bash
# D'abord créer un devis via API
# Puis tester l'envoi
curl -X POST https://n8n.talosprimes.com/webhook/envoyer-devis \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "[id-du-devis-créé]",
    "customer_email": "meddecyril@icloud.com",
    "customer_name": "Cyril Medde"
  }'
```

**Résultat attendu** :
- ✅ Dans N8N : Voir l'exécution réussie (vert)
- ✅ Email reçu dans boîte mail
- ✅ Log créé dans `/platform/logs`

---

## 🎯 RÉCAPITULATIF

### ✅ Ce qui est configuré

**Credentials** :
- ✅ Supabase Service Key (pour requêtes API)
- ✅ Resend SMTP (pour envoi emails)

**Workflows Webhooks** (3) :
- ✅ envoyer-devis → `/webhook/envoyer-devis`
- ✅ envoyer-facture → `/webhook/envoyer-facture`
- ✅ confirmation-paiement → `/webhook/confirmation-paiement`
- ✅ generer-pdf → `/webhook/generer-pdf`

**Workflows Crons** (2) :
- ✅ relance-devis-j3 → Tous les jours 9h
- ✅ relance-factures-impayees → Tous les jours 10h

**Automatisations** :
- ✅ Emails professionnels HTML
- ✅ Relances intelligentes
- ✅ Génération PDF A4
- ✅ Logging centralisé

---

## 🚀 PROCHAINES ÉTAPES

### Maintenant, vous pouvez :

1. **Créer un devis de test** :
   ```
   POST /api/billing/documents/create
   ```

2. **L'envoyer par email** :
   ```
   POST /webhook/envoyer-devis
   ```

3. **Générer son PDF** :
   ```
   POST /webhook/generer-pdf
   ```

4. **Consulter les logs** :
   ```
   https://www.talosprimes.com/platform/logs
   ```

### Tests Complets

**Voir** : `docs/DEPLOIEMENT_MODULE_FACTURATION.md` section "Tests de Vérification"

---

## ⚠️ TROUBLESHOOTING

### Workflow ne s'exécute pas

**Vérifier** :
- ✅ Toggle "Active" est vert
- ✅ Credentials correctement assignées
- ✅ URL webhook correcte
- ✅ Consulter "Executions" dans N8N

### Email non reçu

**Vérifier** :
- ✅ Credential Resend SMTP correcte
- ✅ Domaine vérifié dans Resend (talosprimes.com)
- ✅ From Email : noreply@talosprimes.com
- ✅ Consulter logs Resend : https://resend.com/emails

### Variables non interprétées

**Syntax N8N** :
- ✅ `={{ $json.body.variable }}` (PAS `${}`)
- ✅ Vérifier chemins dans console N8N

### Cron ne se déclenche pas

**Vérifier** :
- ✅ Workflow "Active"
- ✅ Timezone correcte (UTC ou Europe/Paris)
- ✅ Heure configurée (9h, 10h)
- ✅ Tester manuellement (Execute Workflow)

---

## 📞 SUPPORT

**Logs N8N** :
```
Menu : Executions
Cliquer sur une exécution pour voir détails
```

**Logs Application** :
```
https://www.talosprimes.com/platform/logs
Filtrer par action (devis_envoye, facture_envoyee...)
```

---

## ✅ CONFIGURATION TERMINÉE !

**Module Facturation 100% Opérationnel !** 🎉

- ✅ Backend API
- ✅ Workflows N8N
- ✅ Emails automatiques
- ✅ Relances intelligentes
- ✅ Génération PDF
- ✅ Logs système

**Prêt à facturer ! 💼**

