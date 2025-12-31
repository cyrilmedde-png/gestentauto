# 📦 GUIDE IMPORT - Workflows Stripe N8N

## 🎯 OBJECTIF
Importer et activer les 4 workflows N8N critiques pour les abonnements Stripe.

---

## ⏱️ TEMPS ESTIMÉ
**15 minutes** (tous workflows inclus)

---

## 📋 PRÉREQUIS

✅ **N8N accessible** : https://n8n.talosprimes.com  
✅ **Resend SMTP configuré** dans N8N (voir `CONFIGURER_RESEND_SMTP_N8N.md`)  
✅ **Code déployé** sur le VPS avec modifications webhook Stripe

---

## 🚀 ÉTAPE 1 : Importer les 4 Workflows (10 min)

### Workflow 1 : Nouvel Abonnement

**Fichier** : `n8n-workflows/abonnements/creer-abonnement.json`

**Actions** :
1. Se connecter à https://n8n.talosprimes.com
2. Cliquer **"+ → Import from File"**
3. Sélectionner `creer-abonnement.json`
4. Vérifier le webhook : `/webhook/abonnement-cree`
5. Configurer credentials :
   - **Resend** : Sélectionner credential existante
6. **ACTIVER le workflow** (toggle en haut à droite)

**Ce qu'il fait** :
- ✅ Email de bienvenue après souscription
- ✅ Récapitulatif abonnement + prix
- ✅ Lien vers plateforme
- ✅ Infos support

---

### Workflow 2 : Renouvellement Mensuel

**Fichier** : `n8n-workflows/abonnements/renouveler-abonnement.json`

**Actions** :
1. Cliquer **"+ → Import from File"**
2. Sélectionner `renouveler-abonnement.json`
3. Vérifier le webhook : `/webhook/renouveler-abonnement`
4. Configurer credentials **Resend**
5. **ACTIVER le workflow**

**Ce qu'il fait** :
- ✅ Email reçu de paiement
- ✅ Détails facture + PDF
- ✅ Date prochain prélèvement
- ✅ Lien téléchargement facture

---

### Workflow 3 : Échec Paiement (🔴 CRITIQUE)

**Fichier** : `n8n-workflows/abonnements/echec-paiement.json`

**Actions** :
1. Cliquer **"+ → Import from File"**
2. Sélectionner `echec-paiement.json`
3. Vérifier le webhook : `/webhook/echec-paiement`
4. Configurer credentials :
   - **Resend** : Email
   - **Twilio** : SMS (optionnel, désactiver en dev)
5. **ACTIVER le workflow**

**Ce qu'il fait** :
- ✅ Email alerte échec paiement
- ✅ SMS alerte (si configuré)
- ✅ Demande mise à jour carte
- ✅ Évite churns clients !

**⚠️ IMPORTANT** : Ce workflow est **critique** pour éviter les pertes de clients suite à des CB expirées.

---

### Workflow 4 : Annulation Abonnement

**Fichier** : `n8n-workflows/abonnements/annuler-abonnement.json`

**Actions** :
1. Cliquer **"+ → Import from File"**
2. Sélectionner `annuler-abonnement.json`
3. Vérifier le webhook : `/webhook/annuler-abonnement`
4. Configurer credentials **Resend**
5. **ACTIVER le workflow**

**Ce qu'il fait** :
- ✅ Email confirmation annulation
- ✅ Date fin d'accès
- ✅ Conservation données (30j)
- ✅ Lien questionnaire satisfaction
- ✅ Bouton réactivation

---

## 🧪 ÉTAPE 2 : Tester les Workflows (5 min)

### Test 1 : Vérifier les Webhooks

```bash
# Test webhook abonnement créé
curl -X POST https://n8n.talosprimes.com/webhook/abonnement-cree \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@talosprimes.com",
    "first_name": "Test",
    "last_name": "User",
    "plan_name": "Business",
    "amount": 79,
    "currency": "eur"
  }'

# Test webhook renouvellement
curl -X POST https://n8n.talosprimes.com/webhook/renouveler-abonnement \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@talosprimes.com",
    "first_name": "Test",
    "amount": 79,
    "plan_name": "Business",
    "invoice_number": "INV-TEST-001"
  }'

# Test webhook échec paiement
curl -X POST https://n8n.talosprimes.com/webhook/echec-paiement \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@talosprimes.com",
    "first_name": "Test",
    "phone": "+33612345678",
    "amount": 79,
    "plan_name": "Business",
    "attempt_count": 1,
    "failure_reason": "Fonds insuffisants"
  }'

# Test webhook annulation
curl -X POST https://n8n.talosprimes.com/webhook/annuler-abonnement \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@talosprimes.com",
    "first_name": "Test",
    "plan_name": "Business",
    "canceled_at": "2025-01-01",
    "access_until": "2025-02-01"
  }'
```

**Résultat attendu** :
- Email reçu sur `test@talosprimes.com`
- Exécution visible dans N8N (onglet "Executions")
- Logs : `✅ Workflow executed successfully`

---

### Test 2 : Vérifier les Logs N8N

1. Aller sur https://n8n.talosprimes.com
2. Cliquer sur le workflow testé
3. Onglet **"Executions"**
4. Vérifier :
   - ✅ **Status** : Success
   - ✅ **Data** : Email envoyé
   - ✅ **Time** : < 5 secondes

---

### Test 3 : Simuler un Événement Stripe (Avancé)

**Avec Stripe CLI** (optionnel) :

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Écouter les webhooks locaux
stripe listen --forward-to https://www.talosprimes.com/api/stripe/webhooks/stripe

# Déclencher un événement
stripe trigger checkout.session.completed
```

**Ce que ça fait** :
1. Stripe CLI envoie un événement `checkout.session.completed`
2. Webhook API Route `/api/stripe/webhooks/stripe` reçoit l'événement
3. API Route déclenche le workflow N8N `abonnement-cree`
4. Email envoyé au client

---

## 📊 VALIDATION COMPLÈTE

### Checklist Workflows Importés

```
✅ creer-abonnement.json importé et activé
✅ renouveler-abonnement.json importé et activé
✅ echec-paiement.json importé et activé
✅ annuler-abonnement.json importé et activé
```

### Checklist Credentials

```
✅ Resend SMTP configuré (4 workflows)
⏸️ Twilio SMS configuré (optionnel, workflow echec-paiement)
```

### Checklist Tests

```
✅ Test curl → Email reçu (abonnement-cree)
✅ Test curl → Email reçu (renouveler-abonnement)
✅ Test curl → Email reçu (echec-paiement)
✅ Test curl → Email reçu (annuler-abonnement)
✅ Logs N8N → Aucune erreur
```

---

## 🔧 DÉPANNAGE

### ❌ Email non reçu

**Causes** :
1. Workflow non activé → **Toggle ON**
2. Resend non configuré → **Voir CONFIGURER_RESEND_SMTP_N8N.md**
3. DNS Resend en propagation → **Attendre 1-24h**
4. Email dans spam → **Vérifier dossier spam**

**Solution** :
```bash
# Vérifier logs N8N
pm2 logs n8n --lines 50 | grep "error"

# Tester webhook manuellement
curl -X POST https://n8n.talosprimes.com/webhook/abonnement-cree \
  -H "Content-Type: application/json" \
  -d '{"email": "test@talosprimes.com"}'
```

---

### ❌ Webhook 404

**Cause** : Workflow non importé ou désactivé.

**Solution** :
1. Vérifier que le workflow existe dans N8N
2. Vérifier que le webhook est bien `/webhook/abonnement-cree` (pas d'espace)
3. **ACTIVER** le workflow (toggle)

---

### ❌ Erreur "Failed to send email"

**Cause** : Credentials Resend invalides.

**Solution** :
1. Aller sur https://resend.com/api-keys
2. Créer nouvelle clé API
3. Mettre à jour dans N8N :
   - Cliquer **Credentials → Resend**
   - Entrer nouvelle clé API
   - Sauvegarder

---

### ❌ "Error in workflow" dans les logs

**Cause** : Node email ou SMS échoue.

**Solution** :
1. Ouvrir le workflow dans N8N
2. Tester chaque node individuellement
3. Vérifier les credentials
4. Désactiver le node SMS si Twilio non configuré

---

## 📈 PROCHAINES ÉTAPES

Après avoir importé et testé ces 4 workflows, vous pourrez :

### ÉTAPE 3 : Actions Client (20 min)
- Connecter workflow changement de plan
- Connecter annulation côté client

### ÉTAPE 4 : Crons (30 min)
- Rappel renouvellement (J-7)
- Suspension compte impayé

---

## 📝 NOTES IMPORTANTES

1. **Tous les workflows doivent être ACTIVÉS** pour fonctionner
2. **Mode Test** : Utiliser des adresses email réelles
3. **SMS** : Désactivés en mode dev (Twilio trial)
4. **Stripe Webhooks** : Appelés via API Route, pas directement par Stripe
5. **DNS Resend** : Peut prendre 1-24h pour se propager

---

## 🎯 RÉSUMÉ

```
AVANT:  2/12 workflows connectés (17%)
APRÈS:  6/12 workflows connectés (50%)

✅ inscription-lead.json
✅ creer-essai.json
✅ gestion-plans-SIMPLE.json
✅ creer-abonnement.json      ← NOUVEAU
✅ renouveler-abonnement.json ← NOUVEAU
✅ echec-paiement.json        ← NOUVEAU
✅ annuler-abonnement.json    ← NOUVEAU

IMPACT CLIENT:
🔴 CRITIQUE → Expérience client complète
✅ Email confirmation abonnement
✅ Reçu de paiement mensuel
✅ Alerte échec paiement (évite churns !)
✅ Email annulation + feedback
```

---

## 📧 SUPPORT

**Besoin d'aide ?**
- **Email** : support@talosprimes.com
- **Discord** : [Talos Prime Community]
- **Documentation** : https://docs.talosprimes.com

---

**Créé le** : 31 décembre 2025  
**Temps** : 15 minutes  
**Impact** : 🔴 Critique pour l'expérience client  
**Status** : ✅ Prêt à importer

