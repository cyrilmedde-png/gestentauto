-- =====================================================
-- TABLE D'HISTORIQUE DES MODIFICATIONS DE PLANS
-- =====================================================
-- Cette table enregistre toutes les modifications
-- effectuées sur les plans d'abonnement
-- =====================================================

-- Créer la table d'historique
CREATE TABLE IF NOT EXISTS plan_modification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  modified_by TEXT NOT NULL,  -- Email de l'admin qui a modifié
  changes JSONB NOT NULL,      -- JSON des modifications
  modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ajouter des commentaires
COMMENT ON TABLE plan_modification_history IS 'Historique des modifications de plans d''abonnement';
COMMENT ON COLUMN plan_modification_history.plan_id IS 'ID du plan modifié';
COMMENT ON COLUMN plan_modification_history.modified_by IS 'Email de l''administrateur';
COMMENT ON COLUMN plan_modification_history.changes IS 'JSON des champs modifiés';
COMMENT ON COLUMN plan_modification_history.modified_at IS 'Date de la modification';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_plan_mod_plan_id ON plan_modification_history(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_mod_modified_at ON plan_modification_history(modified_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_mod_modified_by ON plan_modification_history(modified_by);

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

-- Activer RLS
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
-- FONCTION : Statistiques de modifications
-- =====================================================

CREATE OR REPLACE FUNCTION get_modification_stats(days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_modifications BIGINT,
  plans_modifies BIGINT,
  top_modifier TEXT,
  modifications_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) AS total_mods,
      COUNT(DISTINCT plan_id) AS unique_plans,
      modified_by,
      COUNT(*) AS user_mods
    FROM plan_modification_history
    WHERE modified_at >= NOW() - (days || ' days')::INTERVAL
    GROUP BY modified_by
  )
  SELECT
    (SELECT SUM(total_mods)::BIGINT FROM stats),
    (SELECT SUM(unique_plans)::BIGINT FROM stats),
    (SELECT modified_by FROM stats ORDER BY user_mods DESC LIMIT 1),
    (SELECT MAX(user_mods)::BIGINT FROM stats)
  ;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VUES UTILES
-- =====================================================

-- Vue : Historique complet avec détails du plan
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

-- Vue : Résumé des modifications par plan
CREATE OR REPLACE VIEW plan_modifications_summary AS
SELECT 
  sp.id AS plan_id,
  sp.name AS plan_name,
  sp.display_name AS plan_display_name,
  COUNT(ph.id) AS total_modifications,
  MAX(ph.modified_at) AS last_modified_at,
  ARRAY_AGG(DISTINCT ph.modified_by) AS modifiers
FROM subscription_plans sp
LEFT JOIN plan_modification_history ph ON sp.id = ph.plan_id
GROUP BY sp.id, sp.name, sp.display_name
ORDER BY total_modifications DESC;

-- =====================================================
-- TRIGGERS (Optionnel)
-- =====================================================

-- Trigger : Auto-nettoyer les anciens logs (> 2 ans)
CREATE OR REPLACE FUNCTION cleanup_old_plan_history()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM plan_modification_history
  WHERE modified_at < NOW() - INTERVAL '2 years';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger (s'exécute après chaque INSERT)
DROP TRIGGER IF EXISTS trigger_cleanup_old_plan_history ON plan_modification_history;
CREATE TRIGGER trigger_cleanup_old_plan_history
  AFTER INSERT ON plan_modification_history
  EXECUTE FUNCTION cleanup_old_plan_history();

-- =====================================================
-- DONNÉES DE TEST (Optionnel)
-- =====================================================

-- Insérer un log de test
INSERT INTO plan_modification_history (
  plan_id,
  modified_by,
  changes,
  modified_at
)
SELECT
  id,
  'test@talosprimes.com',
  '{"price": 79.00, "quotas": {"maxUsers": 20}}'::JSONB,
  NOW()
FROM subscription_plans
WHERE name = 'business'
LIMIT 1;

-- =====================================================
-- REQUÊTES UTILES
-- =====================================================

-- Voir les 10 dernières modifications
SELECT * FROM plan_modifications_detail LIMIT 10;

-- Voir l'historique d'un plan spécifique
SELECT * FROM get_plan_history('uuid-du-plan');

-- Voir les stats des 30 derniers jours
SELECT * FROM get_modification_stats(30);

-- Voir combien de fois chaque plan a été modifié
SELECT * FROM plan_modifications_summary;

-- Voir qui a le plus modifié de plans
SELECT 
  modified_by,
  COUNT(*) AS modifications
FROM plan_modification_history
GROUP BY modified_by
ORDER BY modifications DESC;

-- =====================================================
-- VÉRIFICATIONS
-- =====================================================

-- Vérifier que la table existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'plan_modification_history'
) AS table_exists;

-- Vérifier les index
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'plan_modification_history';

-- Vérifier les policies RLS
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'plan_modification_history';

-- =====================================================
-- CLEANUP (Si besoin de supprimer)
-- =====================================================

/*
-- Supprimer tout (ATTENTION : Destructif)
DROP TRIGGER IF EXISTS trigger_cleanup_old_plan_history ON plan_modification_history;
DROP FUNCTION IF EXISTS cleanup_old_plan_history();
DROP VIEW IF EXISTS plan_modifications_summary;
DROP VIEW IF EXISTS plan_modifications_detail;
DROP FUNCTION IF EXISTS get_modification_stats(INTEGER);
DROP FUNCTION IF EXISTS get_plan_history(UUID);
DROP TABLE IF EXISTS plan_modification_history CASCADE;
*/

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

-- Message de succès
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Table plan_modification_history créée avec succès !';
  RAISE NOTICE '✅ Index créés';
  RAISE NOTICE '✅ RLS activé';
  RAISE NOTICE '✅ Fonctions et vues créées';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Pour voir l''historique: SELECT * FROM plan_modifications_detail;';
END $$;

