-- Requête SQL pour lister tous les comptes utilisateurs classés par company_id
-- Utile pour vérifier la structure des utilisateurs et leurs entreprises
-- Compatible avec Supabase/PostgreSQL

-- IMPORTANT : Pour vérifier le platform_company_id, utilisez cette requête d'abord :
SELECT 
  key,
  value,
  value#>>'{}' as value_extracted,
  company_id
FROM settings 
WHERE key = 'platform_company_id';

-- Version simple : Liste des utilisateurs avec leur company_id
SELECT 
  u.id as user_id,
  u.email,
  u.first_name,
  u.last_name,
  u.company_id,
  c.name as company_name,
  c.email as company_email,
  u.role_id,
  r.name as role_name,
  u.created_at,
  u.updated_at
FROM users u
LEFT JOIN companies c ON c.id = u.company_id
LEFT JOIN roles r ON r.id = u.role_id
ORDER BY u.company_id, u.email;

-- Version détaillée avec vérification plateforme
SELECT 
  u.id as user_id,
  u.email,
  u.first_name,
  u.last_name,
  u.company_id,
  c.name as company_name,
  c.email as company_email,
  u.role_id,
  r.name as role_name,
  -- Vérifier si c'est la plateforme (extraire correctement le JSONB)
  CASE 
    WHEN u.company_id::text = (SELECT value#>>'{}' FROM settings WHERE key = 'platform_company_id' LIMIT 1) 
    THEN 'PLATEFORME' 
    ELSE 'CLIENT' 
  END as user_type,
  u.created_at,
  u.updated_at
FROM users u
LEFT JOIN companies c ON c.id = u.company_id
LEFT JOIN roles r ON r.id = u.role_id
ORDER BY 
  CASE 
    WHEN u.company_id::text = (SELECT value#>>'{}' FROM settings WHERE key = 'platform_company_id' LIMIT 1) 
    THEN 0 
    ELSE 1 
  END,
  u.company_id, 
  u.email;

-- Version avec comptage par entreprise
SELECT 
  u.company_id,
  c.name as company_name,
  COUNT(u.id) as nombre_utilisateurs,
  STRING_AGG(u.email, ', ') as liste_emails
FROM users u
LEFT JOIN companies c ON c.id = u.company_id
GROUP BY u.company_id, c.name
ORDER BY 
  CASE 
    WHEN u.company_id::text = (SELECT value#>>'{}' FROM settings WHERE key = 'platform_company_id' LIMIT 1) 
    THEN 0 
    ELSE 1 
  END,
  c.name;

-- Version pour vérifier spécifiquement votre compte
-- Remplacez 'votre-email@example.com' par votre email
SELECT 
  u.id as user_id,
  u.email,
  u.first_name,
  u.last_name,
  u.company_id as votre_company_id,
  c.name as company_name,
  -- Récupérer le platform_company_id (extraire correctement le JSONB)
  (SELECT value#>>'{}' FROM settings WHERE key = 'platform_company_id' LIMIT 1) as platform_company_id,
  -- Comparer
  CASE 
    WHEN u.company_id::text = (SELECT value#>>'{}' FROM settings WHERE key = 'platform_company_id' LIMIT 1) 
    THEN '✓ VOUS ÊTES PLATEFORME' 
    ELSE '✗ VOUS ÊTES CLIENT' 
  END as status,
  u.role_id,
  r.name as role_name
FROM users u
LEFT JOIN companies c ON c.id = u.company_id
LEFT JOIN roles r ON r.id = u.role_id
WHERE u.email = 'votre-email@example.com';

