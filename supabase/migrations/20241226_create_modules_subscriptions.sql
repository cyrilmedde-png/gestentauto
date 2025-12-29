-- ============================================
-- Tables pour système de modules avec abonnements Stripe
-- ============================================

-- Table des modules disponibles (avec prix)
CREATE TABLE IF NOT EXISTS available_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- ex: "starter", "leads", "commandes"
  display_name TEXT NOT NULL, -- ex: "Pack Starter", "Module Leads"
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL, -- Prix mensuel en euros
  price_yearly DECIMAL(10,2), -- Prix annuel (optionnel)
  icon TEXT DEFAULT 'Package', -- Icône Lucide
  category TEXT DEFAULT 'standard', -- 'base', 'premium', 'custom'
  features JSONB, -- Liste des fonctionnalités
  is_n8n_created BOOLEAN DEFAULT false, -- Créé par N8N ou non
  n8n_workflow_id TEXT, -- ID du workflow N8N si créé par N8N
  route_slug TEXT, -- ex: "leads", "commandes"
  table_name TEXT, -- Nom de la table Supabase créée par N8N
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des abonnements Stripe par entreprise
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', etc.
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des modules activés par entreprise (lié à l'abonnement)
CREATE TABLE IF NOT EXISTS company_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  module_id UUID REFERENCES available_modules(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  stripe_price_id TEXT, -- ID du prix Stripe
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Si abonnement mensuel
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, module_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_company_modules_company_id ON company_modules(company_id);
CREATE INDEX IF NOT EXISTS idx_company_modules_module_id ON company_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- RLS pour toutes les tables
ALTER TABLE available_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_modules ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour available_modules (lecture publique, écriture admin uniquement)
CREATE POLICY "Anyone can view active modules"
  ON available_modules FOR SELECT
  USING (is_active = true);

-- Politiques RLS pour subscriptions
CREATE POLICY "Users can view their company's subscriptions"
  ON subscriptions FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Politiques RLS pour company_modules
CREATE POLICY "Users can view their company's modules"
  ON company_modules FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Insertion des modules de base
INSERT INTO available_modules (name, display_name, description, price_monthly, icon, category, features) VALUES
(
  'starter',
  'Pack Starter',
  'Module de base : Dashboard, Facturation, Devis, Avoir, Finances',
  19.99,
  'Home',
  'base',
  '["Dashboard", "Facturation", "Devis", "Avoir", "Finances"]'::jsonb
),
(
  'leads',
  'Module Leads',
  'Gestion complète des leads d''onboarding avec suivi du parcours',
  29.99,
  'UserPlus',
  'premium',
  '["Gestion des leads", "Suivi du parcours", "Questionnaires", "Entretiens", "Conversion"]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_available_modules_updated_at
  BEFORE UPDATE ON available_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();






