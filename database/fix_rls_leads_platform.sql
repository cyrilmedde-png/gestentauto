-- Script pour corriger les RLS policies des tables onboarding
-- Assure que SEULEMENT la plateforme peut accéder aux leads
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier que les fonctions existent
-- Si elles n'existent pas, les créer d'abord avec platform_access_rls.sql

-- 2. Corriger les RLS policies pour leads
DROP POLICY IF EXISTS "Platform can manage all leads" ON leads;
DROP POLICY IF EXISTS "Only platform can access leads" ON leads;

-- Policy pour SELECT (lecture)
CREATE POLICY "Platform can view all leads"
  ON leads FOR SELECT
  USING (public.is_platform_user());

-- Policy pour INSERT (création)
CREATE POLICY "Platform can create leads"
  ON leads FOR INSERT
  WITH CHECK (public.is_platform_user());

-- Policy pour UPDATE (modification)
CREATE POLICY "Platform can update leads"
  ON leads FOR UPDATE
  USING (public.is_platform_user())
  WITH CHECK (public.is_platform_user());

-- Policy pour DELETE (suppression)
CREATE POLICY "Platform can delete leads"
  ON leads FOR DELETE
  USING (public.is_platform_user());

-- 3. Corriger les RLS policies pour onboarding_questionnaires
DROP POLICY IF EXISTS "Platform can manage all questionnaires" ON onboarding_questionnaires;
DROP POLICY IF EXISTS "Only platform can access questionnaires" ON onboarding_questionnaires;

CREATE POLICY "Platform can view all questionnaires"
  ON onboarding_questionnaires FOR SELECT
  USING (public.is_platform_user());

CREATE POLICY "Platform can create questionnaires"
  ON onboarding_questionnaires FOR INSERT
  WITH CHECK (public.is_platform_user());

CREATE POLICY "Platform can update questionnaires"
  ON onboarding_questionnaires FOR UPDATE
  USING (public.is_platform_user())
  WITH CHECK (public.is_platform_user());

CREATE POLICY "Platform can delete questionnaires"
  ON onboarding_questionnaires FOR DELETE
  USING (public.is_platform_user());

-- 4. Corriger les RLS policies pour onboarding_interviews
DROP POLICY IF EXISTS "Platform can manage all interviews" ON onboarding_interviews;
DROP POLICY IF EXISTS "Only platform can access interviews" ON onboarding_interviews;

CREATE POLICY "Platform can view all interviews"
  ON onboarding_interviews FOR SELECT
  USING (public.is_platform_user());

CREATE POLICY "Platform can create interviews"
  ON onboarding_interviews FOR INSERT
  WITH CHECK (public.is_platform_user());

CREATE POLICY "Platform can update interviews"
  ON onboarding_interviews FOR UPDATE
  USING (public.is_platform_user())
  WITH CHECK (public.is_platform_user());

CREATE POLICY "Platform can delete interviews"
  ON onboarding_interviews FOR DELETE
  USING (public.is_platform_user());

-- 5. Corriger les RLS policies pour trials
-- Note: trials a un company_id, mais reste accessible uniquement à la plateforme
DROP POLICY IF EXISTS "Platform can manage all trials" ON trials;
DROP POLICY IF EXISTS "Only platform can access trials" ON trials;

CREATE POLICY "Platform can view all trials"
  ON trials FOR SELECT
  USING (public.is_platform_user());

CREATE POLICY "Platform can create trials"
  ON trials FOR INSERT
  WITH CHECK (public.is_platform_user());

CREATE POLICY "Platform can update trials"
  ON trials FOR UPDATE
  USING (public.is_platform_user())
  WITH CHECK (public.is_platform_user());

CREATE POLICY "Platform can delete trials"
  ON trials FOR DELETE
  USING (public.is_platform_user());

-- 6. Vérification : S'assurer que RLS est activé sur ces tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials ENABLE ROW LEVEL SECURITY;

-- 7. Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies corrigées pour les tables onboarding';
  RAISE NOTICE '   - Seuls les utilisateurs plateforme peuvent accéder aux leads';
  RAISE NOTICE '   - Les clients ne peuvent pas voir les leads';
END $$;









