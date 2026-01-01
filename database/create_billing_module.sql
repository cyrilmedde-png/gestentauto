-- ============================================================================
-- MODULE FACTURATION COMPLET - Schéma Base de Données
-- ============================================================================
-- Date: 2026-01-01
-- Module: Facturation (Devis, Proforma, Factures, Avoirs, Achats)

-- ============================================================================
-- 1. TABLE PRINCIPALE: documents
-- ============================================================================
-- Stocke tous les documents (devis, factures, avoirs, etc.)

CREATE TABLE IF NOT EXISTS billing_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Type de document
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('quote', 'proforma', 'invoice', 'credit_note', 'purchase_invoice')),
  
  -- Numérotation
  document_number VARCHAR(50) UNIQUE NOT NULL, -- Ex: FAC-2026-0001, DEV-2026-0001
  reference VARCHAR(100), -- Référence client/interne
  
  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE, -- Pour factures
  valid_until DATE, -- Pour devis
  
  -- Statut
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'paid', 'partially_paid', 'overdue', 'cancelled', 'converted')),
  
  -- Client/Fournisseur
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES companies(id), -- Client (pour ventes)
  supplier_id UUID REFERENCES companies(id), -- Fournisseur (pour achats)
  
  -- Contact
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_address TEXT,
  customer_vat_number VARCHAR(50),
  
  -- Montants
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 20.00, -- TVA 20%
  discount_amount DECIMAL(10, 2) DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  
  -- Paiement
  payment_method VARCHAR(50), -- 'bank_transfer', 'credit_card', 'cash', 'check'
  payment_terms TEXT, -- Conditions de paiement
  paid_amount DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Relations
  parent_document_id UUID REFERENCES billing_documents(id), -- Pour avoir lié à facture
  converted_from_id UUID REFERENCES billing_documents(id), -- Devis → Facture
  
  -- Fichiers
  pdf_url TEXT, -- URL du PDF généré
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  terms_and_conditions TEXT,
  
  -- Métadonnées
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 2. TABLE: billing_document_items
-- ============================================================================
-- Lignes de détail des documents (produits/services)

CREATE TABLE IF NOT EXISTS billing_document_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES billing_documents(id) ON DELETE CASCADE,
  
  -- Ordre d'affichage
  position INTEGER NOT NULL DEFAULT 0,
  
  -- Produit/Service
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('product', 'service', 'discount', 'shipping')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100), -- Référence produit
  
  -- Quantité & Prix
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  unit_price DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'unité', -- 'unité', 'heure', 'jour', 'kg', etc.
  
  -- TVA
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
  
  -- Montants
  subtotal DECIMAL(10, 2) NOT NULL, -- quantity * unit_price
  tax_amount DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. TABLE: billing_sequences
-- ============================================================================
-- Gestion des numéros de séquence par type de document

CREATE TABLE IF NOT EXISTS billing_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  prefix VARCHAR(20) NOT NULL, -- Ex: 'FAC', 'DEV', 'AVO'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(company_id, document_type, year)
);

-- ============================================================================
-- 4. TABLE: billing_payments
-- ============================================================================
-- Historique des paiements

CREATE TABLE IF NOT EXISTS billing_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES billing_documents(id) ON DELETE CASCADE,
  
  -- Montant
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Méthode
  payment_method VARCHAR(50) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Détails
  transaction_reference VARCHAR(255),
  notes TEXT,
  
  -- Métadonnées
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. TABLE: billing_settings
-- ============================================================================
-- Paramètres de facturation par entreprise

CREATE TABLE IF NOT EXISTS billing_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  
  -- Numérotation
  quote_prefix VARCHAR(20) DEFAULT 'DEV',
  invoice_prefix VARCHAR(20) DEFAULT 'FAC',
  credit_note_prefix VARCHAR(20) DEFAULT 'AVO',
  proforma_prefix VARCHAR(20) DEFAULT 'PRO',
  purchase_invoice_prefix VARCHAR(20) DEFAULT 'ACH',
  
  -- TVA
  default_tax_rate DECIMAL(5, 2) DEFAULT 20.00,
  vat_number VARCHAR(50),
  
  -- Conditions de paiement
  default_payment_terms TEXT DEFAULT 'Paiement sous 30 jours',
  default_due_days INTEGER DEFAULT 30,
  default_quote_validity_days INTEGER DEFAULT 30,
  
  -- Coordonnées bancaires
  bank_name VARCHAR(255),
  iban VARCHAR(50),
  bic VARCHAR(20),
  
  -- Logo & Design
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#4F46E5',
  
  -- Informations légales
  company_legal_name VARCHAR(255),
  company_address TEXT,
  company_phone VARCHAR(50),
  company_email VARCHAR(255),
  legal_notice TEXT,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. INDEXES pour performances
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_billing_documents_company ON billing_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_billing_documents_type ON billing_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_billing_documents_status ON billing_documents(status);
CREATE INDEX IF NOT EXISTS idx_billing_documents_number ON billing_documents(document_number);
CREATE INDEX IF NOT EXISTS idx_billing_documents_dates ON billing_documents(issue_date, due_date);
CREATE INDEX IF NOT EXISTS idx_billing_documents_customer ON billing_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_documents_supplier ON billing_documents(supplier_id);

CREATE INDEX IF NOT EXISTS idx_billing_items_document ON billing_document_items(document_id);
CREATE INDEX IF NOT EXISTS idx_billing_items_position ON billing_document_items(document_id, position);

CREATE INDEX IF NOT EXISTS idx_billing_payments_document ON billing_payments(document_id);
CREATE INDEX IF NOT EXISTS idx_billing_payments_date ON billing_payments(payment_date);

-- ============================================================================
-- 7. FUNCTIONS
-- ============================================================================

-- Fonction: Générer prochain numéro de document
CREATE OR REPLACE FUNCTION get_next_document_number(
  p_company_id UUID,
  p_document_type VARCHAR,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS VARCHAR AS $$
DECLARE
  v_prefix VARCHAR(20);
  v_next_number INTEGER;
  v_document_number VARCHAR(50);
BEGIN
  -- Obtenir le préfixe depuis les settings
  SELECT 
    CASE 
      WHEN p_document_type = 'quote' THEN quote_prefix
      WHEN p_document_type = 'invoice' THEN invoice_prefix
      WHEN p_document_type = 'credit_note' THEN credit_note_prefix
      WHEN p_document_type = 'proforma' THEN proforma_prefix
      WHEN p_document_type = 'purchase_invoice' THEN purchase_invoice_prefix
      ELSE 'DOC'
    END INTO v_prefix
  FROM billing_settings
  WHERE company_id = p_company_id;

  -- Si pas de settings, utiliser défaut
  IF v_prefix IS NULL THEN
    v_prefix := CASE 
      WHEN p_document_type = 'quote' THEN 'DEV'
      WHEN p_document_type = 'invoice' THEN 'FAC'
      WHEN p_document_type = 'credit_note' THEN 'AVO'
      WHEN p_document_type = 'proforma' THEN 'PRO'
      WHEN p_document_type = 'purchase_invoice' THEN 'ACH'
      ELSE 'DOC'
    END;
  END IF;

  -- Insérer ou mettre à jour la séquence
  INSERT INTO billing_sequences (company_id, document_type, year, last_number, prefix)
  VALUES (p_company_id, p_document_type, p_year, 1, v_prefix)
  ON CONFLICT (company_id, document_type, year)
  DO UPDATE SET 
    last_number = billing_sequences.last_number + 1,
    updated_at = NOW()
  RETURNING last_number INTO v_next_number;

  -- Construire le numéro: PREFIX-YEAR-0001
  v_document_number := v_prefix || '-' || p_year || '-' || LPAD(v_next_number::TEXT, 4, '0');

  RETURN v_document_number;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Recalculer totaux document
CREATE OR REPLACE FUNCTION recalculate_document_totals(p_document_id UUID)
RETURNS VOID AS $$
DECLARE
  v_subtotal DECIMAL(10, 2);
  v_tax_amount DECIMAL(10, 2);
  v_total DECIMAL(10, 2);
BEGIN
  -- Calculer depuis les items
  SELECT 
    COALESCE(SUM(subtotal), 0),
    COALESCE(SUM(tax_amount), 0),
    COALESCE(SUM(total), 0)
  INTO v_subtotal, v_tax_amount, v_total
  FROM billing_document_items
  WHERE document_id = p_document_id;

  -- Mettre à jour le document
  UPDATE billing_documents
  SET 
    subtotal = v_subtotal,
    tax_amount = v_tax_amount,
    total_amount = v_total,
    updated_at = NOW()
  WHERE id = p_document_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Calculer total payé
CREATE OR REPLACE FUNCTION calculate_paid_amount(p_document_id UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  v_paid_amount DECIMAL(10, 2);
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_paid_amount
  FROM billing_payments
  WHERE document_id = p_document_id;

  RETURN v_paid_amount;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================

-- Trigger: Recalculer totaux après insert/update/delete item
CREATE OR REPLACE FUNCTION trigger_recalculate_document_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_document_totals(OLD.document_id);
  ELSE
    PERFORM recalculate_document_totals(NEW.document_id);
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalc_after_item_change
AFTER INSERT OR UPDATE OR DELETE ON billing_document_items
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_document_totals();

-- Trigger: Mettre à jour paid_amount après paiement
CREATE OR REPLACE FUNCTION trigger_update_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE billing_documents
  SET 
    paid_amount = calculate_paid_amount(NEW.document_id),
    status = CASE 
      WHEN calculate_paid_amount(NEW.document_id) >= total_amount THEN 'paid'
      WHEN calculate_paid_amount(NEW.document_id) > 0 THEN 'partially_paid'
      ELSE status
    END,
    paid_at = CASE 
      WHEN calculate_paid_amount(NEW.document_id) >= total_amount THEN NOW()
      ELSE paid_at
    END,
    updated_at = NOW()
  WHERE id = NEW.document_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_paid_after_payment
AFTER INSERT ON billing_payments
FOR EACH ROW EXECUTE FUNCTION trigger_update_paid_amount();

-- ============================================================================
-- 9. RLS (Row Level Security)
-- ============================================================================

ALTER TABLE billing_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Utilisateurs peuvent voir leurs propres documents
CREATE POLICY billing_documents_select_own ON billing_documents
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY billing_documents_insert_own ON billing_documents
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY billing_documents_update_own ON billing_documents
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Mêmes policies pour les autres tables
CREATE POLICY billing_items_all ON billing_document_items FOR ALL USING (
  document_id IN (SELECT id FROM billing_documents)
);

CREATE POLICY billing_sequences_all ON billing_sequences FOR ALL USING (
  company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

CREATE POLICY billing_payments_all ON billing_payments FOR ALL USING (
  document_id IN (SELECT id FROM billing_documents)
);

CREATE POLICY billing_settings_all ON billing_settings FOR ALL USING (
  company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

-- ============================================================================
-- 10. DONNÉES DE TEST
-- ============================================================================

-- Insérer settings par défaut pour toutes les companies existantes
INSERT INTO billing_settings (company_id)
SELECT id FROM companies
WHERE id NOT IN (SELECT company_id FROM billing_settings)
ON CONFLICT (company_id) DO NOTHING;

-- ============================================================================
-- ✅ MIGRATION TERMINÉE !
-- ============================================================================
-- Tables créées:
-- - billing_documents (documents principaux)
-- - billing_document_items (lignes de détail)
-- - billing_sequences (numérotation)
-- - billing_payments (paiements)
-- - billing_settings (paramètres)
--
-- Functions:
-- - get_next_document_number() (génère numéro)
-- - recalculate_document_totals() (recalcule montants)
-- - calculate_paid_amount() (calcule total payé)
--
-- Triggers:
-- - Auto-recalcul totaux
-- - Auto-update statut paiement
--
-- RLS configuré pour sécurité multi-tenant
-- ============================================================================

