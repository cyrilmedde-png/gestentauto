-- =====================================================
-- Tables CLIENT - Modules métier pour les clients
-- =====================================================
-- Ces tables contiennent les données métier des clients
-- avec isolation par company_id
-- =====================================================

-- TABLE : client_leads
-- Module Leads/CRM - Gestion des leads/prospects des clients
-- =====================================================
CREATE TABLE IF NOT EXISTS client_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Informations du lead
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  company_name VARCHAR(255),
  
  -- Statut et source
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  source VARCHAR(100), -- web, email, phone, referral, social_media, etc.
  
  -- Métadonnées
  notes TEXT,
  assigned_to UUID REFERENCES users(id),
  
  -- Champs personnalisables (JSONB pour flexibilité)
  custom_fields JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_client_lead_status CHECK (
    status IN ('new', 'contacted', 'qualified', 'converted', 'lost', 'nurturing')
  )
);

-- Index pour client_leads
CREATE INDEX IF NOT EXISTS idx_client_leads_company_id ON client_leads(company_id);
CREATE INDEX IF NOT EXISTS idx_client_leads_status ON client_leads(company_id, status);
CREATE INDEX IF NOT EXISTS idx_client_leads_assigned_to ON client_leads(company_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_client_leads_email ON client_leads(company_id, email);
CREATE INDEX IF NOT EXISTS idx_client_leads_created_at ON client_leads(company_id, created_at DESC);

-- TABLE : client_customers
-- Module CRM - Clients finaux des entreprises clientes
-- =====================================================
CREATE TABLE IF NOT EXISTS client_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Informations client
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  company_name VARCHAR(255),
  
  -- Informations facturation
  billing_address TEXT,
  billing_city VARCHAR(100),
  billing_zip_code VARCHAR(20),
  billing_country VARCHAR(100),
  
  -- Statut
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  
  -- Métadonnées
  notes TEXT,
  tags TEXT[], -- Tags pour catégorisation
  custom_fields JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_client_customer_status CHECK (
    status IN ('active', 'inactive', 'archived')
  )
);

-- Index pour client_customers
CREATE INDEX IF NOT EXISTS idx_client_customers_company_id ON client_customers(company_id);
CREATE INDEX IF NOT EXISTS idx_client_customers_status ON client_customers(company_id, status);
CREATE INDEX IF NOT EXISTS idx_client_customers_email ON client_customers(company_id, email);

-- TABLE : client_invoices
-- Module Facturation - Factures des clients
-- =====================================================
CREATE TABLE IF NOT EXISTS client_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Lien avec le client
  customer_id UUID REFERENCES client_customers(id) ON DELETE SET NULL,
  
  -- Informations facture
  invoice_number VARCHAR(100) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE,
  
  -- Montants
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Statut
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  
  -- Paiement
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50),
  
  -- Métadonnées
  notes TEXT,
  items JSONB DEFAULT '[]', -- Tableau des lignes de facture
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_client_invoice_status CHECK (
    status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')
  ),
  
  UNIQUE(company_id, invoice_number)
);

-- Index pour client_invoices
CREATE INDEX IF NOT EXISTS idx_client_invoices_company_id ON client_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_client_invoices_customer_id ON client_invoices(company_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_client_invoices_status ON client_invoices(company_id, status);
CREATE INDEX IF NOT EXISTS idx_client_invoices_issue_date ON client_invoices(company_id, issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_client_invoices_due_date ON client_invoices(company_id, due_date);

-- TABLE : client_quotes
-- Module Facturation - Devis des clients
-- =====================================================
CREATE TABLE IF NOT EXISTS client_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Lien avec le client
  customer_id UUID REFERENCES client_customers(id) ON DELETE SET NULL,
  
  -- Informations devis
  quote_number VARCHAR(100) NOT NULL,
  issue_date DATE NOT NULL,
  valid_until DATE,
  
  -- Montants
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Statut
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  
  -- Conversion
  converted_to_invoice_id UUID REFERENCES client_invoices(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  
  -- Métadonnées
  notes TEXT,
  items JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_client_quote_status CHECK (
    status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')
  ),
  
  UNIQUE(company_id, quote_number)
);

-- Index pour client_quotes
CREATE INDEX IF NOT EXISTS idx_client_quotes_company_id ON client_quotes(company_id);
CREATE INDEX IF NOT EXISTS idx_client_quotes_customer_id ON client_quotes(company_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_client_quotes_status ON client_quotes(company_id, status);
CREATE INDEX IF NOT EXISTS idx_client_quotes_issue_date ON client_quotes(company_id, issue_date DESC);

-- RLS : Activer RLS sur toutes les tables client
ALTER TABLE client_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies : Les clients voient uniquement leurs données
-- La plateforme peut voir toutes les données (pour support)

-- client_leads
CREATE POLICY "Users can access their company leads"
  ON client_leads FOR ALL
  USING (
    company_id = public.user_company_id()
    OR public.is_platform_user()
  )
  WITH CHECK (
    company_id = public.user_company_id()
    OR public.is_platform_user()
  );

-- client_customers
CREATE POLICY "Users can access their company customers"
  ON client_customers FOR ALL
  USING (
    company_id = public.user_company_id()
    OR public.is_platform_user()
  )
  WITH CHECK (
    company_id = public.user_company_id()
    OR public.is_platform_user()
  );

-- client_invoices
CREATE POLICY "Users can access their company invoices"
  ON client_invoices FOR ALL
  USING (
    company_id = public.user_company_id()
    OR public.is_platform_user()
  )
  WITH CHECK (
    company_id = public.user_company_id()
    OR public.is_platform_user()
  );

-- client_quotes
CREATE POLICY "Users can access their company quotes"
  ON client_quotes FOR ALL
  USING (
    company_id = public.user_company_id()
    OR public.is_platform_user()
  )
  WITH CHECK (
    company_id = public.user_company_id()
    OR public.is_platform_user()
  );

-- Triggers pour updated_at
CREATE TRIGGER update_client_leads_updated_at
  BEFORE UPDATE ON client_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_customers_updated_at
  BEFORE UPDATE ON client_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_invoices_updated_at
  BEFORE UPDATE ON client_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_quotes_updated_at
  BEFORE UPDATE ON client_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Tables client créées avec succès !';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables créées :';
  RAISE NOTICE '  - client_leads (Module Leads/CRM)';
  RAISE NOTICE '  - client_customers (Module CRM)';
  RAISE NOTICE '  - client_invoices (Module Facturation)';
  RAISE NOTICE '  - client_quotes (Module Facturation)';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS activé sur toutes les tables client.';
END $$;


