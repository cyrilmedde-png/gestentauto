import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Variables d'environnement - utiliser des valeurs par défaut vides pour éviter les erreurs
const supabaseUrl = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) || ''
const supabaseAnonKey = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) || ''
const supabaseServiceRoleKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || ''

// Vérifier si Supabase est configuré (vérifier que ce ne sont pas des chaînes vides)
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== '' &&
  !supabaseUrl.startsWith('http://placeholder') &&
  !supabaseUrl.startsWith('https://placeholder')
)

// Créer un singleton du client Supabase
let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  // Si le client existe déjà, le retourner (singleton)
  if (supabaseClient) {
    return supabaseClient
  }

  // Si les variables ne sont pas définies, créer un client placeholder
  // Ne JAMAIS lancer d'erreur, juste créer un client qui ne fonctionnera pas
  if (!isSupabaseConfigured) {
    supabaseClient = createClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder',
      { 
        auth: { 
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: () => Promise.reject(new Error('Supabase not configured'))
        }
      }
    ) as SupabaseClient
    
    return supabaseClient
  }

  // Créer le client avec la configuration normale
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: typeof window !== 'undefined',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseClient
}

// Exporter le client singleton (lazy initialization)
// Cette initialisation ne doit JAMAIS lancer d'erreur
export const supabase = getSupabaseClient()

// Client pour les opérations serveur (avec service role key)
export const supabaseAdmin = isSupabaseConfigured && supabaseServiceRoleKey && supabaseServiceRoleKey.trim() !== ''
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null
