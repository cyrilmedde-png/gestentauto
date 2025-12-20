-- Script pour corriger la récursion infinie dans les politiques RLS
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Créer une fonction pour obtenir le company_id de l'utilisateur actuel
-- Cette fonction contourne RLS en utilisant SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT company_id INTO v_company_id
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN v_company_id;
END;
$$;

-- 2. Supprimer TOUTES les anciennes politiques (pour éviter les conflits)
-- Table users
DROP POLICY IF EXISTS "Users can view themselves" ON users;
DROP POLICY IF EXISTS "Users can view users in their company" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;

-- Table companies
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;

-- Table roles
DROP POLICY IF EXISTS "Users can view roles in their company" ON roles;

-- Table modules
DROP POLICY IF EXISTS "Users can view modules in their company" ON modules;

-- Table settings
DROP POLICY IF EXISTS "Users can view settings in their company" ON settings;
DROP POLICY IF EXISTS "Users can update settings in their company" ON settings;
DROP POLICY IF EXISTS "Users can insert settings in their company" ON settings;

-- 3. Recréer les politiques sans récursion

-- Policies pour users (sans récursion)
-- Les utilisateurs peuvent voir leur propre enregistrement
CREATE POLICY "Users can view themselves"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Les utilisateurs peuvent voir les autres utilisateurs de leur entreprise
CREATE POLICY "Users can view users in their company"
  ON users FOR SELECT
  USING (company_id = public.user_company_id());

-- Les utilisateurs peuvent se mettre à jour eux-mêmes
CREATE POLICY "Users can update themselves"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Policies pour companies (sans récursion)
CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  USING (id = public.user_company_id());

CREATE POLICY "Users can update their own company"
  ON companies FOR UPDATE
  USING (id = public.user_company_id());

-- Policies pour roles (sans récursion)
CREATE POLICY "Users can view roles in their company"
  ON roles FOR SELECT
  USING (company_id = public.user_company_id());

-- Policies pour modules (sans récursion)
CREATE POLICY "Users can view modules in their company"
  ON modules FOR SELECT
  USING (company_id = public.user_company_id());

-- Policies pour settings (sans récursion)
CREATE POLICY "Users can view settings in their company"
  ON settings FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "Users can update settings in their company"
  ON settings FOR UPDATE
  USING (company_id = public.user_company_id());

CREATE POLICY "Users can insert settings in their company"
  ON settings FOR INSERT
  WITH CHECK (company_id = public.user_company_id());

