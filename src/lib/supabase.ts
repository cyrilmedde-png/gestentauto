import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Créer un singleton du client Supabase pour éviter les recréations
let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  // Si le client existe déjà, le retourner (singleton)
  if (supabaseClient) {
    return supabaseClient
  }

  // Créer le client avec la configuration de persistance
  // Ne pas spécifier storageKey pour utiliser la clé par défaut de Supabase
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true, // Activer la persistance de session
      storage: typeof window !== 'undefined' ? window.localStorage : undefined, // Utiliser localStorage côté client
      autoRefreshToken: true, // Rafraîchir automatiquement les tokens
      detectSessionInUrl: true, // Détecter les sessions dans l'URL (pour les callbacks)
    },
  })

  return supabaseClient
}

// Exporter le client singleton
export const supabase = getSupabaseClient()

// Client pour les opérations serveur (avec service role key)
// Utilisé uniquement côté serveur
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null

