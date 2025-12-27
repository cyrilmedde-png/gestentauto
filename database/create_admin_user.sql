-- Script pour créer un compte administrateur directement dans Supabase
-- ⚠️ IMPORTANT : Remplacez les valeurs entre < > par vos vraies valeurs

-- 1. Créer l'entreprise
INSERT INTO companies (name, email)
VALUES ('Groupe Mclem', 'groupemclem@gmail.com')
RETURNING id;

-- 2. Notez l'ID de l'entreprise retourné ci-dessus
-- Remplacez <COMPANY_ID> ci-dessous par cet ID

-- 3. Créer l'utilisateur dans public.users
-- ⚠️ Remplacez <USER_ID> par l'UUID de votre utilisateur Supabase Auth
-- Pour obtenir votre USER_ID :
--   - Allez dans Supabase Dashboard > Authentication > Users
--   - Copiez l'UUID de votre utilisateur
--   OU
--   - Créez votre compte via l'interface web d'inscription
--   - Récupérez l'UUID depuis la console du navigateur ou les logs

INSERT INTO users (id, company_id, email, first_name, last_name)
VALUES (
  '<USER_ID>'::uuid,  -- ⚠️ REMPLACEZ par votre UUID
  '<COMPANY_ID>'::uuid,  -- ⚠️ REMPLACEZ par l'ID de l'entreprise créée ci-dessus
  'groupemclem@gmail.com',
  'Cyril',
  'Mclem'
)
ON CONFLICT (id) DO UPDATE
SET company_id = EXCLUDED.company_id,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;

-- 4. Créer un rôle admin avec tous les droits
-- Notez l'ID du rôle retourné
INSERT INTO roles (company_id, name, permissions)
VALUES (
  '<COMPANY_ID>'::uuid,  -- ⚠️ REMPLACEZ par l'ID de l'entreprise
  'Administrateur',
  '{
    "all": true,
    "companies": {"read": true, "write": true, "delete": true},
    "users": {"read": true, "write": true, "delete": true},
    "modules": {"read": true, "write": true, "delete": true},
    "settings": {"read": true, "write": true, "delete": true}
  }'::jsonb
)
ON CONFLICT (company_id, name) DO UPDATE
SET permissions = EXCLUDED.permissions
RETURNING id;

-- 5. Assigner le rôle admin à l'utilisateur
-- ⚠️ Remplacez <ROLE_ID> par l'ID du rôle retourné ci-dessus
UPDATE users
SET role_id = '<ROLE_ID>'::uuid  -- ⚠️ REMPLACEZ par l'ID du rôle admin
WHERE id = '<USER_ID>'::uuid;  -- ⚠️ REMPLACEZ par votre UUID

-- 6. Vérification : Afficher les informations créées
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  c.name as company_name,
  r.name as role_name,
  r.permissions
FROM users u
JOIN companies c ON u.company_id = c.id
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.email = 'groupemclem@gmail.com';






