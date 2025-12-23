-- Script SIMPLE en plusieurs étapes pour créer l'utilisateur
-- Exécutez chaque section une par une

-- 1. Créer l'entreprise (si elle n'existe pas)
INSERT INTO companies (name, email)
VALUES ('Groupe Mclem', 'groupemclem@gmail.com')
ON CONFLICT DO NOTHING;

-- 2. Créer l'utilisateur (l'entreprise sera trouvée automatiquement)
INSERT INTO users (id, company_id, email, first_name, last_name)
VALUES (
  '178e64c6-6058-4503-937e-85b4d70d8152'::uuid,
  (SELECT id FROM companies WHERE email = 'groupemclem@gmail.com' OR name = 'Groupe Mclem' LIMIT 1),
  'groupemclem@gmail.com',
  'Cyril',
  'Mclem'
)
ON CONFLICT (id) DO UPDATE
SET 
  company_id = EXCLUDED.company_id,
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- 3. Vérifier que tout est OK
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  c.id as company_id,
  c.name as company_name
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.email = 'groupemclem@gmail.com';



