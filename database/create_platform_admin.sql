-- Script pour créer le compte super admin de la plateforme
-- ⚠️ IMPORTANT : Exécuter ce script dans Supabase SQL Editor
-- Ce script crée la plateforme système avec un compte super admin non supprimable

-- ÉTAPE 1 : Vérifier si l'utilisateur existe déjà dans auth.users
-- Remplacer 'groupemclem@gmail.com' par l'email de l'utilisateur si différent
DO $$
DECLARE
  platform_user_id UUID;
  platform_company_id UUID;
  admin_role_id UUID;
BEGIN
  -- Trouver l'ID de l'utilisateur dans auth.users par email
  SELECT id INTO platform_user_id
  FROM auth.users
  WHERE email = 'groupemclem@gmail.com'
  LIMIT 1;

  -- Si l'utilisateur n'existe pas, afficher un message d'erreur
  IF platform_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur avec l''email groupemclem@gmail.com non trouvé dans auth.users. Veuillez d''abord créer cet utilisateur via Supabase Auth (inscription ou création manuelle dans Supabase Dashboard > Authentication > Users)';
  END IF;

  -- ÉTAPE 2 : Créer ou mettre à jour l'entreprise plateforme
  -- Vérifier si une plateforme existe déjà (via settings)
  -- Le champ value est JSONB, donc on extrait la valeur comme texte puis on la convertit en UUID
  -- On utilise #>>'{}' pour extraire le texte brut du JSONB (sans les guillemets)
  SELECT (value#>>'{}')::UUID INTO platform_company_id
  FROM settings
  WHERE key = 'platform_company_id'
  LIMIT 1;

  IF platform_company_id IS NULL THEN
    -- Créer la nouvelle entreprise plateforme
    INSERT INTO companies (
      name,
      email,
      phone,
      address,
      city,
      postal_code,
      country,
      vat_number,
      siret
    ) VALUES (
      'Groupe MCLEM',
      'groupemclem@gmail.com',
      '0789394806',
      '38 avenue Leon Blum',
      'Bagnols sur ceze',
      '30200',
      'FR',
      'FR53907790745',
      '90779074500018'
    )
    RETURNING id INTO platform_company_id;

    RAISE NOTICE 'Entreprise plateforme créée avec l''ID: %', platform_company_id;
  ELSE
    -- Mettre à jour l'entreprise plateforme existante
    UPDATE companies
    SET 
      name = 'Groupe MCLEM',
      email = 'groupemclem@gmail.com',
      phone = '0789394806',
      address = '38 avenue Leon Blum',
      city = 'Bagnols sur ceze',
      postal_code = '30200',
      country = 'FR',
      vat_number = 'FR53907790745',
      siret = '90779074500018',
      updated_at = NOW()
    WHERE id = platform_company_id;

    RAISE NOTICE 'Entreprise plateforme mise à jour avec l''ID: %', platform_company_id;
  END IF;

  -- ÉTAPE 3 : Créer ou mettre à jour le setting platform_company_id
  -- Le champ value est JSONB, donc on utilise to_jsonb() pour convertir
  INSERT INTO settings (company_id, key, value)
  VALUES (platform_company_id, 'platform_company_id', to_jsonb(platform_company_id::text))
  ON CONFLICT (company_id, key)
  DO UPDATE SET value = to_jsonb(platform_company_id::text), updated_at = NOW();

  -- ÉTAPE 4 : Créer le rôle Super Admin pour la plateforme
  INSERT INTO roles (company_id, name, permissions)
  VALUES (
    platform_company_id,
    'Super Admin',
    '{
      "platform": {
        "read": true,
        "write": true,
        "delete": false
      },
      "clients": {
        "read": true,
        "write": true,
        "delete": true,
        "create": true
      },
      "settings": {
        "read": true,
        "write": true,
        "delete": false
      },
      "users": {
        "read": true,
        "write": true,
        "delete": true,
        "create": true
      },
      "all_modules": true
    }'::jsonb
  )
  ON CONFLICT (company_id, name)
  DO UPDATE SET 
    permissions = EXCLUDED.permissions,
    updated_at = NOW()
  RETURNING id INTO admin_role_id;

  RAISE NOTICE 'Rôle Super Admin créé/mis à jour avec l''ID: %', admin_role_id;

  -- ÉTAPE 5 : Créer ou mettre à jour l'entrée utilisateur dans users
  INSERT INTO users (
    id,
    company_id,
    email,
    first_name,
    last_name,
    role_id
  ) VALUES (
    platform_user_id,
    platform_company_id,
    'groupemclem@gmail.com',
    NULL,
    NULL,
    admin_role_id
  )
  ON CONFLICT (id)
  DO UPDATE SET
    company_id = platform_company_id,
    email = 'groupemclem@gmail.com',
    role_id = admin_role_id,
    updated_at = NOW();

  RAISE NOTICE 'Utilisateur super admin créé/mis à jour avec l''ID: %', platform_user_id;

  -- ÉTAPE 6 : Créer un setting pour marquer cette plateforme comme non supprimable
  INSERT INTO settings (company_id, key, value)
  VALUES (platform_company_id, 'is_platform', 'true'::jsonb)
  ON CONFLICT (company_id, key)
  DO UPDATE SET value = 'true'::jsonb, updated_at = NOW();

  RAISE NOTICE '✓ Configuration complète ! Plateforme créée avec succès.';
  RAISE NOTICE '  - Company ID: %', platform_company_id;
  RAISE NOTICE '  - User ID: %', platform_user_id;
  RAISE NOTICE '  - Role ID: %', admin_role_id;
END $$;

-- ÉTAPE 7 : Vérification finale
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.email as company_email,
  c.siret,
  c.vat_number,
  u.id as user_id,
  u.email as user_email,
  r.name as role_name,
  (SELECT value#>>'{}' FROM settings WHERE company_id = c.id AND key = 'platform_company_id') as platform_setting_value,
  (SELECT value#>>'{}' FROM settings WHERE company_id = c.id AND key = 'is_platform') as is_platform_flag
FROM companies c
LEFT JOIN users u ON u.company_id = c.id
LEFT JOIN roles r ON r.id = u.role_id
WHERE c.name = 'Groupe MCLEM'
ORDER BY c.created_at DESC
LIMIT 1;

