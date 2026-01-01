-- ===================================
-- SCRIPT SQL SIMPLIFIÉ
-- Table: subscription_logs
-- ===================================

-- 1. Supprimer la table si elle existe (pour réinitialiser)
DROP TABLE IF EXISTS public.subscription_logs CASCADE;

-- 2. Créer la table
CREATE TABLE public.subscription_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  event_type TEXT NOT NULL,
  subscription_id TEXT,
  company_id UUID,
  user_id UUID,
  
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning', 'info')),
  
  details JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  
  source TEXT DEFAULT 'api',
  ip_address TEXT,
  user_agent TEXT
);

-- 3. Index
CREATE INDEX idx_logs_created_at ON public.subscription_logs(created_at DESC);
CREATE INDEX idx_logs_event_type ON public.subscription_logs(event_type);
CREATE INDEX idx_logs_subscription_id ON public.subscription_logs(subscription_id);
CREATE INDEX idx_logs_company_id ON public.subscription_logs(company_id);
CREATE INDEX idx_logs_status ON public.subscription_logs(status);

-- 4. RLS
ALTER TABLE public.subscription_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins plateforme
CREATE POLICY "admins_can_view_all_logs"
  ON public.subscription_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.company_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

-- Policy: Companies voient leurs logs
CREATE POLICY "companies_view_own_logs"
  ON public.subscription_logs
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.users
      WHERE id = auth.uid()
    )
  );

-- Policy: Service role peut insérer
CREATE POLICY "service_can_insert_logs"
  ON public.subscription_logs
  FOR INSERT
  WITH CHECK (true);

-- ✅ TERMINÉ !
-- Vérification:
SELECT 'Table subscription_logs créée avec succès!' as status;

