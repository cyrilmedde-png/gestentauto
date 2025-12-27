# Accès Plateforme aux Données

## Vue d'ensemble

La plateforme (Groupe MCLEM) a un accès étendu aux données du système, avec une restriction importante : **elle ne peut pas voir les clients des clients**.

## Ce que la plateforme peut voir

✅ **Tous les clients (entreprises abonnées)**
- Liste de toutes les entreprises qui ont un abonnement
- Informations des entreprises (nom, email, adresse, etc.)
- Statut d'abonnement de chaque entreprise
- Utilisateurs de chaque entreprise cliente

✅ **Données système**
- Modules activés par entreprise
- Rôles et permissions de chaque entreprise
- Settings et configurations de chaque entreprise

✅ **Données de gestion plateforme**
- Statistiques globales
- Métriques d'utilisation
- Données de facturation (Stripe)

## Ce que la plateforme NE peut PAS voir

❌ **Clients des clients**
- Les clients CRM de chaque entreprise (table `customers`, `contacts`, etc.)
- Les données métier internes de chaque entreprise cliente
- Les factures/devis des entreprises pour leurs propres clients
- Les produits/services internes des entreprises

## Implémentation Technique

### 1. Fonctions SQL

Deux fonctions ont été créées pour gérer l'accès plateforme :

**`is_platform_user()`** : Vérifie si l'utilisateur actuel appartient à la plateforme
```sql
SELECT is_platform_user(); -- Retourne true/false
```

**`platform_company_id()`** : Retourne l'ID de l'entreprise plateforme
```sql
SELECT platform_company_id(); -- Retourne UUID
```

### 2. Politiques RLS (Row Level Security)

Les politiques RLS ont été modifiées pour permettre à la plateforme de voir les données :

```sql
-- Exemple pour la table companies
CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  USING (
    id = public.user_company_id()
    OR
    public.is_platform_user() -- La plateforme voit tout
  );
```

### 3. Filtrage dans les APIs

Pour les tables contenant des "clients des clients", il faut filtrer côté API :

```typescript
// Exemple pour la table customers (CRM)
const { data } = await supabase
  .from('customers')
  .select('*')
  .eq('company_id', userCompanyId) // Toujours filtrer par company_id
  // La plateforme ne verra jamais cette requête car elle utilise des APIs dédiées
```

### 4. APIs Dédiées Plateforme

Les APIs pour la plateforme doivent utiliser des endpoints spécifiques :

- `/api/settings/clients` : Liste des clients (entreprises abonnées)
- `/api/platform/stats` : Statistiques globales (à créer)
- `/api/platform/subscriptions` : Gestion des abonnements (à créer)

**Ces APIs n'accèdent JAMAIS aux tables "clients des clients"**.

## Règles à suivre pour les développements futurs

### ✅ FAIRE

1. **Pour les données entreprises** (companies, users, roles, modules, settings) :
   - Les politiques RLS permettent déjà l'accès plateforme
   - Aucune modification nécessaire

2. **Pour les APIs plateforme** :
   - Utiliser des endpoints dédiés (`/api/platform/*`)
   - Ne jamais accéder aux données "clients des clients"
   - Toujours filtrer par `company_id` quand nécessaire

3. **Pour les modules métier** (CRM, Facturation, etc.) :
   - Toujours filtrer par `company_id` dans les requêtes
   - La plateforme n'accède jamais directement à ces tables
   - Créer des APIs séparées si la plateforme a besoin de métriques agrégées

### ❌ NE PAS FAIRE

1. **Ne jamais** créer de politiques RLS qui donnent accès plateforme aux tables :
   - `customers` (clients CRM)
   - `suppliers` (fournisseurs)
   - `contacts` (contacts CRM)
   - `invoices` (factures clients)
   - `quotes` (devis clients)
   - Toute autre table contenant des données métier internes

2. **Ne jamais** utiliser les APIs normales pour accéder aux données clients depuis la plateforme

3. **Ne jamais** permettre à la plateforme de voir les données d'une entreprise cliente pour ses propres clients

## Exemple : Module CRM

Quand le module CRM sera créé, la table `customers` aura cette politique :

```sql
-- Politique pour customers (clients CRM des entreprises)
CREATE POLICY "Companies can view their own customers"
  ON customers FOR SELECT
  USING (
    company_id = public.user_company_id()
    -- PAS de is_platform_user() ici !
  );
```

La plateforme ne pourra jamais voir cette table via RLS. Si elle a besoin de statistiques, on créera une API dédiée qui agrège les données sans exposer les détails.

## Vérification

Pour vérifier si vous êtes connecté en tant que plateforme :

```typescript
import { isPlatformUser } from '@/lib/auth'

const isPlatform = await isPlatformUser()
if (isPlatform) {
  // Logique spécifique plateforme
}
```

## Script SQL

Exécuter `database/platform_access_rls.sql` pour configurer toutes les politiques RLS nécessaires.





