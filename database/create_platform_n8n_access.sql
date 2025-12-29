-- Table pour gérer les accès N8N des administrateurs plateforme
-- À exécuter dans Supabase SQL Editor

-- Table: platform_n8n_access
CREATE TABLE IF NOT EXISTS platform_n8n_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_platform_admin BOOLEAN NOT NULL DEFAULT false,
  has_n8n_access BOOLEAN NOT NULL DEFAULT true,
  access_level VARCHAR(50) DEFAULT 'admin', -- 'admin', 'viewer', 'editor'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE(user_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_platform_n8n_access_user_id ON platform_n8n_access(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_n8n_access_company_id ON platform_n8n_access(company_id);
CREATE INDEX IF NOT EXISTS idx_platform_n8n_access_is_platform_admin ON platform_n8n_access(is_platform_admin) WHERE is_platform_admin = true;
CREATE INDEX IF NOT EXISTS idx_platform_n8n_access_has_n8n_access ON platform_n8n_access(has_n8n_access) WHERE has_n8n_access = true;

-- Trigger pour updated_at
CREATE TRIGGER update_platform_n8n_access_updated_at 
  BEFORE UPDATE ON platform_n8n_access
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE platform_n8n_access ENABLE ROW LEVEL SECURITY;

-- Policy : Seuls les utilisateurs plateforme peuvent voir cette table
DROP POLICY IF EXISTS "Platform users can view n8n access" ON platform_n8n_access;
CREATE POLICY "Platform users can view n8n access"
  ON platform_n8n_access FOR SELECT
  USING (
    company_id = (SELECT (value#>>'{}')::UUID FROM settings WHERE key = 'platform_company_id' LIMIT 1)
    OR
    public.is_platform_user()
  );

-- Policy : Seuls les utilisateurs plateforme peuvent modifier
DROP POLICY IF EXISTS "Platform users can manage n8n access" ON platform_n8n_access;
CREATE POLICY "Platform users can manage n8n access"
  ON platform_n8n_access FOR ALL
  USING (
    company_id = (SELECT (value#>>'{}')::UUID FROM settings WHERE key = 'platform_company_id' LIMIT 1)
    OR
    public.is_platform_user()
  );

-- Commentaire sur la table
COMMENT ON TABLE platform_n8n_access IS 'Gère les accès N8N pour les administrateurs de la plateforme';
COMMENT ON COLUMN platform_n8n_access.is_platform_admin IS 'Indique si l''utilisateur est administrateur de la plateforme';
COMMENT ON COLUMN platform_n8n_access.has_n8n_access IS 'Indique si l''utilisateur a accès à N8N (peut être désactivé sans supprimer l''enregistrement)';
COMMENT ON COLUMN platform_n8n_access.access_level IS 'Niveau d''accès : admin (plein accès), editor (modification), viewer (lecture seule)';









