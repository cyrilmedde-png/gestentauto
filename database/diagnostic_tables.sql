-- =====================================================
-- Script de diagnostic - Vérifier l'état des tables
-- =====================================================
-- Exécuter ce script dans Supabase SQL Editor pour diagnostiquer
-- =====================================================

-- 1. Lister toutes les tables qui contiennent "lead" dans le nom
SELECT 
  'Tables contenant "lead"' as diagnostic,
  table_name,
  'Existe' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%lead%'
ORDER BY table_name;

-- 2. Vérifier spécifiquement chaque table
SELECT 
  'platform_leads' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'platform_leads'
  ) as exists
UNION ALL
SELECT 
  'leads' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'leads'
  ) as exists
UNION ALL
SELECT 
  'client_leads' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'client_leads'
  ) as exists;

-- 2b. Compter les lignes uniquement pour les tables qui existent (exécution séparée)
-- Exécuter ces requêtes seulement après avoir vérifié que les tables existent
DO $$
DECLARE
  platform_leads_count INTEGER := 0;
  leads_count INTEGER := 0;
  client_leads_count INTEGER := 0;
BEGIN
  -- Compter platform_leads si elle existe
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'platform_leads') THEN
    SELECT COUNT(*) INTO platform_leads_count FROM platform_leads;
    RAISE NOTICE 'platform_leads : % lignes', platform_leads_count;
  END IF;
  
  -- Compter leads si elle existe
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    SELECT COUNT(*) INTO leads_count FROM leads;
    RAISE NOTICE 'leads : % lignes', leads_count;
  END IF;
  
  -- Compter client_leads si elle existe
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_leads') THEN
    SELECT COUNT(*) INTO client_leads_count FROM client_leads;
    RAISE NOTICE 'client_leads : % lignes', client_leads_count;
  END IF;
END $$;

-- 3. Vérifier les RLS policies sur les tables existantes
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename LIKE '%lead%'
ORDER BY tablename, policyname;

-- 4. Vérifier si RLS est activé
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN 'RLS activé'
    ELSE 'RLS désactivé'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%lead%'
ORDER BY tablename;

-- 5. Message de diagnostic
DO $$
DECLARE
  platform_leads_exists BOOLEAN;
  leads_exists BOOLEAN;
  client_leads_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'platform_leads'
  ) INTO platform_leads_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'leads'
  ) INTO leads_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'client_leads'
  ) INTO client_leads_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNOSTIC DES TABLES';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'platform_leads existe : %', platform_leads_exists;
  RAISE NOTICE 'leads existe : %', leads_exists;
  RAISE NOTICE 'client_leads existe : %', client_leads_exists;
  RAISE NOTICE '';
  
  IF NOT platform_leads_exists AND NOT leads_exists THEN
    RAISE NOTICE '❌ PROBLÈME : Aucune table de leads d''onboarding trouvée !';
    RAISE NOTICE '';
    RAISE NOTICE 'SOLUTION :';
    RAISE NOTICE '  1. Si vous avez déjà des données dans "leads", exécutez :';
    RAISE NOTICE '     database/migration_platform_client_naming.sql';
    RAISE NOTICE '';
    RAISE NOTICE '  2. Si aucune table n''existe, exécutez :';
    RAISE NOTICE '     database/schema_onboarding.sql (pour créer leads)';
    RAISE NOTICE '     Puis database/migration_platform_client_naming.sql (pour renommer)';
    RAISE NOTICE '';
  ELSIF platform_leads_exists THEN
    RAISE NOTICE '✅ Table platform_leads existe - Migration complétée';
  ELSIF leads_exists THEN
    RAISE NOTICE '⚠️  Table leads existe - Migration pas encore exécutée';
    RAISE NOTICE '     Exécutez : database/migration_platform_client_naming.sql';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

