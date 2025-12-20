import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase pour les opérations PLATEFORME
 * Utilise le service role key pour avoir accès à toutes les données
 * ⚠️ À utiliser UNIQUEMENT dans les routes API plateforme (/api/platform/*)
 */
export function createPlatformClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase environment variables are not set')
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

