# ⚡ TEST RAPIDE ÉTAPE 4 (10 min)

---

## 🎯 CE QU'ON VA TESTER

Rappels automatiques **7 jours avant** le renouvellement d'un abonnement.

---

## 📥 ÉTAPE 1 : Import Workflow (1 min)

1. **N8N** : **"+"** → **"Import from File"**
2. Fichier : `n8n-workflows/abonnements/rappel-renouvellement.json`
3. **Importez**

---

## ✏️ ÉTAPE 2 : Correction Variables (2 min)

Dans le workflow importé :

### Node "Email Rappel J-7"

**Sujet** (statique) :
```
⏰ Votre abonnement se renouvelle dans 7 jours
```

**Variables HTML** (vérifiez qu'elles commencent par `{{$json.body.`) :
```
{{$json.body.first_name}}
{{$json.body.plan_name}}
{{$json.body.amount}}
{{$json.body.renewal_date}}
{{$json.body.payment_method}}
{{$json.body.app_url}}
```

### Node "SMS Rappel (optionnel)"

**Message** :
```
⏰ Rappel TalosPrimes : Votre abonnement {{$json.body.plan_name}} ({{$json.body.amount}}€) se renouvelle dans 7 jours. Aucune action requise. Plus d'infos sur votre compte.
```

---

## ✅ ÉTAPE 3 : Save + Activate (30 sec)

1. **Save**
2. **Activate** (toggle ON)
3. Webhook : `/webhook/rappel-renouvellement`

---

## 🧪 ÉTAPE 4 : Test Direct Workflow (2 min)

```bash
curl -X POST https://n8n.talosprimes.com/webhook/rappel-renouvellement \
  -H "Content-Type: application/json" \
  -d '{
    "email": "meddecyril@icloud.com",
    "first_name": "Cyril",
    "last_name": "Medde",
    "phone": "+33612345678",
    "plan_name": "Business",
    "amount": 99,
    "renewal_date": "lundi 10 février 2026",
    "payment_method": "VISA •••• 4242",
    "subscription_id": "sub_test_rappel_j7",
    "app_url": "https://www.talosprimes.com"
  }'
```

**Résultat attendu** :
```json
{"success": true, "message": "Rappel J-7 envoyé"}
```

**Vérifiez email** :
- ✅ Sujet : "⏰ Votre abonnement se renouvelle dans 7 jours"
- ✅ Contenu : Business, 99€, lundi 10 février 2026
- ✅ Moyen paiement : VISA •••• 4242
- ✅ Liens vers /billing fonctionnels

---

## 🔧 ÉTAPE 5 : Ajouter Variables ENV (3 min)

### Sur le VPS

```bash
ssh root@82.165.129.143

cd /var/www/talosprime
nano .env.production

# Ajoutez (remplacez les valeurs)
CRON_SECRET=votre_secret_généré_avec_openssl
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_supabase

# Save (Ctrl+O, Enter, Ctrl+X)

# Redémarrez
pm2 restart talosprime
```

**Où trouver** `SUPABASE_SERVICE_ROLE_KEY` :
- Supabase Dashboard → Settings → API → **service_role** (secret key)

**Générer** `CRON_SECRET` :
```bash
openssl rand -base64 32
```

---

## 🧪 ÉTAPE 6 : Test API Cron (1 min)

```bash
curl -X GET https://www.talosprimes.com/api/cron/subscription-reminders \
  -H "Authorization: Bearer VOTRE_CRON_SECRET"
```

**Résultat attendu** (si aucun abonnement J+7) :
```json
{
  "success": true,
  "message": "0 rappel(s) envoyé(s) avec succès",
  "total": 0,
  "successCount": 0,
  "errorCount": 0
}
```

**C'est normal** si `0` ! Il n'y a pas d'abonnements qui se renouvellent dans exactement 7 jours pour le moment.

---

## ⏰ ÉTAPE 7 : Configuration Cron (Optionnel - 2 min)

### Option rapide : cron-job.org

1. Allez sur **https://cron-job.org/en/**
2. **New Cron Job** :
   - **URL** : `https://www.talosprimes.com/api/cron/subscription-reminders`
   - **Schedule** : `0 9 * * *` (tous les jours à 9h)
   - **Headers** : `Authorization: Bearer VOTRE_CRON_SECRET`
3. **Save**

---

## ✅ SUCCÈS SI...

- [ ] `curl` workflow retourne `{"success": true}`
- [ ] Email reçu avec tous les détails
- [ ] Variables interprétées (pas de `{{...}}`)
- [ ] Liens /billing fonctionnels
- [ ] `curl` API cron retourne `{"success": true}`
- [ ] Pas d'erreur "Non autorisé"

---

## ❌ SI ERREUR...

### `{"success": false, "error": "Non autorisé"}`

**→** `CRON_SECRET` manquant ou incorrect

1. Ajoutez `CRON_SECRET` dans `.env.production`
2. `pm2 restart talosprime`
3. Re-test

### Variables non interprétées

**→** Oubli `.body` quelque part

1. Node "Email Rappel J-7"
2. Remplacez `{{$json.xxx}}` par `{{$json.body.xxx}}`
3. Save + Toggle OFF/ON

---

## 🎉 ÉTAPE 4 TERMINÉE !

**Temps total** : 10 minutes

**Prochaine étape** : Récapitulatif final + tests end-to-end

---

**Dernière mise à jour** : 1er janvier 2026

