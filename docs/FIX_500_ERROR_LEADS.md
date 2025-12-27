# 🔧 Fix : Erreur 500 sur /api/platform/leads

## Problème

L'erreur 500 sur `/api/platform/leads` peut avoir plusieurs causes :

1. **Table `platform_leads` n'existe pas** (migration SQL pas encore exécutée)
2. **Permissions RLS** bloquent l'accès
3. **Erreur de configuration** Supabase

## Solution appliquée

Le code a été mis à jour pour **détecter automatiquement** quelle table utiliser :

1. Essaie d'abord `platform_leads` (nouveau nom après migration)
2. Si erreur, essaie automatiquement `leads` (ancien nom)
3. Logs informatifs pour indiquer quelle table est utilisée

## Vérifications à faire

### 1. Vérifier les logs serveur

Sur le serveur, vérifier les logs PM2 :
```bash
pm2 logs
```

Chercher les messages :
- `Table platform_leads not accessible, trying 'leads' instead`
- `✅ Using legacy table name "leads"`

### 2. Vérifier quelle table existe dans Supabase

Exécuter dans Supabase SQL Editor :
```sql
-- Vérifier si platform_leads existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'platform_leads'
) as platform_leads_exists;

-- Vérifier si leads existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'leads'
) as leads_exists;
```

### 3. Vérifier les permissions RLS

```sql
-- Vérifier les RLS policies sur leads
SELECT * FROM pg_policies WHERE tablename = 'leads';

-- Vérifier les RLS policies sur platform_leads
SELECT * FROM pg_policies WHERE tablename = 'platform_leads';
```

## Solutions

### Option 1 : Exécuter la migration SQL (RECOMMANDÉ)

Si `platform_leads` n'existe pas, exécuter les scripts SQL :
1. `database/migration_platform_client_naming.sql`
2. `database/create_client_tables.sql`
3. `database/update_rls_platform_tables.sql`

Voir `docs/GUIDE_MIGRATION_SQL.md` pour les détails.

### Option 2 : Utiliser temporairement l'ancien nom

Le code détecte automatiquement et utilise `leads` si `platform_leads` n'existe pas. C'est une solution temporaire en attendant la migration.

### Option 3 : Vérifier les logs détaillés

Si l'erreur persiste, vérifier les logs avec plus de détails. Le code a été amélioré pour logger :
- Le code d'erreur exact
- Le message d'erreur
- Les détails complets de l'erreur

## Redéploiement

Après les modifications, redéployer :

```bash
cd /var/www/talosprime
git pull origin main
npm install
npm run build
pm2 restart all
```

## Test

Après redéploiement :
1. Se connecter avec un compte plateforme
2. Aller sur `/platform/leads`
3. Vérifier la console du navigateur (F12)
4. Vérifier les logs serveur (PM2)

Si ça ne fonctionne toujours pas, vérifier les logs serveur pour voir l'erreur exacte.





