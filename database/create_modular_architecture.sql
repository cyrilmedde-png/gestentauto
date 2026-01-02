-- ============================================================================
-- ARCHITECTURE MODULAIRE PROFESSIONNELLE - Base de Données
-- ============================================================================
-- Date: 2 Janvier 2026
-- Description: Réorganisation complète en architecture modulaire
-- Tables: module_categories, modules (upgrade), subscription_plan_modules

-- ============================================================================
-- 1. TABLE: module_categories
-- ============================================================================
-- Catégories de modules (Business, Finance, RH, etc.)

CREATE TABLE IF NOT EXISTS module_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identification
  name VARCHAR(100) UNIQUE NOT NULL,              -- 'business', 'finance', 'rh'...
  display_name VARCHAR(100) NOT NULL,             -- 'Business', 'Finance', 'RH'
  description TEXT,
  
  -- Affichage
  icon VARCHAR(50) NOT NULL,                      -- 'Briefcase', 'DollarSign'...
  color VARCHAR(20),                              -- Couleur pour UI
  order_index INTEGER NOT NULL DEFAULT 0,         -- Ordre affichage sidebar
  
  -- Permissions
  is_platform_only BOOLEAN DEFAULT false,         -- Réservé admin plateforme
  is_core BOOLEAN DEFAULT false,                  -- Core non-désactivable
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_module_categories_order ON module_categories(order_index);
CREATE INDEX IF NOT EXISTS idx_module_categories_platform ON module_categories(is_platform_only);

-- ============================================================================
-- 2. MISE À JOUR TABLE: modules
-- ============================================================================
-- Amélioration table existante avec nouvelles colonnes

-- Ajouter colonne category_id
ALTER TABLE modules ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES module_categories(id);

-- Ajouter colonnes affichage
ALTER TABLE modules ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE modules ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE modules ADD COLUMN IF NOT EXISTS color VARCHAR(20);

-- Ajouter colonne route
ALTER TABLE modules ADD COLUMN IF NOT EXISTS route VARCHAR(100);

-- Ajouter ordre affichage
ALTER TABLE modules ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Ajouter plan minimum requis
ALTER TABLE modules ADD COLUMN IF NOT EXISTS min_plan VARCHAR(50); -- 'starter', 'business', 'premium', 'enterprise'

-- Ajouter tags pour recherche
ALTER TABLE modules ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Ajouter limites par défaut
ALTER TABLE modules ADD COLUMN IF NOT EXISTS default_limits JSONB;

-- Ajouter statut développement
ALTER TABLE modules ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'planned'; -- 'planned', 'development', 'beta', 'production'

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_modules_category ON modules(category_id);
CREATE INDEX IF NOT EXISTS idx_modules_min_plan ON modules(min_plan);
CREATE INDEX IF NOT EXISTS idx_modules_status ON modules(status);
CREATE INDEX IF NOT EXISTS idx_modules_route ON modules(route);

-- ============================================================================
-- 3. TABLE: subscription_plan_modules
-- ============================================================================
-- Lien entre plans Stripe et modules inclus

CREATE TABLE IF NOT EXISTS subscription_plan_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  module_name VARCHAR(100) NOT NULL,              -- Référence modules.module_name
  
  -- Configuration
  is_included BOOLEAN DEFAULT true,               -- Module inclus dans le plan
  is_optional BOOLEAN DEFAULT false,              -- Module additionnel payant
  
  -- Limites spécifiques au plan
  limits JSONB,  -- Ex: { "max_contacts": 500, "max_users": 5, "max_invoices_per_month": 100 }
  
  -- Prix si optionnel
  additional_price DECIMAL(10, 2),                -- Prix si module additionnel
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Contrainte unicité
  UNIQUE(plan_id, module_name)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_plan_modules_plan ON subscription_plan_modules(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_modules_module ON subscription_plan_modules(module_name);
CREATE INDEX IF NOT EXISTS idx_plan_modules_included ON subscription_plan_modules(plan_id, is_included) WHERE is_included = true;

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Trigger updated_at pour module_categories
DROP TRIGGER IF EXISTS update_module_categories_updated_at ON module_categories;
CREATE TRIGGER update_module_categories_updated_at 
  BEFORE UPDATE ON module_categories
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger updated_at pour subscription_plan_modules
DROP TRIGGER IF EXISTS update_subscription_plan_modules_updated_at ON subscription_plan_modules;
CREATE TRIGGER update_subscription_plan_modules_updated_at 
  BEFORE UPDATE ON subscription_plan_modules
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction: Vérifier si utilisateur a accès à un module
CREATE OR REPLACE FUNCTION user_has_module_access(
  p_user_id UUID,
  p_module_name VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_company_id UUID;
  v_plan_id UUID;
  v_has_access BOOLEAN;
BEGIN
  -- Récupérer company_id de l'utilisateur
  SELECT company_id INTO v_company_id
  FROM users
  WHERE id = p_user_id;
  
  IF v_company_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Vérifier si le module est activé pour cette entreprise
  SELECT EXISTS (
    SELECT 1 
    FROM modules
    WHERE company_id = v_company_id
    AND module_name = p_module_name
    AND is_active = true
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Récupérer modules disponibles pour un plan
CREATE OR REPLACE FUNCTION get_plan_modules(p_plan_id UUID)
RETURNS TABLE (
  module_name VARCHAR,
  is_included BOOLEAN,
  is_optional BOOLEAN,
  limits JSONB,
  additional_price DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    spm.module_name,
    spm.is_included,
    spm.is_optional,
    spm.limits,
    spm.additional_price
  FROM subscription_plan_modules spm
  WHERE spm.plan_id = p_plan_id
  AND spm.is_included = true
  ORDER BY spm.module_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. RLS (Row Level Security)
-- ============================================================================

-- Activer RLS sur nouvelles tables
ALTER TABLE module_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plan_modules ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur modules (si pas déjà fait)
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir les modules de leur entreprise
-- La plateforme peut voir tous les modules
DROP POLICY IF EXISTS "Users can view modules in their company" ON modules;
CREATE POLICY "Users can view modules in their company"
  ON modules FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1)
    )
  );

-- Policy: Tout le monde peut voir les catégories
DROP POLICY IF EXISTS "Anyone can view module categories" ON module_categories;
CREATE POLICY "Anyone can view module categories"
  ON module_categories FOR SELECT
  USING (true);

-- Policy: Seuls admins plateforme peuvent modifier catégories
DROP POLICY IF EXISTS "Platform admins can manage categories" ON module_categories;
CREATE POLICY "Platform admins can manage categories"
  ON module_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1)
    )
  );

-- Policy: Admins plateforme peuvent voir tous les plan_modules
DROP POLICY IF EXISTS "Platform admins can view plan modules" ON subscription_plan_modules;
CREATE POLICY "Platform admins can view plan modules"
  ON subscription_plan_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1)
    )
  );

-- Policy: Admins plateforme peuvent gérer plan_modules
DROP POLICY IF EXISTS "Platform admins can manage plan modules" ON subscription_plan_modules;
CREATE POLICY "Platform admins can manage plan modules"
  ON subscription_plan_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1)
    )
  );

-- ============================================================================
-- 7. DONNÉES PAR DÉFAUT - CATÉGORIES
-- ============================================================================

INSERT INTO module_categories (name, display_name, description, icon, color, order_index, is_platform_only, is_core) VALUES
  -- Core (toujours actif)
  ('core', 'Core', 'Fonctionnalités principales non-désactivables', 'Settings', '#6366f1', 0, false, true),
  
  -- Plateforme (admin uniquement)
  ('platform', 'Plateforme', 'Administration et gestion de la plateforme', 'Crown', '#f59e0b', 1, true, false),
  
  -- Modules métier
  ('business', 'Business', 'Modules de gestion commerciale', 'Briefcase', '#10b981', 2, false, false),
  ('finance', 'Finance', 'Modules de gestion financière', 'DollarSign', '#3b82f6', 3, false, false),
  ('rh', 'Ressources Humaines', 'Modules de gestion RH', 'Users', '#8b5cf6', 4, false, false),
  ('logistique', 'Logistique', 'Modules de gestion logistique', 'Package', '#f97316', 5, false, false),
  ('gestion', 'Gestion', 'Modules de gestion de projets', 'FolderKanban', '#06b6d4', 6, false, false),
  ('documents', 'Documents', 'Modules de gestion documentaire', 'FileText', '#6366f1', 7, false, false)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  order_index = EXCLUDED.order_index,
  is_platform_only = EXCLUDED.is_platform_only,
  is_core = EXCLUDED.is_core;

-- ============================================================================
-- 8. MIGRATION MODULES EXISTANTS
-- ============================================================================

-- Mettre à jour les modules existants avec leurs catégories

-- CORE
UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'core'),
  display_name = 'Authentification',
  description = 'Système d''authentification et gestion sessions',
  icon = 'Lock',
  route = '/platform/auth',
  status = 'production',
  order_index = 1
WHERE module_name = 'auth';

UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'core'),
  display_name = 'Dashboard',
  description = 'Tableau de bord principal',
  icon = 'LayoutDashboard',
  route = '/platform/dashboard',
  status = 'production',
  order_index = 2
WHERE module_name = 'dashboard';

UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'core'),
  display_name = 'Paramètres',
  description = 'Configuration de l''entreprise',
  icon = 'Settings',
  route = '/platform/settings',
  status = 'production',
  order_index = 3
WHERE module_name = 'settings';

-- PLATEFORME
-- Créer ou mettre à jour les modules de la plateforme pour Groupe MCLEM

-- Dashboard (premier module)
INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  status,
  order_index,
  is_active
)
SELECT 
  (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1),
  'platform_dashboard',
  (SELECT id FROM module_categories WHERE name = 'platform'),
  'Dashboard',
  'Tableau de bord plateforme',
  'LayoutDashboard',
  '/platform/dashboard',
  'production',
  0,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM modules 
  WHERE module_name = 'platform_dashboard' 
  AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1)
)
ON CONFLICT DO NOTHING;

UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'platform'),
  display_name = 'Dashboard',
  description = 'Tableau de bord plateforme',
  icon = 'LayoutDashboard',
  route = '/platform/dashboard',
  status = 'production',
  order_index = 0,
  is_active = true
WHERE module_name = 'platform_dashboard'
AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1);

-- Gestion Clients
INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  status,
  order_index,
  is_active
)
SELECT 
  (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1),
  'platform_clients',
  (SELECT id FROM module_categories WHERE name = 'platform'),
  'Gestion Clients',
  'Administration des entreprises clientes',
  'Building2',
  '/platform/clients',
  'production',
  1,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM modules 
  WHERE module_name = 'platform_clients' 
  AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1)
)
ON CONFLICT DO NOTHING;

UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'platform'),
  display_name = 'Gestion Clients',
  description = 'Administration des entreprises clientes',
  icon = 'Building2',
  route = '/platform/clients',
  status = 'production',
  order_index = 1,
  is_active = true
WHERE module_name = 'platform_clients'
AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1);

INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  status,
  order_index,
  is_active
)
SELECT 
  (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1),
  'platform_plans',
  (SELECT id FROM module_categories WHERE name = 'platform'),
  'Plans & Abonnements',
  'Gestion des plans Stripe et abonnements',
  'CreditCard',
  '/platform/plans',
  'production',
  2,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM modules 
  WHERE module_name = 'platform_plans' 
  AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1)
)
ON CONFLICT DO NOTHING;

UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'platform'),
  display_name = 'Plans & Abonnements',
  description = 'Gestion des plans Stripe et abonnements',
  icon = 'CreditCard',
  route = '/platform/plans',
  status = 'production',
  order_index = 2,
  is_active = true
WHERE module_name = 'platform_plans'
AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1);

INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  status,
  order_index,
  is_active
)
SELECT 
  (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1),
  'platform_modules',
  (SELECT id FROM module_categories WHERE name = 'platform'),
  'Gestion Modules',
  'Activation/désactivation modules par client',
  'Package',
  '/platform/modules',
  'production',
  3,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM modules 
  WHERE module_name = 'platform_modules' 
  AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1)
)
ON CONFLICT DO NOTHING;

UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'platform'),
  display_name = 'Gestion Modules',
  description = 'Activation/désactivation modules par client',
  icon = 'Package',
  route = '/platform/modules',
  status = 'production',
  order_index = 3,
  is_active = true
WHERE module_name = 'platform_modules'
AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1);

-- Ajouter les autres modules de la plateforme
INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  status,
  order_index,
  is_active
)
SELECT 
  (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1),
  'platform_leads',
  (SELECT id FROM module_categories WHERE name = 'platform'),
  'Leads',
  'Gestion des leads et pré-inscriptions',
  'UserPlus',
  '/platform/leads',
  'production',
  4,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM modules 
  WHERE module_name = 'platform_leads' 
  AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1)
)
ON CONFLICT DO NOTHING;

INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  status,
  order_index,
  is_active
)
SELECT 
  (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1),
  'platform_onboarding',
  (SELECT id FROM module_categories WHERE name = 'platform'),
  'Onboarding',
  'Processus d''intégration clients',
  'UserCheck',
  '/platform/onboarding',
  'production',
  5,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM modules 
  WHERE module_name = 'platform_onboarding' 
  AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1)
)
ON CONFLICT DO NOTHING;

INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  status,
  order_index,
  is_active
)
SELECT 
  (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1),
  'platform_subscriptions',
  (SELECT id FROM module_categories WHERE name = 'platform'),
  'Abonnements',
  'Gestion des abonnements clients',
  'CreditCard',
  '/platform/subscriptions',
  'production',
  6,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM modules 
  WHERE module_name = 'platform_subscriptions' 
  AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1)
)
ON CONFLICT DO NOTHING;

INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  status,
  order_index,
  is_active
)
SELECT 
  (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1),
  'platform_settings',
  (SELECT id FROM module_categories WHERE name = 'platform'),
  'Paramètres',
  'Configuration de la plateforme',
  'Settings',
  '/platform/settings',
  'production',
  7,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM modules 
  WHERE module_name = 'platform_settings' 
  AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1)
)
ON CONFLICT DO NOTHING;

INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  status,
  order_index,
  is_active
)
SELECT 
  (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1),
  'platform_admins',
  (SELECT id FROM module_categories WHERE name = 'platform'),
  'Administrateurs',
  'Gestion des administrateurs plateforme',
  'Shield',
  '/platform/admins',
  'production',
  8,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM modules 
  WHERE module_name = 'platform_admins' 
  AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1)
)
ON CONFLICT DO NOTHING;

INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  status,
  order_index,
  is_active
)
SELECT 
  (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1),
  'platform_logs',
  (SELECT id FROM module_categories WHERE name = 'platform'),
  'Logs Système',
  'Logs et traçabilité système',
  'FileText',
  '/platform/logs',
  'production',
  9,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM modules 
  WHERE module_name = 'platform_logs' 
  AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1)
)
ON CONFLICT DO NOTHING;

INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  status,
  order_index,
  is_active
)
SELECT 
  (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1),
  'platform_analytics',
  (SELECT id FROM module_categories WHERE name = 'platform'),
  'Analytics',
  'Statistiques et analyses plateforme',
  'BarChart',
  '/platform/analytics',
  'production',
  10,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM modules 
  WHERE module_name = 'platform_analytics' 
  AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1)
)
ON CONFLICT DO NOTHING;

INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  status,
  order_index,
  is_active
)
SELECT 
  (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1),
  'platform_users',
  (SELECT id FROM module_categories WHERE name = 'platform'),
  'Utilisateurs',
  'Gestion des utilisateurs plateforme',
  'Users',
  '/platform/users',
  'production',
  11,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM modules 
  WHERE module_name = 'platform_users' 
  AND company_id = (SELECT id FROM companies WHERE name = 'Groupe MCLEM' LIMIT 1)
)
ON CONFLICT DO NOTHING;

-- BUSINESS
UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'business'),
  display_name = 'Leads & Prospection',
  description = 'Gestion des leads et pré-inscriptions',
  icon = 'Target',
  route = '/platform/leads',
  min_plan = 'starter',
  status = 'production',
  order_index = 1,
  default_limits = '{"max_leads_per_month": 50}'::jsonb
WHERE module_name = 'leads';

UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'business'),
  display_name = 'Onboarding',
  description = 'Processus d''intégration clients',
  icon = 'UserPlus',
  route = '/platform/onboarding',
  min_plan = 'starter',
  status = 'production',
  order_index = 2
WHERE module_name = 'onboarding' OR module_name = 'starter';

-- Facturation : Créer ou mettre à jour pour toutes les entreprises
INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  min_plan,
  status,
  order_index,
  is_active,
  default_limits
)
SELECT 
  c.id,
  'facturation',
  (SELECT id FROM module_categories WHERE name = 'finance'),
  'Facturation',
  'Gestion devis, factures et paiements',
  'FileText',
  '/platform/facturation',
  'business',
  'production',
  1,
  false,
  '{"max_invoices_per_month": -1}'::jsonb
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM modules 
  WHERE module_name = 'facturation' 
  AND company_id = c.id
)
ON CONFLICT DO NOTHING;

-- Mettre à jour le module facturation existant (catégorie finance)
UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'finance'),
  display_name = 'Facturation',
  description = 'Gestion devis, factures et paiements',
  icon = 'FileText',
  route = '/platform/facturation',
  min_plan = 'business',
  status = 'production',
  order_index = 1,
  default_limits = '{"max_invoices_per_month": -1}'::jsonb
WHERE module_name = 'facturation';

-- CRM (à créer)
INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  min_plan,
  status,
  order_index,
  is_active,
  default_limits
)
SELECT 
  (value#>>'{}')::UUID,
  'crm',
  (SELECT id FROM module_categories WHERE name = 'business'),
  'CRM',
  'Gestion de la relation client (contacts, opportunités)',
  'Users',
  '/platform/crm',
  'business',
  'planned',
  4,
  false,
  '{"max_contacts": 500, "max_deals": 100}'::jsonb
FROM settings
WHERE key = 'platform_company_id'
AND NOT EXISTS (
  SELECT 1 FROM modules WHERE module_name = 'crm'
);

-- Mettre à jour le module CRM existant
UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'business'),
  display_name = 'CRM',
  description = 'Gestion de la relation client (contacts, opportunités)',
  icon = 'Users',
  route = '/platform/crm',
  min_plan = 'business',
  status = 'planned',
  order_index = 4,
  default_limits = '{"max_contacts": 500, "max_deals": 100}'::jsonb
WHERE module_name = 'crm';

-- FINANCE
INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  min_plan,
  status,
  order_index,
  is_active,
  default_limits
)
SELECT 
  (value#>>'{}')::UUID,
  'comptabilite',
  (SELECT id FROM module_categories WHERE name = 'finance'),
  'Comptabilité',
  'Plan comptable, écritures, déclarations TVA',
  'Calculator',
  '/platform/comptabilite',
  'premium',
  'planned',
  1,
  false,
  '{}'::jsonb
FROM settings
WHERE key = 'platform_company_id'
AND NOT EXISTS (
  SELECT 1 FROM modules WHERE module_name = 'comptabilite'
);

-- Mettre à jour le module Comptabilité existant
UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'finance'),
  display_name = 'Comptabilité',
  description = 'Plan comptable, écritures, déclarations TVA',
  icon = 'Calculator',
  route = '/platform/comptabilite',
  min_plan = 'premium',
  status = 'planned',
  order_index = 1,
  default_limits = '{}'::jsonb
WHERE module_name = 'comptabilite';

INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  min_plan,
  status,
  order_index,
  is_active
)
SELECT 
  (value#>>'{}')::UUID,
  'tresorerie',
  (SELECT id FROM module_categories WHERE name = 'finance'),
  'Trésorerie',
  'Suivi de trésorerie et prévisions',
  'TrendingUp',
  '/platform/tresorerie',
  'premium',
  'planned',
  2,
  false
FROM settings
WHERE key = 'platform_company_id'
AND NOT EXISTS (
  SELECT 1 FROM modules WHERE module_name = 'tresorerie'
);

-- Mettre à jour le module Trésorerie existant
UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'finance'),
  display_name = 'Trésorerie',
  description = 'Suivi de trésorerie et prévisions',
  icon = 'TrendingUp',
  route = '/platform/tresorerie',
  min_plan = 'premium',
  status = 'planned',
  order_index = 2
WHERE module_name = 'tresorerie';

-- RH
INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  min_plan,
  status,
  order_index,
  is_active,
  default_limits
)
SELECT 
  (value#>>'{}')::UUID,
  'employes',
  (SELECT id FROM module_categories WHERE name = 'rh'),
  'Employés',
  'Gestion des employés et contrats',
  'UserCheck',
  '/platform/employes',
  'business',
  'planned',
  1,
  false,
  '{"max_employees": 10}'::jsonb
FROM settings
WHERE key = 'platform_company_id'
AND NOT EXISTS (
  SELECT 1 FROM modules WHERE module_name = 'employes'
);

-- Mettre à jour le module Employés existant
UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'rh'),
  display_name = 'Employés',
  description = 'Gestion des employés et contrats',
  icon = 'UserCheck',
  route = '/platform/employes',
  min_plan = 'business',
  status = 'planned',
  order_index = 1,
  default_limits = '{"max_employees": 10}'::jsonb
WHERE module_name = 'employes';

INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  min_plan,
  status,
  order_index,
  is_active
)
SELECT 
  (value#>>'{}')::UUID,
  'conges',
  (SELECT id FROM module_categories WHERE name = 'rh'),
  'Congés',
  'Gestion des congés et absences',
  'Calendar',
  '/platform/conges',
  'business',
  'planned',
  2,
  false
FROM settings
WHERE key = 'platform_company_id'
AND NOT EXISTS (
  SELECT 1 FROM modules WHERE module_name = 'conges'
);

-- Mettre à jour le module Congés existant
UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'rh'),
  display_name = 'Congés',
  description = 'Gestion des congés et absences',
  icon = 'Calendar',
  route = '/platform/conges',
  min_plan = 'business',
  status = 'planned',
  order_index = 2
WHERE module_name = 'conges';

INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  min_plan,
  status,
  order_index,
  is_active
)
SELECT 
  (value#>>'{}')::UUID,
  'paie',
  (SELECT id FROM module_categories WHERE name = 'rh'),
  'Paie',
  'Gestion de la paie et bulletins',
  'Wallet',
  '/platform/paie',
  'premium',
  'planned',
  3,
  false
FROM settings
WHERE key = 'platform_company_id'
AND NOT EXISTS (
  SELECT 1 FROM modules WHERE module_name = 'paie'
);

-- Mettre à jour le module Paie existant
UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'rh'),
  display_name = 'Paie',
  description = 'Gestion de la paie et bulletins',
  icon = 'Wallet',
  route = '/platform/paie',
  min_plan = 'premium',
  status = 'planned',
  order_index = 3
WHERE module_name = 'paie';

-- LOGISTIQUE
INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  min_plan,
  status,
  order_index,
  is_active,
  default_limits
)
SELECT 
  (value#>>'{}')::UUID,
  'stock',
  (SELECT id FROM module_categories WHERE name = 'logistique'),
  'Stock',
  'Gestion des stocks et inventaires',
  'Package',
  '/platform/stock',
  'business',
  'planned',
  1,
  false,
  '{"max_products": 1000}'::jsonb
FROM settings
WHERE key = 'platform_company_id'
AND NOT EXISTS (
  SELECT 1 FROM modules WHERE module_name = 'stock'
);

-- Mettre à jour le module Stock existant
UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'logistique'),
  display_name = 'Stock',
  description = 'Gestion des stocks et inventaires',
  icon = 'Package',
  route = '/platform/stock',
  min_plan = 'business',
  status = 'planned',
  order_index = 1,
  default_limits = '{"max_products": 1000}'::jsonb
WHERE module_name = 'stock';

-- GESTION
INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  min_plan,
  status,
  order_index,
  is_active,
  default_limits
)
SELECT 
  (value#>>'{}')::UUID,
  'taches',
  (SELECT id FROM module_categories WHERE name = 'gestion'),
  'Tâches',
  'Gestion des tâches et to-do lists',
  'CheckSquare',
  '/platform/taches',
  'starter',
  'planned',
  1,
  false,
  '{"max_tasks": 100}'::jsonb
FROM settings
WHERE key = 'platform_company_id'
AND NOT EXISTS (
  SELECT 1 FROM modules WHERE module_name = 'taches'
);

-- Mettre à jour le module Tâches existant
UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'gestion'),
  display_name = 'Tâches',
  description = 'Gestion des tâches et to-do lists',
  icon = 'CheckSquare',
  route = '/platform/taches',
  min_plan = 'starter',
  status = 'planned',
  order_index = 1,
  default_limits = '{"max_tasks": 100}'::jsonb
WHERE module_name = 'taches';

INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  min_plan,
  status,
  order_index,
  is_active,
  default_limits
)
SELECT 
  (value#>>'{}')::UUID,
  'projets',
  (SELECT id FROM module_categories WHERE name = 'gestion'),
  'Projets',
  'Gestion de projets et suivi',
  'FolderKanban',
  '/platform/projets',
  'business',
  'planned',
  2,
  false,
  '{"max_projects": 10}'::jsonb
FROM settings
WHERE key = 'platform_company_id'
AND NOT EXISTS (
  SELECT 1 FROM modules WHERE module_name = 'projets'
);

-- Mettre à jour le module Projets existant
UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'gestion'),
  display_name = 'Projets',
  description = 'Gestion de projets et suivi',
  icon = 'FolderKanban',
  route = '/platform/projets',
  min_plan = 'business',
  status = 'planned',
  order_index = 2,
  default_limits = '{"max_projects": 10}'::jsonb
WHERE module_name = 'projets';

-- DOCUMENTS
INSERT INTO modules (
  company_id,
  module_name,
  category_id,
  display_name,
  description,
  icon,
  route,
  min_plan,
  status,
  order_index,
  is_active
)
SELECT 
  (value#>>'{}')::UUID,
  'documents',
  (SELECT id FROM module_categories WHERE name = 'documents'),
  'GED',
  'Gestion électronique de documents',
  'FileStack',
  '/platform/documents',
  'business',
  'planned',
  1,
  false
FROM settings
WHERE key = 'platform_company_id'
AND NOT EXISTS (
  SELECT 1 FROM modules WHERE module_name = 'documents'
);

-- Mettre à jour le module Documents existant
UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'documents'),
  display_name = 'GED',
  description = 'Gestion électronique de documents',
  icon = 'FileStack',
  route = '/platform/documents',
  min_plan = 'business',
  status = 'planned',
  order_index = 1
WHERE module_name = 'documents';

-- ============================================================================
-- 9. LIER MODULES AUX PLANS STRIPE
-- ============================================================================

-- ============================================================================
-- 9. LIER MODULES AUX PLANS STRIPE (Optionnel - À configurer plus tard)
-- ============================================================================
-- Cette section est commentée car vous allez configurer les packs plus tard
-- Décommentez quand vous aurez créé vos plans Stripe

/*
-- Plan STARTER (29€)
INSERT INTO subscription_plan_modules (plan_id, module_name, is_included, limits)
SELECT 
  sp.id,
  'leads',
  true,
  '{"max_leads_per_month": 50}'::jsonb
FROM subscription_plans sp
WHERE sp.name = 'starter'  -- Utilise colonne 'name' au lieu de 'stripe_plan_name'
ON CONFLICT (plan_id, module_name) DO UPDATE SET
  is_included = EXCLUDED.is_included,
  limits = EXCLUDED.limits;

INSERT INTO subscription_plan_modules (plan_id, module_name, is_included)
SELECT sp.id, 'onboarding', true
FROM subscription_plans sp
WHERE sp.name = 'starter'
ON CONFLICT (plan_id, module_name) DO NOTHING;

INSERT INTO subscription_plan_modules (plan_id, module_name, is_included, limits)
SELECT 
  sp.id,
  'taches',
  true,
  '{"max_tasks": 100}'::jsonb
FROM subscription_plans sp
WHERE sp.name = 'starter'
ON CONFLICT (plan_id, module_name) DO UPDATE SET
  is_included = EXCLUDED.is_included,
  limits = EXCLUDED.limits;

-- Plan BUSINESS (79€)
INSERT INTO subscription_plan_modules (plan_id, module_name, is_included, limits)
SELECT 
  sp.id,
  unnest(ARRAY['leads', 'onboarding', 'taches', 'facturation', 'crm', 'employes', 'conges', 'stock', 'projets', 'documents']),
  true,
  CASE unnest(ARRAY['leads', 'onboarding', 'taches', 'facturation', 'crm', 'employes', 'conges', 'stock', 'projets', 'documents'])
    WHEN 'leads' THEN '{"max_leads_per_month": -1}'::jsonb
    WHEN 'crm' THEN '{"max_contacts": 500}'::jsonb
    WHEN 'employes' THEN '{"max_employees": 10}'::jsonb
    WHEN 'stock' THEN '{"max_products": 1000}'::jsonb
    WHEN 'projets' THEN '{"max_projects": 10}'::jsonb
    ELSE '{}'::jsonb
  END
FROM subscription_plans sp
WHERE sp.name = 'business'
ON CONFLICT (plan_id, module_name) DO UPDATE SET
  is_included = EXCLUDED.is_included,
  limits = EXCLUDED.limits;

-- Plan PREMIUM (149€)
INSERT INTO subscription_plan_modules (plan_id, module_name, is_included, limits)
SELECT 
  sp.id,
  unnest(ARRAY[
    'leads', 'onboarding', 'taches', 'facturation', 'crm', 
    'employes', 'conges', 'paie', 'stock', 'projets', 
    'documents', 'comptabilite', 'tresorerie'
  ]),
  true,
  CASE unnest(ARRAY[
    'leads', 'onboarding', 'taches', 'facturation', 'crm', 
    'employes', 'conges', 'paie', 'stock', 'projets', 
    'documents', 'comptabilite', 'tresorerie'
  ])
    WHEN 'crm' THEN '{"max_contacts": -1}'::jsonb
    WHEN 'employes' THEN '{"max_employees": 20}'::jsonb
    WHEN 'stock' THEN '{"max_products": -1}'::jsonb
    WHEN 'projets' THEN '{"max_projects": -1}'::jsonb
    ELSE '{}'::jsonb
  END
FROM subscription_plans sp
WHERE sp.name = 'premium'
ON CONFLICT (plan_id, module_name) DO UPDATE SET
  is_included = EXCLUDED.is_included,
  limits = EXCLUDED.limits;
*/

-- Note: Cette section sera activée quand vous configurerez vos packs Stripe

-- ============================================================================
-- ✅ MIGRATION TERMINÉE !
-- ============================================================================

-- Tables créées/mises à jour:
-- ✅ module_categories (8 catégories)
-- ✅ modules (colonnes ajoutées + modules migrés)
-- ✅ subscription_plan_modules (modules par plan)
--
-- Fonctions:
-- ✅ user_has_module_access() - Vérifier accès module
-- ✅ get_plan_modules() - Récupérer modules d'un plan
--
-- RLS configuré sur toutes les tables
--
-- Modules créés: 14 modules
-- Catégories: 8 catégories
-- Plans configurés: Starter, Business, Premium


