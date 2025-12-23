import { createBrowserClient } from '@supabase/ssr'

/**
 * Client Supabase côté client utilisant @supabase/ssr
 * CRITIQUE : Utilise createBrowserClient pour synchroniser les cookies HTTP
 * Cela permet aux API routes de lire les cookies de session
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Utiliser createBrowserClient de @supabase/ssr pour gérer les cookies HTTP
  // Cela synchronise automatiquement localStorage avec les cookies HTTP
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Client Supabase singleton pour éviter de créer plusieurs instances
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export const supabase = typeof window !== 'undefined' 
  ? (supabaseInstance || (supabaseInstance = createClient()))
  : ({} as ReturnType<typeof createBrowserClient>)
