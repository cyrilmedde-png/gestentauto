# 💳 Workflows - Gestion des Abonnements

## Description
Workflows pour la gestion du cycle de vie des abonnements Stripe (création, renouvellement, annulation, paiements).

---

## 📁 Workflows (À créer)

### 🔮 creer-abonnement.json
**Statut** : À développer  
**Webhook** : `/webhook/creer-abonnement`

**Déclencheur** : Client converti (fin essai ou inscription directe)

**Actions prévues** :
- ✅ Création client Stripe
- 💳 Création abonnement Stripe
- 📧 Email confirmation abonnement
- 📱 SMS confirmation
- 🔄 Mise à jour statut dans `subscriptions`

---

### 🔮 renouveler-abonnement.json
**Statut** : À développer  
**Webhook** : Webhook Stripe `invoice.payment_succeeded`

**Actions prévues** :
- ✅ Mise à jour date de renouvellement
- 📧 Email reçu de paiement
- 🔔 Notification in-app

---

### 🔮 echec-paiement.json
**Statut** : À développer  
**Webhook** : Webhook Stripe `invoice.payment_failed`

**Actions prévues** :
- ❌ Alerte échec paiement
- 📧 Email demande mise à jour moyen de paiement
- 📱 SMS alerte
- 🔔 Notification in-app
- ⏸️ Suspension compte après 3 échecs

---

### 🔮 annuler-abonnement.json
**Statut** : À développer  
**Webhook** : `/webhook/annuler-abonnement`

**Déclencheur** : Client demande annulation

**Actions prévues** :
- 🛑 Annulation abonnement Stripe
- 📧 Email confirmation annulation
- 📋 Email questionnaire satisfaction
- 🔄 Mise à jour statut `cancelled`
- 📊 Export données client (RGPD)

---

### 🔮 rappel-renouvellement.json
**Statut** : À développer  
**Déclencheur** : Cron (3 jours avant renouvellement)

**Actions prévues** :
- 📧 Email rappel renouvellement
- 💰 Montant à payer
- 📅 Date de prélèvement

---

### 🔮 upgrade-downgrade-plan.json
**Statut** : À développer  
**Webhook** : `/webhook/change-plan`

**Déclencheur** : Client change de formule

**Actions prévues** :
- 🔄 Mise à jour abonnement Stripe (prorata)
- 📧 Email confirmation changement
- 🔔 Notification in-app
- 📦 Activation/Désactivation modules

---

## 💰 Formules Prévues

| Formule | Prix (€/mois) | Utilisateurs | Modules |
|---------|---------------|--------------|---------|
| **Starter** | 29€ | 1 | Leads, Clients |
| **Business** | 79€ | 5 | Tous modules |
| **Enterprise** | 149€ | Illimité | Tous modules + API |

---

## ⚙️ Configuration Requise

### Credentials N8N
- **Stripe API** : Clé secrète `sk_live_...`
- **Resend API** : Pour les emails
- **Twilio API** : Pour les SMS

### Variables d'environnement
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=your_resend_key
```

### Webhooks Stripe à Configurer
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `invoice.upcoming`

**URL webhook** : `https://n8n.talosprimes.com/webhook/stripe-events`

---

## 🔄 Cycle de Vie d'un Abonnement

```
Essai terminé → Conversion
    ↓
Création abonnement Stripe
    ↓
Email confirmation + SMS
    ↓
Renouvellement mensuel automatique
    ↓
    ├── Paiement OK → Email reçu
    └── Paiement KO → Email + SMS alerte
                    ↓
                3 échecs → Suspension
    ↓
Client annule OU Upgrade/Downgrade
    ↓
Email confirmation + MAJ Stripe
```

---

## 📊 Statuts des Abonnements

| Statut | Description | Action |
|--------|-------------|--------|
| `active` | Abonnement actif | Client utilise l'app |
| `past_due` | Paiement en retard | Envoyer relances |
| `unpaid` | Non payé (après relances) | Suspendre compte |
| `canceled` | Annulé | Archiver données |
| `incomplete` | Paiement initial en attente | Relancer |
| `trialing` | En période d'essai | Préparer conversion |

---

## 🧪 Tests

### Environnement de Test Stripe
1. Utiliser les clés **test** de Stripe (`sk_test_...`)
2. Utiliser les cartes de test :
   - `4242 4242 4242 4242` : Paiement réussi
   - `4000 0000 0000 0002` : Paiement refusé
   - Date : N'importe quelle date future
   - CVC : N'importe quel 3 chiffres

### Tester les Webhooks
```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Écouter les webhooks en local
stripe listen --forward-to https://n8n.talosprimes.com/webhook/stripe-events

# Déclencher un événement test
stripe trigger payment_intent.succeeded
```

---

## 📚 Documentation à Créer

- [ ] Guide intégration Stripe
- [ ] Guide webhooks Stripe
- [ ] API routes pour abonnements
- [ ] UI changement de formule
- [ ] UI annulation abonnement
- [ ] Politique de remboursement

---

## 🔧 Maintenance

- **Responsable** : Admin plateforme
- **Statut** : 🔮 Planifié
- **Priorité** : Haute
- **Date début prévue** : Après mise en place des essais

---

## 📚 Ressources

- [Documentation Stripe](https://stripe.com/docs)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)

