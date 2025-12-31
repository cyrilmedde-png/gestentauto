# 🔧 FIX : Erreur 404 Workflow N8N

**Erreur** : `⚠️ Workflow N8N échoué (non bloquant): 404`

**Cause** : Le webhook `https://n8n.talosprimes.com/webhook/plan-modified` n'existe pas ou n'est pas activé.

---

## ✅ SOLUTION (5 MINUTES)

### ÉTAPE 1 : Importer le Workflow dans N8N

#### 1.1 Ouvrir N8N

```
https://n8n.talosprimes.com
```

Se connecter avec vos identifiants N8N.

#### 1.2 Importer le Workflow

```
1. Cliquer sur "Workflows" (menu gauche)
2. Cliquer sur "Import from File" (en haut à droite)
3. Sélectionner le fichier:
   n8n-workflows/abonnements/gestion-plans-SIMPLE.json
4. Cliquer "Import"
```

**Vous devriez voir** :
- Nom du workflow : "Gestion Plans - Notifications"
- 3 nodes : Webhook, Email, Response

#### 1.3 Configurer SMTP (Si Pas Déjà Fait)

```
1. Cliquer sur le node "Email Admin"
2. Credentials → "Select Credential"
3. Si "Resend SMTP" existe → Le sélectionner
4. Si non → "Create New Credential"
   - Name: Resend SMTP
   - Host: smtp.resend.com
   - Port: 465
   - User: resend
   - Password: re_xxxxxxxxxxxxx (votre clé API Resend)
   - SSL/TLS: Activé
5. Sauvegarder
```

#### 1.4 Activer le Workflow

```
1. En haut à droite, trouver le toggle "Active"
2. Cliquer pour passer de OFF → ON
3. Le workflow doit afficher "Active"
```

**IMPORTANT** : Le workflow DOIT être **activé** pour que le webhook fonctionne !

---

### ÉTAPE 2 : Vérifier le Webhook

#### 2.1 Vérifier l'URL du Webhook

```
1. Dans le workflow, cliquer sur le node "Webhook Plan Modifie"
2. Vérifier "Webhook URLs"
3. L'URL devrait être:
   Production: https://n8n.talosprimes.com/webhook/plan-modified
```

**Si l'URL est différente** : C'est le problème ! Notez la bonne URL et corrigez dans le code API.

#### 2.2 Tester le Webhook Directement

```bash
# Test 1: Depuis votre terminal
curl -X POST https://n8n.talosprimes.com/webhook/plan-modified \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "plan_updated",
    "planId": "test-123",
    "planName": "Test Plan",
    "modifiedBy": "test@example.com",
    "modifiedAt": "2025-12-31T10:00:00Z",
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
{
  "success": true,
  "message": "Notification envoyee"
}
```

**Si vous avez une erreur 404** :
- Le workflow n'est pas activé (toggle OFF)
- Le path du webhook est différent
- N8N a un problème

**Si vous avez une erreur 502/503** :
- N8N n'est pas démarré
- Problème serveur

---

### ÉTAPE 3 : Tester Depuis l'Application

#### 3.1 Modifier un Plan

```
1. Aller sur: https://www.talosprimes.com/platform/plans
2. Vider cache: Cmd+Shift+R
3. Cliquer ✏️ sur "Business"
4. Changer "Max Utilisateurs" : 5 → 10
5. Sauvegarder
```

#### 3.2 Vérifier les Logs VPS

```bash
ssh root@votre-vps
pm2 logs talosprime --lines 50

# Chercher:
# ✅ "🔔 Déclenchement workflow N8N: plan-modified"
# ✅ "✅ Workflow N8N déclenché avec succès"
# ❌ "⚠️ Workflow N8N échoué (non bloquant): 404" (ne devrait plus apparaître)
```

#### 3.3 Vérifier les Executions N8N

```
1. Aller sur: https://n8n.talosprimes.com
2. Workflows → "Gestion Plans - Notifications"
3. Onglet "Executions"
4. Vérifier qu'il y a une nouvelle exécution
5. Cliquer dessus pour voir les détails
```

**Vous devriez voir** :
- Webhook reçu : ✅
- Email envoyé : ✅
- Response renvoyée : ✅

---

## 🔍 DÉPANNAGE AVANCÉ

### Erreur Persiste Après Import

**Solution 1** : Vérifier le path du webhook

```
1. Dans N8N, ouvrir le workflow
2. Cliquer sur "Webhook Plan Modifie"
3. Regarder "Path": Devrait être "plan-modified"
4. Si différent, changer et sauvegarder
```

**Solution 2** : Redémarrer N8N

```bash
ssh root@votre-vps
pm2 restart n8n
pm2 logs n8n --lines 30
```

**Solution 3** : Vérifier que N8N écoute bien

```bash
# Tester la santé de N8N
curl https://n8n.talosprimes.com/healthz
# Devrait retourner: OK

# Lister tous les webhooks actifs (si API disponible)
curl https://n8n.talosprimes.com/rest/webhooks
```

---

## 🎯 SI VOUS N'AVEZ PAS RESEND/SMTP

Le workflow utilise un node "Email Send" qui nécessite des credentials SMTP.

### Option 1 : Désactiver l'Email Temporairement

```
1. Dans N8N, ouvrir le workflow
2. Cliquer sur le node "Email Admin"
3. Cliquer sur les 3 points (...) → "Disable"
4. Le node devient grisé
5. Sauvegarder
```

**Résultat** : Le webhook fonctionnera mais n'enverra pas d'email.

### Option 2 : Configurer Resend

```
1. Aller sur: https://resend.com
2. Se connecter / Créer un compte
3. API Keys → Create API Key
4. Copier la clé: re_xxxxxxxxxxxxx
5. Dans N8N, configurer le credential (voir ÉTAPE 1.3)
```

---

## ✅ VÉRIFICATION FINALE

### Check-list

- [ ] Workflow importé dans N8N
- [ ] Workflow activé (toggle ON)
- [ ] SMTP configuré (ou email node désactivé)
- [ ] Test curl retourne success: true
- [ ] Modification plan ne retourne plus 404
- [ ] Logs montrent "✅ Workflow N8N déclenché avec succès"
- [ ] N8N Executions montre l'appel
- [ ] Email reçu (si SMTP configuré)

---

## 📊 RÉSULTAT ATTENDU

### Dans les Logs (AVANT)

```
🔔 Déclenchement workflow N8N: plan-modified
⚠️ Workflow N8N échoué (non bloquant): 404    ❌ ERREUR
✅ Plan modifié avec succès: Business
```

### Dans les Logs (APRÈS)

```
🔔 Déclenchement workflow N8N: plan-modified
✅ Workflow N8N déclenché avec succès           ✅ SUCCESS
✅ Plan modifié avec succès: Business
```

---

## 🚀 APRÈS CORRECTION

**Une fois que ça fonctionne** :
- ✅ Modification plan → Email admin
- ✅ Toggle plan → Email admin
- ✅ Historique dans BDD
- ✅ Prêt pour ÉTAPE 2 (Webhooks Stripe)

---

**⏱️ TEMPS ESTIMÉ : 5 MINUTES**

**🎯 COMMENCEZ PAR IMPORTER LE WORKFLOW DANS N8N !**

**💬 DITES-MOI LE RÉSULTAT DU TEST CURL ET ON VALIDE !**

