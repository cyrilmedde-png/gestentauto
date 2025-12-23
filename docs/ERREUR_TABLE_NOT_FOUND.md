# 🔴 Erreur : Table not found (platform_leads)

## Problème

L'erreur 500 sur `/api/platform/leads` indique que la table `platform_leads` n'existe pas encore dans Supabase.

Cela signifie que **les scripts SQL de migration n'ont pas encore été exécutés**.

## Solution immédiate

Vous avez **deux options** :

### Option 1 : Exécuter les scripts SQL (RECOMMANDÉ)

Suivez le guide : `docs/GUIDE_MIGRATION_SQL.md`

**Ordre d'exécution :**
1. `database/migration_platform_client_naming.sql`
2. `database/create_client_tables.sql`
3. `database/update_rls_platform_tables.sql`

### Option 2 : Utiliser temporairement l'ancien code

Si vous ne pouvez pas exécuter les scripts SQL maintenant, le code a été mis à jour pour **détecter automatiquement** quelle table utiliser :
- Il essaie d'abord `platform_leads`
- Si la table n'existe pas, il utilise `leads` (ancien nom)

**Le code devrait fonctionner automatiquement** même si les tables n'ont pas encore été renommées.

## Vérification

Pour vérifier quelle table existe dans Supabase :

```sql
-- Vérifier si platform_leads existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'platform_leads'
);

-- Vérifier si leads existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'leads'
);
```

## Prochaines étapes

Une fois les scripts SQL exécutés :
1. Redéployer l'application
2. Vérifier que `/api/platform/leads` fonctionne
3. Supprimer le code de fallback (optionnel, pour nettoyer)


