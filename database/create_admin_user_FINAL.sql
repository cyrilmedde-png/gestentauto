-- Script FINAL pour créer le compte admin - Prêt à exécuter
-- UUID: 178e64c6-6058-4503-937e-85b4d70d8152
-- Email: groupemclem@gmail.com

-- Supprimer d'éventuelles entrées existantes (optionnel, pour repartir de zéro)
-- Décommentez si nécessaire :
-- DELETE FROM users WHERE id = '178e64c6-6058-4503-937e-85b4d70d8152'::uuid;
-- DELETE FROM companies WHERE email = 'groupemclem@gmail.com';

-- Créer ou récupérer l'entreprise
INSERT INTO companies (name, email)
VALUES ('Groupe Mclem', 'groupemclem@gmail.com')
ON CONFLICT DO NOTHING;

-- Récupérer l'ID de l'entreprise
DO $$
DECLARE
  v_user_id uuid := '178e64c6-6058-4503-937e-85b4d70d8152'::uuid;
  v_company_id uuid;
  v_role_id uuid;
BEGIN
  -- Récupérer ou créer l'entreprise
  SELECT id INTO v_company_id 
  FROM companies 
  WHERE email = 'groupemclem@gmail.com' OR name = 'Groupe Mclem'
  LIMIT 1;

  IF v_company_id IS NULL THEN
    INSERT INTO companies (name, email)
    VALUES ('Groupe Mclem', 'groupemclem@gmail.com')
    RETURNING id INTO v_company_id;
  END IF;

  -- Créer ou mettre à jour l'utilisateur
  INSERT INTO users (id, company_id, email, first_name, last_name)
  VALUES (v_user_id, v_company_id, 'groupemclem@gmail.com', 'Cyril', 'Mclem')
  ON CONFLICT (id) DO UPDATE
  SET 
    company_id = EXCLUDED.company_id,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();

  -- Créer ou mettre à jour le rôle admin
  INSERT INTO roles (company_id, name, permissions)
  VALUES (
    v_company_id,
    'Administrateur',
    '{
      "all": true,
      "companies": {"read": true, "write": true, "delete": true},
      "users": {"read": true, "write": true, "delete": true},
      "roles": {"read": true, "write": true, "delete": true},
      "modules": {"read": true, "write": true, "delete": true},
      "settings": {"read": true, "write": true, "delete": true}
    }'::jsonb
  )
  ON CONFLICT (company_id, name) DO UPDATE
  SET permissions = EXCLUDED.permissions
  RETURNING id INTO v_role_id;

  -- Assigner le rôle à l'utilisateur
  UPDATE users
  SET role_id = v_role_id
  WHERE id = v_user_id;

  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ Compte admin créé avec succès!';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE 'Company ID: %', v_company_id;
  RAISE NOTICE 'Role ID: %', v_role_id;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Email: groupemclem@gmail.com';
  RAISE NOTICE '✅ ========================================';
END $$;

-- Vérification finale
SELECT 
  '✅ VÉRIFICATION FINALE' as verification,
  u.id as user_id,
  u.email,
  u.first_name || ' ' || u.last_name as full_name,
  c.id as company_id,
  c.name as company_name,
  r.id as role_id,
  r.name as role_name,
  CASE 
    WHEN u.id IS NOT NULL AND c.id IS NOT NULL AND r.id IS NOT NULL THEN '✅ TOUT EST OK'
    WHEN u.id IS NOT NULL AND c.id IS NOT NULL THEN '⚠️ Utilisateur et entreprise OK, mais pas de rôle'
    WHEN u.id IS NOT NULL THEN '⚠️ Utilisateur OK, mais pas d''entreprise'
    ELSE '❌ PROBLÈME'
  END as status
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.email = 'groupemclem@gmail.com'
   OR u.id = '178e64c6-6058-4503-937e-85b4d70d8152'::uuid;







