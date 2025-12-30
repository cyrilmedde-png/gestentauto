-- =====================================================
-- DIAGNOSTIC + FIX - Système d'Abonnements
-- =====================================================
-- Ce script vérifie et corrige les erreurs de migration
-- =====================================================

-- =====================================================
-- ÉTAPE 1 : DIAGNOSTIC
-- =====================================================

-- Vérifier si les tables existent
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') 
    THEN '✅ Table subscription_plans existe'
    ELSE '❌ Table subscription_plans MANQUANTE'
  END as check_plans,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') 
    THEN '✅ Table subscriptions existe'
    ELSE '❌ Table subscriptions MANQUANTE'
  END as check_subscriptions;

-- Vérifier les colonnes de subscriptions si la table existe
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    RAISE NOTICE 'Colonnes de la table subscriptions :';
  END IF;
END $$;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
ORDER BY ordinal_position;

-- =====================================================
-- ÉTAPE 2 : SUPPRESSION PROPRE (si besoin)
-- =====================================================

-- Supprimer les tables dans le bon ordre (si elles existent déjà)
-- ATTENTION : Cela supprime les données existantes !

DROP TABLE IF EXISTS subscription_history CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- =====================================================
-- ÉTAPE 3 : RECRÉATION COMPLÈTE
-- =====================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: subscription_plans
-- =====================================================
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identification
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Stripe
  stripe_product_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255) UNIQUE,
  
  -- Tarification
  price_monthly DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  billing_period VARCHAR(20) DEFAULT 'monthly',
  
  -- Quotas
  max_users INTEGER,
  max_leads INTEGER,
  max_clients INTEGER,
  max_storage_gb INTEGER,
  max_workflows INTEGER,
  
  -- Fonctionnalités
  features JSONB DEFAULT '[]',
  modules JSONB DEFAULT '[]',
  
  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_subscription_plans_name ON subscription_plans(name);
CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_sort_order ON subscription_plans(sort_order);

-- =====================================================
-- TABLE: subscriptions
-- =====================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Lien entreprise + plan
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  
  -- Stripe
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  
  -- Statut
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  
  -- Dates
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Tarification
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Paiement
  payment_method VARCHAR(50),
  last_payment_at TIMESTAMPTZ,
  next_payment_at TIMESTAMPTZ,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  cancel_reason TEXT,
  cancel_requested_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_subscription_status CHECK (
    status IN ('active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'trialing', 'incomplete_expired')
  )
);

-- Index
CREATE INDEX idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- =====================================================
-- TABLE: subscription_history
-- =====================================================
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  event_type VARCHAR(50) NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  
  old_plan_id UUID REFERENCES subscription_plans(id),
  new_plan_id UUID REFERENCES subscription_plans(id),
  
  amount DECIMAL(10, 2),
  currency VARCHAR(3),
  
  details JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_subscription_history_subscription_id ON subscription_history(subscription_id);
CREATE INDEX idx_subscription_history_company_id ON subscription_history(company_id);
CREATE INDEX idx_subscription_history_event_type ON subscription_history(event_type);
CREATE INDEX idx_subscription_history_created_at ON subscription_history(created_at DESC);

-- =====================================================
-- TABLE: payment_methods
-- =====================================================
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,
  
  is_default BOOLEAN DEFAULT false,
  
  card_brand VARCHAR(50),
  card_last4 VARCHAR(4),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  
  sepa_last4 VARCHAR(4),
  sepa_bank_code VARCHAR(50),
  
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_payment_methods_company_id ON payment_methods(company_id);
CREATE INDEX idx_payment_methods_stripe_payment_method_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX idx_payment_methods_is_default ON payment_methods(is_default);

-- =====================================================
-- ÉTAPE 4 : INSERTION DES 3 FORMULES
-- =====================================================

INSERT INTO subscription_plans (
  name, 
  display_name, 
  description, 
  price_monthly, 
  currency, 
  billing_period,
  max_users,
  max_leads,
  max_clients,
  max_storage_gb,
  max_workflows,
  features,
  modules,
  is_active,
  sort_order
) VALUES 
(
  'starter',
  'Starter',
  'Formule idéale pour démarrer et tester la plateforme',
  29.00,
  'EUR',
  'monthly',
  1,
  100,
  10,
  1,
  0,
  '["1 utilisateur", "100 leads/mois", "10 clients", "1 GB stockage", "Support email"]'::jsonb,
  '["leads", "clients"]'::jsonb,
  true,
  1
),
(
  'business',
  'Business',
  'Formule complète pour les PME et agences',
  79.00,
  'EUR',
  'monthly',
  5,
  NULL,
  NULL,
  10,
  5,
  '["5 utilisateurs", "Leads illimités", "Clients illimités", "10 GB stockage", "5 workflows N8N", "Support prioritaire", "Exports avancés"]'::jsonb,
  '["leads", "clients", "workflows", "exports", "analytics"]'::jsonb,
  true,
  2
),
(
  'enterprise',
  'Enterprise',
  'Formule sur-mesure pour les grandes entreprises',
  199.00,
  'EUR',
  'monthly',
  NULL,
  NULL,
  NULL,
  100,
  NULL,
  '["Utilisateurs illimités", "Leads illimités", "Clients illimités", "100 GB stockage", "Workflows N8N illimités", "Support dédié 24/7", "API complète", "White-label", "SLA garanti"]'::jsonb,
  '["leads", "clients", "workflows", "exports", "analytics", "api", "white-label", "custom"]'::jsonb,
  true,
  3
);

-- =====================================================
-- ÉTAPE 5 : ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Policy pour subscription_plans (lecture publique pour users authentifiés)
CREATE POLICY "Lecture publique des formules" ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy pour subscriptions (chaque company voit ses abonnements)
CREATE POLICY "Users voient leurs abonnements" ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy pour subscription_history
CREATE POLICY "Users voient leur historique" ON subscription_history
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy pour payment_methods
CREATE POLICY "Users voient leurs moyens de paiement" ON payment_methods
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- =====================================================
-- ÉTAPE 6 : TRIGGERS pour updated_at
-- =====================================================

-- Fonction trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ÉTAPE 7 : VÉRIFICATION FINALE
-- =====================================================

-- Compter les formules
SELECT 
  COUNT(*) as nombre_formules,
  STRING_AGG(display_name || ' (' || price_monthly || '€)', ', ') as formules
FROM subscription_plans
WHERE is_active = true;

-- Lister toutes les colonnes de subscriptions
SELECT 
  '✅ Colonne: ' || column_name || ' (type: ' || data_type || ')' as verification
FROM information_schema.columns 
WHERE table_name = 'subscriptions'
AND column_name IN ('id', 'company_id', 'plan_id', 'stripe_subscription_id', 'status')
ORDER BY ordinal_position;

-- Message final
DO $$ 
BEGIN
  RAISE NOTICE '✅✅✅ MIGRATION TERMINÉE AVEC SUCCÈS ! ✅✅✅';
  RAISE NOTICE '📊 3 formules créées : Starter (29€), Business (79€), Enterprise (199€)';
  RAISE NOTICE '🔒 Row Level Security activé sur toutes les tables';
  RAISE NOTICE '⚡ Triggers updated_at configurés';
  RAISE NOTICE '🎯 Prêt pour Stripe !';
END $$;

