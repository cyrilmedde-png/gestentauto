-- Schéma de base de données pour le module d'onboarding automatisé
-- À exécuter dans Supabase SQL Editor

-- Table: leads (Pré-inscriptions)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  company_name VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pre_registered',
  onboarding_step VARCHAR(50) NOT NULL DEFAULT 'form',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('pre_registered', 'questionnaire_completed', 'interview_scheduled', 'trial_started', 'converted', 'abandoned')),
  CONSTRAINT valid_step CHECK (onboarding_step IN ('form', 'questionnaire', 'interview', 'trial', 'completed'))
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_onboarding_step ON leads(onboarding_step);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Table: onboarding_questionnaires (Questionnaires de besoins)
CREATE TABLE IF NOT EXISTS onboarding_questionnaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Type de demande
  request_type VARCHAR(50), -- company_creation, platform_setup, trial_7days, full_service
  
  -- Informations métier
  business_sector VARCHAR(100), -- commerce, restauration, immobilier, santé, etc.
  business_size VARCHAR(50), -- startup, pme, grande_entreprise
  current_tools TEXT[], -- Liste des outils actuels
  main_needs TEXT[], -- Liste des besoins principaux
  
  -- Budget et timing
  budget_range VARCHAR(50), -- <100, 100-500, 500-1000, >1000
  timeline VARCHAR(50), -- immediate, 1_month, 3_months, 6_months
  
  -- Réponses libres
  additional_info TEXT,
  
  -- Recommandations système (rempli automatiquement)
  recommended_modules TEXT[], -- Modules recommandés selon les réponses
  trial_config JSONB, -- Configuration de l'essai gratuit
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(lead_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_questionnaires_lead_id ON onboarding_questionnaires(lead_id);
CREATE INDEX IF NOT EXISTS idx_questionnaires_request_type ON onboarding_questionnaires(request_type);
CREATE INDEX IF NOT EXISTS idx_questionnaires_business_sector ON onboarding_questionnaires(business_sector);

-- Table: onboarding_interviews (Entretiens)
CREATE TABLE IF NOT EXISTS onboarding_interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  scheduled_at TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  
  meeting_link VARCHAR(500), -- Lien visio si applicable
  notes TEXT,
  interviewer_id UUID, -- ID utilisateur plateforme qui fait l'entretien (peut référencer auth.users)
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_interview_status CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled', 'no_show'))
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_interviews_lead_id ON onboarding_interviews(lead_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON onboarding_interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON onboarding_interviews(scheduled_at);

-- Table: trials (Essais gratuits)
CREATE TABLE IF NOT EXISTS trials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 7,
  
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  
  -- Configuration de l'essai
  enabled_modules TEXT[], -- Modules activés pour l'essai
  trial_type VARCHAR(50), -- full_access, limited, custom
  
  -- Connexion à l'entreprise si converti
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  
  -- Token d'accès temporaire (pour connexion sans compte complet)
  access_token VARCHAR(500),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_trial_status CHECK (status IN ('active', 'expired', 'converted', 'cancelled')),
  CONSTRAINT valid_trial_type CHECK (trial_type IN ('full_access', 'limited', 'custom'))
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_trials_lead_id ON trials(lead_id);
CREATE INDEX IF NOT EXISTS idx_trials_company_id ON trials(company_id);
CREATE INDEX IF NOT EXISTS idx_trials_status ON trials(status);
CREATE INDEX IF NOT EXISTS idx_trials_end_date ON trials(end_date);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questionnaires_updated_at BEFORE UPDATE ON onboarding_questionnaires
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON onboarding_interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trials_updated_at BEFORE UPDATE ON trials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
-- La plateforme a accès à toutes les données de leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials ENABLE ROW LEVEL SECURITY;

-- Politiques RLS : La plateforme peut tout voir et modifier
-- (Ces tables ne contiennent pas de données clients des clients, donc pas de restriction)
CREATE POLICY "Platform can manage all leads"
  ON leads FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Platform can manage all questionnaires"
  ON onboarding_questionnaires FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Platform can manage all interviews"
  ON onboarding_interviews FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Platform can manage all trials"
  ON trials FOR ALL
  USING (true)
  WITH CHECK (true);


