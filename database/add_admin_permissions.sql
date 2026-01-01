-- ============================================================================
-- MIGRATION: Ajouter colonne permissions pour les administrateurs
-- ============================================================================
-- Date: 2026-01-01
-- Permet de gérer les permissions granulaires des administrateurs

-- 1. Ajouter colonne permissions (JSONB)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "logs": true,
  "plans": true,
  "subscriptions": true,
  "admins": true,
  "analytics": true,
  "clients": true,
  "users": true,
  "modules": true
}'::jsonb;

-- 2. Mettre à jour tous les admins existants avec les permissions par défaut
UPDATE users
SET permissions = '{
  "logs": true,
  "plans": true,
  "subscriptions": true,
  "admins": true,
  "analytics": true,
  "clients": true,
  "users": true,
  "modules": true
}'::jsonb
WHERE permissions IS NULL 
AND company_id IN (
  SELECT value::text::uuid 
  FROM settings 
  WHERE key = 'platform_company_id'
);

-- 3. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_permissions 
ON users USING gin (permissions);

-- 4. Vérifier
SELECT 
  id,
  email,
  first_name,
  last_name,
  company_id,
  permissions,
  created_at
FROM users
WHERE company_id IN (
  SELECT value::text::uuid 
  FROM settings 
  WHERE key = 'platform_company_id'
)
ORDER BY created_at DESC;

-- ============================================================================
-- ✅ MIGRATION TERMINÉE !
-- ============================================================================
-- Les admins peuvent maintenant avoir des permissions granulaires
-- Par défaut, tous les admins ont accès à toutes les fonctionnalités

