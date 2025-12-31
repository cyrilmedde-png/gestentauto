# 📝 GUIDE : Modifier un Abonnement

Date : 31 Décembre 2025

---

## 🎯 TYPES DE MODIFICATIONS POSSIBLES

Il existe **3 types de modifications** possibles :

1. **Modifier une formule existante** (Starter/Business/Enterprise)
2. **Changer l'abonnement d'un client** (upgrade/downgrade)
3. **Modifier une formule custom** après création

---

## 1️⃣ MODIFIER UNE FORMULE EXISTANTE (Starter/Business/Enterprise)

### 📍 Où : Base de données Supabase

**Accès** : https://supabase.com/dashboard/project/gqkfqvmvqswpqlkvdowz/editor

**Table** : `subscription_plans`

### 🔧 Ce Que Vous Pouvez Modifier

#### A. Modifier le PRIX

```sql
-- Exemple : Changer le prix du Business de 79€ à 89€
UPDATE subscription_plans
SET price_monthly = 89.00
WHERE name = 'business';
```

⚠️ **IMPORTANT** : Si vous changez le prix, vous DEVEZ aussi :
1. Créer un nouveau prix dans Stripe
2. Mettre à jour le `stripe_price_id` dans la base

**Dans Stripe Dashboard** :
1. Aller sur https://dashboard.stripe.com/products
2. Trouver le produit "Business"
3. Cliquer "Add another price"
4. Créer le nouveau prix (89€/mois)
5. Copier le nouveau `price_id`

```sql
-- Mettre à jour le stripe_price_id
UPDATE subscription_plans
SET stripe_price_id = 'price_NOUVEAU_ID_ICI'
WHERE name = 'business';
```

#### B. Modifier les QUOTAS

```sql
-- Exemple : Augmenter le nombre de users pour Starter
UPDATE subscription_plans
SET max_users = 10  -- au lieu de 5
WHERE name = 'starter';

-- Exemple : Augmenter les leads pour Enterprise
UPDATE subscription_plans
SET max_leads = 2000  -- au lieu de 1000
WHERE name = 'enterprise';

-- Exemple : Mettre illimité (NULL)
UPDATE subscription_plans
SET max_leads = NULL  -- Illimité
WHERE name = 'enterprise';
```

#### C. Modifier la DESCRIPTION

```sql
-- Exemple : Changer la description
UPDATE subscription_plans
SET description = 'Nouvelle description pour les petites entreprises'
WHERE name = 'starter';
```

#### D. Modifier les FONCTIONNALITÉS

```sql
-- Exemple : Ajouter une fonctionnalité
UPDATE subscription_plans
SET features = features || ARRAY['Support prioritaire 24/7']
WHERE name = 'enterprise';

-- Exemple : Remplacer toutes les fonctionnalités
UPDATE subscription_plans
SET features = ARRAY[
  '20 utilisateurs',
  '500 leads/mois',
  'Support prioritaire',
  'API complète',
  'Webhooks personnalisés'
]
WHERE name = 'business';
```

#### E. Activer/Désactiver une Formule

```sql
-- Désactiver temporairement une formule
UPDATE subscription_plans
SET is_active = false
WHERE name = 'starter';

-- Réactiver
UPDATE subscription_plans
SET is_active = true
WHERE name = 'starter';
```

### 🧪 Vérifier les Modifications

```sql
-- Voir toutes les formules
SELECT 
  name,
  display_name,
  price_monthly,
  max_users,
  max_leads,
  is_active,
  stripe_price_id
FROM subscription_plans
ORDER BY sort_order;
```

---

## 2️⃣ CHANGER L'ABONNEMENT D'UN CLIENT (Upgrade/Downgrade)

### 🔄 Côté Client (Interface Web)

**URL** : `https://www.talosprimes.com/billing`

**Étapes** :
1. Le client se connecte à son compte
2. Va sur la page "Gestion de l'Abonnement"
3. Clique sur **"Changer de formule"**
4. Sélectionne la nouvelle formule (Starter → Business)
5. Confirme le changement
6. Le paiement est ajusté automatiquement (prorata)

**Ce qui se passe automatiquement** :
```
1. API `/api/stripe/subscriptions/change-plan` appelée
2. Stripe met à jour l'abonnement (prorata calculé)
3. La table `subscriptions` est mise à jour
4. Un webhook Stripe confirme le changement
5. Le workflow N8N `upgrade-downgrade-plan.json` est déclenché
6. Email de confirmation envoyé au client
```

### 🔧 Côté Admin (Forcer un changement)

**Si vous devez forcer un changement manuellement** :

#### Option 1 : Via l'API

```bash
# Appeler l'API pour changer le plan
curl -X POST https://www.talosprimes.com/api/stripe/subscriptions/change-plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "newPlanId": "uuid-du-nouveau-plan"
  }'
```

#### Option 2 : Directement dans Stripe Dashboard

1. Aller sur https://dashboard.stripe.com/subscriptions
2. Trouver l'abonnement du client
3. Cliquer "Update subscription"
4. Changer le "Price" pour la nouvelle formule
5. Sauvegarder

⚠️ **Webhook va synchroniser automatiquement la BDD**

#### Option 3 : Manuellement dans la BDD (DÉCONSEILLÉ)

```sql
-- Trouver l'abonnement du client
SELECT * FROM subscriptions WHERE company_id = 'uuid-company';

-- Changer le plan
UPDATE subscriptions
SET 
  plan_id = 'uuid-nouveau-plan',
  amount = 79.00,  -- Nouveau prix
  updated_at = NOW()
WHERE company_id = 'uuid-company' AND status = 'active';
```

⚠️ **DANGER** : Si vous faites ça manuellement, Stripe ne sera pas au courant !
➡️ **Recommandation** : Toujours passer par Stripe ou l'API.

---

## 3️⃣ MODIFIER UNE FORMULE CUSTOM

### 📍 Où : Page Admin

**URL** : `https://www.talosprimes.com/platform/subscriptions`

### Problème : Pas d'Interface de Modification Encore

**Actuellement**, vous ne pouvez QUE créer des formules custom, pas les modifier.

### ✅ Solutions de Contournement

#### Solution A : Modifier Directement dans la BDD

```sql
-- 1. Trouver la formule custom
SELECT * FROM subscription_plans WHERE name LIKE 'custom_%';

-- 2. Modifier le prix
UPDATE subscription_plans
SET price_monthly = 350.00
WHERE id = 'uuid-custom-plan';

-- 3. Modifier les quotas
UPDATE subscription_plans
SET 
  max_users = 15,
  max_leads = 1500,
  max_storage_gb = 100
WHERE id = 'uuid-custom-plan';

-- 4. Modifier les fonctionnalités
UPDATE subscription_plans
SET features = ARRAY[
  '15 utilisateurs',
  '1500 leads/mois',
  '100 GB de stockage',
  'Support dédié',
  'API illimitée'
]
WHERE id = 'uuid-custom-plan';
```

#### Solution B : Modifier dans Stripe Dashboard

Si le prix change :
1. Aller sur https://dashboard.stripe.com/products
2. Trouver le produit custom (chercher par nom du client)
3. Créer un nouveau prix
4. Mettre à jour le `stripe_price_id` dans la BDD

```sql
UPDATE subscription_plans
SET stripe_price_id = 'price_NOUVEAU_ID'
WHERE id = 'uuid-custom-plan';
```

#### Solution C : Créer une Interface d'Édition (À DÉVELOPPER)

**Vous voulez que je crée ça ?** 🚀

Je peux créer :
- Une page `/platform/subscriptions/edit/[planId]`
- Un modal "Modifier la formule"
- Avec formulaire pré-rempli
- Qui met à jour la BDD ET Stripe

**Temps estimé** : 20-30 minutes

---

## 🔄 MIGRATION D'ABONNEMENTS EN MASSE

### Cas d'Usage : Augmenter tous les prix de 10%

```sql
-- Augmenter tous les prix de 10%
UPDATE subscription_plans
SET price_monthly = price_monthly * 1.10
WHERE is_active = true;
```

⚠️ **ATTENTION** : Les clients déjà abonnés gardent leur ancien prix !
Pour les migrer :

```sql
-- Voir combien de clients seraient impactés
SELECT 
  sp.name AS plan,
  COUNT(*) AS nombre_clients,
  s.amount AS ancien_prix,
  sp.price_monthly AS nouveau_prix
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.status = 'active'
GROUP BY sp.name, s.amount, sp.price_monthly;
```

**Pour migrer les clients** : Il faut passer par Stripe pour chaque abonnement.

---

## 🎨 CRÉER UNE INTERFACE DE MODIFICATION

### Option 1 : Modal "Modifier la Formule"

**Fichiers à créer** :
- `components/admin/EditPlanModal.tsx`
- `app/api/admin/subscriptions/update-plan/route.ts`

**Fonctionnalités** :
- Modifier prix (crée un nouveau prix Stripe)
- Modifier quotas (users, leads, storage)
- Modifier fonctionnalités
- Activer/désactiver la formule

### Option 2 : Page Dédiée `/platform/subscriptions/edit/[planId]`

**Plus complet** :
- Formulaire complet avec validation
- Historique des modifications
- Aperçu des clients impactés
- Confirmation avant modification

---

## 📊 TABLEAU RÉCAPITULATIF

| Modification | Méthode | Où | Impact Stripe | Impact Clients Existants |
|--------------|---------|-----|---------------|--------------------------|
| **Prix** | BDD + Stripe | Supabase + Stripe Dashboard | ✅ Oui | ❌ Non (gardent ancien prix) |
| **Quotas** | BDD | Supabase | ❌ Non | ✅ Oui (immédiat) |
| **Description** | BDD | Supabase | ❌ Non | ✅ Oui (affichage) |
| **Fonctionnalités** | BDD | Supabase | ❌ Non | ✅ Oui (affichage) |
| **Activer/Désactiver** | BDD | Supabase | ❌ Non | ❌ Non (mais plus dispo nouveaux) |
| **Changer plan client** | API/Stripe | Interface web ou Stripe | ✅ Oui | ✅ Oui (avec prorata) |

---

## 🚨 BONNES PRATIQUES

### ✅ À FAIRE

1. **Toujours tester en mode sandbox Stripe d'abord**
2. **Documenter chaque modification** (historique)
3. **Prévenir les clients avant d'augmenter les prix**
4. **Créer un nouveau prix Stripe plutôt que de modifier l'ancien**
5. **Utiliser des transactions SQL pour les modifications en masse**

### ❌ À ÉVITER

1. ❌ Modifier un prix Stripe existant (casse les abonnements)
2. ❌ Modifier la BDD sans passer par Stripe (désynchronisation)
3. ❌ Augmenter les prix sans prévenir (mauvaise UX)
4. ❌ Supprimer une formule avec des clients actifs
5. ❌ Modifier des quotas drastiquement sans migration progressive

---

## 🎯 EXEMPLES CONCRETS

### Exemple 1 : Passer le Starter de 29€ à 34€

```sql
-- 1. Dans Stripe Dashboard :
-- Créer un nouveau prix : 34€/mois
-- Copier le nouveau price_id : price_1SkXXXX

-- 2. Dans Supabase :
UPDATE subscription_plans
SET 
  price_monthly = 34.00,
  stripe_price_id = 'price_1SkXXXX'
WHERE name = 'starter';

-- 3. Vérifier
SELECT name, price_monthly, stripe_price_id 
FROM subscription_plans 
WHERE name = 'starter';
```

**Résultat** :
- ✅ Nouveaux clients paieront 34€
- ⚠️ Anciens clients gardent 29€ (leur abonnement existant)

### Exemple 2 : Doubler les quotas du Business

```sql
-- Simple modification des quotas
UPDATE subscription_plans
SET 
  max_users = 40,  -- était 20
  max_leads = 1000,  -- était 500
  max_storage_gb = 100  -- était 50
WHERE name = 'business';

-- Vérifier
SELECT name, max_users, max_leads, max_storage_gb
FROM subscription_plans
WHERE name = 'business';
```

**Résultat** :
- ✅ Tous les clients Business profitent immédiatement des nouveaux quotas
- ✅ Pas besoin de toucher à Stripe

### Exemple 3 : Créer une variante "Business Pro"

```sql
-- Créer une nouvelle formule basée sur Business
INSERT INTO subscription_plans (
  id,
  name,
  display_name,
  description,
  price_monthly,
  stripe_product_id,
  stripe_price_id,
  max_users,
  max_leads,
  max_storage_gb,
  max_workflows,
  features,
  modules,
  is_active,
  sort_order
)
SELECT
  gen_random_uuid(),
  'business_pro',
  'Business Pro',
  'Pour les équipes en forte croissance',
  129.00,
  'prod_CREER_DANS_STRIPE',  -- À créer dans Stripe d'abord
  'price_CREER_DANS_STRIPE',  -- À créer dans Stripe d'abord
  50,
  2000,
  200,
  50,
  ARRAY[
    '50 utilisateurs',
    '2000 leads/mois',
    '200 GB stockage',
    'Support prioritaire 24/7',
    'API illimitée',
    'Webhooks avancés'
  ],
  ARRAY['leads', 'onboarding', 'analytics', 'automation'],
  true,
  4  -- Après Enterprise
FROM subscription_plans 
WHERE name = 'business' 
LIMIT 1;
```

---

## 💡 VOUS VOULEZ QUE JE DÉVELOPPE ?

**Je peux créer pour vous** :

### Option A : Interface de Modification Simple
- Modal "Modifier la formule"
- Champs : Prix, Quotas, Fonctionnalités
- Sauvegarde dans BDD + Stripe
- **Temps** : 20 minutes

### Option B : Interface Complète de Gestion
- Page dédiée `/platform/subscriptions/manage`
- Liste de toutes les formules (standard + custom)
- Bouton "Modifier" pour chaque formule
- Historique des modifications
- Aperçu clients impactés
- **Temps** : 45 minutes

### Option C : Système de Migration de Prix
- Interface pour migrer les clients vers nouveau prix
- Calcul automatique du prorata
- Prévisualisation des impacts
- Email automatique aux clients
- **Temps** : 1 heure

---

## 🎯 RECOMMANDATION

**Pour l'instant** :
1. Modifications simples → **Supabase SQL Editor**
2. Changements de prix → **Stripe Dashboard + SQL**
3. Changement de plan client → **Interface `/billing`** (déjà fonctionnelle)

**Pour plus tard** :
- Développer une interface admin complète de gestion des formules

---

## ❓ FAQ

**Q : Si je change le prix d'une formule, les clients actuels sont impactés ?**
R : Non, ils gardent leur ancien prix. Seuls les NOUVEAUX abonnements utilisent le nouveau prix.

**Q : Comment migrer tous mes clients Business vers le nouveau prix ?**
R : Il faut modifier chaque abonnement dans Stripe (via API ou Dashboard). Pas de migration en masse automatique.

**Q : Puis-je supprimer une formule ?**
R : Oui, mais mettez `is_active = false` plutôt que de supprimer. Les clients existants doivent pouvoir garder leur formule.

**Q : Comment créer une promo temporaire (-20%) ?**
R : Dans Stripe Dashboard, créez un "Coupon" ou "Promotion Code" plutôt que de modifier le prix.

**Q : Puis-je avoir des prix différents par pays ?**
R : Oui, Stripe supporte les prix internationaux. Il faut créer plusieurs `stripe_price_id` pour chaque devise.

---

**Besoin d'aide pour une modification spécifique ? Dites-moi ! 🚀**

