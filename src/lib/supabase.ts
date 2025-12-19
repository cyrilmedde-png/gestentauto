import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Récupérer les variables d'environnement directement
// Les variables NEXT_PUBLIC_* sont disponibles côté client après le build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Vérifier si Supabase est configuré (URL valide et clé assez longue)
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.length > 10 &&
  supabaseAnonKey.length > 50 &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('not-configured')
)

// Singleton du client
let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient
  }

  if (!isSupabaseConfigured) {
    // Créer un mock qui ne fait JAMAIS de requêtes réseau
    // Toutes les méthodes retournent une erreur claire
    const mockClient = {
      auth: {
        getSession: async () => ({
          data: { session: null },
          error: { message: 'Supabase non configuré. Configurez les variables d\'environnement sur Vercel.' } as any,
        }),
        getUser: async () => ({
          data: { user: null },
          error: { message: 'Supabase non configuré. Configurez les variables d\'environnement sur Vercel.' } as any,
        }),
        signInWithPassword: async () => ({
          data: null,
          error: { message: 'Supabase non configuré. Configurez les variables d\'environnement sur Vercel.' } as any,
        }),
        signUp: async () => ({
          data: null,
          error: { message: 'Supabase non configuré. Configurez les variables d\'environnement sur Vercel.' } as any,
        }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } },
        }),
      },
    } as unknown as SupabaseClient

    supabaseClient = mockClient
    return supabaseClient
  }

  // Créer le vrai client seulement si configuré
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

export const supabase = getSupabaseClient()

export const supabaseAdmin =
  isSupabaseConfigured && supabaseServiceRoleKey && supabaseServiceRoleKey.length > 50
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null
