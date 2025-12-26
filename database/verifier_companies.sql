-- Script pour vérifier les entreprises dans la base de données
-- À exécuter dans Supabase SQL Editor

-- 1. Voir toutes les entreprises
SELECT 
  id,
  name,
  email,
  siret,
  created_at,
  updated_at
FROM companies
ORDER BY created_at DESC;

-- 2. Voir les entreprises avec leurs utilisateurs
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.email as company_email,
  c.created_at as company_created_at,
  u.id as user_id,
  u.email as user_email,
  u.first_name,
  u.last_name,
  u.created_at as user_created_at
FROM companies c
LEFT JOIN users u ON u.company_id = c.id
ORDER BY c.created_at DESC;

-- 3. Compter les entreprises par nom (pour détecter les doublons)
SELECT 
  name,
  COUNT(*) as count,
  ARRAY_AGG(id ORDER BY created_at) as company_ids,
  ARRAY_AGG(created_at ORDER BY created_at) as created_dates
FROM companies
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 4. Vérifier quelle entreprise est utilisée par quels utilisateurs
SELECT 
  c.name,
  c.id as company_id,
  COUNT(u.id) as user_count,
  ARRAY_AGG(u.email) as user_emails
FROM companies c
LEFT JOIN users u ON u.company_id = c.id
GROUP BY c.id, c.name
ORDER BY user_count DESC, c.created_at DESC;




