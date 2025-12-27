# 🔧 Fix : Erreur PGRST205 - Table not found

## Erreur observée

```
code: 'PGRST205'
message: "Could not find the table 'public.leads' in the schema cache"
hint: "Perhaps you meant the table 'public.client_leads'"
```

## Cause

L'application cherche la table `leads` ou `platform_leads` mais aucune des deux n'existe dans Supabase. L'erreur PGRST205 indique que Supabase ne trouve pas la table dans son cache de schéma.

## Solutions

### Solution 1 : Vérifier quelle table existe réellement

Exécuter dans Supabase SQL Editor :

```sql
-- Lister toutes les tables qui contiennent "lead" dans le nom
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%lead%'
ORDER BY table_name;

-- Vérifier spécifiquement chaque table
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'platform_leads'
) as platform_leads_exists;

SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'leads'
) as leads_exists;

SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'client_leads'
) as client_leads_exists;
```

### Solution 2 : Si aucune table n'existe, créer la table

Si aucune des tables n'existe, exécuter le script SQL de création :

```sql
-- Voir database/schema_onboarding.sql pour créer la table leads
-- OU exécuter la migration si elle n'a pas été faite
```

### Solution 3 : Si la table existe mais Supabase ne la voit pas

Parfois Supabase a un problème de cache. Essayer :

1. **Rafraîchir le schéma dans Supabase Dashboard**
   - Aller dans Database > Tables
   - Vérifier que la table apparaît

2. **Réinitialiser le cache PostgREST** (si vous avez accès admin)

3. **Vérifier les permissions**
   ```sql
   -- Vérifier que la table est accessible
   SELECT * FROM platform_leads LIMIT 1;
   -- ou
   SELECT * FROM leads LIMIT 1;
   ```

### Solution 4 : Exécuter la migration SQL complète

Si les scripts de migration n'ont pas été exécutés :

1. Exécuter `database/migration_platform_client_naming.sql`
2. Exécuter `database/create_client_tables.sql`
3. Exécuter `database/update_rls_platform_tables.sql`

Voir `docs/GUIDE_MIGRATION_SQL.md` pour les détails.

## Code corrigé

Le code a été mis à jour pour :
1. Essayer `platform_leads` d'abord
2. Si erreur PGRST205, essayer `leads`
3. Si aucune ne fonctionne, retourner une erreur claire avec instructions

## Vérification après correction

1. Redéployer l'application
2. Vérifier les logs serveur - ne devrait plus y avoir de crash en boucle
3. Tester `/api/platform/leads` - devrait fonctionner ou retourner une erreur claire

## Commandes de redéploiement

```bash
cd /var/www/talosprime
git pull origin main
npm install
npm run build
pm2 restart all
pm2 logs talosprime --lines 50
```






