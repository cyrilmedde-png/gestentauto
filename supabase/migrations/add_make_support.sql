-- ============================================
-- Ajout du support Make.com pour les modules
-- ============================================
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- Ajouter les colonnes pour Make.com
ALTER TABLE available_modules 
  ADD COLUMN IF NOT EXISTS is_make_created BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS make_scenario_id TEXT;

-- Créer un index pour les recherches par workflow Make
CREATE INDEX IF NOT EXISTS idx_available_modules_make_scenario_id 
  ON available_modules(make_scenario_id) 
  WHERE make_scenario_id IS NOT NULL;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Support Make.com ajouté avec succès !';
  RAISE NOTICE '✅ Colonnes is_make_created et make_scenario_id ajoutées';
  RAISE NOTICE '✅ Index créé pour les recherches Make';
END $$;


