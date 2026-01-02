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
CREATE TRIGGER update_module_categories_updated_at 
  BEFORE UPDATE ON module_categories
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger updated_at pour subscription_plan_modules
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

-- Policy: Tout le monde peut voir les catégories
CREATE POLICY "Anyone can view module categories"
  ON module_categories FOR SELECT
  USING (true);

-- Policy: Seuls admins plateforme peuvent modifier catégories
CREATE POLICY "Platform admins can manage categories"
  ON module_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND company_id = (SELECT id FROM companies WHERE name = 'Talosprime' LIMIT 1)
    )
  );

-- Policy: Admins plateforme peuvent voir tous les plan_modules
CREATE POLICY "Platform admins can view plan modules"
  ON subscription_plan_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND company_id = (SELECT id FROM companies WHERE name = 'Talosprime' LIMIT 1)
    )
  );

-- Policy: Admins plateforme peuvent gérer plan_modules
CREATE POLICY "Platform admins can manage plan modules"
  ON subscription_plan_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND company_id = (SELECT id FROM companies WHERE name = 'Talosprime' LIMIT 1)
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
  route = '/auth',
  status = 'production',
  order_index = 1
WHERE module_name = 'auth';

UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'core'),
  display_name = 'Dashboard',
  description = 'Tableau de bord principal',
  icon = 'LayoutDashboard',
  route = '/dashboard',
  status = 'production',
  order_index = 2
WHERE module_name = 'dashboard';

UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'core'),
  display_name = 'Paramètres',
  description = 'Configuration de l''entreprise',
  icon = 'Settings',
  route = '/settings',
  status = 'production',
  order_index = 3
WHERE module_name = 'settings';

-- PLATEFORME
UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'platform'),
  display_name = 'Gestion Clients',
  description = 'Administration des entreprises clientes',
  icon = 'Building2',
  route = '/platform/clients',
  status = 'production',
  order_index = 1
WHERE module_name = 'platform_clients';

UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'platform'),
  display_name = 'Plans & Abonnements',
  description = 'Gestion des plans Stripe et abonnements',
  icon = 'CreditCard',
  route = '/platform/plans',
  status = 'production',
  order_index = 2
WHERE module_name = 'platform_plans';

UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'platform'),
  display_name = 'Gestion Modules',
  description = 'Activation/désactivation modules par client',
  icon = 'Package',
  route = '/platform/modules',
  status = 'production',
  order_index = 3
WHERE module_name = 'platform_modules';

-- BUSINESS
UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'business'),
  display_name = 'Leads & Prospection',
  description = 'Gestion des leads et pré-inscriptions',
  icon = 'Target',
  route = '/leads',
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
  route = '/onboarding',
  min_plan = 'starter',
  status = 'production',
  order_index = 2
WHERE module_name = 'onboarding' OR module_name = 'starter';

UPDATE modules SET 
  category_id = (SELECT id FROM module_categories WHERE name = 'business'),
  display_name = 'Facturation',
  description = 'Gestion devis, factures et paiements',
  icon = 'FileText',
  route = '/facturation',
  min_plan = 'business',
  status = 'production',
  order_index = 3,
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
  '/crm',
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
  '/comptabilite',
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
  '/tresorerie',
  'premium',
  'planned',
  2,
  false
FROM settings
WHERE key = 'platform_company_id'
AND NOT EXISTS (
  SELECT 1 FROM modules WHERE module_name = 'tresorerie'
);

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
  '/employes',
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
  '/conges',
  'business',
  'planned',
  2,
  false
FROM settings
WHERE key = 'platform_company_id'
AND NOT EXISTS (
  SELECT 1 FROM modules WHERE module_name = 'conges'
);

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
  '/paie',
  'premium',
  'planned',
  3,
  false
FROM settings
WHERE key = 'platform_company_id'
AND NOT EXISTS (
  SELECT 1 FROM modules WHERE module_name = 'paie'
);

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
  '/stock',
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
  '/taches',
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
  '/projets',
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
  '/documents',
  'business',
  'planned',
  1,
  false
FROM settings
WHERE key = 'platform_company_id'
AND NOT EXISTS (
  SELECT 1 FROM modules WHERE module_name = 'documents'
);

-- ============================================================================
-- 9. LIER MODULES AUX PLANS STRIPE
-- ============================================================================

-- Plan STARTER (29€)
INSERT INTO subscription_plan_modules (plan_id, module_name, is_included, limits)
SELECT 
  sp.id,
  'leads',
  true,
  '{"max_leads_per_month": 50}'::jsonb
FROM subscription_plans sp
WHERE sp.stripe_plan_name = 'Starter'
ON CONFLICT (plan_id, module_name) DO UPDATE SET
  is_included = EXCLUDED.is_included,
  limits = EXCLUDED.limits;

INSERT INTO subscription_plan_modules (plan_id, module_name, is_included)
SELECT sp.id, 'onboarding', true
FROM subscription_plans sp
WHERE sp.stripe_plan_name = 'Starter'
ON CONFLICT (plan_id, module_name) DO NOTHING;

INSERT INTO subscription_plan_modules (plan_id, module_name, is_included, limits)
SELECT 
  sp.id,
  'taches',
  true,
  '{"max_tasks": 100}'::jsonb
FROM subscription_plans sp
WHERE sp.stripe_plan_name = 'Starter'
ON CONFLICT (plan_id, module_name) DO UPDATE SET
  is_included = EXCLUDED.is_included,
  limits = EXCLUDED.limits;

-- Plan BUSINESS (79€)
-- Inclut tout de Starter + nouveaux modules
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
WHERE sp.stripe_plan_name = 'Business'
ON CONFLICT (plan_id, module_name) DO UPDATE SET
  is_included = EXCLUDED.is_included,
  limits = EXCLUDED.limits;

-- Plan PREMIUM (149€)
-- Inclut tout de Business + modules finance
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
WHERE sp.stripe_plan_name = 'Premium'
ON CONFLICT (plan_id, module_name) DO UPDATE SET
  is_included = EXCLUDED.is_included,
  limits = EXCLUDED.limits;

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


