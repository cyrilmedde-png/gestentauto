-- Script ULTRA SIMPLE pour créer uniquement l'utilisateur dans la table users
-- À exécuter si l'utilisateur existe déjà dans Supabase Auth mais pas dans users

-- UUID de l'utilisateur : 178e64c6-6058-4503-937e-85b4d70d8152

-- ÉTAPE 1 : Créer l'entreprise (si elle n'existe pas)
INSERT INTO companies (name, email)
VALUES ('Groupe Mclem', 'groupemclem@gmail.com')
ON CONFLICT DO NOTHING;

-- ÉTAPE 2 : Récupérer l'ID de l'entreprise
-- Exécutez cette requête pour voir l'ID :
SELECT id, name, email FROM companies WHERE email = 'groupemclem@gmail.com' OR name = 'Groupe Mclem';

-- ÉTAPE 3 : Remplacez '<COMPANY_ID>' ci-dessous par l'ID obtenu, puis exécutez :

-- Créer l'utilisateur dans la table users
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

-- Vérification
SELECT * FROM users WHERE email = 'groupemclem@gmail.com';








