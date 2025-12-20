-- Script simplifié pour créer un compte admin
-- Utilisez ce script SI vous avez déjà créé votre compte via l'interface web d'inscription

-- ⚠️ ÉTAPE 1 : Récupérez votre USER_ID depuis Supabase Dashboard > Authentication > Users
-- Remplacez 'VOTRE_USER_ID_ICI' ci-dessous par votre UUID

-- Étape 2 : Exécutez ce script avec votre USER_ID

DO $$
DECLARE
  v_user_id uuid := '178e64c6-6058-4503-937e-85b4d70d8152'::uuid;  -- UUID de groupemclem@gmail.com
  v_company_id uuid;
  v_role_id uuid;
BEGIN
  -- Créer l'entreprise
  INSERT INTO companies (name, email)
  VALUES ('Groupe Mclem', 'groupemclem@gmail.com')
  RETURNING id INTO v_company_id;

  -- Créer/mettre à jour l'utilisateur
  INSERT INTO users (id, company_id, email, first_name, last_name)
  VALUES (v_user_id, v_company_id, 'groupemclem@gmail.com', 'Cyril', 'Mclem')
  ON CONFLICT (id) DO UPDATE
  SET company_id = EXCLUDED.company_id,
      email = EXCLUDED.email,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name;

  -- Créer le rôle admin
  INSERT INTO roles (company_id, name, permissions)
  VALUES (
    v_company_id,
    'Administrateur',
    '{"all": true}'::jsonb
  )
  ON CONFLICT (company_id, name) DO UPDATE
  SET permissions = EXCLUDED.permissions
  RETURNING id INTO v_role_id;

  -- Assigner le rôle à l'utilisateur
  UPDATE users
  SET role_id = v_role_id
  WHERE id = v_user_id;

  RAISE NOTICE 'Compte admin créé avec succès!';
  RAISE NOTICE 'Company ID: %', v_company_id;
  RAISE NOTICE 'Role ID: %', v_role_id;
  RAISE NOTICE 'User ID: %', v_user_id;
END $$;

