-- ===================================
-- TABLE: subscription_logs
-- Logs centralisés des événements abonnements
-- ===================================

-- 1. Créer la table
CREATE TABLE IF NOT EXISTS public.subscription_logs (
  id UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Identification
  event_type TEXT NOT NULL, -- 'subscription_created', 'payment_succeeded', 'payment_failed', etc.
  subscription_id TEXT, -- Stripe subscription ID
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning', 'info')),
  
  -- Détails
  details JSONB DEFAULT '{}'::jsonb, -- Données complètes de l'événement
  error_message TEXT, -- Si erreur
  
  -- Métadonnées
  source TEXT DEFAULT 'api', -- 'api', 'webhook', 'cron', 'n8n'
  ip_address TEXT,
  user_agent TEXT,
  
  -- Contrainte clé primaire
  CONSTRAINT subscription_logs_pkey PRIMARY KEY (id)
);

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_subscription_logs_created_at 
  ON public.subscription_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_logs_event_type 
  ON public.subscription_logs(event_type);

CREATE INDEX IF NOT EXISTS idx_subscription_logs_subscription_id 
  ON public.subscription_logs(subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_logs_company_id 
  ON public.subscription_logs(company_id);

CREATE INDEX IF NOT EXISTS idx_subscription_logs_status 
  ON public.subscription_logs(status);

CREATE INDEX IF NOT EXISTS idx_subscription_logs_details 
  ON public.subscription_logs USING gin(details);

-- 3. RLS Policies
ALTER TABLE public.subscription_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins plateforme peuvent tout voir
CREATE POLICY "Admins plateforme peuvent voir tous les logs"
  ON public.subscription_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.company_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

-- Policy: Companies peuvent voir leurs propres logs
CREATE POLICY "Companies voient leurs logs"
  ON public.subscription_logs
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.users
      WHERE id = auth.uid()
    )
  );

-- Policy: Service role peut tout insérer
CREATE POLICY "Service role peut insérer logs"
  ON public.subscription_logs
  FOR INSERT
  WITH CHECK (true);

-- 4. Vue pour statistiques rapides
CREATE OR REPLACE VIEW subscription_logs_stats AS
SELECT
  DATE(created_at) as date,
  event_type,
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count
FROM public.subscription_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), event_type, status
ORDER BY date DESC, event_type;

-- 5. Function pour nettoyer vieux logs (> 90 jours)
CREATE OR REPLACE FUNCTION clean_old_subscription_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.subscription_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Exemples de requêtes utiles

-- Logs des dernières 24h
-- SELECT * FROM subscription_logs 
-- WHERE created_at >= NOW() - INTERVAL '24 hours'
-- ORDER BY created_at DESC;

-- Compter erreurs par type
-- SELECT event_type, COUNT(*) as error_count
-- FROM subscription_logs
-- WHERE status = 'error'
-- AND created_at >= NOW() - INTERVAL '7 days'
-- GROUP BY event_type
-- ORDER BY error_count DESC;

-- Logs d'un abonnement spécifique
-- SELECT * FROM subscription_logs
-- WHERE subscription_id = 'sub_xxxxx'
-- ORDER BY created_at DESC;

-- Stats quotidiennes
-- SELECT * FROM subscription_logs_stats
-- ORDER BY date DESC
-- LIMIT 30;

-- ✅ MIGRATION TERMINÉE !

