# 🔐 Guide Configuration Stripe - Étape par Étape

## 📋 Vue d'Ensemble

Ce guide vous explique comment configurer Stripe pour le système d'abonnements Talos Prime.

**Temps estimé** : 30-45 minutes

---

## 🎯 Ce Que Vous Allez Faire

1. ✅ Créer/Accéder compte Stripe
2. ✅ Créer 3 produits (Starter, Business, Enterprise)
3. ✅ Créer les prix mensuels
4. ✅ Récupérer les clés API
5. ✅ Configurer les webhooks
6. ✅ Mettre à jour la base de données

---

## 🚀 Étape 1 : Compte Stripe

### Option A : Créer un Nouveau Compte

1. **Aller sur** : https://dashboard.stripe.com/register
2. **Renseigner** :
   - Email
   - Nom complet
   - Pays : France
   - Mot de passe
3. **Valider l'email**
4. **Compléter le profil**

### Option B : Utiliser un Compte Existant

1. **Se connecter** : https://dashboard.stripe.com/login
2. **Passer en mode Test** (toggle en haut à droite)
   - Pour développement : Mode Test ✅
   - Pour production : Mode Live

---

## 💰 Étape 2 : Créer les 3 Produits

### 2.1 - Produit "Starter"

1. **Aller dans** : https://dashboard.stripe.com/test/products
2. **Cliquer** : "+ Add product"
3. **Renseigner** :
   ```
   Name: Starter
   Description: Parfait pour les entrepreneurs individuels et freelances
   
   Pricing:
   - Model: Standard pricing
   - Price: 29.00
   - Billing period: Monthly
   - Currency: EUR
   
   Payment options:
   - One time: ❌ (Désactivé)
   - Recurring: ✅ (Activé)
   ```
4. **Save product**
5. **📝 Noter** :
   - Product ID : `prod_XXXXXXXXXXXXX`
   - Price ID : `price_XXXXXXXXXXXXX`

---

### 2.2 - Produit "Business"

1. **Cliquer** : "+ Add product"
2. **Renseigner** :
   ```
   Name: Business
   Description: Idéal pour les PME et entreprises en croissance
   
   Pricing:
   - Model: Standard pricing
   - Price: 79.00
   - Billing period: Monthly
   - Currency: EUR
   
   Payment options:
   - One time: ❌ (Désactivé)
   - Recurring: ✅ (Activé)
   ```
3. **Save product**
4. **📝 Noter** :
   - Product ID : `prod_XXXXXXXXXXXXX`
   - Price ID : `price_XXXXXXXXXXXXX`

---

### 2.3 - Produit "Enterprise"

1. **Cliquer** : "+ Add product"
2. **Renseigner** :
   ```
   Name: Enterprise
   Description: Solution complète pour grandes entreprises
   
   Pricing:
   - Model: Standard pricing
   - Price: 199.00
   - Billing period: Monthly
   - Currency: EUR
   
   Payment options:
   - One time: ❌ (Désactivé)
   - Recurring: ✅ (Activé)
   ```
3. **Save product**
4. **📝 Noter** :
   - Product ID : `prod_XXXXXXXXXXXXX`
   - Price ID : `price_XXXXXXXXXXXXX`

---

## 🔑 Étape 3 : Récupérer les Clés API

### 3.1 - Clés de Test (Développement)

1. **Aller dans** : https://dashboard.stripe.com/test/apikeys
2. **Copier** :
   - **Publishable key** (commence par `pk_test_...`)
   - **Secret key** (cliquer "Reveal test key", commence par `sk_test_...`)

**📝 Noter dans un fichier sécurisé** :
```
STRIPE TEST
===========
Publishable Key: pk_test_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Secret Key: sk_test_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

### 3.2 - Clés Live (Production - Plus tard)

**⚠️ Ne pas utiliser maintenant** - Seulement quand tout est testé !

1. **Passer en mode Live** (toggle en haut à droite)
2. **Aller dans** : https://dashboard.stripe.com/apikeys
3. **Copier** :
   - Publishable key (`pk_live_...`)
   - Secret key (`sk_live_...`)

---

## 🔔 Étape 4 : Configurer les Webhooks

### 4.1 - Ajouter un Endpoint Webhook

1. **Aller dans** : https://dashboard.stripe.com/test/webhooks
2. **Cliquer** : "+ Add endpoint"
3. **Renseigner** :
   ```
   Endpoint URL: https://n8n.talosprimes.com/webhook/stripe-events
   Description: Webhooks Stripe pour abonnements Talos Prime
   ```

4. **Sélectionner les événements** :
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `invoice.upcoming`
   - ✅ `customer.created`
   - ✅ `payment_method.attached`
   - ✅ `payment_method.detached`

5. **Add endpoint**

6. **📝 Noter le Signing Secret** :
   - Cliquer sur le webhook créé
   - Cliquer "Reveal" sur "Signing secret"
   - Copier : `whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

---

## 🗄️ Étape 5 : Mettre à Jour la Base de Données

### 5.1 - Préparer les IDs

**Créer un fichier temporaire** avec vos IDs :

```sql
-- Fichier: update_stripe_ids.sql

-- STARTER
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_VOTRE_ID_STARTER',
  stripe_price_id = 'price_VOTRE_ID_STARTER'
WHERE name = 'starter';

-- BUSINESS
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_VOTRE_ID_BUSINESS',
  stripe_price_id = 'price_VOTRE_ID_BUSINESS'
WHERE name = 'business';

-- ENTERPRISE
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_VOTRE_ID_ENTERPRISE',
  stripe_price_id = 'price_VOTRE_ID_ENTERPRISE'
WHERE name = 'enterprise';

-- Vérifier
SELECT name, display_name, stripe_product_id, stripe_price_id 
FROM subscription_plans 
ORDER BY sort_order;
```

### 5.2 - Exécuter dans Supabase

1. **Ouvrir** : https://supabase.com/dashboard/project/gqkfqvmvqswpqlkvdowz/sql/new
2. **Remplacer** les `VOTRE_ID_XXX` par vos vrais IDs
3. **Coller** le SQL complet
4. **Run** ▶️
5. **Vérifier** que les 3 lignes sont affichées avec les IDs

---

## 🔐 Étape 6 : Variables d'Environnement

### 6.1 - Local (`.env.local`)

**Créer/Modifier** `.env.local` à la racine du projet :

```bash
# Stripe - Mode Test
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK_SECRET

# Supabase (déjà existantes normalement)
NEXT_PUBLIC_SUPABASE_URL=https://gqkfqvmvqswpqlkvdowz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Important** : Ne jamais committer `.env.local` dans Git !

---

### 6.2 - VPS Production (Plus tard)

**Quand tout sera testé**, sur le VPS :

```bash
# Se connecter au VPS
ssh root@votre-serveur.com

# Éditer le fichier
cd /var/www/talosprime
nano .env.production

# Ajouter (avec les clés LIVE cette fois)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_VOTRE_CLE_PUBLIQUE_LIVE
STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_SECRETE_LIVE
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK_SECRET_LIVE

# Sauvegarder : Ctrl+X, Y, Enter

# Rebuild et restart
npm run build
pm2 restart talosprime
```

---

## 🧪 Étape 7 : Tester la Configuration

### 7.1 - Test API Stripe

**Créer un fichier** `scripts/test-stripe.js` :

```javascript
const Stripe = require('stripe');
const stripe = Stripe('sk_test_VOTRE_CLE_SECRETE');

async function testStripe() {
  try {
    console.log('🧪 Test connexion Stripe...\n');
    
    // Test 1 : Lister les produits
    const products = await stripe.products.list({ limit: 10 });
    console.log('✅ Produits trouvés:', products.data.length);
    products.data.forEach(p => {
      console.log(`   - ${p.name} (${p.id})`);
    });
    
    // Test 2 : Lister les prix
    const prices = await stripe.prices.list({ limit: 10 });
    console.log('\n✅ Prix trouvés:', prices.data.length);
    prices.data.forEach(p => {
      console.log(`   - ${p.unit_amount/100}€/${p.recurring?.interval} (${p.id})`);
    });
    
    console.log('\n🎉 Configuration Stripe OK !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testStripe();
```

**Exécuter** :

```bash
node scripts/test-stripe.js
```

**Résultat attendu** :
```
🧪 Test connexion Stripe...

✅ Produits trouvés: 3
   - Starter (prod_XXX)
   - Business (prod_XXX)
   - Enterprise (prod_XXX)

✅ Prix trouvés: 3
   - 29€/month (price_XXX)
   - 79€/month (price_XXX)
   - 199€/month (price_XXX)

🎉 Configuration Stripe OK !
```

---

## 📝 Récapitulatif - Vos IDs à Noter

**Remplissez ce tableau** :

| Formule | Product ID | Price ID |
|---------|------------|----------|
| **Starter** | `prod_________________` | `price_________________` |
| **Business** | `prod_________________` | `price_________________` |
| **Enterprise** | `prod_________________` | `price_________________` |

**Clés API** :

| Type | Valeur |
|------|--------|
| **Publishable Key (Test)** | `pk_test_____________________________________` |
| **Secret Key (Test)** | `sk_test_____________________________________` |
| **Webhook Secret** | `whsec___________________________________` |

---

## ✅ Checklist Configuration

- [ ] Compte Stripe créé/connecté
- [ ] Mode Test activé
- [ ] 3 produits créés (Starter, Business, Enterprise)
- [ ] 3 prix créés (29€, 79€, 199€)
- [ ] Product IDs notés
- [ ] Price IDs notés
- [ ] Clés API récupérées (Publishable + Secret)
- [ ] Webhook endpoint créé (`https://n8n.talosprimes.com/webhook/stripe-events`)
- [ ] 9 événements sélectionnés
- [ ] Webhook secret noté
- [ ] Base de données mise à jour (IDs Stripe)
- [ ] `.env.local` créé avec les clés
- [ ] Test de connexion OK

---

## 🔄 Passer en Production (Plus Tard)

**Quand tout sera testé** :

1. ✅ Basculer en mode Live
2. ✅ Activer votre compte Stripe (vérification identité)
3. ✅ Recréer les 3 produits en mode Live
4. ✅ Récupérer nouvelles clés (`pk_live_...`, `sk_live_...`)
5. ✅ Créer nouveau webhook Live
6. ✅ Mettre à jour `.env.production` sur VPS
7. ✅ Mettre à jour BDD avec IDs Live

---

## 🆘 Problèmes Courants

### Problème : "Invalid API Key"

**Solution** :
- Vérifier que vous êtes en mode Test
- Vérifier que la clé commence bien par `sk_test_`
- Régénérer une nouvelle clé si nécessaire

---

### Problème : "Product not found"

**Solution** :
- Vérifier que le Product ID est correct
- Vérifier que vous êtes dans le bon mode (Test/Live)
- Vérifier dans le dashboard Stripe que le produit existe

---

### Problème : "Webhook signature verification failed"

**Solution** :
- Vérifier le Webhook Secret dans `.env.local`
- Vérifier que l'URL du webhook est correcte
- Tester avec Stripe CLI en local

---

## 📚 Documentation Stripe

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Documentation API](https://stripe.com/docs/api)
- [Guide Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Webhooks](https://stripe.com/docs/webhooks)
- [Testing](https://stripe.com/docs/testing)

---

## 🎯 Prochaine Étape

Une fois cette configuration terminée, vous pourrez :
- ✅ Tester les API routes Stripe en local
- ✅ Créer des abonnements de test
- ✅ Recevoir les webhooks
- ✅ Gérer les paiements

**Passez à** : Test de l'application en local (`npm run dev`)

---

**Configuration créée le** : 30 décembre 2025  
**Dernière mise à jour** : 30 décembre 2025

