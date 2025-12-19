import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Variables d'environnement (peuvent être undefined au moment du build SSG)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Créer un singleton du client Supabase pour éviter les recréations
let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  // Si le client existe déjà, le retourner (singleton)
  if (supabaseClient) {
    return supabaseClient
  }

  // Vérifier que les variables d'environnement sont définies
  if (!supabaseUrl || !supabaseAnonKey) {
    // Si les variables ne sont pas disponibles (build ou runtime sans config),
    // créer un client placeholder pour éviter les erreurs
    // Note: Ce client ne fonctionnera pas, mais permettra au code de se charger
    // L'utilisateur devra configurer les variables dans Vercel Dashboard
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
    // Log un avertissement en console (pas d'erreur qui bloque)
    if (typeof window !== 'undefined') {
      console.warn('⚠️ Supabase environment variables are not configured. Please configure them in Vercel Dashboard.')
    }
    return supabaseClient
  }

  // Créer le client avec la configuration de persistance
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

// Exporter le client singleton (lazy initialization lors du build SSG)
export const supabase = getSupabaseClient()

// Client pour les opérations serveur (avec service role key)
// Utilisé uniquement côté serveur
export const supabaseAdmin = supabaseServiceRoleKey && supabaseUrl
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null

