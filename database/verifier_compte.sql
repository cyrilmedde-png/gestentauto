-- Script de vérification pour voir l'état actuel de votre compte
-- Exécutez ce script pour voir si votre compte existe dans les tables

-- Vérifier si l'utilisateur existe dans auth.users (via la table users)
SELECT 
  'Vérification utilisateur' as check_type,
  u.id as user_id,
  u.email,
  u.first_name,
  u.last_name,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ Utilisateur existe dans users'
    ELSE '❌ Utilisateur NON trouvé dans users'
  END as status
FROM users u
WHERE u.email = 'groupemclem@gmail.com'
   OR u.id = '178e64c6-6058-4503-937e-85b4d70d8152'::uuid;

-- Vérifier l'entreprise
SELECT 
  'Vérification entreprise' as check_type,
  c.id as company_id,
  c.name as company_name,
  c.email,
  CASE 
    WHEN c.id IS NOT NULL THEN '✅ Entreprise existe'
    ELSE '❌ Entreprise NON trouvée'
  END as status
FROM companies c
WHERE c.email = 'groupemclem@gmail.com'
   OR c.name = 'Groupe Mclem';

-- Vérifier le rôle
SELECT 
  'Vérification rôle' as check_type,
  r.id as role_id,
  r.name as role_name,
  r.permissions,
  CASE 
    WHEN r.id IS NOT NULL THEN '✅ Rôle existe'
    ELSE '❌ Rôle NON trouvé'
  END as status
FROM roles r
WHERE r.name = 'Administrateur'
  AND r.company_id IN (
    SELECT id FROM companies WHERE email = 'groupemclem@gmail.com' OR name = 'Groupe Mclem'
  );

-- Vérification complète
SELECT 
  u.id as user_id,
  u.email,
  u.first_name,
  u.last_name,
  c.id as company_id,
  c.name as company_name,
  r.id as role_id,
  r.name as role_name,
  CASE 
    WHEN u.id IS NOT NULL AND c.id IS NOT NULL AND r.id IS NOT NULL THEN '✅ Compte configuré avec rôle'
    WHEN u.id IS NOT NULL AND c.id IS NOT NULL THEN '⚠️ Compte configuré mais sans rôle'
    WHEN u.id IS NOT NULL THEN '⚠️ Utilisateur existe mais pas d''entreprise'
    ELSE '❌ Utilisateur non trouvé'
  END as status_complet
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.email = 'groupemclem@gmail.com'
   OR u.id = '178e64c6-6058-4503-937e-85b4d70d8152'::uuid;

