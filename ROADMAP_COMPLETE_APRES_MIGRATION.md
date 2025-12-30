# 🗺️ ROADMAP COMPLÈTE - Après Migration SQL

## 📊 Vue d'Ensemble

**Ce qu'il faut faire APRÈS avoir exécuté la migration SQL avec succès**

**Temps total estimé** : 2-3 heures  
**Difficulté** : Moyenne  
**Prérequis** : Migration SQL terminée ✅

---

## ✅ ÉTAPE 0 : Vérifier que la Migration a Réussi

### 0.1 Vérifier les Tables

```sql
-- Dans Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'subscription%';

-- Résultat attendu:
-- subscription_plans
-- subscriptions
-- subscription_history
```

### 0.2 Vérifier les 3 Formules

```sql
SELECT name, display_name, price_monthly, is_active 
FROM subscription_plans 
ORDER BY sort_order;

-- Résultat attendu:
-- starter    | Starter     | 29.00  | true
-- business   | Business    | 79.00  | true
-- enterprise | Enterprise  | 199.00 | true
```

### 0.3 Vérifier la Colonne plan_id

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND column_name = 'plan_id';

-- Résultat attendu:
-- plan_id | uuid
```

**Si tout est ✅, passez à l'étape 1 !**

---

## 🎯 ÉTAPE 1 : Mettre à Jour le VPS (15 min)

### 1.1 Pull GitHub

```bash
# SSH sur le VPS
ssh root@votre-serveur.com

# Aller dans le projet
cd /var/www/talosprime

# Pull
git pull origin main

# Installer packages
npm install
```

### 1.2 Build

```bash
# Build Next.js
npm run build

# Si erreur, vérifier les logs
# L'erreur plan_id ne devrait plus apparaître
```

### 1.3 Restart

```bash
# Restart l'app
pm2 restart talosprime

# Vérifier les logs
pm2 logs talosprime --lines 50

# Vérifier qu'il n'y a pas d'erreur
```

### 1.4 Test API

```bash
# Tester l'API des formules
curl https://www.talosprimes.com/api/stripe/plans/list

# Résultat attendu: JSON avec 3 formules
```

### 1.5 Test Page Billing

**Ouvrir** : https://www.talosprimes.com/billing

**Vérifier** :
- ✅ Page se charge sans erreur
- ✅ "Aucun Abonnement Actif" s'affiche
- ✅ Bouton "Choisir une formule" présent

**✅ Checkpoint 1 : Application déployée et fonctionnelle**

---

## 💳 ÉTAPE 2 : Configurer Stripe (MODE TEST) (45-60 min)

### 2.1 Créer/Se connecter à Stripe

1. Aller sur : https://dashboard.stripe.com
2. Se connecter ou créer un compte
3. **IMPORTANT** : Rester en **Mode Test** (toggle en haut à droite)

### 2.2 Créer les 3 Produits

**Pour chaque formule (Starter, Business, Enterprise)** :

1. **Aller sur** : https://dashboard.stripe.com/products
2. **Cliquer** : "+ Nouveau produit"
3. **Remplir** :
   - **Nom** : `Talos Prime - Starter` (ou Business, Enterprise)
   - **Description** : `Formule Starter - 1 user, 100 leads/mois, 1 GB`
4. **Prix** :
   - **Type** : Abonnement récurrent
   - **Montant** : `29.00` EUR (ou 79, 199)
   - **Période** : Mensuel
5. **Cliquer** : "Enregistrer le produit"
6. **Noter les IDs** :
   - **Product ID** : `prod_XXXXXXXXXXXXX`
   - **Price ID** : `price_XXXXXXXXXXXXX`

**Répéter pour les 3 formules !**

### 2.3 Récupérer les Clés API

1. **Aller sur** : https://dashboard.stripe.com/apikeys
2. **Noter** :
   - **Clé publiable** (mode test) : `pk_test_XXXXX`
   - **Clé secrète** (mode test) : `sk_test_XXXXX`

### 2.4 Configurer le Webhook

1. **Aller sur** : https://dashboard.stripe.com/webhooks
2. **Cliquer** : "+ Ajouter un endpoint"
3. **URL** : `https://www.talosprimes.com/api/stripe/webhooks/stripe`
4. **Événements à écouter** :
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
5. **Cliquer** : "Ajouter un endpoint"
6. **Noter** : **Webhook Secret** : `whsec_XXXXX`

**✅ Checkpoint 2 : Stripe configuré en mode Test**

---

## 🔐 ÉTAPE 3 : Variables d'Environnement (10 min)

### 3.1 Sur le VPS

```bash
# SSH sur le VPS
ssh root@votre-serveur.com

# Aller dans le projet
cd /var/www/talosprime

# Éditer .env.production
nano .env.production
```

**Ajouter ces lignes** (REMPLACER par vos vraies valeurs) :

```bash
# Stripe - MODE TEST
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK_SECRET
```

**Sauvegarder** : `Ctrl+X`, `Y`, `Enter`

### 3.2 Rebuild & Restart

```bash
# Rebuild avec les nouvelles variables
npm run build

# Restart
pm2 restart talosprime

# Vérifier les variables sont chargées
pm2 logs talosprime | grep STRIPE
```

**✅ Checkpoint 3 : Variables d'environnement configurées**

---

## 🗄️ ÉTAPE 4 : Mettre à Jour les IDs Stripe dans la BDD (10 min)

### 4.1 Préparer le SQL

**Copier ce template et REMPLACER les IDs** :

```sql
-- REMPLACER les prod_XXX et price_XXX par vos vrais IDs Stripe !

-- Formule Starter
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_VOTRE_ID_STARTER',
  stripe_price_id = 'price_VOTRE_ID_STARTER'
WHERE name = 'starter';

-- Formule Business
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_VOTRE_ID_BUSINESS',
  stripe_price_id = 'price_VOTRE_ID_BUSINESS'
WHERE name = 'business';

-- Formule Enterprise
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_VOTRE_ID_ENTERPRISE',
  stripe_price_id = 'price_VOTRE_ID_ENTERPRISE'
WHERE name = 'enterprise';

-- Vérifier
SELECT 
  name, 
  display_name, 
  price_monthly,
  stripe_product_id,
  stripe_price_id
FROM subscription_plans 
ORDER BY sort_order;
```

### 4.2 Exécuter dans Supabase

1. **Ouvrir** : https://supabase.com/dashboard/project/gqkfqvmvqswpqlkvdowz/sql/new
2. **Coller** le SQL (avec vos vrais IDs)
3. **Exécuter** : Run ▶️
4. **Vérifier** : Les 3 lignes doivent avoir `stripe_product_id` et `stripe_price_id` remplis

**✅ Checkpoint 4 : IDs Stripe enregistrés dans la BDD**

---

## 🔄 ÉTAPE 5 : Importer les Workflows N8N (30 min)

### 5.1 Se Connecter à N8N

**URL** : https://n8n.talosprimes.com

### 5.2 Importer Chaque Workflow

**Pour les 7 workflows dans `n8n-workflows/abonnements/`** :

1. **Cliquer** : `+ → Import from File`
2. **Sélectionner** le fichier `.json`
3. **Configurer credentials** :
   - **Resend** (Email) : Vérifier que la clé API est présente
   - **Twilio** (SMS) : Optionnel en dev, requis en prod
4. **ACTIVER** le workflow (toggle en haut à droite) ⚡
5. **Tester** (clic droit sur le nœud → Test)

**Liste des workflows à importer** :
- ✅ `creer-abonnement.json`
- ✅ `renouveler-abonnement.json`
- ✅ `echec-paiement.json`
- ✅ `annuler-abonnement.json`
- ✅ `upgrade-downgrade-plan.json`
- ✅ `rappel-renouvellement.json`
- ✅ `suspendre-compte.json`

**✅ Checkpoint 5 : 7 workflows N8N activés**

---

## 🧪 ÉTAPE 6 : Tests Complets (30 min)

### 6.1 Test API Plans

```bash
curl https://www.talosprimes.com/api/stripe/plans/list | jq
```

**Résultat attendu** : JSON avec 3 formules incluant `stripe_product_id` et `stripe_price_id`

### 6.2 Test Page Billing

1. **Se connecter** à l'app : https://www.talosprimes.com
2. **Aller sur** : `/billing`
3. **Vérifier** :
   - ✅ Page se charge
   - ✅ "Aucun Abonnement Actif"
   - ✅ Bouton "Choisir une formule"

### 6.3 Test Modal Formules

1. **Cliquer** : "Choisir une formule"
2. **Vérifier** :
   - ✅ Modal s'ouvre
   - ✅ 3 formules affichées (Starter, Business, Enterprise)
   - ✅ Prix corrects (29€, 79€, 199€)
   - ✅ Fonctionnalités listées

### 6.4 Test Redirection Stripe Checkout

1. **Cliquer** : "Choisir Business" (ou une autre formule)
2. **Vérifier** :
   - ✅ Redirection vers `checkout.stripe.com`
   - ✅ Formule correcte affichée
   - ✅ Prix correct affiché

### 6.5 Test Paiement (Carte Test)

**Utiliser une carte test Stripe** :
- **Numéro** : `4242 4242 4242 4242`
- **Date** : N'importe quelle date future (ex: 12/25)
- **CVC** : N'importe quel 3 chiffres (ex: 123)
- **Code postal** : N'importe lequel (ex: 75001)

1. **Remplir** le formulaire Stripe
2. **Valider** le paiement
3. **Vérifier** :
   - ✅ Redirection vers `/billing?success=true`
   - ✅ Message de succès affiché
   - ✅ Abonnement actif visible

### 6.6 Vérifier Webhook

**Dans Stripe Dashboard** :
1. **Aller sur** : https://dashboard.stripe.com/webhooks
2. **Cliquer** sur votre webhook
3. **Vérifier** :
   - ✅ Événements reçus (checkout.session.completed, customer.subscription.created)
   - ✅ Status 200 OK
   - ✅ Pas d'erreur

### 6.7 Vérifier BDD

**Dans Supabase SQL Editor** :

```sql
-- Vérifier qu'un abonnement a été créé
SELECT 
  s.id,
  s.status,
  s.amount,
  sp.display_name as plan,
  c.name as company
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
JOIN companies c ON s.company_id = c.id
ORDER BY s.created_at DESC
LIMIT 1;
```

**Résultat attendu** : 1 ligne avec votre abonnement test

### 6.8 Vérifier Email N8N

**Vérifier votre boîte email** :
- ✅ Email de confirmation reçu
- ✅ Design correct
- ✅ Informations correctes

**✅ Checkpoint 6 : Tous les tests passent !**

---

## 📊 ÉTAPE 7 : Monitoring & Logs (10 min)

### 7.1 Logs Application

```bash
# Sur le VPS
pm2 logs talosprime --lines 100

# Filtrer les logs Stripe
pm2 logs talosprime | grep stripe

# Vérifier qu'il n'y a pas d'erreur
```

### 7.2 Logs N8N

1. **Aller sur** : https://n8n.talosprimes.com
2. **Pour chaque workflow** :
   - Cliquer sur le workflow
   - Onglet "Executions"
   - Vérifier qu'il y a au moins 1 exécution réussie ✅

### 7.3 Logs Stripe

1. **Aller sur** : https://dashboard.stripe.com/logs
2. **Vérifier** :
   - ✅ Requêtes API réussies
   - ✅ Webhooks livrés
   - ✅ Pas d'erreur

**✅ Checkpoint 7 : Monitoring en place**

---

## 🎨 ÉTAPE 8 : Personnalisation (Optionnel, 30 min)

### 8.1 Modifier les Formules

**Si vous voulez changer les prix, quotas, etc.** :

```sql
-- Dans Supabase SQL Editor
UPDATE subscription_plans
SET 
  price_monthly = 39.00,  -- Nouveau prix
  max_users = 2,          -- Nouvelles quotas
  features = '["2 utilisateurs", "200 leads/mois", ...]'::jsonb
WHERE name = 'starter';
```

### 8.2 Ajouter des Modules

**Modifier le JSONB `modules`** :

```sql
UPDATE subscription_plans
SET 
  modules = modules || '["nouveau_module"]'::jsonb
WHERE name = 'business';
```

### 8.3 Personnaliser les Emails N8N

1. **Ouvrir** le workflow dans N8N
2. **Éditer** le nœud "Email"
3. **Modifier** le HTML du template
4. **Sauvegarder**

**✅ Checkpoint 8 : Personnalisation terminée**

---

## 🚀 ÉTAPE 9 : Passer en MODE PRODUCTION (Quand prêt)

### ⚠️ À faire SEULEMENT après avoir tout testé en Mode Test !

### 9.1 Activer Stripe en Production

1. **Stripe Dashboard** → Toggle "Mode Live"
2. **Vérifier** compte bancaire configuré
3. **Recréer** les 3 produits en mode Live
4. **Noter** les nouveaux IDs (prod_live_XXX, price_live_XXX)

### 9.2 Récupérer Clés Live

1. **Aller sur** : https://dashboard.stripe.com/apikeys
2. **Noter** :
   - `pk_live_XXXXX` (clé publique)
   - `sk_live_XXXXX` (clé secrète)

### 9.3 Recréer Webhook en Live

1. **Même URL** : `https://www.talosprimes.com/api/stripe/webhooks/stripe`
2. **Mêmes événements**
3. **Noter** : Nouveau `whsec_live_XXXXX`

### 9.4 Mettre à Jour .env.production

```bash
# Sur le VPS
nano /var/www/talosprime/.env.production

# REMPLACER les clés test par les clés live
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_VOTRE_CLE
STRIPE_SECRET_KEY=sk_live_VOTRE_CLE
STRIPE_WEBHOOK_SECRET=whsec_live_VOTRE_SECRET
```

### 9.5 Mettre à Jour les IDs en BDD

```sql
-- AVEC LES IDs LIVE cette fois !
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_live_STARTER',
  stripe_price_id = 'price_live_STARTER'
WHERE name = 'starter';

-- Répéter pour business et enterprise
```

### 9.6 Rebuild & Restart

```bash
npm run build
pm2 restart talosprime
```

### 9.7 Test Paiement Réel

**⚠️ Avec votre vraie carte cette fois !**
1. Créer un abonnement
2. Vérifier le prélèvement dans votre banque
3. Vérifier dans Stripe Live Dashboard

**✅ Checkpoint 9 : EN PRODUCTION ! 🎉**

---

## 📋 CHECK-LIST RÉCAPITULATIVE

### Avant de Commencer
- [ ] Migration SQL exécutée avec succès
- [ ] 4 tables créées (subscription_plans, subscriptions, subscription_history, payment_methods)
- [ ] 3 formules insérées (Starter, Business, Enterprise)
- [ ] Colonne `plan_id` existe dans `subscriptions`

### Configuration Stripe (Mode Test)
- [ ] Compte Stripe créé/connecté
- [ ] Mode Test activé
- [ ] 3 produits créés (Starter, Business, Enterprise)
- [ ] Prix configurés (29€, 79€, 199€)
- [ ] IDs Stripe notés (prod_XXX, price_XXX)
- [ ] Clés API récupérées (pk_test, sk_test)
- [ ] Webhook configuré (whsec_XXX)

### Variables d'Environnement
- [ ] `.env.production` mis à jour sur VPS
- [ ] 3 variables Stripe ajoutées
- [ ] Application rebuild
- [ ] Application restart

### Base de Données
- [ ] IDs Stripe mis à jour dans `subscription_plans`
- [ ] Vérification SQL passée (3 formules avec IDs)

### Workflows N8N
- [ ] 7 workflows importés
- [ ] Tous les workflows activés ⚡
- [ ] Credentials Resend configurées
- [ ] (Optionnel) Credentials Twilio configurées

### Tests
- [ ] API `/api/stripe/plans/list` fonctionne
- [ ] Page `/billing` se charge
- [ ] Modal formules s'ouvre
- [ ] Redirection Stripe Checkout fonctionne
- [ ] Paiement test réussi (carte 4242...)
- [ ] Webhook reçu (status 200)
- [ ] Abonnement créé en BDD
- [ ] Email confirmation reçu
- [ ] Aucune erreur dans les logs

### Monitoring
- [ ] Logs PM2 sans erreur
- [ ] Logs N8N : exécutions réussies
- [ ] Logs Stripe : webhooks livrés

### Production (Quand prêt)
- [ ] Stripe activé en Mode Live
- [ ] Produits recréés en Live
- [ ] Clés Live récupérées
- [ ] Webhook Live configuré
- [ ] `.env.production` mis à jour avec clés Live
- [ ] IDs Live mis à jour en BDD
- [ ] Test paiement réel réussi

---

## 🎯 RÉSUMÉ TEMPS PAR ÉTAPE

| Étape | Description | Temps | Difficulté |
|-------|-------------|-------|------------|
| 0 | Vérification migration | 5 min | Facile |
| 1 | Mettre à jour VPS | 15 min | Facile |
| 2 | Configurer Stripe Test | 45-60 min | Moyenne |
| 3 | Variables d'environnement | 10 min | Facile |
| 4 | IDs Stripe en BDD | 10 min | Facile |
| 5 | Importer workflows N8N | 30 min | Moyenne |
| 6 | Tests complets | 30 min | Facile |
| 7 | Monitoring | 10 min | Facile |
| 8 | Personnalisation (opt.) | 30 min | Moyenne |
| 9 | Production (plus tard) | 30 min | Moyenne |

**TOTAL** : 2h30 - 3h30

---

## 🆘 TROUBLESHOOTING

### Problème : "API plans retourne vide"
**Solution** : Vérifier que les 3 formules existent avec `is_active = true`

### Problème : "Webhook failed 401"
**Solution** : Vérifier `STRIPE_WEBHOOK_SECRET` dans `.env.production`

### Problème : "Email N8N non reçu"
**Solution** : Vérifier credentials Resend dans N8N

### Problème : "Page /billing erreur 500"
**Solution** : Vérifier logs PM2, probablement colonne manquante en BDD

---

## 🎉 FÉLICITATIONS !

**Une fois tout terminé, vous aurez** :

✅ Système d'abonnements complet  
✅ 3 formules actives (Starter, Business, Enterprise)  
✅ Paiements Stripe automatisés  
✅ Webhooks configurés  
✅ Workflows N8N automatisés  
✅ Emails de confirmation  
✅ Interface client professionnelle  
✅ Monitoring en place  

**Vous êtes prêt à accepter des paiements ! 💰🚀**

---

**Document créé le** : 30 décembre 2025  
**Pour** : Talos Prime - Système d'Abonnements  
**Version** : 1.0

