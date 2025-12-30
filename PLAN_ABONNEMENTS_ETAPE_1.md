# 💳 Système d'Abonnements - Étape 1 Terminée ✅

## 🎯 Ce qui a été fait

### 1. **Analyse Complète de la Base de Données** ✅

**Tables existantes identifiées** :
- ✅ `companies` - Entreprises clientes
- ✅ `users` - Utilisateurs (auth.users)
- ✅ `roles` - Rôles et permissions
- ✅ `modules` - Modules activés par entreprise
- ✅ `platform_leads` - Leads en pré-inscription
- ✅ `platform_trials` - Essais gratuits

**Manquant** (créé maintenant) :
- 💰 Tables pour les abonnements Stripe

---

### 2. **Définition des Formules d'Abonnement** ✅

#### 🥉 Starter - 29€/mois
**Pour** : Entrepreneurs individuels, freelances

| Fonctionnalité | Quota |
|----------------|-------|
| Utilisateurs | 1 |
| Leads | 100/mois |
| Clients | 50 |
| Stockage | 1 GB |
| Workflows N8N | 0 |
| Support | Email 48h |

**Modules** : Leads, Clients, Facturation de base

---

#### 🥈 Business - 79€/mois ⭐ **POPULAIRE**
**Pour** : PME, entreprises en croissance

| Fonctionnalité | Quota |
|----------------|-------|
| Utilisateurs | 5 |
| Leads | Illimité |
| Clients | Illimité |
| Stockage | 10 GB |
| Workflows N8N | 5 |
| Support | Prioritaire 24h |

**Modules** : Leads, Clients, Facturation avancée, CRM complet, Analytics, Automatisations

**Bonus** :
- 🎨 Personnalisation interface
- 📊 Rapports avancés
- 📧 Exports

---

#### 🥇 Enterprise - 199€/mois
**Pour** : Grandes entreprises, besoins spécifiques

| Fonctionnalité | Quota |
|----------------|-------|
| Utilisateurs | Illimité |
| Leads | Illimité |
| Clients | Illimité |
| Stockage | 100 GB |
| Workflows N8N | Illimité |
| Support | Dédié 4h |

**Modules** : TOUS

**Bonus** :
- 🔧 Développements sur mesure
- 🏢 Hébergement dédié (option)
- 📈 Business Intelligence
- 📚 Formation équipe
- 🎯 Onboarding personnalisé
- ✅ SLA 99.9%

---

### 3. **Migration SQL Créée** ✅

**Fichier** : `database/create_subscriptions_tables.sql`

**4 nouvelles tables** :

#### 📊 `subscription_plans`
Définition des formules (Starter, Business, Enterprise)

**Champs clés** :
- `name` - Identifiant unique (starter, business, enterprise)
- `stripe_product_id` - ID produit Stripe
- `stripe_price_id` - ID prix Stripe
- `price_monthly` - Prix mensuel
- `max_users`, `max_leads`, etc. - Quotas
- `features` - Liste des fonctionnalités (JSONB)
- `modules` - Liste des modules activés (JSONB)

---

#### 💳 `subscriptions`
Abonnements actifs des entreprises

**Champs clés** :
- `company_id` - Entreprise cliente
- `plan_id` - Formule souscrite
- `stripe_subscription_id` - ID abonnement Stripe
- `stripe_customer_id` - ID client Stripe
- `status` - active, past_due, canceled, etc.
- `current_period_start/end` - Période actuelle
- `amount` - Montant

---

#### 📜 `subscription_history`
Historique de tous les changements

**Champs clés** :
- `subscription_id` - Abonnement concerné
- `event_type` - Type d'événement (created, upgraded, payment_succeeded, etc.)
- `old_plan_id` → `new_plan_id` - Changements
- `stripe_event_id` - Événement Stripe
- `amount` - Montant

---

#### 💳 `payment_methods`
Cartes et moyens de paiement

**Champs clés** :
- `company_id` - Entreprise
- `stripe_payment_method_id` - ID moyen paiement Stripe
- `type` - card, sepa_debit, etc.
- `card_brand` - visa, mastercard, amex
- `card_last4` - 4 derniers chiffres
- `is_default` - Carte par défaut ?

---

### 4. **Documentation Complète Créée** ✅

**Fichier** : `docs/SYSTEME_ABONNEMENTS_COMPLET.md`

**Contenu** :
- 📊 Vue d'ensemble architecture
- 💰 Détails des 3 formules
- 🗄️ Schémas de base de données
- 🔄 7 workflows N8N à créer
- 🎨 Maquettes interface client
- 🔗 Liste API routes à créer
- 🧪 Guide tests Stripe
- 📝 Checklist complète implémentation

---

## 🎯 Prochaines Étapes (À valider avec vous)

### Étape 2 : Configuration Stripe ⏳

**Actions** :
1. ☑️ Créer compte Stripe (ou utiliser existant)
2. ☑️ Créer 3 produits :
   - Starter (29€/mois)
   - Business (79€/mois)
   - Enterprise (199€/mois)
3. ☑️ Récupérer les IDs :
   - `prod_xxx` (Product ID)
   - `price_xxx` (Price ID)
4. ☑️ Mettre à jour la BDD avec les IDs Stripe
5. ☑️ Configurer webhooks Stripe

**Temps estimé** : 1-2 heures

---

### Étape 3 : API Routes 🔧

**Routes à créer** :
```
/api/stripe/
├── checkout/create-session    # Créer session paiement
├── subscriptions/
│   ├── create                 # Créer abonnement
│   ├── get/[id]               # Détails abonnement
│   ├── upgrade                # Upgrade formule
│   ├── downgrade              # Downgrade formule
│   └── cancel                 # Annuler
├── plans/list                 # Liste formules
├── payment-methods/
│   ├── list                   # Liste cartes
│   ├── add                    # Ajouter carte
│   └── set-default            # Carte par défaut
└── webhooks/stripe            # Recevoir événements Stripe
```

**Temps estimé** : 4-6 heures

---

### Étape 4 : Workflows N8N 🔄

**7 workflows à créer** :
1. ✅ `creer-abonnement.json` - Créer abonnement après essai
2. ✅ `renouveler-abonnement.json` - Renouvellement mensuel
3. ✅ `echec-paiement.json` - Gérer échecs paiement
4. ✅ `annuler-abonnement.json` - Annulation client
5. ✅ `upgrade-downgrade-plan.json` - Changement formule
6. ✅ `rappel-renouvellement.json` - Rappel 7j avant
7. ✅ `suspendre-compte.json` - 3 échecs → suspension

**Temps estimé** : 6-8 heures

---

### Étape 5 : Interface Client 🎨

**Pages à créer** :
- `/billing` - Page gestion abonnement complète
  - Affichage abonnement actuel
  - Boutons Upgrade/Downgrade/Annuler
  - Liste moyens de paiement
  - Liste factures
  - Utilisation quotas

**Composants** :
- `UpgradePlanModal.tsx`
- `AddPaymentMethodModal.tsx`
- `CancelSubscriptionModal.tsx`
- `InvoiceList.tsx`
- `UsageStats.tsx`

**Temps estimé** : 8-10 heures

---

### Étape 6 : Tests 🧪

**À tester** :
- ✅ Création abonnement (Stripe Sandbox)
- ✅ Paiement réussi / échoué
- ✅ Webhooks Stripe reçus
- ✅ Upgrade / Downgrade
- ✅ Annulation
- ✅ Suspension après 3 échecs

**Temps estimé** : 3-4 heures

---

### Étape 7 : Production 🚀

**Déploiement** :
- ☑️ Exécuter migration SQL sur Supabase
- ☑️ Activer Stripe Live (mode production)
- ☑️ Configurer webhooks production
- ☑️ Push code sur GitHub
- ☑️ Déployer sur VPS
- ☑️ Tests en production
- ☑️ Documentation client

**Temps estimé** : 2-3 heures

---

## 📊 Temps Total Estimé

| Étape | Durée |
|-------|-------|
| ✅ Étape 1 (Analyse + SQL) | ✅ Terminé |
| Étape 2 (Stripe Config) | 1-2h |
| Étape 3 (API Routes) | 4-6h |
| Étape 4 (Workflows N8N) | 6-8h |
| Étape 5 (Interface) | 8-10h |
| Étape 6 (Tests) | 3-4h |
| Étape 7 (Production) | 2-3h |
| **TOTAL** | **25-35 heures** |

---

## 🎨 Aperçu Interface Client

```
╔════════════════════════════════════════════════════╗
║  💳 Gestion de votre Abonnement                    ║
╚════════════════════════════════════════════════════╝

┌────────────────────────────────────────────────────┐
│ 📊 Votre Formule Actuelle                          │
│                                                     │
│  🥈 Business - 79€/mois                            │
│                                                     │
│  Prochain prélèvement : 15 février 2026            │
│  Montant : 79,00 €                                 │
│                                                     │
│  [🚀 Passer à Enterprise] [⬇️ Revenir à Starter]   │
│  [❌ Annuler mon abonnement]                       │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ 💳 Moyens de Paiement                              │
│                                                     │
│  • Visa •••• 4242 ✅ Par défaut                    │
│    Expire 12/2028                                  │
│    [Modifier] [Supprimer]                          │
│                                                     │
│  • Mastercard •••• 5555                            │
│    Expire 06/2027                                  │
│    [Définir par défaut] [Supprimer]               │
│                                                     │
│  [+ Ajouter une carte bancaire]                    │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ 📄 Factures & Reçus                                │
│                                                     │
│  • Janvier 2026 - 79,00 € ✅ [📥 PDF]             │
│  • Décembre 2025 - 79,00 € ✅ [📥 PDF]            │
│  • Novembre 2025 - 79,00 € ✅ [📥 PDF]            │
│  • Octobre 2025 - 79,00 € ✅ [📥 PDF]             │
│                                                     │
│  [Voir toutes les factures (12)]                   │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ 📊 Utilisation de vos Quotas                       │
│                                                     │
│  👥 Utilisateurs    : 3 / 5    [▓▓▓▓▓▓░░░░] 60%   │
│  💾 Stockage        : 4.2 / 10 GB [▓▓▓▓░░░░░░] 42% │
│  🔄 Workflows N8N   : 2 / 5    [▓▓▓▓░░░░░░] 40%   │
│  📊 Leads (ce mois) : Illimité ✨                  │
│  👤 Clients         : Illimité ✨                  │
└────────────────────────────────────────────────────┘
```

---

## 🔄 Cycle de Vie Complet d'un Client

```
1. 📝 PRÉ-INSCRIPTION (Form public)
   ↓ (API /api/auth/register-lead)
   
2. 📊 LEAD ENREGISTRÉ (platform_leads)
   Status: pre_registered
   ↓ (Admin qualifie)
   
3. 📋 QUESTIONNAIRE + ENTRETIEN
   Tables: platform_onboarding_questionnaires
           platform_onboarding_interviews
   ↓ (Admin décide)
   
4. 🧪 ESSAI GRATUIT (7-30 jours)
   ↓ (API /api/platform/trials/create)
   - Création auth.users
   - Création company
   - Création role "Propriétaire"
   - Email identifiants (N8N)
   ↓ (Client teste)
   
5. ⏰ FIN D'ESSAI
   ↓ (Client décide)
   
6. 💳 SOUSCRIPTION ABONNEMENT ⭐
   ↓ (API /api/stripe/checkout/create-session)
   - Client choisit formule
   - Redirigé vers Stripe Checkout
   - Saisit carte bancaire
   ↓ (Paiement réussi)
   
7. ✅ CLIENT ACTIF PAYANT
   Table: subscriptions
   Status: active
   ↓ (Chaque mois)
   
8. 🔄 RENOUVELLEMENT AUTO
   Webhook: invoice.payment_succeeded
   ↓ (N8N: Email reçu)
   
9. 💰 PAIEMENT MENSUEL
   Continue indéfiniment
   OU
   ↓ (Client annule)
   
10. ❌ ANNULATION
    Webhook: customer.subscription.deleted
    Status: canceled
    ↓ (Fin période payée)
    
11. 🔒 DÉSACTIVATION
    Accès révoqué
    Données archivées
```

---

## 💡 Questions à Valider

### 1. **Stripe**
- ✅ Vous avez déjà un compte Stripe ?
- ✅ Mode Test ou directement Production ?
- ✅ Clés API Stripe disponibles ?

### 2. **Tarification**
- ✅ Les prix 29€ / 79€ / 199€ vous conviennent ?
- ✅ Uniquement mensuel ou aussi annuel (-20%) ?
- ✅ Période d'essai gratuite incluse dans l'abonnement ?

### 3. **Conversion Essai → Abonnement**
- ✅ Automatique (fin essai) ou manuel (client décide) ?
- ✅ Relances avant fin d'essai (J-7, J-3, J-1) ?
- ✅ Essai converti = crédit sur 1er mois ?

### 4. **Annulation**
- ✅ Immédiate ou fin de période ?
- ✅ Questionnaire de satisfaction obligatoire ?
- ✅ Possibilité de pause (1-3 mois) ?

### 5. **Échecs de Paiement**
- ✅ Combien de tentatives avant suspension ? (recommandé : 3)
- ✅ Délai entre tentatives ? (recommandé : 3, 5, 7 jours)
- ✅ Suspension immédiate ou 30j de grâce ?

---

## 📁 Fichiers Créés

```
gestion complete automatiser/
├── docs/
│   └── SYSTEME_ABONNEMENTS_COMPLET.md  ✅ (Architecture complète)
├── database/
│   └── create_subscriptions_tables.sql  ✅ (Migration SQL)
└── PLAN_ABONNEMENTS_ETAPE_1.md          ✅ (Ce fichier)
```

---

## 🚀 Commande pour Appliquer la Migration

**Quand vous serez prêt** :

```bash
# 1. Ouvrir Supabase Dashboard
https://supabase.com/dashboard/project/gqkfqvmvqswpqlkvdowz/sql

# 2. Copier le contenu de :
database/create_subscriptions_tables.sql

# 3. Coller dans SQL Editor

# 4. Cliquer "Run" ▶️

# 5. Vérifier les tables créées :
Tables → subscription_plans (3 lignes)
         subscriptions (0 lignes)
         subscription_history (0 lignes)
         payment_methods (0 lignes)
```

---

## 🎯 Prochaine Action Recommandée

**Option A** : **Configuration Stripe** (simple, 1-2h)
- Créer les produits
- Récupérer les IDs
- Mettre à jour la BDD

**Option B** : **Commencer les API Routes** (plus technique, 4-6h)
- Structure `/api/stripe/*`
- Intégration SDK Stripe
- Gestion erreurs

**Option C** : **Workflows N8N d'abord** (logique métier, 6-8h)
- Définir les flows
- Tester en isolation
- Puis connecter aux API

---

## ❓ Quelle approche préférez-vous ?

1. **🎯 Tout d'un coup** : Je continue et je crée tout (25-35h de travail)
2. **📦 Étape par étape** : On fait une étape, on valide, on passe à la suivante
3. **🔧 Vous choisissez** : Dites-moi par quoi commencer

**Mon conseil** : **Option 2 (Étape par étape)** pour éviter les erreurs et valider au fur et à mesure.

---

**Qu'en pensez-vous ? Par quoi voulez-vous qu'on commence ? 🤔**

