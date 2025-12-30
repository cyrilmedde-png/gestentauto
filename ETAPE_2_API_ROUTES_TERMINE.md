# ✅ Étape 2 : API Routes Stripe - TERMINÉ

## 🎉 Ce Qui a Été Créé

### 📦 Packages NPM Ajoutés

```json
{
  "stripe": "^17.5.0",
  "@stripe/stripe-js": "^4.10.0"
}
```

**À installer localement** :
```bash
npm install
```

---

### 🔧 Configuration Stripe

**Fichier** : `lib/stripe/config.ts`

- ✅ Instance Stripe serveur
- ✅ Configuration publique client
- ✅ URLs de callback
- ✅ Gestion erreurs si clés manquantes

---

### 🔗 API Routes Créées (6 routes)

#### 1. **GET `/api/stripe/plans/list`**
📊 **Liste toutes les formules disponibles**

**Réponse** :
```json
{
  "success": true,
  "plans": [
    {
      "id": "uuid",
      "name": "starter",
      "displayName": "Starter",
      "description": "...",
      "price": 29.00,
      "currency": "EUR",
      "features": [...],
      "quotas": {
        "maxUsers": 1,
        "maxLeads": 100,
        ...
      },
      "stripeProductId": "prod_xxx",
      "stripePriceId": "price_xxx"
    },
    ...
  ]
}
```

**Utilisation** :
```typescript
const response = await fetch('/api/stripe/plans/list')
const { plans } = await response.json()
```

---

#### 2. **POST `/api/stripe/checkout/create-session`**
💳 **Crée une session Stripe Checkout**

**Body** :
```json
{
  "plan_id": "uuid-de-la-formule"
}
```

**Réponse** :
```json
{
  "success": true,
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxx"
}
```

**Utilisation** :
```typescript
const response = await fetch('/api/stripe/checkout/create-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ plan_id: 'uuid' })
})

const { url } = await response.json()
window.location.href = url // Rediriger vers Stripe Checkout
```

**Fonctionnalités** :
- ✅ Vérifie qu'aucun abonnement actif n'existe
- ✅ Crée session avec email pré-rempli
- ✅ Support carte + SEPA
- ✅ Codes promo activés
- ✅ Adresse de facturation requise
- ✅ Métadonnées (company_id, plan_id, user_id)

---

#### 3. **POST `/api/stripe/webhooks/stripe`**
🔔 **Gère tous les webhooks Stripe**

**Événements gérés** :
- ✅ `customer.subscription.created` - Nouvel abonnement
- ✅ `customer.subscription.updated` - Abonnement modifié
- ✅ `customer.subscription.deleted` - Abonnement annulé
- ✅ `invoice.payment_succeeded` - Paiement réussi
- ✅ `invoice.payment_failed` - Paiement échoué

**Actions automatiques** :
- ✅ Upsert dans `subscriptions`
- ✅ Création entrées dans `subscription_history`
- ✅ Mise à jour statuts
- ✅ Enregistrement dates
- ✅ Vérification signature webhook (sécurité)

**⚠️ Important** : Cette route doit être accessible depuis Stripe (pas de auth)

---

#### 4. **GET `/api/stripe/subscriptions/current`**
📊 **Récupère l'abonnement actif de l'utilisateur**

**Réponse** :
```json
{
  "success": true,
  "hasSubscription": true,
  "subscription": {
    "id": "uuid",
    "status": "active",
    "currentPeriodStart": "2026-01-01T00:00:00Z",
    "currentPeriodEnd": "2026-02-01T00:00:00Z",
    "canceledAt": null,
    "amount": 79.00,
    "currency": "EUR",
    "nextPaymentAt": "2026-02-01T00:00:00Z",
    "plan": {
      "id": "uuid",
      "name": "business",
      "displayName": "Business",
      "price": 79.00,
      "features": [...],
      "quotas": {...}
    }
  }
}
```

**Si pas d'abonnement** :
```json
{
  "success": true,
  "hasSubscription": false,
  "subscription": null
}
```

---

#### 5. **POST `/api/stripe/subscriptions/cancel`**
❌ **Annule l'abonnement actif**

**Body** :
```json
{
  "reason": "Trop cher pour moi",
  "cancel_at_period_end": true
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Votre abonnement sera annulé à la fin de la période en cours",
  "cancel_at": "2026-02-01T00:00:00Z"
}
```

**Options** :
- `cancel_at_period_end: true` (défaut) - Annulation à la fin de la période
- `cancel_at_period_end: false` - Annulation immédiate

---

#### 6. **POST `/api/stripe/subscriptions/change-plan`**
🔄 **Change la formule (upgrade/downgrade)**

**Body** :
```json
{
  "new_plan_id": "uuid-nouvelle-formule"
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Vous avez été upgradé vers Business. Le prorata sera appliqué sur votre prochaine facture.",
  "subscription": {
    "id": "uuid",
    "plan": {
      "name": "business",
      "displayName": "Business",
      "price": 79.00
    },
    "nextPaymentAmount": 79.00
  }
}
```

**Fonctionnalités** :
- ✅ Calcul prorata automatique par Stripe
- ✅ Détecte upgrade vs downgrade
- ✅ Historique enregistré
- ✅ Application immédiate
- ✅ Crédit/Débit selon le cas

---

## 🧪 Tests en Local

### 1. Démarrer l'Application

```bash
cd "/Users/giiz_mo_o/Desktop/devellopement application/gestion complete automatiser"
npm install
npm run dev
```

**URL** : http://localhost:3000

---

### 2. Tester avec cURL

#### Liste des formules
```bash
curl http://localhost:3000/api/stripe/plans/list
```

#### Créer une session (nécessite auth)
```bash
curl -X POST http://localhost:3000/api/stripe/checkout/create-session \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{"plan_id": "uuid-starter"}'
```

#### Récupérer abonnement actuel (nécessite auth)
```bash
curl http://localhost:3000/api/stripe/subscriptions/current \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

---

### 3. Tester les Webhooks

**Avec Stripe CLI** (recommandé) :

```bash
# 1. Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# 2. Se connecter
stripe login

# 3. Écouter les webhooks en local
stripe listen --forward-to localhost:3000/api/stripe/webhooks/stripe

# 4. Dans un autre terminal, déclencher des événements test
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

---

## ⚙️ Variables d'Environnement Requises

### `.env.local` (Développement)

```bash
# Stripe - Mode Test
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_SECRET_KEY=sk_test_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Supabase (déjà existantes)
NEXT_PUBLIC_SUPABASE_URL=https://gqkfqvmvqswpqlkvdowz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ À NE PAS committer dans Git !**

---

## 📁 Structure Créée

```
app/api/stripe/
├── plans/
│   └── list/
│       └── route.ts              ✅ Liste formules
├── checkout/
│   └── create-session/
│       └── route.ts              ✅ Créer session paiement
├── subscriptions/
│   ├── current/
│   │   └── route.ts              ✅ Abonnement actuel
│   ├── cancel/
│   │   └── route.ts              ✅ Annuler abonnement
│   └── change-plan/
│       └── route.ts              ✅ Changer formule
└── webhooks/
    └── stripe/
        └── route.ts              ✅ Recevoir webhooks Stripe

lib/stripe/
└── config.ts                     ✅ Configuration Stripe
```

---

## 🔄 Flow Complet d'Abonnement

```
1. CLIENT : Visite /billing
   ↓
2. CLIENT : Choisit formule (Starter/Business/Enterprise)
   ↓
3. FRONTEND : POST /api/stripe/checkout/create-session
   ↓
4. API : Crée session Stripe Checkout
   ↓
5. FRONTEND : Redirige vers Stripe Checkout
   ↓
6. CLIENT : Saisit carte bancaire sur Stripe
   ↓
7. STRIPE : Traite paiement
   ↓
8. STRIPE : Envoie webhook customer.subscription.created
   ↓
9. API : Reçoit webhook /api/stripe/webhooks/stripe
   ↓
10. API : Crée entrée dans subscriptions
    ↓
11. STRIPE : Redirige vers /billing?success=true
    ↓
12. FRONTEND : Affiche message succès
```

---

## ✅ Checklist Avant Tests

### Configuration
- [ ] Packages NPM installés (`npm install`)
- [ ] `.env.local` créé avec clés Stripe
- [ ] Migration SQL exécutée (tables subscription_*)
- [ ] Compte Stripe configuré (voir `GUIDE_CONFIGURATION_STRIPE.md`)
- [ ] 3 produits Stripe créés
- [ ] IDs Stripe mis à jour en BDD

### Tests Unitaires
- [ ] GET `/api/stripe/plans/list` → 3 formules retournées
- [ ] POST `/api/stripe/checkout/create-session` → URL Stripe retournée
- [ ] GET `/api/stripe/subscriptions/current` → 200 OK
- [ ] Webhooks reçus correctement (test avec Stripe CLI)

### Tests Fonctionnels
- [ ] Créer session → Redirection Stripe OK
- [ ] Paiement test réussi → Abonnement créé en BDD
- [ ] Webhook payment_succeeded → BDD mise à jour
- [ ] Annulation abonnement → Statut canceled
- [ ] Changement formule → Prorata appliqué

---

## 🎯 Prochaines Étapes

### Étape 3 : Workflows N8N (6-8h)
✅ Automatisations sur événements Stripe

**7 workflows à créer** :
1. `creer-abonnement.json` - Email confirmation
2. `renouveler-abonnement.json` - Email reçu
3. `echec-paiement.json` - Alertes
4. `annuler-abonnement.json` - Email annulation
5. `upgrade-downgrade-plan.json` - Email changement
6. `rappel-renouvellement.json` - Rappel J-7
7. `suspendre-compte.json` - 3 échecs

---

### Étape 4 : Interface Client (8-10h)
✅ Page `/billing` complète

**Composants** :
- CurrentPlan.tsx - Formule actuelle
- UpgradePlanModal.tsx - Upgrade/Downgrade
- PaymentMethodsList.tsx - Liste cartes
- InvoicesList.tsx - Factures
- UsageStats.tsx - Quotas
- CancelSubscriptionModal.tsx - Annulation

---

## 🆘 Problèmes Courants

### Erreur : "STRIPE_SECRET_KEY n'est pas définie"
**Solution** : Créer `.env.local` avec les clés Stripe

---

### Erreur : "Invalid signature" (webhooks)
**Solution** : 
1. Vérifier `STRIPE_WEBHOOK_SECRET` dans `.env.local`
2. Tester avec Stripe CLI en local
3. Vérifier l'URL webhook dans Stripe Dashboard

---

### Erreur : "Plan not found"
**Solution** : 
1. Exécuter migration SQL (`create_subscriptions_tables.sql`)
2. Vérifier que les 3 formules sont insérées
3. Mettre à jour les `stripe_product_id` et `stripe_price_id`

---

## 📚 Documentation

- ✅ `docs/GUIDE_CONFIGURATION_STRIPE.md` - Config Stripe pas à pas
- ✅ `docs/SYSTEME_ABONNEMENTS_COMPLET.md` - Architecture complète
- ✅ `PLAN_ABONNEMENTS_ETAPE_1.md` - Plan général

---

## 📊 Progression Globale

| Étape | Statut | Durée |
|-------|--------|-------|
| ✅ Étape 1 (Architecture) | **Terminé** | - |
| ✅ Étape 2 (API Routes) | **Terminé** | - |
| ⏳ Étape 3 (Workflows N8N) | **À faire** | 6-8h |
| ⏳ Étape 4 (Interface) | **À faire** | 8-10h |
| ⏳ Étape 5 (Tests) | **À faire** | 3-4h |
| ⏳ Étape 6 (Production) | **À faire** | 2-3h |

**Progression** : **28%** (2/7 étapes)

---

**Créé le** : 30 décembre 2025  
**Étape** : 2/7  
**Prochaine action** : Configurer Stripe + Tester les API

