# 💳 Système d'Abonnements Complet - Architecture

## 📋 Vue d'Ensemble

Système d'abonnements basé sur **Stripe** permettant aux clients de souscrire aux formules Talos Prime après leur essai gratuit.

---

## 🎯 Cycle de Vie Client Complet

```
📝 Pré-inscription
    ↓ (inscription-lead.json)
📊 Lead dans platform_leads
    ↓ (admin qualifie)
📋 Questionnaire + Entretien
    ↓ (admin crée essai)
🧪 Essai Gratuit (7-30 jours)
    ↓ (creer-essai.json)
👤 Compte auth.users créé + Entreprise
    ↓ (fin essai)
💳 CONVERSION → ABONNEMENT 🎯
    ↓ (creer-abonnement.json)
✅ Client Payant Actif
    ↓
🔄 Renouvellement Automatique (mensuel)
    ↓ (Webhooks Stripe)
💰 Paiements + Gestion
```

---

## 💰 Formules d'Abonnement

### 🥉 Starter - 29€/mois
**Public** : Entrepreneurs individuels, freelances

**Inclus** :
- ✅ 1 utilisateur
- ✅ Module Leads (100 leads/mois)
- ✅ Module Clients (50 clients)
- ✅ Module Facturation de base
- ✅ Support email (48h)
- ✅ Stockage : 1 GB

**Limites** :
- ❌ Pas de team
- ❌ Pas d'API
- ❌ Pas de personnalisation avancée

---

### 🥈 Business - 79€/mois
**Public** : PME, entreprises en croissance

**Inclus** :
- ✅ 5 utilisateurs
- ✅ Module Leads (illimité)
- ✅ Module Clients (illimité)
- ✅ Module Facturation avancé
- ✅ Module CRM complet
- ✅ Automatisations N8N (5 workflows)
- ✅ Support prioritaire (24h)
- ✅ Stockage : 10 GB
- ✅ Rapports & Analytics

**Avantages** :
- 🎨 Personnalisation interface
- 📊 Exports avancés
- 🔔 Notifications illimitées

---

### 🥇 Enterprise - Sur devis (à partir de 199€/mois)
**Public** : Grandes entreprises, besoins spécifiques

**Inclus** :
- ✅ Utilisateurs illimités
- ✅ Tous les modules
- ✅ API complète
- ✅ Automatisations N8N illimitées
- ✅ Support dédié (4h)
- ✅ Stockage : 100 GB
- ✅ Formation équipe
- ✅ Onboarding personnalisé
- ✅ SLA garantie 99.9%

**Avantages** :
- 🔧 Développements sur mesure
- 🏢 Hébergement dédié (option)
- 🔒 Conformité RGPD renforcée
- 📈 Business Intelligence

---

## 🗄️ Base de Données - Nouvelles Tables

### Table: `subscription_plans`
Définition des formules d'abonnement

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identification
  name VARCHAR(100) NOT NULL UNIQUE, -- starter, business, enterprise
  display_name VARCHAR(100) NOT NULL, -- Starter, Business, Enterprise
  description TEXT,
  
  -- Stripe
  stripe_product_id VARCHAR(255) UNIQUE, -- prod_xxx
  stripe_price_id VARCHAR(255) UNIQUE, -- price_xxx
  
  -- Tarification
  price_monthly DECIMAL(10, 2) NOT NULL, -- 29.00, 79.00, 199.00
  currency VARCHAR(3) DEFAULT 'EUR',
  billing_period VARCHAR(20) DEFAULT 'monthly', -- monthly, annual
  
  -- Quotas
  max_users INTEGER, -- NULL = illimité
  max_leads INTEGER, -- NULL = illimité
  max_clients INTEGER, -- NULL = illimité
  max_storage_gb INTEGER, -- NULL = illimité
  max_workflows INTEGER, -- NULL = illimité
  
  -- Fonctionnalités
  features JSONB DEFAULT '[]', -- Liste des features incluses
  modules JSONB DEFAULT '[]', -- Liste des modules activés
  
  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0, -- Pour affichage
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_subscription_plans_name ON subscription_plans(name);
CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active);
```

---

### Table: `subscriptions`
Abonnements actifs des entreprises

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Lien entreprise
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  
  -- Stripe
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL, -- sub_xxx
  stripe_customer_id VARCHAR(255) NOT NULL, -- cus_xxx
  
  -- Statut
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  -- active, past_due, unpaid, canceled, incomplete, trialing
  
  -- Dates
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_end TIMESTAMPTZ, -- Si converti depuis essai
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Tarification
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Paiement
  payment_method VARCHAR(50), -- card, sepa_debit, etc.
  last_payment_at TIMESTAMPTZ,
  next_payment_at TIMESTAMPTZ,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}', -- Données Stripe supplémentaires
  cancel_reason TEXT, -- Raison si annulé
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_subscription_status CHECK (
    status IN ('active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'trialing', 'incomplete_expired')
  ),
  
  UNIQUE(company_id) -- Une seule subscription active par company
);

-- Index
CREATE INDEX idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);
```

---

### Table: `subscription_history`
Historique des changements d'abonnement

```sql
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Changement
  event_type VARCHAR(50) NOT NULL,
  -- created, upgraded, downgraded, renewed, payment_succeeded, payment_failed, canceled
  
  old_plan_id UUID REFERENCES subscription_plans(id),
  new_plan_id UUID REFERENCES subscription_plans(id),
  
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  
  -- Stripe
  stripe_event_id VARCHAR(255), -- evt_xxx
  stripe_invoice_id VARCHAR(255), -- in_xxx
  
  -- Montant
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Métadonnées
  details JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_subscription_history_subscription_id ON subscription_history(subscription_id);
CREATE INDEX idx_subscription_history_company_id ON subscription_history(company_id);
CREATE INDEX idx_subscription_history_event_type ON subscription_history(event_type);
CREATE INDEX idx_subscription_history_created_at ON subscription_history(created_at DESC);
```

---

### Table: `payment_methods`
Méthodes de paiement enregistrées

```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Stripe
  stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL, -- pm_xxx
  
  -- Type
  type VARCHAR(50) NOT NULL, -- card, sepa_debit, etc.
  
  -- Détails (selon type)
  card_brand VARCHAR(50), -- visa, mastercard, amex
  card_last4 VARCHAR(4),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  
  sepa_last4 VARCHAR(4),
  sepa_bank_code VARCHAR(20),
  
  -- Statut
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_payment_methods_company_id ON payment_methods(company_id);
CREATE INDEX idx_payment_methods_is_default ON payment_methods(company_id, is_default);
```

---

## 🔄 Webhooks Stripe à Configurer

### Événements Essentiels

| Événement Stripe | Action | Workflow N8N |
|------------------|--------|--------------|
| `customer.subscription.created` | Abonnement créé | ✅ Log + Email |
| `customer.subscription.updated` | Abonnement modifié | ✅ Mise à jour BDD |
| `customer.subscription.deleted` | Abonnement annulé | ❌ Email annulation |
| `invoice.payment_succeeded` | Paiement réussi | ✅ Email reçu |
| `invoice.payment_failed` | Paiement échoué | ❌ Email + SMS alerte |
| `invoice.upcoming` | Facture à venir (7j) | 📧 Email rappel |
| `customer.created` | Client Stripe créé | ✅ Log |
| `payment_method.attached` | Moyen paiement ajouté | ✅ Notification |
| `payment_method.detached` | Moyen paiement supprimé | ⚠️ Alerte |

**URL Webhook** : `https://n8n.talosprimes.com/webhook/stripe-events`

---

## 🎨 Architecture API

### Routes à Créer

```
/api/stripe/
├── checkout/
│   ├── create-session       # POST - Créer session paiement
│   └── success             # GET - Callback succès
│
├── subscriptions/
│   ├── create              # POST - Créer abonnement
│   ├── list                # GET - Liste abonnements
│   ├── get/[id]            # GET - Détails abonnement
│   ├── upgrade             # POST - Upgrade formule
│   ├── downgrade           # POST - Downgrade formule
│   └── cancel              # POST - Annuler abonnement
│
├── plans/
│   └── list                # GET - Liste formules disponibles
│
├── payment-methods/
│   ├── list                # GET - Liste moyens paiement
│   ├── add                 # POST - Ajouter moyen paiement
│   ├── set-default         # POST - Définir par défaut
│   └── remove              # DELETE - Supprimer
│
├── invoices/
│   ├── list                # GET - Liste factures
│   └── download/[id]       # GET - Télécharger facture PDF
│
└── webhooks/
    └── stripe              # POST - Webhooks Stripe
```

---

## 🔄 Workflows N8N à Créer

### 1. `creer-abonnement.json`
**Webhook** : `/webhook/creer-abonnement`  
**Déclencheur** : Fin d'essai ou inscription directe

**Actions** :
1. Créer client Stripe (`customer.create`)
2. Attacher moyen de paiement
3. Créer abonnement Stripe (`subscription.create`)
4. Créer entrée `subscriptions` BDD
5. Activer modules selon formule
6. Email confirmation + reçu
7. SMS confirmation

---

### 2. `renouveler-abonnement.json`
**Webhook Stripe** : `invoice.payment_succeeded`

**Actions** :
1. Récupérer infos abonnement
2. Mettre à jour `subscriptions` (dates)
3. Créer entrée `subscription_history`
4. Email reçu de paiement avec PDF
5. Notification in-app

---

### 3. `echec-paiement.json`
**Webhook Stripe** : `invoice.payment_failed`

**Actions** :
1. Récupérer infos abonnement
2. Compter nombre d'échecs
3. Email + SMS alerte urgente
4. Si 1er échec : "Veuillez mettre à jour votre moyen de paiement"
5. Si 2ème échec : "Dernière chance avant suspension"
6. Si 3ème échec : Suspension compte + workflow `suspendre-compte.json`

---

### 4. `annuler-abonnement.json`
**Webhook** : `/webhook/annuler-abonnement`  
**Déclencheur** : Client demande annulation

**Actions** :
1. Annuler abonnement Stripe (`subscription.cancel`)
2. Mise à jour `subscriptions` (status canceled)
3. Email confirmation annulation
4. Email questionnaire satisfaction
5. Désactiver modules (fin période payée)
6. Archiver données client (RGPD)

---

### 5. `upgrade-downgrade-plan.json`
**Webhook** : `/webhook/change-plan`  
**Déclencheur** : Client change de formule

**Actions** :
1. Calculer prorata Stripe
2. Mettre à jour abonnement (`subscription.update`)
3. Mise à jour `subscriptions` + `subscription_history`
4. Activer/Désactiver modules
5. Email confirmation changement
6. Notification in-app

---

### 6. `rappel-renouvellement.json`
**Webhook Stripe** : `invoice.upcoming`  
**Déclencheur** : 7 jours avant renouvellement

**Actions** :
1. Email rappel renouvellement
2. Montant à payer
3. Date de prélèvement
4. Lien gestion abonnement

---

### 7. `suspendre-compte.json`
**Déclencheur** : 3 échecs de paiement

**Actions** :
1. Mise à jour status → `suspended`
2. Désactiver accès application
3. Email + SMS suspension
4. Garder 30 jours avant suppression
5. Email quotidien rappel

---

## 🖥️ Interface Client - Pages à Créer

### `/billing` - Gestion Abonnement

**Sections** :
```
┌─────────────────────────────────────┐
│ 📊 Votre Abonnement                 │
│                                      │
│ Formule : Business (79€/mois) 🥈    │
│ Prochain prélèvement : 15/02/2026   │
│                                      │
│ [Upgrade] [Downgrade] [Annuler]     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 💳 Moyens de Paiement               │
│                                      │
│ • Visa •••• 4242 (par défaut)       │
│ • Mastercard •••• 5555              │
│                                      │
│ [+ Ajouter une carte]               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📄 Factures                         │
│                                      │
│ • Janvier 2026 - 79€ [PDF]          │
│ • Décembre 2025 - 79€ [PDF]         │
│ • Novembre 2025 - 79€ [PDF]         │
│                                      │
│ [Voir toutes les factures]          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📊 Utilisation                      │
│                                      │
│ Utilisateurs : 3 / 5                │
│ Stockage : 4.2 GB / 10 GB           │
│ Workflows : 2 / 5                   │
└─────────────────────────────────────┘
```

---

## 🧪 Tests - Cartes Stripe Test

### Succès
- `4242 4242 4242 4242` - Toujours réussi
- `5555 5555 5555 4444` - Mastercard réussi

### Échecs
- `4000 0000 0000 0002` - Carte refusée
- `4000 0000 0000 9995` - Fonds insuffisants
- `4000 0000 0000 0069` - Carte expirée

**Date** : N'importe quelle date future  
**CVC** : N'importe quel 3 chiffres

---

## 📝 Checklist Implémentation

### Phase 1 : Base de données ✅
- [ ] Créer `subscription_plans`
- [ ] Créer `subscriptions`
- [ ] Créer `subscription_history`
- [ ] Créer `payment_methods`
- [ ] Insérer les 3 formules (Starter, Business, Enterprise)
- [ ] Créer migration SQL complète

### Phase 2 : Stripe Configuration 🎯
- [ ] Créer compte Stripe (ou utiliser existant)
- [ ] Créer 3 produits (Starter, Business, Enterprise)
- [ ] Créer prix mensuels pour chaque
- [ ] Configurer webhooks
- [ ] Tester en mode sandbox

### Phase 3 : API Routes 🔧
- [ ] `/api/stripe/checkout/create-session`
- [ ] `/api/stripe/subscriptions/*`
- [ ] `/api/stripe/payment-methods/*`
- [ ] `/api/stripe/webhooks/stripe`
- [ ] Gestion erreurs complète

### Phase 4 : Workflows N8N 🔄
- [ ] `creer-abonnement.json`
- [ ] `renouveler-abonnement.json`
- [ ] `echec-paiement.json`
- [ ] `annuler-abonnement.json`
- [ ] `upgrade-downgrade-plan.json`
- [ ] `rappel-renouvellement.json`
- [ ] `suspendre-compte.json`

### Phase 5 : Interface Client 🎨
- [ ] Page `/billing`
- [ ] Modal changement de formule
- [ ] Modal ajout carte
- [ ] Modal annulation
- [ ] Liste factures

### Phase 6 : Tests 🧪
- [ ] Tests Stripe Sandbox complets
- [ ] Tests paiements réussis/échoués
- [ ] Tests webhooks
- [ ] Tests upgrades/downgrades
- [ ] Tests annulation

### Phase 7 : Production 🚀
- [ ] Activer Stripe Live
- [ ] Configurer webhooks production
- [ ] Documentation client
- [ ] Déploiement VPS

---

## 💰 Calculs Financiers

### MRR (Monthly Recurring Revenue)
```
MRR = Σ (abonnements actifs * prix mensuel)
```

### Prorata (Upgrade/Downgrade)
```
Stripe calcule automatiquement :
- Upgrade : Crédit du temps restant sur ancien plan
- Downgrade : Appliqué à la fin de la période en cours
```

---

## 🔒 Sécurité

### Webhooks Stripe
- ✅ Vérifier signature webhook (`stripe.webhooks.constructEvent`)
- ✅ Valider événements reçus
- ✅ Idempotence (éviter double traitement)

### API
- ✅ Authentification requise (JWT Supabase)
- ✅ Validation company_id (RLS)
- ✅ Rate limiting
- ✅ Logs des actions sensibles

---

## 📚 Documentation

- [Stripe Subscriptions API](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)
- [SCA (Strong Customer Authentication)](https://stripe.com/docs/strong-customer-authentication)

---

**Créé le** : 30 décembre 2025  
**Statut** : 📋 Planification  
**Priorité** : 🔥 Haute

