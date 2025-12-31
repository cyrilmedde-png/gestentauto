-- =====================================================
-- TABLE D'HISTORIQUE DES MODIFICATIONS DE PLANS
-- Version Simplifiée (Sans exemples de test)
-- =====================================================

-- Créer la table d'historique
CREATE TABLE IF NOT EXISTS plan_modification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  modified_by TEXT NOT NULL,
  changes JSONB NOT NULL,
  modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Commentaires
COMMENT ON TABLE plan_modification_history IS 'Historique des modifications de plans d''abonnement';
COMMENT ON COLUMN plan_modification_history.plan_id IS 'ID du plan modifié';
COMMENT ON COLUMN plan_modification_history.modified_by IS 'Email de l''administrateur';
COMMENT ON COLUMN plan_modification_history.changes IS 'JSON des champs modifiés';

-- Index
CREATE INDEX IF NOT EXISTS idx_plan_mod_plan_id ON plan_modification_history(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_mod_modified_at ON plan_modification_history(modified_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_mod_modified_by ON plan_modification_history(modified_by);

-- RLS
ALTER TABLE plan_modification_history ENABLE ROW LEVEL SECURITY;

-- Policy : Les admins plateforme peuvent tout voir
CREATE POLICY "Admins peuvent voir l'historique"
  ON plan_modification_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.name = 'Administrateur Plateforme'
    )
  );

-- Policy : Les admins peuvent insérer des logs
CREATE POLICY "Admins peuvent créer des logs"
  ON plan_modification_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.name = 'Administrateur Plateforme'
    )
  );

-- =====================================================
-- FONCTION : Récupérer l'historique d'un plan
-- =====================================================

CREATE OR REPLACE FUNCTION get_plan_history(p_plan_id UUID)
RETURNS TABLE (
  id UUID,
  plan_name TEXT,
  modified_by TEXT,
  changes JSONB,
  modified_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ph.id,
    sp.display_name AS plan_name,
    ph.modified_by,
    ph.changes,
    ph.modified_at
  FROM plan_modification_history ph
  JOIN subscription_plans sp ON ph.plan_id = sp.id
  WHERE ph.plan_id = p_plan_id
  ORDER BY ph.modified_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VUE : Historique complet avec détails du plan
-- =====================================================

CREATE OR REPLACE VIEW plan_modifications_detail AS
SELECT 
  ph.id,
  ph.plan_id,
  sp.name AS plan_name,
  sp.display_name AS plan_display_name,
  ph.modified_by,
  ph.changes,
  ph.modified_at,
  ph.created_at
FROM plan_modification_history ph
JOIN subscription_plans sp ON ph.plan_id = sp.id
ORDER BY ph.modified_at DESC;

-- =====================================================
-- VÉRIFICATIONS
-- =====================================================

-- Vérifier que la table existe
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'plan_modification_history'
    )
    THEN '✅ Table plan_modification_history créée'
    ELSE '❌ Erreur: Table non créée'
  END AS status;

-- Message de succès
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Table plan_modification_history créée avec succès !';
  RAISE NOTICE '✅ Index créés';
  RAISE NOTICE '✅ RLS activé';
  RAISE NOTICE '✅ Fonctions et vues créées';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Commandes utiles:';
  RAISE NOTICE '   - SELECT * FROM plan_modifications_detail LIMIT 10;';
  RAISE NOTICE '   - SELECT id, display_name FROM subscription_plans;';
END $$;

