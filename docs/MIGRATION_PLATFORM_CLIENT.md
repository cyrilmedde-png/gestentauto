# 📋 Guide de Migration - Convention de nommage Platform/Client

## 🎯 Objectif

Séparer clairement les données plateforme et client avec une convention de nommage explicite :
- **`platform_*`** : Tables appartenant à la plateforme (onboarding, gestion clients)
- **`client_*`** : Tables contenant les données métier des clients (CRM, facturation, etc.)

## 📝 État de la migration

### ✅ Scripts SQL créés

1. **`database/migration_platform_client_naming.sql`**
   - Renomme les tables onboarding existantes
   - Met à jour les références et contraintes
   - Met à jour les index

2. **`database/create_client_tables.sql`**
   - Crée les tables `client_*` pour les modules clients
   - Configure les RLS policies
   - Ajoute les triggers pour `updated_at`

3. **`database/update_rls_platform_tables.sql`**
   - Met à jour les RLS policies pour les tables `platform_*`
   - Assure que seuls les utilisateurs plateforme peuvent accéder

### ✅ Code mis à jour

- **Routes API platform** : Mises à jour pour utiliser `platform_*`
  - `app/api/platform/leads/route.ts`
  - `app/api/platform/leads/[id]/route.ts`
  - `app/api/platform/leads/[id]/questionnaire/route.ts`
  - `app/api/platform/leads/[id]/interview/route.ts`
  - `app/api/platform/leads/[id]/trial/route.ts`
  - `app/api/platform/leads/[id]/trial/resend-credentials/route.ts`
  - `app/api/platform/leads/test/route.ts`

### ⏳ À faire

- [ ] Mettre à jour les références dans les types TypeScript
- [ ] Mettre à jour les composants frontend qui utilisent les anciennes tables
- [ ] Créer les routes API client pour les modules clients
- [ ] Créer le système de permissions et modules
- [ ] Rendre le Sidebar dynamique

## 🚀 Étapes de migration

### Étape 1 : Exécuter les scripts SQL dans Supabase

**Ordre d'exécution :**

1. **Migration des noms de tables**
   ```sql
   -- Exécuter dans Supabase SQL Editor
   -- Fichier: database/migration_platform_client_naming.sql
   ```

2. **Créer les tables client**
   ```sql
   -- Exécuter dans Supabase SQL Editor
   -- Fichier: database/create_client_tables.sql
   ```

3. **Mettre à jour les RLS policies**
   ```sql
   -- Exécuter dans Supabase SQL Editor
   -- Fichier: database/update_rls_platform_tables.sql
   ```

### Étape 2 : Vérifier la migration

```sql
-- Vérifier que les tables ont été renommées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'platform_%' OR table_name LIKE 'client_%'
ORDER BY table_name;

-- Vérifier que les nouvelles tables client existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'client_%'
ORDER BY table_name;
```

### Étape 3 : Déployer le code

```bash
# Sur le serveur
cd /var/www/talosprime
git pull origin main
npm install
npm run build
pm2 restart all
```

### Étape 4 : Tester

1. **Plateforme** :
   - Se connecter avec un compte plateforme
   - Vérifier que `/platform/leads` fonctionne
   - Vérifier que les leads s'affichent correctement

2. **Client** :
   - Se connecter avec un compte client
   - Vérifier qu'il ne peut pas accéder à `/platform/leads`
   - (À venir) Tester l'accès aux modules client

## 🔄 Changements de nommage

### Tables renommées

| Ancien nom | Nouveau nom |
|------------|-------------|
| `leads` | `platform_leads` |
| `onboarding_questionnaires` | `platform_onboarding_questionnaires` |
| `onboarding_interviews` | `platform_onboarding_interviews` |
| `trials` | `platform_trials` |

### Colonnes renommées

| Table | Ancienne colonne | Nouvelle colonne |
|-------|------------------|------------------|
| `platform_onboarding_questionnaires` | `lead_id` | `platform_lead_id` |
| `platform_onboarding_interviews` | `lead_id` | `platform_lead_id` |
| `platform_trials` | `lead_id` | `platform_lead_id` |

### Nouvelles tables client

- `client_leads` - Module Leads/CRM
- `client_customers` - Module CRM
- `client_invoices` - Module Facturation
- `client_quotes` - Module Facturation

## 🚨 Points d'attention

1. **Backup** : Faire un backup de la base de données avant d'exécuter les scripts SQL
2. **Tests** : Tester en environnement de développement avant production
3. **Code** : Tous les appels aux anciennes tables doivent être mis à jour
4. **RLS** : Vérifier que les RLS policies fonctionnent correctement après migration

## 📚 Documentation complémentaire

- `docs/ARCHITECTURE_PLATEFORME_CLIENT.md` : Architecture complète
- `docs/CORRECTION_ARCHITECTURE_PLATEFORME.md` : Guide de correction précédent


