-- Table pour les notifications de la plateforme
-- Permet d'afficher les notifications aux utilisateurs plateforme

CREATE TABLE IF NOT EXISTS platform_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les notifications non lues
CREATE INDEX IF NOT EXISTS idx_platform_notifications_read 
ON platform_notifications(read, created_at DESC);

-- Index pour les notifications par type
CREATE INDEX IF NOT EXISTS idx_platform_notifications_type 
ON platform_notifications(type, created_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS update_platform_notifications_updated_at ON platform_notifications;

-- Créer le trigger
CREATE TRIGGER update_platform_notifications_updated_at
BEFORE UPDATE ON platform_notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Les notifications sont visibles uniquement par les utilisateurs plateforme
ALTER TABLE platform_notifications ENABLE ROW LEVEL SECURITY;

-- Fonction helper pour vérifier si un utilisateur est plateforme
CREATE OR REPLACE FUNCTION public.is_platform_user()
RETURNS BOOLEAN AS $$
DECLARE
  v_user_company_id UUID;
  v_platform_company_id UUID;
BEGIN
  -- Récupérer le company_id de l'utilisateur
  SELECT company_id INTO v_user_company_id
  FROM users
  WHERE id = auth.uid()
  LIMIT 1;

  IF v_user_company_id IS NULL THEN
    RETURN false;
  END IF;

  -- Récupérer l'ID de la plateforme depuis settings
  SELECT (value#>>'{}')::UUID INTO v_platform_company_id
  FROM settings
  WHERE key = 'platform_company_id'
  LIMIT 1;

  IF v_platform_company_id IS NULL THEN
    RETURN false;
  END IF;

  -- Comparer les UUIDs
  RETURN (v_user_company_id = v_platform_company_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politique : Les utilisateurs plateforme peuvent voir toutes les notifications
CREATE POLICY "Platform users can view all notifications"
ON platform_notifications
FOR SELECT
USING (public.is_platform_user());

-- Politique : Les utilisateurs plateforme peuvent mettre à jour les notifications (marquer comme lues)
CREATE POLICY "Platform users can update notifications"
ON platform_notifications
FOR UPDATE
USING (public.is_platform_user());

-- Commentaires
COMMENT ON TABLE platform_notifications IS 'Notifications pour les utilisateurs de la plateforme (nouvelles inscriptions, leads, etc.)';
COMMENT ON COLUMN platform_notifications.type IS 'Type de notification (new_registration, new_lead, etc.)';
COMMENT ON COLUMN platform_notifications.data IS 'Données supplémentaires au format JSON';
COMMENT ON COLUMN platform_notifications.read IS 'Indique si la notification a été lue';

