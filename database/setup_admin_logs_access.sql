-- ============================================================================
-- CONFIGURATION ACCÈS LOGS : SEUL groupemclem@gmail.com
-- ============================================================================
-- Ce script garantit que SEULE l'adresse groupemclem@gmail.com a accès à /platform/logs
-- Tous les autres utilisateurs seront refusés
-- ============================================================================

-- ÉTAPE 1 : Vérifier que groupemclem@gmail.com existe
-- ============================================================================
DO $$
DECLARE
  admin_user_id UUID;
  admin_company_id UUID;
BEGIN
  -- Chercher l'utilisateur admin
  SELECT id, company_id INTO admin_user_id, admin_company_id
  FROM users
  WHERE email = 'groupemclem@gmail.com'
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'ERREUR: L''utilisateur groupemclem@gmail.com n''existe pas dans la table users';
  END IF;

  RAISE NOTICE '✅ Admin trouvé: groupemclem@gmail.com (user_id: %, company_id: %)', admin_user_id, admin_company_id;
END $$;

-- ============================================================================
-- ÉTAPE 2 : Configurer settings.platform_company_id
-- ============================================================================
-- Si groupemclem@gmail.com a déjà un company_id, l'utiliser
-- Sinon, créer une company "Plateforme Admin"

DO $$
DECLARE
  admin_company_id UUID;
  platform_company_id UUID;
BEGIN
  -- Récupérer le company_id de l'admin
  SELECT company_id INTO admin_company_id
  FROM users
  WHERE email = 'groupemclem@gmail.com'
  LIMIT 1;

  -- Si l'admin n'a pas de company, en créer une
  IF admin_company_id IS NULL THEN
    RAISE NOTICE '⚠️  groupemclem@gmail.com n''a pas de company_id, création d''une company "Plateforme Admin"';
    
    INSERT INTO companies (name, created_at, updated_at)
    VALUES ('Plateforme Admin', NOW(), NOW())
    RETURNING id INTO platform_company_id;
    
    -- Assigner cette company à l'admin
    UPDATE users
    SET company_id = platform_company_id
    WHERE email = 'groupemclem@gmail.com';
    
    RAISE NOTICE '✅ Company "Plateforme Admin" créée (id: %)', platform_company_id;
  ELSE
    platform_company_id := admin_company_id;
    RAISE NOTICE '✅ Utilisation du company_id existant: %', platform_company_id;
  END IF;

  -- Mettre à jour ou créer settings.platform_company_id
  INSERT INTO settings (key, value, created_at, updated_at)
  VALUES (
    'platform_company_id',
    to_jsonb(platform_company_id::text),
    NOW(),
    NOW()
  )
  ON CONFLICT (key) DO UPDATE
  SET 
    value = to_jsonb(platform_company_id::text),
    updated_at = NOW();

  RAISE NOTICE '✅ settings.platform_company_id configuré: %', platform_company_id;
END $$;

-- ============================================================================
-- ÉTAPE 3 : Créer la fonction RPC platform_company_id() (si n'existe pas)
-- ============================================================================
CREATE OR REPLACE FUNCTION platform_company_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT value#>>'{}'::text 
  FROM settings 
  WHERE key = 'platform_company_id'
  LIMIT 1;
$$;

-- ============================================================================
-- ÉTAPE 4 : S'assurer que les autres users n'ont PAS le platform_company_id
-- ============================================================================
DO $$
DECLARE
  platform_id UUID;
  updated_count INTEGER;
BEGIN
  -- Récupérer le platform_company_id
  SELECT (value#>>'{}'::text)::uuid INTO platform_id
  FROM settings
  WHERE key = 'platform_company_id';

  -- Mettre à NULL le company_id de tous les users sauf groupemclem@gmail.com
  -- qui ont le platform_company_id
  UPDATE users
  SET company_id = NULL
  WHERE email != 'groupemclem@gmail.com'
    AND company_id = platform_id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count > 0 THEN
    RAISE NOTICE '⚠️  % utilisateur(s) non-admin avaient le platform_company_id, company_id mis à NULL', updated_count;
  ELSE
    RAISE NOTICE '✅ Aucun utilisateur non-admin n''avait le platform_company_id';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 5 : VÉRIFICATION FINALE
-- ============================================================================
SELECT 
  '🔍 VÉRIFICATION FINALE' AS titre,
  '' AS sep1;

-- Afficher settings.platform_company_id
SELECT 
  'settings.platform_company_id' AS source,
  value#>>'{}'::text AS company_id,
  '✅' AS status
FROM settings 
WHERE key = 'platform_company_id';

-- Afficher l'admin (DOIT avoir le platform_company_id)
SELECT 
  'ADMIN: groupemclem@gmail.com' AS source,
  company_id::text AS company_id,
  CASE 
    WHEN company_id::text = (SELECT value#>>'{}'::text FROM settings WHERE key = 'platform_company_id')
    THEN '✅ ACCÈS AUTORISÉ'
    ELSE '❌ ERREUR: company_id incorrect'
  END AS status
FROM users 
WHERE email = 'groupemclem@gmail.com';

-- Afficher les autres users (NE DOIVENT PAS avoir le platform_company_id)
SELECT 
  'USER: ' || email AS source,
  COALESCE(company_id::text, 'NULL') AS company_id,
  CASE 
    WHEN company_id::text = (SELECT value#>>'{}'::text FROM settings WHERE key = 'platform_company_id')
    THEN '❌ ERREUR: a le platform_company_id (ne devrait pas)'
    ELSE '✅ ACCÈS REFUSÉ (normal)'
  END AS status
FROM users 
WHERE email != 'groupemclem@gmail.com'
ORDER BY email
LIMIT 10;

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================
SELECT 
  '' AS sep1,
  '📊 RÉSUMÉ' AS titre;

SELECT 
  (SELECT COUNT(*) FROM users WHERE email = 'groupemclem@gmail.com' AND company_id::text = (SELECT value#>>'{}'::text FROM settings WHERE key = 'platform_company_id'))::text 
  || ' utilisateur(s) avec accès ADMIN (attendu: 1)' AS admin_count,
  
  (SELECT COUNT(*) FROM users WHERE email != 'groupemclem@gmail.com' AND company_id::text = (SELECT value#>>'{}'::text FROM settings WHERE key = 'platform_company_id'))::text 
  || ' utilisateur(s) non-admin avec platform_company_id (attendu: 0)' AS non_admin_with_platform,
  
  (SELECT COUNT(*) FROM users WHERE email != 'groupemclem@gmail.com')::text 
  || ' utilisateur(s) non-admin sans accès (normal)' AS non_admin_without_access;

-- ============================================================================
-- ✅ CONFIGURATION TERMINÉE
-- ============================================================================
-- SEUL groupemclem@gmail.com a maintenant accès à /platform/logs
-- Tous les autres utilisateurs verront "Accès réservé aux administrateurs"
-- ============================================================================

