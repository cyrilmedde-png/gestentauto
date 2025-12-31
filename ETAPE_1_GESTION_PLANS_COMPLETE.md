# ✅ ÉTAPE 1 : GESTION DES PLANS - TERMINÉE

**Date** : 31 Décembre 2025  
**Statut** : ✅ Code modifié, prêt à tester

---

## 🎯 CE QUI A ÉTÉ FAIT

### 1. API Routes Modifiées ✅

#### a) `/api/admin/plans/update` - Modification de Plan

**Améliorations** :
- ✅ Récupération du plan AVANT modification (pour historique)
- ✅ Construction d'un objet `detailedChanges` (old → new)
- ✅ Payload N8N enrichi avec toutes les infos
- ✅ URL N8N avec fallback : `process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.talosprimes.com'`
- ✅ Logs détaillés pour debug

**Webhook appelé** : `https://n8n.talosprimes.com/webhook/plan-modified`

**Payload envoyé** :
```json
{
  "eventType": "plan_updated",
  "planId": "uuid",
  "planName": "Starter",
  "modifiedBy": "admin@example.com",
  "modifiedAt": "2025-12-31T10:00:00Z",
  "changes": {
    "display_name": { "old": "Starter Plan", "new": "Starter" },
    "price_monthly": { "old": 29, "new": 39 },
    "max_users": { "old": 1, "new": 10 }
  },
  "plan": {
    "id": "uuid",
    "name": "starter",
    "display_name": "Starter",
    "price_monthly": 39,
    "max_users": 10,
    "max_leads": 100,
    "max_storage_gb": 1,
    "max_workflows": null
  }
}
```

---

#### b) `/api/admin/plans/toggle` - Activation/Désactivation

**Améliorations** :
- ✅ Appel N8N après toggle
- ✅ Payload avec action (`activated` ou `deactivated`)
- ✅ Même URL avec fallback
- ✅ Logs détaillés

**Webhook appelé** : `https://n8n.talosprimes.com/webhook/plan-modified`

**Payload envoyé** :
```json
{
  "eventType": "plan_toggled",
  "planId": "uuid",
  "planName": "Business",
  "modifiedBy": "admin@example.com",
  "isActive": true,
  "action": "activated",
  "modifiedAt": "2025-12-31T10:00:00Z",
  "plan": {
    "id": "uuid",
    "name": "business",
    "display_name": "Business",
    "price_monthly": 79
  }
}
```

---

### 2. Documentation Créée ✅

| Fichier | Description |
|---------|-------------|
| `PLAN_ACTION_WORKFLOWS_N8N.md` | Plan complet des 4 étapes |
| `ENV_VARIABLES_N8N.md` | Guide variables d'environnement |
| `ETAPE_1_GESTION_PLANS_COMPLETE.md` | Ce fichier (récap étape 1) |

---

## 🔧 CE QU'IL FAUT FAIRE MAINTENANT

### 1. Ajouter la Variable d'Environnement

#### En Local
```bash
# Créer/modifier .env.local
echo "NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.talosprimes.com" >> .env.local

# Redémarrer le serveur
# Ctrl+C puis npm run dev
```

#### Sur le VPS
```bash
ssh root@votre-vps
cd /var/www/talosprime

# Ajouter au fichier .env
echo "NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.talosprimes.com" >> .env

# Rebuild et restart
git pull origin main
npm install
npm run build
pm2 restart talosprime
```

---

### 2. Vérifier que N8N Fonctionne

```bash
# Test 1: N8N est accessible
curl https://n8n.talosprimes.com/healthz
# Devrait retourner: OK

# Test 2: Le workflow existe
# 1. Ouvrir: https://n8n.talosprimes.com
# 2. Chercher "Gestion Plans - Notifications"
# 3. Vérifier qu'il est activé (toggle ON)
```

---

### 3. Importer le Workflow dans N8N (Si pas déjà fait)

```bash
# 1. Aller sur: https://n8n.talosprimes.com
# 2. Workflows → Import from File
# 3. Sélectionner: n8n-workflows/abonnements/gestion-plans-SIMPLE.json
# 4. Activer le workflow (toggle ON)
```

---

### 4. Tester l'Intégration

#### Test 1 : Modification de Plan

```bash
1. Aller sur: https://www.talosprimes.com/platform/plans
2. Vider le cache: Cmd+Shift+R (Mac)
3. Cliquer ✏️ sur "Starter"
4. Changer "Max Utilisateurs" : 1 → 10
5. Cliquer ✅ (Sauvegarder)
```

**Vérifier** :
- ✅ Message de succès dans l'app
- ✅ Logs serveur : `🔔 Déclenchement workflow N8N: plan-modified`
- ✅ Logs serveur : `✅ Workflow N8N déclenché avec succès`
- ✅ N8N Executions : Nouvelle exécution visible
- ✅ Email reçu (si SMTP configuré)

#### Test 2 : Activation/Désactivation

```bash
1. Aller sur: /platform/plans
2. Cliquer 👁️ sur "Business"
3. Observer le changement Actif ↔ Inactif
```

**Vérifier** :
- ✅ Badge passe de "Actif" à "Inactif" (ou inverse)
- ✅ Logs serveur : `🔔 Déclenchement workflow N8N: plan-toggled`
- ✅ N8N : Nouvelle exécution

---

## 🐛 DÉPANNAGE

### Erreur: "Workflow N8N échoué (non bloquant)"

**Causes** :
1. N8N pas accessible
2. Workflow pas importé
3. Workflow pas activé
4. Variable d'env manquante

**Solutions** :
```bash
# 1. Tester N8N
curl https://n8n.talosprimes.com/webhook/plan-modified \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 2. Vérifier les logs N8N
# Aller sur: https://n8n.talosprimes.com
# Workflows → Gestion Plans → Executions

# 3. Vérifier la variable
echo $NEXT_PUBLIC_N8N_WEBHOOK_URL
# Local: Redémarrer npm run dev
# VPS: pm2 restart talosprime
```

---

## 📊 RÉSULTAT ATTENDU

### Avant Cette Étape
```
Workflows N8N utilisés: 2/12 (17%)
- inscription-lead.json ✅
- creer-essai.json ✅
```

### Après Cette Étape
```
Workflows N8N utilisés: 3/12 (25%)
- inscription-lead.json ✅
- creer-essai.json ✅
- gestion-plans-SIMPLE.json ✅ NOUVEAU
```

---

## 🎯 PROCHAINE ÉTAPE

**ÉTAPE 2 : Webhooks Stripe** (30 min)

Une fois que l'étape 1 fonctionne :
1. Valider que les emails de notification arrivent
2. Vérifier l'historique dans `plan_modification_history`
3. Passer à l'étape 2 : Connecter Stripe avec N8N

**Fichiers à modifier (Étape 2)** :
- `app/api/stripe/webhooks/stripe/route.ts`
- 4 workflows N8N (créer-abonnement, renouveler, échec, annuler)

---

## ✅ CHECK-LIST COMPLÈTE

### Code
- [x] Modifier `/api/admin/plans/update`
- [x] Modifier `/api/admin/plans/toggle`
- [x] Créer documentation

### Configuration
- [ ] Ajouter variable locale `.env.local`
- [ ] Ajouter variable VPS `.env`
- [ ] Redémarrer serveur local
- [ ] Rebuild + restart VPS

### N8N
- [ ] Vérifier N8N accessible
- [ ] Importer `gestion-plans-SIMPLE.json`
- [ ] Activer le workflow
- [ ] Configurer SMTP (si pas déjà fait)

### Tests
- [ ] Test modification plan
- [ ] Test toggle plan
- [ ] Vérifier logs serveur
- [ ] Vérifier executions N8N
- [ ] Vérifier email reçu

### Validation
- [ ] Historique dans `plan_modifications_detail`
- [ ] Pas d'erreurs dans les logs
- [ ] Emails arrivent correctement
- [ ] Prêt pour étape 2

---

**🎯 STATUS : CODE PRÊT, EN ATTENTE DE CONFIGURATION + TESTS**

**⏱️ TEMPS RESTANT : 5-10 minutes (config + tests)**

**🚀 DITES-MOI QUAND VOUS AVEZ TESTÉ ET ON PASSE À L'ÉTAPE 2 !**

