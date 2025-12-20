-- Schéma de base de données pour le Module Core (CORRIGÉ - SANS RÉCURSION RLS)
-- À exécuter dans Supabase SQL Editor

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: companies (Entreprises)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  siret VARCHAR(14) UNIQUE,
  vat_number VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'FR',
  phone VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: roles (Rôles et permissions)
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- Table: users (Utilisateurs - métadonnées complémentaires à Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: modules (Modules activés par entreprise)
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  module_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, module_name)
);

-- Table: settings (Paramètres globaux et par entreprise)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, key)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_roles_company_id ON roles(company_id);
CREATE INDEX IF NOT EXISTS idx_modules_company_id ON modules(company_id);
CREATE INDEX IF NOT EXISTS idx_modules_is_active ON modules(company_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_settings_company_id ON settings(company_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FONCTION HELPER POUR ÉVITER LA RÉCURSION RLS
-- ========================================
-- Cette fonction contourne RLS pour obtenir le company_id de l'utilisateur actuel
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

-- Row Level Security (RLS) Policies

-- Activer RLS sur toutes les tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies pour users (SANS RÉCURSION)
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

-- Policies pour companies (SANS RÉCURSION)
CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  USING (id = public.user_company_id());

CREATE POLICY "Users can update their own company"
  ON companies FOR UPDATE
  USING (id = public.user_company_id());

-- Policies pour roles (SANS RÉCURSION)
CREATE POLICY "Users can view roles in their company"
  ON roles FOR SELECT
  USING (company_id = public.user_company_id());

-- Policies pour modules (SANS RÉCURSION)
CREATE POLICY "Users can view modules in their company"
  ON modules FOR SELECT
  USING (company_id = public.user_company_id());

-- Policies pour settings (SANS RÉCURSION)
CREATE POLICY "Users can view settings in their company"
  ON settings FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "Users can update settings in their company"
  ON settings FOR UPDATE
  USING (company_id = public.user_company_id());

CREATE POLICY "Users can insert settings in their company"
  ON settings FOR INSERT
  WITH CHECK (company_id = public.user_company_id());

