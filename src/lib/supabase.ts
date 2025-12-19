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
    // Au moment du build SSG (process.env.NODE_ENV === 'production' et pas de window),
    // créer un client mock pour permettre le build sans erreur
    // Les variables seront disponibles au runtime sur Vercel
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      // Côté serveur/build : créer un client avec des valeurs placeholder
      // Ce client ne sera jamais utilisé au runtime, seulement pour permettre le build
      supabaseClient = createClient(
        'https://placeholder.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder',
        { auth: { persistSession: false, autoRefreshToken: false } }
      ) as SupabaseClient
      return supabaseClient
    }
    // Au runtime (client-side ou serveur avec variables), lancer une erreur si manquant
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
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

