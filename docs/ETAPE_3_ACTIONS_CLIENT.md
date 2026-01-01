# 🎯 ÉTAPE 3 - Actions Client → N8N

**Durée** : 20 minutes  
**Statut** : ✅ Code poussé sur GitHub, en attente import N8N

---

## 📋 OBJECTIF

Connecter les workflows N8N quand le **client** effectue des actions depuis son compte :
- ✅ Changement de plan (upgrade/downgrade)
- ✅ Annulation d'abonnement

---

## 🔧 WORKFLOW À IMPORTER

### 1. Upgrade/Downgrade Plan

**Fichier** : `n8n-workflows/abonnements/upgrade-downgrade-plan.json`  
**Webhook** : `/webhook/changement-formule`  
**API Route** : `app/api/stripe/subscriptions/change-plan/route.ts` ✅

**Ce qu'il fait** :
- ✅ Email confirmation changement de plan
- ✅ Détails : ancien plan → nouveau plan
- ✅ Calcul prorata (crédit ou supplément)
- ✅ SMS confirmation (optionnel)

---

## 🚀 ÉTAPE 3.1 : Import Workflow N8N (3 min)

### 1. Dans N8N

1. Cliquez sur **"+"** → **"Import from File"**
2. Sélectionnez : `n8n-workflows/abonnements/upgrade-downgrade-plan.json`
3. Importez

### 2. Vérifiez le Webhook

Le webhook doit être : `/webhook/changement-formule`

Si différent, modifiez dans :
- `app/api/stripe/subscriptions/change-plan/route.ts` (ligne 160)

### 3. Corrigez les Variables (IMPORTANT !)

Dans **TOUS les nodes** (Email, SMS, Supabase) :

**AVANT** :
```
{{$json.email}}
{{$json.first_name}}
{{$json.old_plan_name}}
{{$json.new_plan_name}}
{{$json.old_price}}
{{$json.new_price}}
{{$json.prorated_amount}}
```

**APRÈS** (ajoutez `.body`) :
```
{{$json.body.email}}
{{$json.body.first_name}}
{{$json.body.old_plan_name}}
{{$json.body.new_plan_name}}
{{$json.body.old_price}}
{{$json.body.new_price}}
{{$json.body.prorated_amount}}
```

### 4. Configurez l'Email Node

**Node** : "Email Confirmation"  
**Type** : HTTP Request  
**URL** : `https://www.talosprimes.com/api/email/send`  
**Method** : POST

**Body** :
```json
{
  "to": "{{$json.body.email}}",
  "subject": "🔄 Changement de formule confirmé",
  "html": "<html>...</html>"
}
```

**Template Email** (HTML) :
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .highlight { background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .footer { background: #F9FAFB; padding: 20px; text-align: center; font-size: 12px; color: #6B7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔄 Changement de formule</h1>
  </div>
  <div class="content">
    <p>Bonjour {{$json.body.first_name}},</p>
    <p>Votre changement de formule a été effectué avec succès !</p>
    
    <div class="highlight">
      <h3>📊 Détails du changement</h3>
      <p><strong>Ancienne formule :</strong> {{$json.body.old_plan_name}} ({{$json.body.old_price}}€/mois)</p>
      <p><strong>Nouvelle formule :</strong> {{$json.body.new_plan_name}} ({{$json.body.new_price}}€/mois)</p>
      <p><strong>Type :</strong> {{$json.body.change_type}}</p>
      <p><strong>Prorata :</strong> {{$json.body.prorated_amount}}€</p>
      <p><strong>Prochaine facturation :</strong> {{$json.body.next_billing_date}}</p>
    </div>

    <p>Le changement est <strong>effectif immédiatement</strong>.</p>
    <p>Le montant prorata ({{$json.body.prorated_amount}}€) sera {{$json.body.change_type === 'upgrade' ? 'ajouté à' : 'crédité sur'}} votre prochaine facture.</p>
    
    <p><a href="https://www.talosprimes.com/billing" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px;">Voir mon abonnement</a></p>
    
    <p>Merci de votre confiance !</p>
    <p>L'équipe TalosPrimes</p>
  </div>
  <div class="footer">
    <p>© 2026 TalosPrimes - Tous droits réservés</p>
    <p>Si vous avez des questions, contactez-nous : <a href="mailto:support@talosprimes.com">support@talosprimes.com</a></p>
  </div>
</body>
</html>
```

### 5. Configurez le SMS Node (optionnel)

**Node** : "SMS Confirmation"  
**Type** : HTTP Request  
**URL** : `https://www.talosprimes.com/api/sms/send`  
**Method** : POST

**Body** :
```json
{
  "to": "{{$json.body.phone}}",
  "message": "🔄 Changement confirmé : {{$json.body.old_plan_name}} → {{$json.body.new_plan_name}}. Prorata : {{$json.body.prorated_amount}}€. Plus d'infos sur votre compte TalosPrimes."
}
```

### 6. Save + Activate

**IMPORTANT** :
- **Save** le workflow
- **Activate** (toggle ON)
- Vérifiez que le webhook est accessible

---

## 🧪 ÉTAPE 3.2 : Test Workflow "Changement Plan" (5 min)

### Test 1 : UPGRADE (Starter → Business)

```bash
curl -X POST https://n8n.talosprimes.com/webhook/changement-formule \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "upgrade",
    "email": "VOTRE_EMAIL@exemple.com",
    "first_name": "Prénom",
    "last_name": "Nom",
    "change_type": "upgrade",
    "old_plan_name": "Starter",
    "new_plan_name": "Business",
    "old_price": 29,
    "new_price": 99,
    "prorated_amount": 70,
    "next_billing_date": "2026-02-01T00:00:00Z",
    "subscription_id": "sub_test123"
  }'
```

**Résultat attendu** :
- ✅ Email reçu avec détails upgrade
- ✅ Variables interprétées correctement
- ✅ Design professionnel

### Test 2 : DOWNGRADE (Business → Starter)

```bash
curl -X POST https://n8n.talosprimes.com/webhook/changement-formule \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "downgrade",
    "email": "VOTRE_EMAIL@exemple.com",
    "first_name": "Prénom",
    "last_name": "Nom",
    "change_type": "downgrade",
    "old_plan_name": "Business",
    "new_plan_name": "Starter",
    "old_price": 99,
    "new_price": 29,
    "prorated_amount": 70,
    "next_billing_date": "2026-02-01T00:00:00Z",
    "subscription_id": "sub_test123"
  }'
```

**Résultat attendu** :
- ✅ Email reçu avec détails downgrade
- ✅ Mention "crédité sur votre prochaine facture"
- ✅ Design professionnel

---

## 🧪 ÉTAPE 3.3 : Test Workflow "Annulation" (5 min)

**Note** : Le workflow `annuler-abonnement.json` existe déjà et a été testé à l'ÉTAPE 2.

Il est maintenant **aussi** déclenché depuis l'interface client via :
- `app/api/stripe/subscriptions/cancel/route.ts`

**Pas d'import supplémentaire nécessaire** ✅

### Test depuis l'API Client

```bash
curl -X POST https://n8n.talosprimes.com/webhook/annuler-abonnement \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "subscription_canceled_by_client",
    "email": "VOTRE_EMAIL@exemple.com",
    "first_name": "Prénom",
    "last_name": "Nom",
    "plan_name": "Business",
    "canceled_at": "2026-01-01T12:00:00Z",
    "access_until": "2026-01-31T23:59:59Z",
    "cancel_at_period_end": true,
    "cancel_reason": "Changement de stratégie",
    "subscription_id": "sub_test123"
  }'
```

**Résultat attendu** :
- ✅ Email annulation reçu
- ✅ Mention "accès jusqu'au 31/01/2026"
- ✅ SMS confirmation (si activé)

---

## 🚨 RÉSOLUTION ERREURS COMMUNES

### ❌ `{"success":false,"message":"Données invalides"}`

**Cause** : Variables non trouvées (manque `.body`)

**Solution** :
1. Ouvrez le node "Validation Données"
2. Vérifiez les conditions :
   - `{{$json.body.email}}` **exists**
   - `{{$json.body.old_plan_name}}` **exists**
   - `{{$json.body.new_plan_name}}` **exists**
3. Save + Toggle OFF/ON

---

### ❌ Variables non interprétées dans email

**Exemple** : Email contient `{{$json.body.first_name}}` au lieu du prénom réel

**Cause** : Mauvaise syntaxe N8N

**Solution** :
1. Ouvrez le node "Email Confirmation"
2. Remplacez dans le HTML :
   - `${first_name}` → `{{$json.body.first_name}}`
   - `{{ first_name }}` → `{{$json.body.first_name}}`
3. N8N utilise **{{}}** (double accolades)
4. Save + Re-test

---

### ❌ `404` sur webhook

**Cause** : Workflow non activé ou webhook URL incorrecte

**Solution** :
1. Vérifiez que le workflow est **activé** (toggle ON)
2. Copiez l'URL du webhook depuis N8N
3. Comparez avec le code :
   - Ligne 160 de `change-plan/route.ts`
   - `'/webhook/changement-formule'`
4. Si différent, modifiez le code ou le webhook dans N8N

---

## ✅ CHECKLIST FINALE ÉTAPE 3

Avant de continuer vers l'ÉTAPE 4 :

- [ ] Workflow `upgrade-downgrade-plan.json` importé dans N8N
- [ ] Webhook vérifié : `/webhook/changement-formule`
- [ ] Variables corrigées (ajout `.body` partout)
- [ ] Email Node configuré (API route + HTML)
- [ ] SMS Node configuré (optionnel)
- [ ] Workflow activé (toggle ON)
- [ ] Test UPGRADE réussi (email reçu)
- [ ] Test DOWNGRADE réussi (email reçu)
- [ ] Test ANNULATION depuis API client réussi
- [ ] Code poussé sur GitHub ✅
- [ ] Logs N8N vérifiés (pas d'erreurs)

---

## 🎯 PROCHAINE ÉTAPE : ÉTAPE 4 - CRONS (30 min)

**Objectif** :
- Rappels automatiques J-7 avant renouvellement
- Notifications proactives pour fidélisation client

**Workflows à connecter** :
- `rappel-renouvellement.json`

**API Routes à créer** :
- `app/api/cron/subscription-reminders/route.ts`

**Impact** :
- ⬇️ Moins de churns (préparation mentale du client)
- 💰 Moins d'échecs paiement (rappel changement CB)
- 📈 Meilleure expérience client

---

## 📊 PROGRESSION GLOBALE

```
ÉTAPE 1: ✅ Analyse & Architecture
ÉTAPE 2: ✅ Webhooks Stripe → N8N
ÉTAPE 3: ✅ Actions Client → N8N (EN COURS D'IMPORT)
ÉTAPE 4: ⏳ Crons (rappels)
ÉTAPE 5: ⏳ Tests end-to-end
ÉTAPE 6: ⏳ Documentation finale
ÉTAPE 7: ⏳ Déploiement VPS
```

**Workflows connectés** : 8/12 (67%)  
**APIs connectées** : 7/9 (78%)

---

**Dernière mise à jour** : 1er janvier 2026  
**Auteur** : AI Assistant + giiz_mo_o  
**Statut** : ✅ Code prêt, import N8N en cours

