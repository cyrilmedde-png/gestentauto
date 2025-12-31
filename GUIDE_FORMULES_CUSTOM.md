# 🎨 Guide Formules Sur-Mesure - Interface Admin

## ✅ Ce Qui a Été Créé

### 1. Interface Admin `/platform/subscriptions`

Une page complète pour gérer les abonnements avec :
- **Vue d'ensemble** des formules (Starter, Business, Enterprise, Custom)
- **Statistiques** (abonnements actifs, revenus, clients)
- **Bouton "Créer Formule Custom"** en haut à droite

### 2. Modal de Création Custom

Formulaire complet pour créer une formule sur-mesure :
- **Nom du client**
- **Email de facturation**
- **Company ID**
- **Prix mensuel personnalisé**
- **Quotas personnalisables** :
  - Max Users (vide = illimité)
  - Max Leads/mois (vide = illimité)
  - Max Storage GB (vide = illimité)
  - Max Workflows N8N (vide = illimité)
- **Fonctionnalités** (liste personnalisée)

### 3. API Automatisée

`/api/admin/subscriptions/create-custom` :
- Crée automatiquement un produit Stripe
- Crée automatiquement le prix Stripe
- Enregistre la formule dans votre BDD
- Génère un lien de paiement unique
- Retourne l'URL à envoyer au client

### 4. Lien dans la Sidebar

Le lien "💳 Abonnements" est maintenant visible dans la sidebar pour les admins plateforme.

---

## 🚀 Comment Utiliser (Workflow Complet)

### Étape 1 : Mettre à Jour les IDs Stripe

**D'ABORD**, mettez à jour votre BDD avec les IDs Stripe :

```sql
-- Copier le contenu de database/update_stripe_ids.sql
-- Coller dans Supabase SQL Editor
-- Run ▶️
```

**Vérifier** :
```sql
SELECT name, display_name, stripe_product_id, stripe_price_id 
FROM subscription_plans 
ORDER BY sort_order;
```

Vous devriez voir vos 3 IDs Stripe remplis ! ✅

---

### Étape 2 : Déployer sur le VPS

```bash
# Sur le VPS
cd /var/www/talosprime
git pull origin main
npm install
npm run build
pm2 restart talosprime
```

---

### Étape 3 : Accéder à l'Interface Admin

1. **Se connecter** à https://www.talosprimes.com
2. **Cliquer** sur "💳 Abonnements" dans la sidebar
3. Vous voyez la page avec :
   - Les 3 formules standards (Starter, Business, Enterprise)
   - Un bouton "Créer Formule Custom"

---

### Étape 4 : Créer une Formule Custom

**Scénario Exemple** : Client "Entreprise XYZ" veut une formule à 350€/mois avec 10 users et 50 GB de stockage.

1. **Cliquer** : "Créer Formule Custom"
2. **Remplir le formulaire** :
   - **Nom du Client** : `Entreprise XYZ`
   - **Email de Facturation** : `contact@xyz.com`
   - **Company ID** : `uuid-xxx-xxx` (copier depuis Supabase)
   - **Prix Mensuel** : `350.00`
   - **Max Utilisateurs** : `10`
   - **Max Leads/mois** : Laisser vide (= illimité)
   - **Stockage (GB)** : `50`
   - **Max Workflows N8N** : `15`
   - **Fonctionnalités** : `10 utilisateurs, Leads illimités, 50 GB stockage, 15 workflows N8N, Support prioritaire, Formation personnalisée`
3. **Cliquer** : "🚀 Créer & Générer Lien de Paiement"
4. **Attendre** 5-10 secondes
5. **SUCCESS !** Modal affiche :
   - ✅ Message de succès
   - 🔗 Lien de paiement Stripe
   - 📊 Résumé de la formule

---

### Étape 5 : Envoyer le Lien au Client

1. **Copier** le lien de paiement (bouton "Copier")
2. **Envoyer** au client par email :

```
Bonjour,

Votre formule sur-mesure Talos Prime est prête !

Prix : 350€/mois
- 10 utilisateurs
- Leads illimités
- 50 GB de stockage
- 15 workflows N8N
- Support prioritaire
- Formation personnalisée

Pour activer votre abonnement, cliquez sur ce lien de paiement sécurisé :
https://checkout.stripe.com/c/pay/cs_test_xxxxx...

Cordialement,
L'équipe Talos Prime
```

---

### Étape 6 : Le Client Paie

1. **Client clique** sur le lien
2. **Client arrive** sur Stripe Checkout
3. **Client entre** ses informations de carte
4. **Client valide** le paiement
5. **Stripe traite** le paiement
6. **Webhook déclenché** → Votre application est notifiée
7. **Abonnement créé** automatiquement dans votre BDD
8. **Client redirigé** vers `/billing?success=true`
9. **Client voit** son abonnement actif avec ses quotas custom ! 🎉

---

## 📊 Vérifications

### Vérifier dans Stripe Dashboard

1. **Aller sur** : https://dashboard.stripe.com/products
2. **Vérifier** : Nouveau produit "Talos Prime - Custom - Entreprise XYZ"
3. **Aller sur** : https://dashboard.stripe.com/subscriptions
4. **Vérifier** : Nouvel abonnement actif

### Vérifier dans Supabase

```sql
-- Vérifier la nouvelle formule custom
SELECT * FROM subscription_plans 
WHERE name LIKE 'custom_%' 
ORDER BY created_at DESC 
LIMIT 1;

-- Vérifier l'abonnement créé
SELECT 
  s.*,
  sp.display_name as plan_name,
  c.name as company_name
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
JOIN companies c ON s.company_id = c.id
WHERE sp.name LIKE 'custom_%'
ORDER BY s.created_at DESC 
LIMIT 1;
```

---

## 🎯 Cas d'Usage Typiques

### Cas 1 : Client Veut Plus d'Utilisateurs

**Client** : "J'ai besoin de 20 utilisateurs au lieu de 5"

**Action** :
- Créer formule custom : 150€/mois, 20 users, autres quotas Business
- Envoyer lien de paiement
- Client paie → Abonnement activé

### Cas 2 : Client Veut Stockage Illimité

**Client** : "J'ai besoin de plus de 100 GB de stockage"

**Action** :
- Créer formule custom : 250€/mois, quotas Enterprise + stockage illimité (vide)
- Envoyer lien de paiement
- Client paie → Abonnement activé

### Cas 3 : Client Veut Formule Totalement Custom

**Client** : "J'ai des besoins très spécifiques"

**Action** :
- Discuter avec le client
- Négocier le prix et les quotas
- Créer formule custom avec TOUS les paramètres personnalisés
- Envoyer lien de paiement
- Client paie → Abonnement activé

---

## 🔐 Sécurité

### Qui Peut Créer des Formules Custom ?

**Uniquement les Administrateurs Plateforme !**

L'API vérifie :
```typescript
// Vérifier que l'utilisateur est admin plateforme
const { data: userData } = await supabase
  .from('users')
  .select('role_id, roles(name)')
  .eq('id', user.id)
  .single()

if (userData.roles?.name !== 'Administrateur Plateforme') {
  return 403 // Accès refusé
}
```

**Clients normaux ne peuvent PAS créer de formules custom.**

---

## 💰 Gestion des Paiements

### Renouvellement Automatique

- **Stripe prélève automatiquement** tous les mois
- **Webhook notifie** votre application
- **Email de reçu** envoyé automatiquement (workflow N8N)
- **Historique conservé** dans `subscription_history`

### Échecs de Paiement

- **Workflow N8N** `echec-paiement.json` déclenché
- **Email + SMS** envoyés au client
- **Après 3 échecs** : Suspension automatique

### Annulation

- **Client peut annuler** depuis `/billing`
- **Workflow N8N** `annuler-abonnement.json` déclenché
- **Email de confirmation** envoyé
- **Accès maintenu** jusqu'à la fin de période

---

## 📈 Évolutions Possibles

### Fonctionnalités Futures

1. **Sélecteur de Company** : Dropdown pour choisir la company au lieu d'entrer l'UUID
2. **Historique des Custom** : Liste des formules custom créées
3. **Modification Custom** : Modifier une formule custom existante
4. **Templates Custom** : Sauvegarder des templates (ex: "Agence 10", "Agence 20")
5. **Envoi Email Auto** : Envoyer l'email avec le lien automatiquement
6. **Multi-prix** : Prix annuel avec réduction

---

## 🆘 Troubleshooting

### Erreur : "Company ID not found"

**Cause** : Le Company ID n'existe pas dans la table `companies`

**Solution** :
```sql
-- Vérifier que la company existe
SELECT id, name FROM companies WHERE id = 'uuid-xxx';
```

### Erreur : "Stripe product creation failed"

**Cause** : Problème avec les clés API Stripe

**Solution** :
- Vérifier `STRIPE_SECRET_KEY` dans `.env.production`
- Vérifier que vous êtes en Mode Test sur Stripe Dashboard
- Vérifier les logs : `pm2 logs talosprime`

### Le lien de paiement ne fonctionne pas

**Cause** : Session Stripe expirée (24h max)

**Solution** :
- Recréer une nouvelle formule custom
- Le nouveau lien sera valide 24h

---

## ✅ Check-List Rapide

### Avant de Commencer

- [ ] Migration SQL exécutée (`diagnostic_et_fix_subscriptions.sql`)
- [ ] IDs Stripe mis à jour (`update_stripe_ids.sql`)
- [ ] Variables d'environnement configurées (`.env.production`)
- [ ] Application déployée sur VPS
- [ ] Build réussi sans erreur

### Pour Créer une Formule Custom

- [ ] Se connecter en tant qu'admin plateforme
- [ ] Aller sur `/platform/subscriptions`
- [ ] Cliquer "Créer Formule Custom"
- [ ] Remplir tous les champs requis (*)
- [ ] Récupérer le Company ID depuis Supabase
- [ ] Valider le formulaire
- [ ] Copier le lien de paiement
- [ ] Envoyer au client
- [ ] Attendre que le client paie
- [ ] Vérifier l'abonnement dans Stripe + Supabase

---

## 🎉 Résumé

**Vous pouvez maintenant** :

✅ Créer des formules sur-mesure en quelques clics  
✅ Personnaliser 100% des quotas et fonctionnalités  
✅ Générer des liens de paiement uniques  
✅ Automatiser tout le processus de paiement  
✅ Gérer les abonnements custom comme les standards  

**Le système est COMPLET et PRÊT ! 🚀**

---

**Créé le** : 31 décembre 2025  
**Version** : 1.0  
**Status** : ✅ Complet et Fonctionnel

