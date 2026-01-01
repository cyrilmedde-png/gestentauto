-- ============================================================================
-- FIX RLS SUBSCRIPTION_LOGS - VERSION FINALE QUI FONCTIONNE
-- ============================================================================
-- Ce script configure les RLS policies pour la table subscription_logs
-- Permet aux admins plateforme de voir tous les logs
-- Permet aux companies de voir leurs propres logs
-- Permet au service role (N8N) d'insérer des logs
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Nettoyage des policies existantes
-- ============================================================================
DROP POLICY IF EXISTS "temp_allow_all" ON subscription_logs;
DROP POLICY IF EXISTS "temp_allow_insert" ON subscription_logs;
DROP POLICY IF EXISTS "allow_all_select" ON subscription_logs;
DROP POLICY IF EXISTS "allow_service_insert" ON subscription_logs;
DROP POLICY IF EXISTS "admin_can_view_logs" ON subscription_logs;
DROP POLICY IF EXISTS "platform_admins_can_view_all_logs" ON subscription_logs;
DROP POLICY IF EXISTS "service_can_insert_logs" ON subscription_logs;
DROP POLICY IF EXISTS "companies_can_view_own_logs" ON subscription_logs;
DROP POLICY IF EXISTS "authenticated_users_can_read" ON subscription_logs;
DROP POLICY IF EXISTS "service_can_insert" ON subscription_logs;

-- ============================================================================
-- ÉTAPE 2 : Activer RLS
-- ============================================================================
ALTER TABLE subscription_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 3 : Policy pour Admins Plateforme (TOUT VOIR)
-- ============================================================================
-- Les admins plateforme (groupemclem@gmail.com et autres)
-- peuvent voir TOUS les logs, peu importe la company_id
CREATE POLICY "platform_admins_can_view_all_logs"
ON subscription_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM users
    WHERE users.id = auth.uid()
    AND users.company_id::text = (
      SELECT value#>>'{}'
      FROM settings 
      WHERE key = 'platform_company_id'
      LIMIT 1
    )
  )
);

-- ============================================================================
-- ÉTAPE 4 : Policy pour Service Role (INSERT)
-- ============================================================================
-- Permet à N8N et aux API backend d'insérer des logs
-- Sans restriction (service_role bypass RLS automatiquement)
CREATE POLICY "service_can_insert_logs"
ON subscription_logs
FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- ÉTAPE 5 (OPTIONNEL) : Policy pour Companies (LEURS LOGS)
-- ============================================================================
-- Les companies peuvent voir leurs propres logs
-- + les logs sans company_id (logs globaux)
CREATE POLICY "companies_can_view_own_logs"
ON subscription_logs
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM users 
    WHERE id = auth.uid()
  )
  OR company_id IS NULL
);

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================
-- Afficher les policies créées
SELECT 
  '✅ RLS Policies Configurées' AS titre,
  '' AS sep;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd AS operation,
  CASE 
    WHEN policyname LIKE '%platform_admins%' THEN '👑 Admin Plateforme'
    WHEN policyname LIKE '%service%' THEN '🤖 Service Role (N8N)'
    WHEN policyname LIKE '%companies%' THEN '🏢 Companies'
    ELSE '❓ Autre'
  END AS type_acces
FROM pg_policies
WHERE tablename = 'subscription_logs'
ORDER BY policyname;

-- Test de lecture (nombre de logs accessibles)
SELECT 
  '📊 Logs Accessibles' AS titre,
  COUNT(*) AS nombre_logs,
  COUNT(DISTINCT event_type) AS types_evenements,
  COUNT(CASE WHEN status = 'success' THEN 1 END) AS successes,
  COUNT(CASE WHEN status = 'error' THEN 1 END) AS errors,
  COUNT(CASE WHEN status = 'warning' THEN 1 END) AS warnings,
  COUNT(CASE WHEN status = 'info' THEN 1 END) AS infos
FROM subscription_logs;

-- ============================================================================
-- ✅ CONFIGURATION TERMINÉE
-- ============================================================================
-- Les admins plateforme peuvent maintenant voir tous les logs
-- L'application /platform/logs fonctionne correctement
-- ============================================================================

