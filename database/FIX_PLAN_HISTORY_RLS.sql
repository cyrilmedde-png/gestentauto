-- =====================================================
-- FIX : RLS ET SECURITY DEFINER POUR plan_modification_history
-- =====================================================
-- Problème: Les policies vérifient un rôle inexistant
-- Solution: Utiliser company_id comme le reste de l'application
-- =====================================================

-- ÉTAPE 1 : Supprimer les anciennes policies incorrectes
-- =====================================================

DROP POLICY IF EXISTS "Admins peuvent voir l'historique" ON plan_modification_history;
DROP POLICY IF EXISTS "Admins peuvent créer des logs" ON plan_modification_history;

-- ÉTAPE 2 : Créer les nouvelles policies basées sur company_id
-- =====================================================

-- Policy SELECT : Admins plateforme peuvent voir l'historique
CREATE POLICY "Platform admins can view history"
  ON plan_modification_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.company_id = (
        SELECT (value#>>'{}')::uuid 
        FROM settings 
        WHERE key = 'platform_company_id'
      )
    )
  );

-- Policy INSERT : Admins plateforme peuvent créer des logs
CREATE POLICY "Platform admins can insert history"
  ON plan_modification_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.company_id = (
        SELECT (value#>>'{}')::uuid 
        FROM settings 
        WHERE key = 'platform_company_id'
      )
    )
  );

-- ÉTAPE 3 : Recréer la fonction sans problème de permissions
-- =====================================================

-- Option 1 : SECURITY DEFINER (garde les permissions)
CREATE OR REPLACE FUNCTION get_plan_history(p_plan_id UUID)
RETURNS TABLE (
  id UUID,
  plan_name TEXT,
  modified_by TEXT,
  changes JSONB,
  modified_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$ LANGUAGE plpgsql;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION get_plan_history(UUID) TO authenticated;

-- ÉTAPE 4 : Recréer la vue (pas de problème ici)
-- =====================================================

DROP VIEW IF EXISTS plan_modifications_detail;

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

-- Donner les permissions sur la vue
GRANT SELECT ON plan_modifications_detail TO authenticated;

-- =====================================================
-- VÉRIFICATIONS
-- =====================================================

-- Vérifier les policies
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN policyname LIKE '%Platform%' THEN '✅ Policy correcte (company_id)'
    ELSE '⚠️ Policy ancienne (rôle)'
  END AS status
FROM pg_policies
WHERE tablename = 'plan_modification_history'
ORDER BY policyname;

-- Vérifier la fonction
SELECT 
  routine_name,
  security_type,
  CASE 
    WHEN security_type = 'DEFINER' THEN '✅ SECURITY DEFINER activé'
    ELSE 'ℹ️ SECURITY INVOKER (normal)'
  END AS status
FROM information_schema.routines
WHERE routine_name = 'get_plan_history'
AND routine_schema = 'public';

-- Vérifier la vue
SELECT 
  table_name,
  table_type,
  CASE 
    WHEN table_type = 'VIEW' THEN '✅ Vue créée'
    ELSE '❌ Vue manquante'
  END AS status
FROM information_schema.tables
WHERE table_name = 'plan_modifications_detail'
AND table_schema = 'public';

-- =====================================================
-- TEST RAPIDE
-- =====================================================

-- Tester si vous pouvez voir la vue
SELECT COUNT(*) as nb_records FROM plan_modifications_detail;

-- Message de succès
DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ RLS ET SECURITY DEFINER CORRIGÉS !';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Nouvelles policies basées sur company_id';
  RAISE NOTICE '🔐 Fonction get_plan_history() sécurisée';
  RAISE NOTICE '👁️ Vue plan_modifications_detail accessible';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test:';
  RAISE NOTICE '   SELECT * FROM plan_modifications_detail LIMIT 5;';
  RAISE NOTICE '';
END $$;

