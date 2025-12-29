-- Script pour configurer l'accès plateforme aux données
-- La plateforme peut voir toutes les données SAUF les clients des clients
-- À exécuter dans Supabase SQL Editor

-- 1. Fonction pour vérifier si un utilisateur appartient à la plateforme
CREATE OR REPLACE FUNCTION public.is_platform_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user_company_id UUID;
  v_platform_company_id UUID;
BEGIN
  -- Récupérer le company_id de l'utilisateur actuel
  v_user_company_id := public.user_company_id();
  
  IF v_user_company_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Récupérer l'ID de la plateforme depuis les settings
  SELECT (value#>>'{}')::UUID INTO v_platform_company_id
  FROM settings
  WHERE key = 'platform_company_id'
  LIMIT 1;
  
  -- Vérifier si l'utilisateur appartient à la plateforme
  RETURN (v_user_company_id = v_platform_company_id);
END;
$$;

-- 2. Fonction pour obtenir l'ID de la plateforme
CREATE OR REPLACE FUNCTION public.platform_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_platform_company_id UUID;
BEGIN
  SELECT (value#>>'{}')::UUID INTO v_platform_company_id
  FROM settings
  WHERE key = 'platform_company_id'
  LIMIT 1;
  
  RETURN v_platform_company_id;
END;
$$;

-- 3. Mettre à jour les politiques RLS pour companies
-- Les utilisateurs normaux voient leur entreprise
-- La plateforme voit toutes les entreprises (clients)
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Platform can view all companies" ON companies;

CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  USING (
    -- L'utilisateur voit son entreprise
    id = public.user_company_id()
    OR
    -- La plateforme voit toutes les entreprises
    public.is_platform_user()
  );

-- 4. Mettre à jour les politiques RLS pour users
-- Les utilisateurs normaux voient les utilisateurs de leur entreprise
-- La plateforme voit tous les utilisateurs (mais on filtrera les clients des clients côté application)
DROP POLICY IF EXISTS "Users can view users in their company" ON users;

CREATE POLICY "Users can view users in their company"
  ON users FOR SELECT
  USING (
    -- L'utilisateur voit les utilisateurs de son entreprise
    company_id = public.user_company_id()
    OR
    -- La plateforme voit tous les utilisateurs
    public.is_platform_user()
  );

-- 5. Mettre à jour les politiques RLS pour roles
DROP POLICY IF EXISTS "Users can view roles in their company" ON roles;

CREATE POLICY "Users can view roles in their company"
  ON roles FOR SELECT
  USING (
    company_id = public.user_company_id()
    OR
    public.is_platform_user()
  );

-- 6. Mettre à jour les politiques RLS pour modules
DROP POLICY IF EXISTS "Users can view modules in their company" ON modules;

CREATE POLICY "Users can view modules in their company"
  ON modules FOR SELECT
  USING (
    company_id = public.user_company_id()
    OR
    public.is_platform_user()
  );

-- 7. Mettre à jour les politiques RLS pour settings
DROP POLICY IF EXISTS "Users can view settings in their company" ON settings;

CREATE POLICY "Users can view settings in their company"
  ON settings FOR SELECT
  USING (
    company_id = public.user_company_id()
    OR
    public.is_platform_user()
  );

-- 8. Permettre à la plateforme de modifier les companies (pour gérer les clients)
DROP POLICY IF EXISTS "Users can update their own company" ON companies;

CREATE POLICY "Users can update their own company"
  ON companies FOR UPDATE
  USING (
    id = public.user_company_id()
    OR
    public.is_platform_user()
  );

-- 9. Permettre à la plateforme de modifier les settings (pour configuration)
DROP POLICY IF EXISTS "Users can update settings in their company" ON settings;

CREATE POLICY "Users can update settings in their company"
  ON settings FOR UPDATE
  USING (
    company_id = public.user_company_id()
    OR
    public.is_platform_user()
  );

DROP POLICY IF EXISTS "Users can insert settings in their company" ON settings;

CREATE POLICY "Users can insert settings in their company"
  ON settings FOR INSERT
  WITH CHECK (
    company_id = public.user_company_id()
    OR
    public.is_platform_user()
  );

-- Note importante : Les tables pour les "clients des clients" (comme customers dans le CRM)
-- devront avoir des politiques spécifiques qui excluent la plateforme pour ces données
-- Ces politiques seront créées quand ces modules seront implémentés







