import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not set')
}

/**
 * Client Supabase tampon pour les opérations CLIENT
 * Utilise la clé anonyme avec le contexte utilisateur client
 * ⚠️ À utiliser UNIQUEMENT dans les routes API client (/api/client/*)
 * 
 * Ce client respecte les RLS policies normales (isolation par company_id)
 */
export function createClientTampon() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not set')
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

