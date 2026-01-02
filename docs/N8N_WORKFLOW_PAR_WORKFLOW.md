# 🔄 Configuration N8N - Guide Workflow par Workflow

**Date** : 2026-01-02  
**Temps total** : 20 minutes

---

## 🎯 PRÉPARATION (5 minutes)

### Avant de commencer, préparez :

1. **Connexion N8N** : https://n8n.talosprimes.com
2. **Clé Supabase** (service_role) : 
   - Aller sur https://supabase.com
   - Sélectionner projet Talosprime
   - Menu : Settings > API
   - Copier : `service_role key` (commence par `eyJ...`)
   
3. **Clé Resend** :
   - Aller sur https://resend.com/api-keys
   - Copier votre clé API (commence par `re_...`)

4. **Fichiers workflows** :
   - Sur VPS : `/var/www/talosprime/n8n-workflows/facturation/`
   - En local : `n8n-workflows/facturation/`

---

## 🔑 ÉTAPE 0 : CRÉER LES CREDENTIALS (UNE SEULE FOIS)

### Credential 1 : Supabase Service Key

```
1. Dans N8N, cliquer en haut à droite sur votre profil
2. Sélectionner : "Credentials"
3. Cliquer : "Add Credential"
4. Dans la recherche, taper : "HTTP Header"
5. Cliquer sur : "HTTP Header Auth"
6. Remplir :
   
   📝 Credential name:
   Supabase Service Key
   
   📝 Header Name:
   apikey
   
   📝 Header Value:
   [Coller votre service_role key de Supabase]
   
7. Cliquer "Save"
8. Fermer la fenêtre
```

**✅ Credential 1 créée !**

---

### Credential 2 : Resend SMTP

```
1. Credentials > "Add Credential"
2. Rechercher : "SMTP"
3. Cliquer sur : "SMTP"
4. Remplir :
   
   📝 Credential name:
   Resend SMTP
   
   📝 Host:
   smtp.resend.com
   
   📝 Port:
   465
   
   📝 Secure Connection:
   ✅ (cocher la case)
   
   📝 User:
   resend
   
   📝 Password:
   [Coller votre clé API Resend]
   
   📝 From Email:
   noreply@talosprimes.com
   
5. Cliquer "Save"
6. Fermer la fenêtre
```

**✅ Credential 2 créée !**

---

## 📥 WORKFLOW 1 : Envoyer Devis (3 minutes)

### Import du fichier

```
1. Menu de gauche : "Workflows"
2. Cliquer : "Add Workflow" > "Import from File"
3. Sélectionner : envoyer-devis.json
4. Le workflow s'ouvre automatiquement
```

### Configuration des nodes

**Node 1 : Webhook - Déclenchement**
```
1. Cliquer sur le premier node (icône webhook)
2. Pas de credential nécessaire
3. Vérifier que "Path" = "envoyer-devis"
4. Fermer
```

**Node 2 : Validation Données**
```
1. Pas de credential
2. Fermer
```

**Node 3 : Récupérer Document**
```
1. Cliquer sur le node "Récupérer Document"
2. Section "Credentials" en haut
3. Dropdown : Sélectionner "Supabase Service Key"
4. Si pas visible, cliquer "Create New" et sélectionner celle créée
5. Fermer
```

**Node 4 : Envoyer Email Devis**
```
1. Cliquer sur le node "Envoyer Email Devis"
2. Section "Credentials" en haut
3. Dropdown : Sélectionner "Resend SMTP"
4. Fermer
```

**Node 5 : Logger Action**
```
1. Cliquer sur le node
2. Pas de credential (ou utiliser Supabase si demandé)
3. Fermer
```

**Node 6 : Réponse Succès**
```
1. Pas de credential
2. Fermer
```

### Activation

```
1. En haut à gauche : Renommer si besoin
   "📋 Envoyer Devis"
   
2. Cliquer "Save" (Ctrl+S)

3. En haut à droite : Toggle "Inactive" → "Active"
   ⚠️ Doit devenir VERT avec marqué "Active"

4. Noter l'URL webhook affichée :
   https://n8n.talosprimes.com/webhook/envoyer-devis
```

**✅ Workflow 1 terminé !**

---

## 💰 WORKFLOW 2 : Envoyer Facture (3 minutes)

### Import

```
1. Workflows > "Add Workflow" > "Import from File"
2. Sélectionner : envoyer-facture.json
3. Le workflow s'ouvre
```

### Configuration

**Nodes avec credentials à configurer :**

```
1. Node "Récupérer Document"
   → Credentials : Supabase Service Key

2. Node "Envoyer Email Facture"
   → Credentials : Resend SMTP

3. Node "Mettre à jour statut"
   → Credentials : Supabase Service Key

4. Node "Logger Action"
   → Credentials : Supabase Service Key (ou aucune)
```

### Activation

```
1. Renommer : "💰 Envoyer Facture"
2. Save (Ctrl+S)
3. Toggle "Active" (vert)
4. URL : https://n8n.talosprimes.com/webhook/envoyer-facture
```

**✅ Workflow 2 terminé !**

---

## ✅ WORKFLOW 3 : Confirmation Paiement (3 minutes)

### Import

```
1. Workflows > "Add Workflow" > "Import from File"
2. Sélectionner : confirmation-paiement.json
```

### Configuration

**Nodes avec credentials :**

```
1. Node "Récupérer Document"
   → Credentials : Supabase Service Key

2. Node "Envoyer Confirmation"
   → Credentials : Resend SMTP

3. Node "Logger Action"
   → Credentials : Supabase Service Key
```

### Activation

```
1. Renommer : "✅ Confirmation Paiement"
2. Save
3. Toggle "Active"
4. URL : https://n8n.talosprimes.com/webhook/confirmation-paiement
```

**✅ Workflow 3 terminé !**

---

## ⏰ WORKFLOW 4 : Relance Devis J-3 (4 minutes)

### Import

```
1. Workflows > "Add Workflow" > "Import from File"
2. Sélectionner : relance-devis-j3.json
```

### Configuration

**Node 1 : Cron Quotidien 9h**
```
1. Cliquer sur le premier node (icône horloge)
2. Vérifier :
   - Mode : "Every Day"
   - Hour : 9
   - Minute : 0
   - Timezone : (laisser défaut ou choisir Europe/Paris)
3. Fermer
```

**Node 2 : Récupérer Devis**
```
1. Credentials : Supabase Service Key
```

**Node 3 : Filtrage JS**
```
1. Pas de credential
```

**Node 4 : IF - A des devis ?**
```
1. Pas de credential
```

**Node 5 : Email Relance**
```
1. Credentials : Resend SMTP
```

**Node 6 : Logger Action**
```
1. Credentials : Supabase Service Key
```

### Activation

```
1. Renommer : "⏰ Relance Devis J-3"
2. Save
3. Toggle "Active" ⚠️ TRÈS IMPORTANT pour les crons !
4. Ce workflow s'exécutera automatiquement tous les jours à 9h
```

**✅ Workflow 4 terminé !**

---

## 🔔 WORKFLOW 5 : Relances Factures Multi-niveaux (5 minutes)

### Import

```
1. Workflows > "Add Workflow" > "Import from File"
2. Sélectionner : relance-factures-impayees.json
```

### Configuration

**Node 1 : Cron Quotidien 10h**
```
1. Cliquer sur le node (icône horloge)
2. Vérifier :
   - Mode : "Every Day"
   - Hour : 10
   - Minute : 0
3. Fermer
```

**Node 2 : Récupérer Factures**
```
1. Credentials : Supabase Service Key
```

**Node 3 : Filtrage JS (catégorisation)**
```
1. Pas de credential
```

**Node 4 : IF - A des factures ?**
```
1. Pas de credential
```

**Node 5 : Switch (4 branches)**
```
1. Pas de credential
```

**Nodes 6-9 : Emails (4 niveaux)**
```
Chaque node email :
1. Email Niveau 0 (J-3) → Credentials : Resend SMTP
2. Email Niveau 1 (J+7) → Credentials : Resend SMTP
3. Email Niveau 2 (J+15) → Credentials : Resend SMTP
4. Email Niveau 3 (J+30) → Credentials : Resend SMTP
```

**Node 10 : Logger Action**
```
1. Credentials : Supabase Service Key
```

### Activation

```
1. Renommer : "🔔 Relances Factures"
2. Save
3. Toggle "Active" ⚠️ IMPORTANT !
4. S'exécutera automatiquement tous les jours à 10h
```

**✅ Workflow 5 terminé !**

---

## 📄 WORKFLOW 6 : Générer PDF (3 minutes)

### Import

```
1. Workflows > "Add Workflow" > "Import from File"
2. Sélectionner : generer-pdf-document.json
```

### Configuration

**Nodes avec credentials :**

```
1. Node "Récupérer Document + Items"
   → Credentials : Supabase Service Key

2. Node "Récupérer Paramètres"
   → Credentials : Supabase Service Key

3. Node "Générer HTML PDF"
   → Pas de credential (Code JavaScript)

4. Node "Convertir en PDF"
   → Pas de credential (API externe html2pdf.app)

5. Node "Sauvegarder URL PDF"
   → Credentials : Supabase Service Key

6. Node "Logger Génération"
   → Credentials : Supabase Service Key
```

### Activation

```
1. Renommer : "📄 Générer PDF"
2. Save
3. Toggle "Active"
4. URL : https://n8n.talosprimes.com/webhook/generer-pdf
```

**✅ Workflow 6 terminé !**

---

## ✅ VÉRIFICATION FINALE (2 minutes)

### Checklist Complète

```
Menu : Workflows

Vous devez voir 6 workflows avec toggle VERT :

✅ 📋 Envoyer Devis (Active)
✅ 💰 Envoyer Facture (Active)
✅ ✅ Confirmation Paiement (Active)
✅ ⏰ Relance Devis J-3 (Active)
✅ 🔔 Relances Factures (Active)
✅ 📄 Générer PDF (Active)
```

### Vérifier Credentials

```
Menu : Credentials

✅ Supabase Service Key (HTTP Header Auth)
✅ Resend SMTP (SMTP)
```

---

## 🧪 TEST RAPIDE (3 minutes)

### Test Workflow "Envoyer Devis"

**Depuis votre terminal local ou VPS :**

```bash
curl -X POST https://n8n.talosprimes.com/webhook/envoyer-devis \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "test-123",
    "customer_email": "meddecyril@icloud.com",
    "customer_name": "Test Client"
  }'
```

**Résultats attendus :**

```
✅ Réponse JSON : { "success": false/true, "message": "..." }
✅ Dans N8N > Executions : Voir l'exécution (verte si succès)
✅ Si document_id invalide : message d'erreur (normal pour test)
```

### Test avec un VRAI document

```
1. D'abord créer un devis via API
2. Noter son ID
3. Tester avec cet ID :

curl -X POST https://n8n.talosprimes.com/webhook/envoyer-devis \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "[ID-REEL]",
    "customer_email": "meddecyril@icloud.com",
    "customer_name": "Cyril Medde"
  }'

✅ Email devrait être reçu
✅ Log créé dans /platform/logs
```

---

## 📊 RÉCAPITULATIF

### Ce qui est maintenant actif

**Webhooks (4)** :
- ✅ `/webhook/envoyer-devis`
- ✅ `/webhook/envoyer-facture`
- ✅ `/webhook/confirmation-paiement`
- ✅ `/webhook/generer-pdf`

**Crons automatiques (2)** :
- ✅ Relance devis : Tous les jours à 9h
- ✅ Relance factures : Tous les jours à 10h

**Fonctionnalités** :
- ✅ Envoi emails HTML professionnels
- ✅ Relances intelligentes multi-niveaux
- ✅ Génération PDF A4 adaptatif
- ✅ Logging centralisé

---

## ⚠️ TROUBLESHOOTING

### Erreur 404 sur webhook

**Problème** : Workflow pas activé  
**Solution** :
```
1. Ouvrir le workflow
2. Vérifier toggle "Active" est vert
3. Save à nouveau
```

### Email non envoyé

**Problème** : Credential Resend incorrecte  
**Solution** :
```
1. Credentials > Resend SMTP
2. Vérifier :
   - Password = votre clé API re_xxx
   - From Email = noreply@talosprimes.com
3. Vérifier domaine vérifié sur resend.com
```

### Variables non interprétées

**Problème** : Syntaxe N8N incorrecte  
**Solution** :
```
Utiliser : {{ $json.body.variable }}
PAS : ${ } ou ${variable}
```

### Cron ne se déclenche pas

**Problème** : Workflow inactif ou timezone  
**Solution** :
```
1. Vérifier toggle "Active" vert
2. Node Cron > Vérifier Hour et Minute
3. Tester manuellement : "Execute Workflow"
```

---

## 🎉 CONFIGURATION TERMINÉE !

**Module Facturation 100% Opérationnel !**

Vous pouvez maintenant :
- ✅ Créer des devis/factures via API
- ✅ Les envoyer par email automatiquement
- ✅ Générer des PDF professionnels
- ✅ Recevoir des relances automatiques
- ✅ Consulter les logs dans `/platform/logs`

**Bravo ! 🚀**

