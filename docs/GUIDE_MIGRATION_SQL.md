# 📋 Guide d'exécution des scripts SQL de migration

## ⚠️ IMPORTANT : Ordre d'exécution

Les scripts SQL doivent être exécutés **dans cet ordre précis** dans Supabase SQL Editor.

## 📝 Étape 1 : Backup (OBLIGATOIRE)

**Avant toute migration, faire un backup complet de votre base de données Supabase.**

1. Aller dans Supabase Dashboard
2. Settings > Database > Backups
3. Créer un backup manuel

## 📝 Étape 2 : Migration des noms de tables

**Script : `database/migration_platform_client_naming.sql`**

1. Ouvrir Supabase Dashboard > SQL Editor
2. Copier le contenu de `database/migration_platform_client_naming.sql`
3. Coller dans l'éditeur SQL
4. Cliquer sur "Run" (ou F5)
5. Vérifier qu'il n'y a pas d'erreurs dans les logs

**Ce script va :**
- Renommer `leads` → `platform_leads`
- Renommer `onboarding_questionnaires` → `platform_onboarding_questionnaires`
- Renommer `onboarding_interviews` → `platform_onboarding_interviews`
- Renommer `trials` → `platform_trials`
- Mettre à jour toutes les références (`lead_id` → `platform_lead_id`)
- Mettre à jour les contraintes et index

**Vérification après exécution :**
```sql
-- Vérifier que les tables ont été renommées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE 'platform_%' OR table_name LIKE 'client_%')
ORDER BY table_name;
```

## 📝 Étape 3 : Créer les tables client

**Script : `database/create_client_tables.sql`**

1. Toujours dans SQL Editor
2. Copier le contenu de `database/create_client_tables.sql`
3. Coller dans l'éditeur SQL
4. Cliquer sur "Run"
5. Vérifier qu'il n'y a pas d'erreurs

**Ce script va créer :**
- `client_leads` (Module Leads/CRM)
- `client_customers` (Module CRM)
- `client_invoices` (Module Facturation)
- `client_quotes` (Module Facturation)
- Avec RLS policies et triggers

**Vérification après exécution :**
```sql
-- Vérifier que les tables client ont été créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'client_%'
ORDER BY table_name;
```

## 📝 Étape 4 : Mettre à jour les RLS policies

**Script : `database/update_rls_platform_tables.sql`**

1. Toujours dans SQL Editor
2. Copier le contenu de `database/update_rls_platform_tables.sql`
3. Coller dans l'éditeur SQL
4. Cliquer sur "Run"
5. Vérifier qu'il n'y a pas d'erreurs

**Ce script va :**
- Mettre à jour les RLS policies pour les tables `platform_*`
- Assurer que seuls les utilisateurs plateforme peuvent accéder

**Vérification après exécution :**
```sql
-- Vérifier les RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE 'platform_%' OR tablename LIKE 'client_%'
ORDER BY tablename, policyname;
```

## ✅ Vérification finale

Exécuter cette requête pour vérifier que tout est correct :

```sql
-- Résumé de la migration
SELECT 
  'Tables platform' as type,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'platform_%'

UNION ALL

SELECT 
  'Tables client' as type,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'client_%'

UNION ALL

SELECT 
  'RLS Policies platform' as type,
  COUNT(*) as count
FROM pg_policies 
WHERE tablename LIKE 'platform_%'

UNION ALL

SELECT 
  'RLS Policies client' as type,
  COUNT(*) as count
FROM pg_policies 
WHERE tablename LIKE 'client_%';
```

**Résultats attendus :**
- Tables platform : 4 (platform_leads, platform_onboarding_questionnaires, platform_onboarding_interviews, platform_trials)
- Tables client : 4 (client_leads, client_customers, client_invoices, client_quotes)
- RLS Policies platform : ~16 (4 tables × 4 policies par table)
- RLS Policies client : ~16 (4 tables × 4 policies par table)

## 🚨 En cas d'erreur

Si vous rencontrez une erreur :

1. **Ne pas continuer** avec les scripts suivants
2. **Vérifier les logs** dans Supabase SQL Editor
3. **Restaurer le backup** si nécessaire
4. **Contacter le support** ou créer une issue GitHub

## 📝 Après la migration SQL

Une fois les scripts SQL exécutés :

1. **Déployer le code** sur le serveur :
   ```bash
   cd /var/www/talosprime
   git pull origin main
   npm install
   npm run build
   pm2 restart all
   ```

2. **Tester** :
   - Se connecter avec un compte plateforme
   - Vérifier que `/platform/leads` fonctionne
   - Vérifier que les leads s'affichent

## 🔗 Liens utiles

- Documentation complète : `docs/MIGRATION_PLATFORM_CLIENT.md`
- Architecture : `docs/ARCHITECTURE_PLATEFORME_CLIENT.md`







