# 🎯 GUIDE PAS À PAS : Importer le Workflow N8N

**Problème** : `⚠️ Workflow N8N échoué (non bloquant): 404`  
**Solution** : Importer et activer le workflow dans N8N

---

## 📋 AVANT DE COMMENCER

Vous aurez besoin de :
- ✅ Accès à https://n8n.talosprimes.com
- ✅ Le fichier : `n8n-workflows/abonnements/gestion-plans-SIMPLE.json`

---

## 🚀 ÉTAPE 1 : OUVRIR N8N

### 1.1 Dans votre navigateur

```
https://n8n.talosprimes.com
```

### 1.2 Se connecter

Entrez vos identifiants N8N.

**Vous arrivez sur** : Le dashboard N8N avec la liste des workflows existants (s'il y en a).

---

## 📥 ÉTAPE 2 : IMPORTER LE WORKFLOW

### 2.1 Cliquer sur "Import from File"

**Où ?** En haut à droite de la page, vous devriez voir un bouton **"Import from File"** ou **"Import"**.

Si vous ne le voyez pas :
- Allez dans le menu **"Workflows"** (à gauche)
- Puis **"Add Workflow"** → **"Import from File"**

### 2.2 Sélectionner le fichier

```
Fichier à importer:
n8n-workflows/abonnements/gestion-plans-SIMPLE.json
```

**Sur votre ordinateur** :
1. Naviguer vers : `Desktop/devellopement application/gestion complete automatiser/n8n-workflows/abonnements/`
2. Sélectionner : `gestion-plans-SIMPLE.json`
3. Cliquer "Ouvrir"

### 2.3 Cliquer "Import"

N8N va importer le workflow.

**Résultat** : Vous voyez maintenant le workflow avec :
- **Nom** : "Gestion Plans - Notifications"
- **3 nodes** :
  1. 🔗 Webhook Plan Modifie
  2. 📧 Email Admin
  3. ✅ Reponse Webhook

---

## ⚙️ ÉTAPE 3 : CONFIGURER LE WORKFLOW

### 3.1 Vérifier le Webhook

1. **Cliquer** sur le premier node : "Webhook Plan Modifie"
2. **Vérifier** que "Path" = `plan-modified`
3. **Vérifier** l'URL Production : `https://n8n.talosprimes.com/webhook/plan-modified`

**Si tout est OK** : Fermer le panneau (cliquer ailleurs)

### 3.2 Configurer l'Email (2 OPTIONS)

#### OPTION A : Vous avez Resend (Recommandé)

1. **Cliquer** sur le node "Email Admin"
2. Dans "Credentials", cliquer sur **"Select Credential"**
3. Si vous voyez "Resend SMTP" → **Le sélectionner**
4. Si non → **"Create New Credential"**
   - Type: SMTP
   - Name: `Resend SMTP`
   - Host: `smtp.resend.com`
   - Port: `465`
   - Security: `SSL/TLS`
   - User: `resend`
   - Password: `re_xxxxxxxxxxxxx` (votre clé API Resend)
5. **Save**

#### OPTION B : Vous n'avez pas Resend (Temporaire)

1. **Cliquer** sur le node "Email Admin"
2. **Cliquer** sur les 3 points (...) en haut à droite du node
3. **Cliquer** sur "Disable"
4. Le node devient grisé (c'est normal, il est désactivé)

**Note** : Le workflow fonctionnera mais n'enverra pas d'email.

---

## ✅ ÉTAPE 4 : ACTIVER LE WORKFLOW ⚠️ **CRITIQUE**

### 4.1 Trouver le Toggle

**En haut à droite** de l'écran, vous devez voir :
- Un toggle (interrupteur) avec "Inactive" ou "OFF"

### 4.2 Activer

**Cliquer sur le toggle** pour le passer de **OFF → ON**

**Résultat** :
- Le toggle devient **vert**
- L'état change à **"Active"**
- Le workflow est maintenant **en écoute** sur le webhook

⚠️ **IMPORTANT** : Si le workflow n'est PAS activé, le webhook retournera toujours 404 !

### 4.3 Sauvegarder

Si N8N demande de sauvegarder, cliquer **"Save"**.

---

## 🧪 ÉTAPE 5 : TESTER

### Test 1 : Depuis le Terminal (Mac/Linux)

```bash
curl -X POST https://n8n.talosprimes.com/webhook/plan-modified \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "plan_updated",
    "planId": "test-123",
    "planName": "Test Plan",
    "modifiedBy": "test@example.com",
    "modifiedAt": "2025-12-31T12:00:00Z",
    "changes": {
      "price_monthly": {
        "old": 29,
        "new": 39
      }
    }
  }'
```

**Résultat attendu** :
```json
{"success":true,"message":"Notification envoyee"}
```

**Si vous avez 404** : Le workflow n'est PAS activé. Retournez à l'ÉTAPE 4.

### Test 2 : Depuis l'Application

```
1. Ouvrir: https://www.talosprimes.com/platform/plans
2. Vider cache: Cmd+Shift+R (Mac) ou Ctrl+Shift+R (PC)
3. Cliquer ✏️ sur "Starter"
4. Changer "Max Utilisateurs" : 1 → 10
5. Sauvegarder
```

**Vérifier les logs VPS** :
```bash
ssh root@votre-vps
pm2 logs talosprime --lines 20
```

**AVANT** :
```
🔔 Déclenchement workflow N8N: plan-modified
⚠️ Workflow N8N échoué (non bloquant): 404    ❌ ERREUR
✅ Plan modifié avec succès: Starter
```

**APRÈS** :
```
🔔 Déclenchement workflow N8N: plan-modified
✅ Workflow N8N déclenché avec succès          ✅ SUCCESS
✅ Plan modifié avec succès: Starter
```

### Test 3 : Vérifier les Executions N8N

```
1. Dans N8N, aller sur "Executions" (menu gauche)
2. Vous devriez voir une nouvelle exécution
3. Cliquer dessus pour voir les détails
4. Vérifier que chaque node a bien fonctionné (✅ vert)
```

---

## ❓ FAQ - PROBLÈMES COURANTS

### Q1 : Je ne trouve pas "Import from File"

**R** : Essayez :
1. Menu hamburger (☰) en haut à gauche
2. Workflows
3. Bouton "+" ou "Add Workflow"
4. "Import from File"

### Q2 : Le fichier JSON ne s'importe pas (erreur)

**R** : Vérifiez que :
- Vous avez bien sélectionné `gestion-plans-SIMPLE.json`
- Le fichier n'est pas corrompu
- Alternative : Copiez le contenu du fichier et utilisez "Import from URL" ou "Import from Clipboard"

### Q3 : Je n'ai pas de clé API Resend

**R** : 2 options :
1. **Option A** : Créer un compte Resend (gratuit)
   - https://resend.com
   - API Keys → Create
   - Copier la clé `re_xxxxx`
   
2. **Option B** : Désactiver le node email (voir ÉTAPE 3.2 OPTION B)

### Q4 : Le toggle n'apparaît pas

**R** : Vous êtes peut-être en mode "Edit". Vérifiez :
1. Sauvegardez le workflow d'abord (Ctrl+S ou bouton Save)
2. Le toggle devrait apparaître en haut à droite

### Q5 : Le test curl retourne toujours 404

**R** : Causes possibles :
1. **Le workflow n'est PAS activé** (toggle OFF) → L'activer !
2. Le path du webhook est différent → Vérifier dans le node Webhook
3. N8N n'est pas démarré → Tester `curl https://n8n.talosprimes.com/healthz`

---

## ✅ VALIDATION FINALE

### Check-list

- [ ] Workflow "Gestion Plans - Notifications" visible dans N8N
- [ ] Toggle **Active** (vert, ON)
- [ ] Test curl retourne `{"success": true}`
- [ ] Modification plan depuis app ne retourne plus 404
- [ ] Logs VPS affichent "✅ Workflow N8N déclenché avec succès"
- [ ] N8N Executions montre les appels
- [ ] Email reçu (si SMTP configuré)

---

## 🎉 SUCCÈS !

**Quand tout est ✅** :

```
Workflows N8N utilisés: 3/12 (25%)
✅ inscription-lead.json
✅ creer-essai.json
✅ gestion-plans-SIMPLE.json (NOUVEAU)
```

**Prêt pour** : ÉTAPE 2 - Webhooks Stripe (30 min)

---

## 📸 CAPTURES D'ÉCRAN ATTENDUES

### 1. Liste des Workflows N8N
```
Workflows
├── Gestion Plans - Notifications  [Active] ✅
└── (autres workflows si existants)
```

### 2. Vue du Workflow
```
Webhook Plan Modifie → Email Admin → Reponse Webhook
     (🔗)                  (📧)              (✅)
```

### 3. Toggle Activé
```
[Active] ← Toggle en vert, position ON
```

---

**⏱️ TEMPS TOTAL : 5-10 MINUTES**

**🎯 SUIVEZ LES ÉTAPES UNE PAR UNE ET TESTEZ !**

**💬 DITES-MOI LE RÉSULTAT DU TEST CURL !**

