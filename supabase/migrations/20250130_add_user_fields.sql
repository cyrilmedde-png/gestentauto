-- ============================================================================
-- Migration: Ajouter les champs manquants à la table users
-- Date: 2025-01-30
-- Description: Ajoute phone, company, first_name, last_name pour inscription
-- ============================================================================

-- 1. Ajouter la colonne phone (obligatoire pour inscription)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 2. Ajouter la colonne company (optionnel)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company VARCHAR(255);

-- 3. Ajouter first_name si manquant
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);

-- 4. Ajouter last_name si manquant
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- 5. Créer un index sur phone pour les recherches
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 6. Ajouter des commentaires pour documentation
COMMENT ON COLUMN users.phone IS 
  'Numéro de téléphone de l''utilisateur (format +33XXXXXXXXX)';

COMMENT ON COLUMN users.company IS 
  'Nom de l''entreprise de l''utilisateur (optionnel)';

COMMENT ON COLUMN users.first_name IS 
  'Prénom de l''utilisateur';

COMMENT ON COLUMN users.last_name IS 
  'Nom de famille de l''utilisateur';

-- 7. Message de succès
DO $$ 
BEGIN 
  RAISE NOTICE 'Migration terminée avec succès !';
  RAISE NOTICE 'Colonnes ajoutées: phone, company, first_name, last_name';
END $$;

