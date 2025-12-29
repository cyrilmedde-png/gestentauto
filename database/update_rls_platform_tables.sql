-- =====================================================
-- Mise à jour des RLS Policies pour les tables platform_*
-- =====================================================
-- Ces tables sont accessibles UNIQUEMENT aux utilisateurs plateforme
-- =====================================================

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Platform can manage all leads" ON platform_leads;
DROP POLICY IF EXISTS "Only platform can access leads" ON platform_leads;
DROP POLICY IF EXISTS "Platform can view all leads" ON platform_leads;
DROP POLICY IF EXISTS "Platform can create leads" ON platform_leads;
DROP POLICY IF EXISTS "Platform can update leads" ON platform_leads;
DROP POLICY IF EXISTS "Platform can delete leads" ON platform_leads;

DROP POLICY IF EXISTS "Platform can manage all questionnaires" ON platform_onboarding_questionnaires;
DROP POLICY IF EXISTS "Only platform can access questionnaires" ON platform_onboarding_questionnaires;
DROP POLICY IF EXISTS "Platform can view all questionnaires" ON platform_onboarding_questionnaires;
DROP POLICY IF EXISTS "Platform can create questionnaires" ON platform_onboarding_questionnaires;
DROP POLICY IF EXISTS "Platform can update questionnaires" ON platform_onboarding_questionnaires;
DROP POLICY IF EXISTS "Platform can delete questionnaires" ON platform_onboarding_questionnaires;

DROP POLICY IF EXISTS "Platform can manage all interviews" ON platform_onboarding_interviews;
DROP POLICY IF EXISTS "Only platform can access interviews" ON platform_onboarding_interviews;
DROP POLICY IF EXISTS "Platform can view all interviews" ON platform_onboarding_interviews;
DROP POLICY IF EXISTS "Platform can create interviews" ON platform_onboarding_interviews;
DROP POLICY IF EXISTS "Platform can update interviews" ON platform_onboarding_interviews;
DROP POLICY IF EXISTS "Platform can delete interviews" ON platform_onboarding_interviews;

DROP POLICY IF EXISTS "Platform can manage all trials" ON platform_trials;
DROP POLICY IF EXISTS "Only platform can access trials" ON platform_trials;
DROP POLICY IF EXISTS "Platform can view all trials" ON platform_trials;
DROP POLICY IF EXISTS "Platform can create trials" ON platform_trials;
DROP POLICY IF EXISTS "Platform can update trials" ON platform_trials;
DROP POLICY IF EXISTS "Platform can delete trials" ON platform_trials;

-- S'assurer que RLS est activé
ALTER TABLE IF EXISTS platform_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS platform_onboarding_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS platform_onboarding_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS platform_trials ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies pour platform_leads
-- =====================================================

CREATE POLICY "Platform can view all leads"
  ON platform_leads FOR SELECT
  USING (public.is_platform_user());

CREATE POLICY "Platform can create leads"
  ON platform_leads FOR INSERT
  WITH CHECK (public.is_platform_user());

CREATE POLICY "Platform can update leads"
  ON platform_leads FOR UPDATE
  USING (public.is_platform_user())
  WITH CHECK (public.is_platform_user());

CREATE POLICY "Platform can delete leads"
  ON platform_leads FOR DELETE
  USING (public.is_platform_user());

-- =====================================================
-- RLS Policies pour platform_onboarding_questionnaires
-- =====================================================

CREATE POLICY "Platform can view all questionnaires"
  ON platform_onboarding_questionnaires FOR SELECT
  USING (public.is_platform_user());

CREATE POLICY "Platform can create questionnaires"
  ON platform_onboarding_questionnaires FOR INSERT
  WITH CHECK (public.is_platform_user());

CREATE POLICY "Platform can update questionnaires"
  ON platform_onboarding_questionnaires FOR UPDATE
  USING (public.is_platform_user())
  WITH CHECK (public.is_platform_user());

CREATE POLICY "Platform can delete questionnaires"
  ON platform_onboarding_questionnaires FOR DELETE
  USING (public.is_platform_user());

-- =====================================================
-- RLS Policies pour platform_onboarding_interviews
-- =====================================================

CREATE POLICY "Platform can view all interviews"
  ON platform_onboarding_interviews FOR SELECT
  USING (public.is_platform_user());

CREATE POLICY "Platform can create interviews"
  ON platform_onboarding_interviews FOR INSERT
  WITH CHECK (public.is_platform_user());

CREATE POLICY "Platform can update interviews"
  ON platform_onboarding_interviews FOR UPDATE
  USING (public.is_platform_user())
  WITH CHECK (public.is_platform_user());

CREATE POLICY "Platform can delete interviews"
  ON platform_onboarding_interviews FOR DELETE
  USING (public.is_platform_user());

-- =====================================================
-- RLS Policies pour platform_trials
-- =====================================================

CREATE POLICY "Platform can view all trials"
  ON platform_trials FOR SELECT
  USING (public.is_platform_user());

CREATE POLICY "Platform can create trials"
  ON platform_trials FOR INSERT
  WITH CHECK (public.is_platform_user());

CREATE POLICY "Platform can update trials"
  ON platform_trials FOR UPDATE
  USING (public.is_platform_user())
  WITH CHECK (public.is_platform_user());

CREATE POLICY "Platform can delete trials"
  ON platform_trials FOR DELETE
  USING (public.is_platform_user());

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies mises à jour pour les tables platform_*';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies créées pour :';
  RAISE NOTICE '  - platform_leads';
  RAISE NOTICE '  - platform_onboarding_questionnaires';
  RAISE NOTICE '  - platform_onboarding_interviews';
  RAISE NOTICE '  - platform_trials';
  RAISE NOTICE '';
  RAISE NOTICE 'Accès : Uniquement utilisateurs plateforme';
END $$;







