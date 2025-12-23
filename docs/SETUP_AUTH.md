# Configuration de l'authentification

## Étape 1 : Configuration Supabase

### 1.1 Créer un projet Supabase
1. Aller sur [supabase.com](https://supabase.com)
2. Créer un compte ou se connecter
3. Créer un nouveau projet
4. Noter l'URL du projet et les clés API

### 1.2 Exécuter le schéma SQL
1. Dans le dashboard Supabase, aller dans **SQL Editor**
2. Ouvrir le fichier `database/schema.sql`
3. Copier tout le contenu
4. Coller dans l'éditeur SQL de Supabase
5. Exécuter le script (bouton "Run")

Ce script va créer :
- Les tables : `companies`, `users`, `roles`, `modules`, `settings`
- Les index pour les performances
- Les triggers pour `updated_at`
- Les politiques RLS (Row Level Security) pour l'isolation multi-tenant

### 1.3 Configurer les variables d'environnement
Créer un fichier `.env.local` à la racine du projet avec :

```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Les clés se trouvent dans Supabase > Settings > API

## Étape 2 : Vérification

### 2.1 Tester l'inscription
1. Démarrer le serveur : `npm run dev`
2. Aller sur `http://localhost:3000/auth/register`
3. Créer un compte de test

### 2.2 Vérifier dans Supabase
- Vérifier que l'utilisateur apparaît dans `Authentication > Users`
- Vérifier que l'entreprise est créée dans la table `companies`
- Vérifier que l'entrée utilisateur est créée dans la table `users`

## Structure créée

### Fichiers de configuration
- `lib/supabase/client.ts` - Client Supabase côté client
- `lib/supabase/server.ts` - Client Supabase côté serveur (Server Components et API Routes)
- `lib/supabase/types.ts` - Types TypeScript pour la base de données
- `lib/auth.ts` - Fonctions utilitaires d'authentification

### Pages d'authentification
- `app/auth/login/page.tsx` - Page de connexion
- `app/auth/register/page.tsx` - Page d'inscription

### API Routes
- `app/api/auth/register/route.ts` - Endpoint pour compléter l'inscription (création entreprise)

### Composants
- `components/auth/AuthProvider.tsx` - Provider React pour l'authentification
- `components/auth/ProtectedRoute.tsx` - Composant pour protéger les routes

## Sécurité

### Row Level Security (RLS)
Toutes les tables ont des politiques RLS activées qui garantissent :
- L'isolation des données par entreprise (`company_id`)
- Que chaque utilisateur ne peut accéder qu'aux données de son entreprise
- La sécurité au niveau de la base de données

### Multi-tenant
- Chaque entreprise a son propre `company_id`
- Toutes les données sont isolées par `company_id`
- Les politiques RLS filtrent automatiquement les données

## Prochaines étapes

Une fois l'authentification configurée et testée :
1. Créer le système de rôles et permissions
2. Implémenter les modules métier (Facturation, CRM, etc.)
3. Ajouter la gestion des modules activés/désactivés



