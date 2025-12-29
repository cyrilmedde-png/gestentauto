-- Script EN UNE SEULE LIGNE pour créer l'utilisateur
-- Copiez-collez cette ligne complète dans Supabase SQL Editor et exécutez-la

INSERT INTO companies (name, email) VALUES ('Groupe Mclem', 'groupemclem@gmail.com') ON CONFLICT DO NOTHING; INSERT INTO users (id, company_id, email, first_name, last_name) VALUES ('178e64c6-6058-4503-937e-85b4d70d8152'::uuid, (SELECT id FROM companies WHERE email = 'groupemclem@gmail.com' LIMIT 1), 'groupemclem@gmail.com', 'Cyril', 'Mclem') ON CONFLICT (id) DO UPDATE SET company_id = EXCLUDED.company_id, email = EXCLUDED.email, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name;










