# 🎯 N8N - GUIDE VISUEL SIMPLIFIÉ

## 📌 AVANT DE COMMENCER

### Ouvrir ces 2 pages :
1. **N8N** : https://n8n.talosprimes.com
2. **Supabase** : https://supabase.com (pour copier la clé)

---

## 🔑 PARTIE 1 : CREDENTIALS (Une seule fois)

### 🟦 Credential 1 : Supabase

#### Étape 1 : Récupérer la clé Supabase
```
1. Aller sur supabase.com
2. Cliquer sur projet "Talosprime"
3. Menu gauche : Settings
4. Cliquer : API
5. Descendre jusqu'à "Project API keys"
6. Trouver : service_role (secret)
7. Cliquer sur l'icône "copier"
8. La clé commence par : eyJ...
```

#### Étape 2 : Créer dans N8N
```
1. Dans N8N, cliquer votre avatar (en haut à droite)
2. Cliquer : Credentials
3. Bouton : "Add Credential"
4. Rechercher : HTTP Header
5. Cliquer : "HTTP Header Auth"
6. Remplir :
   Name : Supabase Service Key
   Header Name : apikey
   Header Value : [COLLER la clé copiée]
7. Bouton "Save"
```

---

### 🟩 Credential 2 : Resend

#### Étape 1 : Récupérer la clé Resend
```
1. Aller sur resend.com
2. Se connecter
3. Menu : API Keys
4. Copier votre clé (commence par re_...)
```

#### Étape 2 : Créer dans N8N
```
1. Credentials > "Add Credential"
2. Rechercher : SMTP
3. Cliquer : "SMTP"
4. Remplir :
   Name : Resend SMTP
   Host : smtp.resend.com
   Port : 465
   Secure : ✅ (cocher)
   User : resend
   Password : [COLLER la clé Resend]
   From Email : noreply@talosprimes.com
5. Bouton "Save"
```

**✅ CREDENTIALS TERMINÉES !**

---

## 📥 PARTIE 2 : WORKFLOWS (6 à importer)

### Pour CHAQUE workflow, suivre ces étapes :

---

### 🔵 WORKFLOW 1/6 : Envoyer Devis

#### Import
```
1. Menu gauche : Workflows
2. Bouton : "Add Workflow"
3. Dropdown : "Import from File"
4. Parcourir : n8n-workflows/facturation/envoyer-devis.json
5. Bouton "Import"
```

#### Configurer les nodes
```
1. Cliquer node "Récupérer Document"
2. En haut : Credentials
3. Choisir : "Supabase Service Key"
4. Fermer

5. Cliquer node "Envoyer Email Devis"
6. En haut : Credentials
7. Choisir : "Resend SMTP"
8. Fermer
```

#### Activer
```
1. Nom en haut : "Envoyer Devis"
2. Bouton "Save" (ou Ctrl+S)
3. Toggle en haut à droite : Inactive → Active (VERT)
```

**✅ 1/6 TERMINÉ**

---

### 🔵 WORKFLOW 2/6 : Envoyer Facture

#### Import
```
Workflows > Add Workflow > Import from File
Fichier : envoyer-facture.json
```

#### Configurer
```
Node "Récupérer Document" → Supabase Service Key
Node "Envoyer Email Facture" → Resend SMTP
Node "Mettre à jour statut" → Supabase Service Key
```

#### Activer
```
Save → Toggle Active (VERT)
```

**✅ 2/6 TERMINÉ**

---

### 🔵 WORKFLOW 3/6 : Confirmation Paiement

#### Import
```
Fichier : confirmation-paiement.json
```

#### Configurer
```
Node "Récupérer Document" → Supabase Service Key
Node "Envoyer Confirmation" → Resend SMTP
```

#### Activer
```
Save → Toggle Active (VERT)
```

**✅ 3/6 TERMINÉ**

---

### 🔵 WORKFLOW 4/6 : Relance Devis J-3

#### Import
```
Fichier : relance-devis-j3.json
```

#### Configurer
```
Node "Cron" → Vérifier Hour = 9, Minute = 0
Node "Récupérer Devis" → Supabase Service Key
Node "Email Relance" → Resend SMTP
```

#### Activer
```
Save → Toggle Active (VERT) ⚠️ IMPORTANT
```

**✅ 4/6 TERMINÉ** (s'exécutera à 9h chaque jour)

---

### 🔵 WORKFLOW 5/6 : Relances Factures

#### Import
```
Fichier : relance-factures-impayees.json
```

#### Configurer
```
Node "Cron" → Vérifier Hour = 10, Minute = 0
Node "Récupérer Factures" → Supabase Service Key
Nodes "Email Niveau 0/1/2/3" (4 nodes) → Resend SMTP
```

#### Activer
```
Save → Toggle Active (VERT) ⚠️ IMPORTANT
```

**✅ 5/6 TERMINÉ** (s'exécutera à 10h chaque jour)

---

### 🔵 WORKFLOW 6/6 : Générer PDF

#### Import
```
Fichier : generer-pdf-document.json
```

#### Configurer
```
Node "Récupérer Document + Items" → Supabase Service Key
Node "Récupérer Paramètres" → Supabase Service Key
Node "Sauvegarder URL PDF" → Supabase Service Key
```

#### Activer
```
Save → Toggle Active (VERT)
```

**✅ 6/6 TERMINÉ !**

---

## ✅ VÉRIFICATION

### Dans N8N, menu Workflows :

```
Vous devez voir 6 workflows avec toggle VERT :

✅ Envoyer Devis (Active)
✅ Envoyer Facture (Active)
✅ Confirmation Paiement (Active)
✅ Relance Devis J-3 (Active)
✅ Relances Factures (Active)
✅ Générer PDF (Active)
```

---

## 🧪 TEST RAPIDE

### Depuis un terminal :

```bash
curl -X POST https://n8n.talosprimes.com/webhook/envoyer-devis \
  -H "Content-Type: application/json" \
  -d '{"document_id":"test","customer_email":"meddecyril@icloud.com","customer_name":"Test"}'
```

**Si réponse JSON** → ✅ Ça marche !

---

## 🎉 TERMINÉ !

**Temps total** : 20 minutes  
**Résultat** : 6 workflows actifs, prêts à facturer ! 🚀

### URLs Webhooks à utiliser :

```
https://n8n.talosprimes.com/webhook/envoyer-devis
https://n8n.talosprimes.com/webhook/envoyer-facture
https://n8n.talosprimes.com/webhook/confirmation-paiement
https://n8n.talosprimes.com/webhook/generer-pdf
```

**Crons automatiques** :
- 9h : Relance devis
- 10h : Relance factures

