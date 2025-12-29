-- ============================================================================
-- Migration: Système d'inscription automatique avec notifications admin
-- Date: 2025-01-29
-- Description: Ajoute le système de changement de mot de passe obligatoire
--              et les notifications pour les admins
-- ============================================================================

-- 1. Ajouter le champ password_change_required à la table users
-- ----------------------------------------------------------------------------
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_change_required BOOLEAN DEFAULT FALSE;

-- 2. Créer la table notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer des index pour optimiser les performances
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
  ON notifications(created_at DESC);

-- 4. Activer Row Level Security (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 5. Créer les policies RLS pour notifications
-- ----------------------------------------------------------------------------

-- Policy: Les utilisateurs peuvent lire leurs propres notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres notifications
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Le système peut créer des notifications (via service role)
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

-- 6. Créer une fonction pour nettoyer les anciennes notifications
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND read = true;
END;
$$;

-- 7. Ajouter des commentaires pour la documentation
-- ----------------------------------------------------------------------------
COMMENT ON TABLE notifications IS 
  'Table pour stocker les notifications des utilisateurs';

COMMENT ON COLUMN notifications.id IS 
  'Identifiant unique de la notification';

COMMENT ON COLUMN notifications.user_id IS 
  'ID de l''utilisateur destinataire de la notification';

COMMENT ON COLUMN notifications.type IS 
  'Type de notification: new_registration, new_lead, etc.';

COMMENT ON COLUMN notifications.title IS 
  'Titre de la notification';

COMMENT ON COLUMN notifications.message IS 
  'Message de la notification';

COMMENT ON COLUMN notifications.data IS 
  'Données JSON supplémentaires associées à la notification';

COMMENT ON COLUMN notifications.read IS 
  'Indique si la notification a été lue par l''utilisateur';

COMMENT ON COLUMN notifications.created_at IS 
  'Date et heure de création de la notification';

COMMENT ON COLUMN users.password_change_required IS 
  'Indique si l''utilisateur doit changer son mot de passe à la prochaine connexion';

-- 8. Afficher un message de succès
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN 
  RAISE NOTICE 'Migration terminée avec succès !';
  RAISE NOTICE 'Table notifications créée';
  RAISE NOTICE 'Champ password_change_required ajouté à users';
  RAISE NOTICE 'Policies RLS configurées';
END $$;

