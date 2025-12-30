-- =====================================================
-- SYSTÈME D'ABONNEMENTS STRIPE - Tables
-- =====================================================
-- Migration pour créer les tables de gestion
-- des abonnements, formules, paiements et historique
-- =====================================================

-- Extension UUID (si pas déjà créée)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: subscription_plans
-- Définition des formules d'abonnement
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identification
  name VARCHAR(100) NOT NULL UNIQUE, -- starter, business, enterprise
  display_name VARCHAR(100) NOT NULL, -- Starter, Business, Enterprise
  description TEXT,
  
  -- Stripe
  stripe_product_id VARCHAR(255) UNIQUE, -- prod_xxx
  stripe_price_id VARCHAR(255) UNIQUE, -- price_xxx
  
  -- Tarification
  price_monthly DECIMAL(10, 2) NOT NULL, -- 29.00, 79.00, 199.00
  currency VARCHAR(3) DEFAULT 'EUR',
  billing_period VARCHAR(20) DEFAULT 'monthly', -- monthly, annual
  
  -- Quotas
  max_users INTEGER, -- NULL = illimité
  max_leads INTEGER, -- NULL = illimité
  max_clients INTEGER, -- NULL = illimité
  max_storage_gb INTEGER, -- NULL = illimité
  max_workflows INTEGER, -- NULL = illimité
  
  -- Fonctionnalités
  features JSONB DEFAULT '[]', -- Liste des features incluses
  modules JSONB DEFAULT '[]', -- Liste des modules activés
  
  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0, -- Pour affichage
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour subscription_plans
CREATE INDEX IF NOT EXISTS idx_subscription_plans_name ON subscription_plans(name);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort_order ON subscription_plans(sort_order);

-- =====================================================
-- TABLE: subscriptions
-- Abonnements actifs des entreprises
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Lien entreprise
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  
  -- Stripe
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL, -- sub_xxx
  stripe_customer_id VARCHAR(255) NOT NULL, -- cus_xxx
  
  -- Statut
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  -- active, past_due, unpaid, canceled, incomplete, trialing, incomplete_expired
  
  -- Dates
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_end TIMESTAMPTZ, -- Si converti depuis essai
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Tarification
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Paiement
  payment_method VARCHAR(50), -- card, sepa_debit, etc.
  last_payment_at TIMESTAMPTZ,
  next_payment_at TIMESTAMPTZ,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}', -- Données Stripe supplémentaires
  cancel_reason TEXT, -- Raison si annulé
  cancel_requested_at TIMESTAMPTZ, -- Date demande annulation
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_subscription_status CHECK (
    status IN ('active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'trialing', 'incomplete_expired')
  ),
  
  -- Une seule subscription active par company
  UNIQUE(company_id)
);

-- Index pour subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);

-- =====================================================
-- TABLE: subscription_history
-- Historique des changements d'abonnement
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Changement
  event_type VARCHAR(50) NOT NULL,
  -- created, upgraded, downgraded, renewed, payment_succeeded, payment_failed, canceled, suspended, reactivated
  
  old_plan_id UUID REFERENCES subscription_plans(id),
  new_plan_id UUID REFERENCES subscription_plans(id),
  
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  
  -- Stripe
  stripe_event_id VARCHAR(255), -- evt_xxx
  stripe_invoice_id VARCHAR(255), -- in_xxx
  
  -- Montant
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Métadonnées
  details JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour subscription_history
CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription_id ON subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_company_id ON subscription_history(company_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_event_type ON subscription_history(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON subscription_history(created_at DESC);

-- =====================================================
-- TABLE: payment_methods
-- Méthodes de paiement enregistrées
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Stripe
  stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL, -- pm_xxx
  
  -- Type
  type VARCHAR(50) NOT NULL, -- card, sepa_debit, etc.
  
  -- Détails carte
  card_brand VARCHAR(50), -- visa, mastercard, amex
  card_last4 VARCHAR(4),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  
  -- Détails SEPA
  sepa_last4 VARCHAR(4),
  sepa_bank_code VARCHAR(20),
  
  -- Statut
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour payment_methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_company_id ON payment_methods(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(company_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_payment_method_id ON payment_methods(stripe_payment_method_id);

-- =====================================================
-- TRIGGERS - Mise à jour automatique de updated_at
-- =====================================================

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
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- subscription_plans : Lecture publique, écriture plateforme seulement
CREATE POLICY "Everyone can read subscription plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Platform can manage subscription plans"
  ON subscription_plans FOR ALL
  USING (public.is_platform_user())
  WITH CHECK (public.is_platform_user());

-- subscriptions : Accès par company_id
CREATE POLICY "Users can access their company subscription"
  ON subscriptions FOR SELECT
  USING (
    company_id = public.user_company_id()
    OR public.is_platform_user()
  );

CREATE POLICY "Platform can manage all subscriptions"
  ON subscriptions FOR ALL
  USING (public.is_platform_user())
  WITH CHECK (public.is_platform_user());

-- subscription_history : Lecture par company_id
CREATE POLICY "Users can read their company subscription history"
  ON subscription_history FOR SELECT
  USING (
    company_id = public.user_company_id()
    OR public.is_platform_user()
  );

CREATE POLICY "Platform can manage subscription history"
  ON subscription_history FOR INSERT
  WITH CHECK (public.is_platform_user());

-- payment_methods : Accès par company_id
CREATE POLICY "Users can access their company payment methods"
  ON payment_methods FOR ALL
  USING (
    company_id = public.user_company_id()
    OR public.is_platform_user()
  )
  WITH CHECK (
    company_id = public.user_company_id()
    OR public.is_platform_user()
  );

-- =====================================================
-- INSERTION DES FORMULES PAR DÉFAUT
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
-- ===== STARTER =====
(
  'starter',
  'Starter',
  'Parfait pour les entrepreneurs individuels et freelances',
  29.00,
  'EUR',
  'monthly',
  1, -- 1 utilisateur
  100, -- 100 leads/mois
  50, -- 50 clients
  1, -- 1 GB
  0, -- Pas de workflows
  '["Module Leads (100/mois)", "Module Clients (50)", "Facturation de base", "Support email 48h", "Stockage 1 GB"]'::jsonb,
  '["leads", "clients", "invoices"]'::jsonb,
  true,
  1
),
-- ===== BUSINESS =====
(
  'business',
  'Business',
  'Idéal pour les PME et entreprises en croissance',
  79.00,
  'EUR',
  'monthly',
  5, -- 5 utilisateurs
  NULL, -- Leads illimités
  NULL, -- Clients illimités
  10, -- 10 GB
  5, -- 5 workflows
  '["5 utilisateurs", "Leads illimités", "Clients illimités", "Facturation avancée", "CRM complet", "5 workflows N8N", "Support prioritaire 24h", "Stockage 10 GB", "Rapports & Analytics", "Personnalisation interface", "Exports avancés"]'::jsonb,
  '["leads", "clients", "invoices", "crm", "analytics", "automations"]'::jsonb,
  true,
  2
),
-- ===== ENTERPRISE =====
(
  'enterprise',
  'Enterprise',
  'Solution complète pour grandes entreprises',
  199.00,
  'EUR',
  'monthly',
  NULL, -- Utilisateurs illimités
  NULL, -- Leads illimités
  NULL, -- Clients illimités
  100, -- 100 GB
  NULL, -- Workflows illimités
  '["Utilisateurs illimités", "Tous les modules", "API complète", "Workflows N8N illimités", "Support dédié 4h", "Stockage 100 GB", "Formation équipe", "Onboarding personnalisé", "SLA 99.9%", "Développements sur mesure", "Business Intelligence"]'::jsonb,
  '["all"]'::jsonb,
  true,
  3
)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Tables d''abonnements créées avec succès !';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables créées :';
  RAISE NOTICE '  - subscription_plans (Formules d''abonnement)';
  RAISE NOTICE '  - subscriptions (Abonnements actifs)';
  RAISE NOTICE '  - subscription_history (Historique)';
  RAISE NOTICE '  - payment_methods (Moyens de paiement)';
  RAISE NOTICE '';
  RAISE NOTICE '💰 Formules insérées :';
  RAISE NOTICE '  - Starter : 29€/mois (1 user, 100 leads)';
  RAISE NOTICE '  - Business : 79€/mois (5 users, illimité)';
  RAISE NOTICE '  - Enterprise : 199€/mois (illimité)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS activé sur toutes les tables';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Prochaines étapes :';
  RAISE NOTICE '  1. Configurer produits Stripe';
  RAISE NOTICE '  2. Mettre à jour stripe_product_id et stripe_price_id';
  RAISE NOTICE '  3. Configurer webhooks Stripe';
  RAISE NOTICE '  4. Créer les API routes';
  RAISE NOTICE '  5. Créer les workflows N8N';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

