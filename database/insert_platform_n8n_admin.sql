-- Script pour insérer l'administrateur principal dans platform_n8n_access
-- ⚠️ IMPORTANT : Remplacez les UUIDs par vos valeurs réelles avant d'exécuter
-- À exécuter dans Supabase SQL Editor

-- ÉTAPE 1 : Récupérer les IDs nécessaires
DO $$
DECLARE
  platform_user_id UUID;
  platform_company_id UUID;
BEGIN
  -- Trouver l'ID de l'utilisateur par email (remplacez par votre email)
  SELECT id INTO platform_user_id
  FROM users
  WHERE email = 'groupemclem@gmail.com'
  LIMIT 1;

  -- Trouver l'ID de la plateforme depuis settings
  SELECT (value#>>'{}')::UUID INTO platform_company_id
  FROM settings
  WHERE key = 'platform_company_id'
  LIMIT 1;

  -- Vérifier que les IDs sont trouvés
  IF platform_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur avec l''email groupemclem@gmail.com non trouvé dans la table users';
  END IF;

  IF platform_company_id IS NULL THEN
    RAISE EXCEPTION 'platform_company_id non trouvé dans settings. Exécutez d''abord create_platform_admin.sql';
  END IF;

  -- Insérer ou mettre à jour l'accès N8N
  INSERT INTO platform_n8n_access (
    user_id,
    company_id,
    is_platform_admin,
    has_n8n_access,
    access_level,
    notes
  ) VALUES (
    platform_user_id,
    platform_company_id,
    true,  -- C'est un admin plateforme
    true,  -- A accès à N8N
    'admin',  -- Niveau d'accès admin
    'Administrateur principal de la plateforme'
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    is_platform_admin = true,
    has_n8n_access = true,
    access_level = 'admin',
    notes = 'Administrateur principal de la plateforme',
    updated_at = NOW();

  RAISE NOTICE '✅ Accès N8N créé/mis à jour pour l''utilisateur: % (company_id: %)', platform_user_id, platform_company_id;
END;
$$;

-- Vérification : Afficher les accès N8N configurés
SELECT 
  pna.id,
  pna.user_id,
  u.email,
  u.first_name,
  u.last_name,
  pna.company_id,
  c.name as company_name,
  pna.is_platform_admin,
  pna.has_n8n_access,
  pna.access_level,
  pna.notes,
  pna.created_at
FROM platform_n8n_access pna
LEFT JOIN users u ON pna.user_id = u.id
LEFT JOIN companies c ON pna.company_id = c.id
ORDER BY pna.created_at DESC;






