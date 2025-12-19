import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Vérifier si Supabase est configuré
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.length > 10 &&
  supabaseAnonKey.length > 50 &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('not-configured')
)

// Mock client complet qui ne fait JAMAIS de requêtes réseau
function createMockClient(): SupabaseClient {
  const errorMessage = 'Supabase non configuré. Configurez les variables d\'environnement sur Vercel.'
  
  return {
    auth: {
      getSession: async () => ({
        data: { session: null },
        error: { message: errorMessage } as any,
      }),
      getUser: async () => ({
        data: { user: null },
        error: { message: errorMessage } as any,
      }),
      signInWithPassword: async () => ({
        data: null,
        error: { message: errorMessage } as any,
      }),
      signUp: async () => ({
        data: null,
        error: { message: errorMessage } as any,
      }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: null,
            error: { message: errorMessage } as any,
          }),
          single: async () => ({
            data: null,
            error: { message: errorMessage } as any,
          }),
        }),
        maybeSingle: async () => ({
          data: null,
          error: { message: errorMessage } as any,
        }),
        single: async () => ({
          data: null,
          error: { message: errorMessage } as any,
        }),
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({
            data: null,
            error: { message: errorMessage } as any,
          }),
        }),
      }),
      delete: () => ({
        eq: async () => ({
          data: null,
          error: { message: errorMessage } as any,
        }),
      }),
      update: () => ({
        eq: async () => ({
          data: null,
          error: { message: errorMessage } as any,
        }),
      }),
    }),
  } as unknown as SupabaseClient
}

// Singleton du client
let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient
  }

  if (!isSupabaseConfigured) {
    supabaseClient = createMockClient()
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
