-- ============================================================================
-- FACTURATION ÉLECTRONIQUE OBLIGATOIRE - Mise à Jour Schéma
-- ============================================================================
-- Date: 2026-01-01
-- Conforme à la réforme de la facturation électronique (1er septembre 2026)
-- Référence: Loi de finances 2024, Article 91

-- ============================================================================
-- 1. NOUVELLES MENTIONS OBLIGATOIRES (depuis 1er septembre 2026)
-- ============================================================================

-- Ajouter colonnes pour nouvelles mentions obligatoires
ALTER TABLE billing_documents
ADD COLUMN IF NOT EXISTS customer_siren VARCHAR(9), -- SIREN client (OBLIGATOIRE)
ADD COLUMN IF NOT EXISTS operation_category VARCHAR(50) CHECK (operation_category IN ('goods', 'services', 'both')), -- Catégorie opération (OBLIGATOIRE)
ADD COLUMN IF NOT EXISTS vat_on_debit BOOLEAN DEFAULT FALSE, -- Option paiement TVA sur débits
ADD COLUMN IF NOT EXISTS delivery_address TEXT, -- Adresse de livraison si différente
ADD COLUMN IF NOT EXISTS delivery_city VARCHAR(255),
ADD COLUMN IF NOT EXISTS delivery_postal_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS delivery_country VARCHAR(2) DEFAULT 'FR';

-- ============================================================================
-- 2. FACTURATION ÉLECTRONIQUE (Format & Transmission)
-- ============================================================================

-- Ajouter colonnes pour facturation électronique
ALTER TABLE billing_documents
ADD COLUMN IF NOT EXISTS electronic_format VARCHAR(50) CHECK (electronic_format IN ('factur-x', 'ubl', 'cii', null)) DEFAULT 'factur-x', -- Format électronique
ADD COLUMN IF NOT EXISTS electronic_status VARCHAR(50) CHECK (electronic_status IN ('pending', 'sent', 'received', 'validated', 'rejected', 'error', null)) DEFAULT 'pending', -- Statut transmission
ADD COLUMN IF NOT EXISTS platform_name VARCHAR(100), -- Plateforme de dématérialisation (PDP)
ADD COLUMN IF NOT EXISTS platform_id VARCHAR(255), -- ID document sur la plateforme
ADD COLUMN IF NOT EXISTS xml_file_url TEXT, -- URL fichier XML (UBL/CII)
ADD COLUMN IF NOT EXISTS facturx_file_url TEXT, -- URL fichier Factur-X (PDF/A-3 + XML)
ADD COLUMN IF NOT EXISTS transmission_date TIMESTAMP WITH TIME ZONE, -- Date transmission à la plateforme
ADD COLUMN IF NOT EXISTS validation_date TIMESTAMP WITH TIME ZONE, -- Date validation par la plateforme
ADD COLUMN IF NOT EXISTS rejection_reason TEXT; -- Raison rejet si erreur

-- ============================================================================
-- 3. E-REPORTING (Transmission données fiscales)
-- ============================================================================

-- Table pour e-reporting (données transactions pour l'administration fiscale)
CREATE TABLE IF NOT EXISTS billing_ereporting (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Document lié
  document_id UUID REFERENCES billing_documents(id) ON DELETE CASCADE,
  
  -- Type de transaction
  transaction_type VARCHAR(50) CHECK (transaction_type IN ('b2c', 'b2b_foreign', 'export', 'other')), -- B2C, B2B étranger, Export
  
  -- Données fiscales
  transaction_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  vat_amount DECIMAL(10, 2) NOT NULL,
  
  -- Paiement
  payment_method VARCHAR(50),
  payment_date DATE,
  
  -- Transmission
  reported_to_dgfip BOOLEAN DEFAULT FALSE, -- Transmis à l'administration
  report_date TIMESTAMP WITH TIME ZONE,
  report_reference VARCHAR(255),
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. PARAMÈTRES PLATEFORME DE DÉMATÉRIALISATION
-- ============================================================================

-- Ajouter paramètres pour plateforme de dématérialisation
ALTER TABLE billing_settings
ADD COLUMN IF NOT EXISTS edp_platform VARCHAR(100), -- Nom de la plateforme (ex: Chorus Pro, Docaposte...)
ADD COLUMN IF NOT EXISTS edp_api_key TEXT, -- Clé API plateforme
ADD COLUMN IF NOT EXISTS edp_api_url TEXT, -- URL API plateforme
ADD COLUMN IF NOT EXISTS edp_company_id VARCHAR(255), -- ID entreprise sur la plateforme
ADD COLUMN IF NOT EXISTS edp_enabled BOOLEAN DEFAULT FALSE, -- Facturation électronique activée
ADD COLUMN IF NOT EXISTS edp_default_format VARCHAR(50) DEFAULT 'factur-x', -- Format par défaut
ADD COLUMN IF NOT EXISTS ereporting_enabled BOOLEAN DEFAULT FALSE; -- E-reporting activé

-- ============================================================================
-- 5. NOUVELLES FONCTIONS
-- ============================================================================

-- Fonction: Valider SIREN (9 chiffres)
CREATE OR REPLACE FUNCTION validate_siren(p_siren VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  -- SIREN doit être 9 chiffres exactement
  RETURN p_siren ~ '^[0-9]{9}$';
END;
$$ LANGUAGE plpgsql;

-- Fonction: Vérifier conformité facturation électronique
CREATE OR REPLACE FUNCTION check_electronic_invoice_compliance(p_document_id UUID)
RETURNS TABLE(is_compliant BOOLEAN, missing_fields TEXT[]) AS $$
DECLARE
  v_doc billing_documents%ROWTYPE;
  v_missing TEXT[] := ARRAY[]::TEXT[];
BEGIN
  SELECT * INTO v_doc FROM billing_documents WHERE id = p_document_id;
  
  -- Vérifier mentions obligatoires
  IF v_doc.customer_siren IS NULL OR v_doc.customer_siren = '' THEN
    v_missing := array_append(v_missing, 'SIREN client');
  END IF;
  
  IF v_doc.operation_category IS NULL THEN
    v_missing := array_append(v_missing, 'Catégorie opération (goods/services/both)');
  END IF;
  
  IF v_doc.customer_address IS NULL OR v_doc.customer_address = '' THEN
    v_missing := array_append(v_missing, 'Adresse client');
  END IF;
  
  IF v_doc.vat_number IS NULL OR v_doc.vat_number = '' THEN
    v_missing := array_append(v_missing, 'Numéro TVA');
  END IF;
  
  -- Vérifier format électronique
  IF v_doc.electronic_format IS NULL THEN
    v_missing := array_append(v_missing, 'Format électronique (factur-x/ubl/cii)');
  END IF;
  
  RETURN QUERY SELECT (array_length(v_missing, 1) IS NULL OR array_length(v_missing, 1) = 0), v_missing;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Générer numéro Factur-X
CREATE OR REPLACE FUNCTION generate_facturx_filename(p_document_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_doc billing_documents%ROWTYPE;
  v_filename VARCHAR;
BEGIN
  SELECT * INTO v_doc FROM billing_documents WHERE id = p_document_id;
  
  -- Format: FACTURX_SIREN-EMETTEUR_NUMERO-FACTURE_DATE.pdf
  v_filename := 'FACTURX_' || 
    COALESCE((SELECT vat_number FROM billing_settings WHERE company_id = v_doc.company_id), 'NOSIREN') || 
    '_' || v_doc.document_number || 
    '_' || TO_CHAR(v_doc.issue_date, 'YYYYMMDD') || 
    '.pdf';
  
  RETURN v_filename;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. INDEXES pour performances
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_billing_documents_electronic_status ON billing_documents(electronic_status);
CREATE INDEX IF NOT EXISTS idx_billing_documents_customer_siren ON billing_documents(customer_siren);
CREATE INDEX IF NOT EXISTS idx_billing_documents_transmission_date ON billing_documents(transmission_date);
CREATE INDEX IF NOT EXISTS idx_billing_ereporting_reported ON billing_ereporting(reported_to_dgfip);
CREATE INDEX IF NOT EXISTS idx_billing_ereporting_document ON billing_ereporting(document_id);

-- ============================================================================
-- 7. RLS pour e-reporting
-- ============================================================================

ALTER TABLE billing_ereporting ENABLE ROW LEVEL SECURITY;

CREATE POLICY billing_ereporting_all ON billing_ereporting FOR ALL USING (
  document_id IN (SELECT id FROM billing_documents)
);

-- ============================================================================
-- 8. MISE À JOUR DONNÉES EXISTANTES
-- ============================================================================

-- Mettre à jour les paramètres pour activer facturation électronique
UPDATE billing_settings
SET 
  edp_enabled = TRUE,
  edp_default_format = 'factur-x',
  ereporting_enabled = TRUE
WHERE edp_enabled IS NULL;

-- ============================================================================
-- 9. CONTRAINTES DE VALIDATION
-- ============================================================================

-- Trigger: Valider SIREN avant insert/update
CREATE OR REPLACE FUNCTION trigger_validate_siren()
RETURNS TRIGGER AS $$
BEGIN
  -- Si SIREN fourni, le valider
  IF NEW.customer_siren IS NOT NULL AND NEW.customer_siren <> '' THEN
    IF NOT validate_siren(NEW.customer_siren) THEN
      RAISE EXCEPTION 'SIREN invalide: doit être 9 chiffres (fourni: %)', NEW.customer_siren;
    END IF;
  END IF;
  
  -- Si facture envoyée, vérifier mentions obligatoires (depuis sept 2026)
  IF NEW.status = 'sent' AND NEW.document_type IN ('invoice', 'credit_note') AND NEW.issue_date >= '2026-09-01' THEN
    IF NEW.customer_siren IS NULL OR NEW.customer_siren = '' THEN
      RAISE EXCEPTION 'SIREN client obligatoire pour factures émises après le 1er septembre 2026';
    END IF;
    
    IF NEW.operation_category IS NULL THEN
      RAISE EXCEPTION 'Catégorie opération obligatoire pour factures émises après le 1er septembre 2026';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_electronic_invoice
BEFORE INSERT OR UPDATE ON billing_documents
FOR EACH ROW EXECUTE FUNCTION trigger_validate_siren();

-- ============================================================================
-- 10. VUE: Factures non conformes
-- ============================================================================

CREATE OR REPLACE VIEW billing_non_compliant_invoices AS
SELECT 
  d.id,
  d.document_number,
  d.issue_date,
  d.customer_name,
  d.customer_siren,
  d.operation_category,
  d.electronic_status,
  CASE 
    WHEN d.customer_siren IS NULL OR d.customer_siren = '' THEN 'SIREN manquant'
    WHEN d.operation_category IS NULL THEN 'Catégorie opération manquante'
    WHEN d.electronic_format IS NULL THEN 'Format électronique manquant'
    WHEN d.electronic_status = 'error' THEN 'Erreur transmission: ' || d.rejection_reason
    ELSE 'Autre'
  END AS compliance_issue
FROM billing_documents d
WHERE 
  d.document_type IN ('invoice', 'credit_note')
  AND d.issue_date >= '2026-09-01'
  AND (
    d.customer_siren IS NULL 
    OR d.customer_siren = '' 
    OR d.operation_category IS NULL
    OR d.electronic_format IS NULL
    OR d.electronic_status = 'error'
  );

-- ============================================================================
-- 11. TABLE: Logs transmission plateforme
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_platform_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES billing_documents(id) ON DELETE CASCADE,
  
  -- Action
  action VARCHAR(50) NOT NULL CHECK (action IN ('send', 'receive', 'validate', 'reject', 'error')),
  
  -- Plateforme
  platform_name VARCHAR(100) NOT NULL,
  platform_response TEXT, -- Réponse brute de la plateforme
  
  -- Statut
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_logs_document ON billing_platform_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_platform_logs_created ON billing_platform_logs(created_at);

ALTER TABLE billing_platform_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY billing_platform_logs_all ON billing_platform_logs FOR ALL USING (
  document_id IN (SELECT id FROM billing_documents)
);

-- ============================================================================
-- ✅ MIGRATION FACTURATION ÉLECTRONIQUE TERMINÉE !
-- ============================================================================
-- 
-- NOUVELLES MENTIONS OBLIGATOIRES:
-- ✅ SIREN client (9 chiffres)
-- ✅ Catégorie opération (goods/services/both)
-- ✅ Option TVA sur débits
-- ✅ Adresse livraison si différente
--
-- FORMATS ÉLECTRONIQUES SUPPORTÉS:
-- ✅ Factur-X (PDF/A-3 + XML)
-- ✅ UBL (XML)
-- ✅ CII (XML)
--
-- PLATEFORME DE DÉMATÉRIALISATION:
-- ✅ Paramètres API configurables
-- ✅ Statuts transmission (pending, sent, validated, rejected)
-- ✅ Logs transmission
--
-- E-REPORTING:
-- ✅ Table dédiée pour données fiscales
-- ✅ Transmission DGFIP
-- ✅ Suivi transactions B2C, export, etc.
--
-- CONFORMITÉ:
-- ✅ Fonction check_electronic_invoice_compliance()
-- ✅ Trigger validation SIREN
-- ✅ Vue factures non conformes
-- ✅ Logs plateforme
--
-- CALENDRIER:
-- 📅 1er septembre 2026: Grandes entreprises & ETI
-- 📅 1er septembre 2027: PME & micro-entreprises
--
-- ============================================================================

