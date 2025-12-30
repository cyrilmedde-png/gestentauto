# 📦 Workflows N8N - Abonnements Stripe

## 🎯 Description

Ce dossier contient tous les workflows N8N pour la gestion automatisée des abonnements Stripe.

---

## 🔄 Workflows Disponibles (7)

### 1️⃣ `creer-abonnement.json` - Confirmation Nouvel Abonnement

**Webhook** : `https://n8n.talosprimes.com/webhook/abonnement-cree`

**Trigger** : API Route `/api/stripe/webhooks/stripe` (événement `checkout.session.completed`)

**Données reçues** :
```json
{
  "email": "client@exemple.com",
  "userId": "user-id",
  "subscriptionId": "sub_xxxxx",
  "planName": "Business",
  "amount": 79,
  "current_period_start": "2025-01-01",
  "current_period_end": "2025-02-01"
}
```

**Actions** :
1. Envoie email de bienvenue professionnel
2. Récapitulatif abonnement + prix
3. Lien vers plateforme
4. Informations support

---

### 2️⃣ `renouveler-abonnement.json` - Reçu de Paiement Mensuel

**Webhook** : `https://n8n.talosprimes.com/webhook/renouveler-abonnement`

**Trigger** : API Route `/api/stripe/webhooks/stripe` (événement `invoice.payment_succeeded`)

**Données reçues** :
```json
{
  "email": "client@exemple.com",
  "first_name": "Jean",
  "amount": 79,
  "payment_date": "2025-02-01",
  "plan_name": "Business",
  "invoice_number": "INV-2025-001",
  "next_payment_date": "2025-03-01",
  "invoice_pdf": "https://..."
}
```

**Actions** :
1. Envoie reçu de paiement
2. Détails facture
3. Lien téléchargement PDF
4. Date prochain prélèvement

---

### 3️⃣ `echec-paiement.json` - Alertes Échec Paiement

**Webhook** : `https://n8n.talosprimes.com/webhook/echec-paiement`

**Trigger** : API Route `/api/stripe/webhooks/stripe` (événement `invoice.payment_failed`)

**Données reçues** :
```json
{
  "email": "client@exemple.com",
  "first_name": "Jean",
  "phone": "+33612345678",
  "amount": 79,
  "plan_name": "Business",
  "attempt_count": 1,
  "failure_reason": "Fonds insuffisants",
  "company_id": "xxx",
  "subscription_id": "sub_xxx"
}
```

**Actions** :
- **Si < 3 échecs** :
  1. Envoie email alerte
  2. Envoie SMS alerte
  3. Demande mise à jour carte
  
- **Si 3 échecs** :
  1. Déclenche workflow `suspendre-compte`
  2. Email/SMS suspension

---

### 4️⃣ `annuler-abonnement.json` - Confirmation Annulation

**Webhook** : `https://n8n.talosprimes.com/webhook/annuler-abonnement`

**Trigger** : API Route `/api/stripe/webhooks/stripe` (événement `customer.subscription.deleted`)

**Données reçues** :
```json
{
  "email": "client@exemple.com",
  "first_name": "Jean",
  "plan_name": "Business",
  "cancel_at": "2025-02-01",
  "access_until": "2025-02-01"
}
```

**Actions** :
1. Envoie email annulation
2. Date fin d'accès
3. Conservation données (30j)
4. Lien questionnaire satisfaction
5. Bouton réactivation

---

### 5️⃣ `upgrade-downgrade-plan.json` - Changement de Formule

**Webhook** : `https://n8n.talosprimes.com/webhook/changement-formule`

**Trigger** : API Route `/api/stripe/webhooks/stripe` (événement `customer.subscription.updated`)

**Données reçues** :
```json
{
  "email": "client@exemple.com",
  "first_name": "Jean",
  "change_type": "upgrade", // ou "downgrade"
  "old_plan_name": "Starter",
  "new_plan_name": "Business",
  "old_price": 29,
  "new_price": 79,
  "prorated_amount": 25,
  "next_billing_date": "2025-02-01",
  "new_features": "<li>5 utilisateurs</li><li>10 GB stockage</li>..."
}
```

**Actions** :
- **Si Upgrade** :
  1. Envoie email félicitations
  2. Nouvelles fonctionnalités
  3. Calcul prorata
  
- **Si Downgrade** :
  1. Envoie email confirmation
  2. Crédit prorata

---

### 6️⃣ `rappel-renouvellement.json` - Rappel J-7

**Trigger** : Cron quotidien (tous les jours à 9h)

**API appelée** : `https://www.talosprimes.com/api/internal/subscriptions/expiring-soon`

**Données reçues** :
```json
{
  "subscriptions": [
    {
      "email": "client@exemple.com",
      "first_name": "Jean",
      "renewal_date": "2025-02-01",
      "amount": 79,
      "plan_name": "Business",
      "payment_method": "Visa **** 4242",
      "card_last4": "4242"
    }
  ]
}
```

**Actions** :
1. Récupère abonnements J-7
2. Envoie email rappel pour chaque client
3. Informe du prélèvement à venir
4. Lien pour changer formule/moyen paiement

---

### 7️⃣ `suspendre-compte.json` - Suspension Compte

**Webhook** : `https://n8n.talosprimes.com/webhook/suspendre-compte`

**Trigger** : 
- Workflow `echec-paiement.json` (après 3 échecs)
- Admin manuel

**Données reçues** :
```json
{
  "email": "client@exemple.com",
  "first_name": "Jean",
  "phone": "+33612345678",
  "subscription_id": "sub_xxx",
  "company_id": "xxx",
  "reason": "3 échecs de paiement consécutifs",
  "suspended_at": "2025-01-15"
}
```

**Actions** :
1. Appelle API `/api/internal/subscriptions/suspend`
2. Envoie email suspension détaillé
3. Envoie SMS urgence
4. Explique démarches réactivation
5. Informe suppression données (30j)

---

## 📊 Flow Global

```
1. CLIENT s'abonne
   → creer-abonnement.json
   
2. TOUS LES MOIS : Renouvellement auto
   → renouveler-abonnement.json
   
3. SI échec paiement
   → echec-paiement.json
   → (après 3 échecs) suspendre-compte.json
   
4. SI CLIENT annule
   → annuler-abonnement.json
   
5. SI CLIENT change formule
   → upgrade-downgrade-plan.json
   
6. TOUS LES JOURS (J-7)
   → rappel-renouvellement.json
```

---

## 🔧 Installation

### 1. Importer les Workflows

Pour chaque fichier `.json` :

1. Se connecter à https://n8n.talosprimes.com
2. Cliquer **"+ → Import from File"**
3. Sélectionner le fichier
4. Vérifier/Configurer les credentials :
   - **Resend** (Email)
   - **Twilio** (SMS, optionnel en dev)
5. **ACTIVER le workflow** ⚡ (bouton en haut à droite)

### 2. Vérifier les Webhooks

**URLs à configurer dans Stripe Dashboard** :
```
https://n8n.talosprimes.com/webhook/abonnement-cree
https://n8n.talosprimes.com/webhook/renouveler-abonnement
https://n8n.talosprimes.com/webhook/echec-paiement
https://n8n.talosprimes.com/webhook/annuler-abonnement
https://n8n.talosprimes.com/webhook/changement-formule
https://n8n.talosprimes.com/webhook/suspendre-compte
```

**Note** : Ces webhooks sont appelés depuis l'API Route `/api/stripe/webhooks/stripe`, pas directement par Stripe.

---

## 🧪 Tester les Workflows

### Test Local

```bash
# Tester un webhook manuellement
curl -X POST https://n8n.talosprimes.com/webhook/abonnement-cree \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@exemple.com",
    "first_name": "Test",
    "last_name": "User",
    "amount": 79,
    "plan_name": "Business"
  }'
```

### Test avec Stripe CLI

```bash
# Déclencher un événement Stripe
stripe trigger checkout.session.completed

# Vérifier logs N8N
# → Aller sur n8n.talosprimes.com
# → Cliquer sur le workflow
# → Onglet "Executions"
```

---

## 📧 Credentials Requises

### Resend (Email)

1. Se connecter à https://resend.com
2. Créer API Key
3. Configurer dans N8N :
   - **Name** : `Resend API`
   - **API Key** : `re_xxxxx`

### Twilio (SMS) - Optionnel

1. Se connecter à https://twilio.com
2. Récupérer Account SID + Auth Token
3. Configurer dans N8N :
   - **Name** : `Twilio SMS`
   - **Account SID** : `ACxxxxx`
   - **Auth Token** : `xxxxx`

---

## 📈 Monitoring

### Vérifier les Executions

1. Aller sur https://n8n.talosprimes.com
2. Cliquer sur un workflow
3. Onglet **"Executions"**
4. Voir :
   - ✅ Succès
   - ❌ Erreurs
   - 🕐 Temps d'exécution
   - 📊 Données input/output

### Logs Application

```bash
# Sur le VPS
pm2 logs n8n --lines 50

# Filtrer par workflow
pm2 logs n8n | grep "abonnement-cree"
```

---

## ⚠️ Notes Importantes

1. **Tous les workflows doivent être ACTIVÉS** pour fonctionner
2. **Mode Test** : Utiliser des adresses email réelles pour recevoir les mails
3. **SMS** : Désactivés en mode dev (Twilio trial), activés en prod
4. **Cron** : `rappel-renouvellement.json` tourne tous les jours à 9h
5. **Webhooks** : Appelés via API Route, pas directement par Stripe

---

## 🎯 Prochaines Améliorations

- [ ] Ajouter notifications Slack pour admins
- [ ] Workflow remerciement après 1 mois
- [ ] Workflow demande avis après 3 mois
- [ ] Workflow offre parrainage
- [ ] Dashboard analytics N8N

---

**Créé le** : 30 décembre 2025  
**Status** : ✅ Complet et Fonctionnel  
**Workflows** : 7/7  
**Emails Templates** : HTML responsive + Dark mode
