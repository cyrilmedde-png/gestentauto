# 🎯 PLAN D'ACTION : Connecter tous les Workflows N8N

**Date** : 31 Décembre 2025  
**Objectif** : Connecter tous les workflows N8N créés avec les API routes

---

## 📋 ORDRE D'IMPLÉMENTATION

### ✅ ÉTAPE 1 : Gestion des Plans (EN COURS)

**Workflows concernés** :
- `gestion-plans-SIMPLE.json`

**API Routes à modifier** :
- ✅ `/api/admin/plans/update` (déjà fait, à améliorer)
- ⏳ `/api/admin/plans/toggle` (à ajouter)

**Webhooks N8N** :
- `https://n8n.talosprimes.com/webhook/plan-modified`

**Temps estimé** : 15 minutes

---

### 🔄 ÉTAPE 2 : Webhooks Stripe (Abonnements)

**Workflows concernés** :
- `creer-abonnement.json`
- `renouveler-abonnement.json`
- `echec-paiement.json`
- `annuler-abonnement.json` (partie webhook)

**API Routes à modifier** :
- ⏳ `/api/stripe/webhooks/stripe` (ajouter appels N8N)

**Webhooks N8N** :
- `https://n8n.talosprimes.com/webhook/creer-abonnement`
- `https://n8n.talosprimes.com/webhook/renouveler-abonnement`
- `https://n8n.talosprimes.com/webhook/echec-paiement`
- `https://n8n.talosprimes.com/webhook/annuler-abonnement`

**Temps estimé** : 30 minutes

---

### 🔄 ÉTAPE 3 : Actions Client sur Abonnements

**Workflows concernés** :
- `annuler-abonnement.json` (partie client)
- `upgrade-downgrade-plan.json`

**API Routes à modifier** :
- ⏳ `/api/stripe/subscriptions/cancel` (ajouter appel N8N)
- ⏳ `/api/stripe/subscriptions/change-plan` (ajouter appel N8N)

**Webhooks N8N** :
- `https://n8n.talosprimes.com/webhook/annuler-abonnement`
- `https://n8n.talosprimes.com/webhook/upgrade-downgrade-plan`

**Temps estimé** : 20 minutes

---

### ⏰ ÉTAPE 4 : Rappels Automatiques (Optionnel)

**Workflows concernés** :
- `rappel-renouvellement.json`
- `suspendre-compte.json`

**API Routes à créer** :
- ⏳ `/api/cron/subscription-reminders` (nouveau)
- ⏳ `/api/cron/suspend-unpaid-accounts` (nouveau)

**Webhooks N8N** :
- `https://n8n.talosprimes.com/webhook/rappel-renouvellement`
- `https://n8n.talosprimes.com/webhook/suspendre-compte`

**Temps estimé** : 30 minutes

---

## 🎯 ÉTAPE 1 : GESTION DES PLANS (DÉTAIL)

### Ce qui existe déjà ✅

```typescript
// app/api/admin/plans/update/route.ts (ligne 86-102)
try {
  await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL + '/webhook/plan-modified', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planId: updatedPlan.id,
      planName: updatedPlan.display_name,
      changes: updates,
      modifiedBy: user.email,
      modifiedAt: new Date().toISOString()
    })
  })
} catch (webhookError) {
  console.error('Erreur webhook N8N:', webhookError)
}
```

### Problèmes identifiés ❌

1. **Variable d'environnement manquante**
   - `process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL` n'est pas définie
   - Devrait être : `https://n8n.talosprimes.com`

2. **Données incomplètes**
   - Manque les valeurs AVANT modification
   - Manque les détails du plan (prix, quotas)

3. **API toggle non connectée**
   - `/api/admin/plans/toggle` ne déclenche pas N8N

---

## 🔧 CORRECTIONS À APPORTER (ÉTAPE 1)

### 1. Ajouter Variable d'Environnement

**Fichier à créer/modifier** : `.env.local` (et `.env.example`)

```bash
# N8N
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.talosprimes.com
```

### 2. Améliorer les Données Envoyées

**Modifier** : `app/api/admin/plans/update/route.ts`

```typescript
// AVANT la mise à jour, récupérer les anciennes valeurs
const { data: currentPlan } = await supabaseAdmin
  .from('subscription_plans')
  .select('*')
  .eq('id', planId)
  .single()

// ... faire la mise à jour ...

// Construire un objet changes détaillé
const detailedChanges = {
  display_name: {
    old: currentPlan.display_name,
    new: updatedPlan.display_name
  },
  price_monthly: {
    old: currentPlan.price_monthly,
    new: updatedPlan.price_monthly
  },
  max_users: {
    old: currentPlan.max_users,
    new: updatedPlan.max_users
  },
  // etc.
}

// Appeler N8N avec plus de détails
await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL + '/webhook/plan-modified', {
  method: 'POST',
  body: JSON.stringify({
    eventType: 'plan_updated',
    planId: updatedPlan.id,
    planName: updatedPlan.display_name,
    modifiedBy: user.email,
    modifiedAt: new Date().toISOString(),
    changes: detailedChanges,
    currentPlan: updatedPlan
  })
})
```

### 3. Ajouter N8N à l'API Toggle

**Modifier** : `app/api/admin/plans/toggle/route.ts`

```typescript
// Après avoir toggleé le statut
await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL + '/webhook/plan-modified', {
  method: 'POST',
  body: JSON.stringify({
    eventType: 'plan_toggled',
    planId: updatedPlan.id,
    planName: updatedPlan.display_name,
    modifiedBy: user.email,
    isActive: updatedPlan.is_active,
    modifiedAt: new Date().toISOString()
  })
})
```

---

## ✅ CHECKLIST ÉTAPE 1

- [ ] Créer `.env.example` avec `NEXT_PUBLIC_N8N_WEBHOOK_URL`
- [ ] Ajouter variable dans `.env.local` (local)
- [ ] Modifier `app/api/admin/plans/update/route.ts`
  - [ ] Récupérer plan AVANT modification
  - [ ] Construire objet changes détaillé
  - [ ] Améliorer payload N8N
- [ ] Modifier `app/api/admin/plans/toggle/route.ts`
  - [ ] Ajouter appel N8N après toggle
- [ ] Tester localement
- [ ] Vérifier logs N8N
- [ ] Commit + Push
- [ ] Ajouter variable sur VPS
- [ ] Redéployer

---

## 📊 APRÈS ÉTAPE 1

**Ce qui fonctionnera** :
- ✅ Modification de plan → Email admin
- ✅ Activation/Désactivation plan → Email admin
- ✅ Historique dans `plan_modification_history`
- ✅ Logs dans N8N

**Workflows N8N utilisés** : 3/12 (25%)

---

## 🎯 SUITE (APRÈS VALIDATION ÉTAPE 1)

**ÉTAPE 2** : Webhooks Stripe (30 min)
- Plus complexe
- Plus d'impact sur l'expérience client
- Nécessite tests Stripe sandbox

**ÉTAPE 3** : Actions client (20 min)
- Annulation abonnement
- Changement de plan
- Feedback et notifications

**ÉTAPE 4** : Crons (30 min)
- Rappels automatiques
- Suspension comptes impayés

---

## ⏱️ TEMPS TOTAL ESTIMÉ

- **Étape 1** : 15 minutes ⏰
- **Étape 2** : 30 minutes
- **Étape 3** : 20 minutes
- **Étape 4** : 30 minutes

**TOTAL** : 1h35 pour tout connecter ! 🚀

---

**🎯 COMMENÇONS PAR L'ÉTAPE 1 MAINTENANT ?**

