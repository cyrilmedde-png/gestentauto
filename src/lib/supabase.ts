import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Créer un singleton du client Supabase
let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  // Si le client existe déjà, le retourner (singleton)
  if (supabaseClient) {
    return supabaseClient
  }

  // Si les variables ne sont pas définies, créer un client avec des valeurs vides
  // Cela permettra au code de se charger sans erreur, mais Supabase ne fonctionnera pas
  if (!supabaseUrl || !supabaseAnonKey) {
    // Créer un client placeholder pour éviter les erreurs
    // Ce client ne fonctionnera pas mais permettra au code de se charger
    supabaseClient = createClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder',
      { 
        auth: { 
          persistSession: typeof window !== 'undefined',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        } 
      }
    ) as SupabaseClient
    
    // Avertissement uniquement côté client pour ne pas polluer les logs serveur
    if (typeof window !== 'undefined') {
      console.warn('⚠️ Supabase environment variables are not configured. Please configure them in Vercel Dashboard.')
    }
    
    return supabaseClient
  }

  // Créer le client avec la configuration normale
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseClient
}

// Exporter le client singleton
export const supabase = getSupabaseClient()

// Client pour les opérations serveur (avec service role key)
export const supabaseAdmin = supabaseServiceRoleKey && supabaseUrl
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null
