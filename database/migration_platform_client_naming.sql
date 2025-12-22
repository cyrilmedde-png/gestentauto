-- =====================================================
-- Migration : Convention de nommage Platform / Client
-- =====================================================
-- Ce script renomme les tables pour clarifier la séparation
-- Plateforme : platform_*
-- Client : client_*
-- =====================================================

-- ÉTAPE 1 : Renommer les tables onboarding existantes
-- =====================================================

-- Renommer leads → platform_leads
ALTER TABLE IF EXISTS leads RENAME TO platform_leads;

-- Renommer onboarding_questionnaires → platform_onboarding_questionnaires
ALTER TABLE IF EXISTS onboarding_questionnaires RENAME TO platform_onboarding_questionnaires;

-- Renommer onboarding_interviews → platform_onboarding_interviews
ALTER TABLE IF EXISTS onboarding_interviews RENAME TO platform_onboarding_interviews;

-- Renommer trials → platform_trials
ALTER TABLE IF EXISTS trials RENAME TO platform_trials;

-- ÉTAPE 2 : Mettre à jour les colonnes de référence
-- =====================================================

-- Mettre à jour les références dans platform_onboarding_questionnaires
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'platform_onboarding_questionnaires' 
             AND column_name = 'lead_id') THEN
    ALTER TABLE platform_onboarding_questionnaires 
      RENAME COLUMN lead_id TO platform_lead_id;
  END IF;
END $$;

-- Mettre à jour les contraintes de clé étrangère
DO $$
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'onboarding_questionnaires_lead_id_fkey'
             AND table_name = 'platform_onboarding_questionnaires') THEN
    ALTER TABLE platform_onboarding_questionnaires 
      DROP CONSTRAINT onboarding_questionnaires_lead_id_fkey;
  END IF;
  
  -- Ajouter la nouvelle contrainte
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'platform_onboarding_questionnaires' 
             AND column_name = 'platform_lead_id') THEN
    ALTER TABLE platform_onboarding_questionnaires
      ADD CONSTRAINT platform_onboarding_questionnaires_platform_lead_id_fkey
      FOREIGN KEY (platform_lead_id) REFERENCES platform_leads(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Mettre à jour les références dans platform_onboarding_interviews
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'platform_onboarding_interviews' 
             AND column_name = 'lead_id') THEN
    ALTER TABLE platform_onboarding_interviews 
      RENAME COLUMN lead_id TO platform_lead_id;
  END IF;
END $$;

-- Mettre à jour les contraintes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'onboarding_interviews_lead_id_fkey'
             AND table_name = 'platform_onboarding_interviews') THEN
    ALTER TABLE platform_onboarding_interviews 
      DROP CONSTRAINT onboarding_interviews_lead_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'platform_onboarding_interviews' 
             AND column_name = 'platform_lead_id') THEN
    ALTER TABLE platform_onboarding_interviews
      ADD CONSTRAINT platform_onboarding_interviews_platform_lead_id_fkey
      FOREIGN KEY (platform_lead_id) REFERENCES platform_leads(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Mettre à jour les références dans platform_trials
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'platform_trials' 
             AND column_name = 'lead_id') THEN
    ALTER TABLE platform_trials 
      RENAME COLUMN lead_id TO platform_lead_id;
  END IF;
END $$;

-- Mettre à jour les contraintes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'trials_lead_id_fkey'
             AND table_name = 'platform_trials') THEN
    ALTER TABLE platform_trials 
      DROP CONSTRAINT trials_lead_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'platform_trials' 
             AND column_name = 'platform_lead_id') THEN
    ALTER TABLE platform_trials
      ADD CONSTRAINT platform_trials_platform_lead_id_fkey
      FOREIGN KEY (platform_lead_id) REFERENCES platform_leads(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ÉTAPE 3 : Mettre à jour les index
-- =====================================================

-- Index pour platform_leads (mettre à jour les noms)
DO $$
BEGIN
  -- Renommer les index existants
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leads_email') THEN
    ALTER INDEX idx_leads_email RENAME TO idx_platform_leads_email;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leads_status') THEN
    ALTER INDEX idx_leads_status RENAME TO idx_platform_leads_status;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leads_onboarding_step') THEN
    ALTER INDEX idx_leads_onboarding_step RENAME TO idx_platform_leads_onboarding_step;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leads_created_at') THEN
    ALTER INDEX idx_leads_created_at RENAME TO idx_platform_leads_created_at;
  END IF;
END $$;

-- Index pour platform_onboarding_questionnaires
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_questionnaires_lead_id') THEN
    ALTER INDEX idx_questionnaires_lead_id RENAME TO idx_platform_questionnaires_lead_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_questionnaires_request_type') THEN
    ALTER INDEX idx_questionnaires_request_type RENAME TO idx_platform_questionnaires_request_type;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_questionnaires_business_sector') THEN
    ALTER INDEX idx_questionnaires_business_sector RENAME TO idx_platform_questionnaires_business_sector;
  END IF;
END $$;

-- Index pour platform_onboarding_interviews
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_interviews_lead_id') THEN
    ALTER INDEX idx_interviews_lead_id RENAME TO idx_platform_interviews_lead_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_interviews_status') THEN
    ALTER INDEX idx_interviews_status RENAME TO idx_platform_interviews_status;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_interviews_scheduled_at') THEN
    ALTER INDEX idx_interviews_scheduled_at RENAME TO idx_platform_interviews_scheduled_at;
  END IF;
END $$;

-- Index pour platform_trials
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_trials_lead_id') THEN
    ALTER INDEX idx_trials_lead_id RENAME TO idx_platform_trials_lead_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_trials_company_id') THEN
    ALTER INDEX idx_trials_company_id RENAME TO idx_platform_trials_company_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_trials_status') THEN
    ALTER INDEX idx_trials_status RENAME TO idx_platform_trials_status;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_trials_end_date') THEN
    ALTER INDEX idx_trials_end_date RENAME TO idx_platform_trials_end_date;
  END IF;
END $$;

-- ÉTAPE 4 : Mettre à jour les contraintes UNIQUE
-- =====================================================

DO $$
BEGIN
  -- Mettre à jour la contrainte UNIQUE sur platform_onboarding_questionnaires
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'onboarding_questionnaires_lead_id_key'
             AND table_name = 'platform_onboarding_questionnaires') THEN
    ALTER TABLE platform_onboarding_questionnaires 
      DROP CONSTRAINT onboarding_questionnaires_lead_id_key;
    
    ALTER TABLE platform_onboarding_questionnaires
      ADD CONSTRAINT platform_onboarding_questionnaires_platform_lead_id_key
      UNIQUE(platform_lead_id);
  END IF;
  
  -- Mettre à jour la contrainte UNIQUE sur platform_trials (si elle existe)
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'onboarding_interviews_lead_id_key'
             AND table_name = 'platform_onboarding_interviews') THEN
    ALTER TABLE platform_onboarding_interviews 
      DROP CONSTRAINT onboarding_interviews_lead_id_key;
    
    ALTER TABLE platform_onboarding_interviews
      ADD CONSTRAINT platform_onboarding_interviews_platform_lead_id_key
      UNIQUE(platform_lead_id);
  END IF;
END $$;

-- ÉTAPE 5 : Message de confirmation
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée avec succès !';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables renommées :';
  RAISE NOTICE '  - leads → platform_leads';
  RAISE NOTICE '  - onboarding_questionnaires → platform_onboarding_questionnaires';
  RAISE NOTICE '  - onboarding_interviews → platform_onboarding_interviews';
  RAISE NOTICE '  - trials → platform_trials';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT : Mettre à jour le code pour utiliser les nouveaux noms de tables !';
END $$;

