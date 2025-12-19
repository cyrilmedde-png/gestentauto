/**
 * Client Supabase - Version complètement isolée pour éviter TOUTES les requêtes réseau
 * si Supabase n'est pas configuré
 */

// Types locaux pour éviter d'importer @supabase/supabase-js
export type SupabaseClient = any
export type User = {
  id: string
  email?: string
  [key: string]: any
}
export type Session = {
  user: User | null
  access_token?: string
  refresh_token?: string
  [key: string]: any
}

/**
 * Récupère les variables d'environnement de manière sûre
 */
function getEnvVar(name: string): string {
  if (typeof window === 'undefined') {
    return process.env[name] || ''
  } else {
    return (process.env[name] || '')
  }
}

// Variables d'environnement
const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const supabaseServiceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY')

/**
 * Valide que l'URL Supabase est vraiment valide
 */
function isValidSupabaseUrl(url: string): boolean {
  if (!url || url.trim() === '') return false
  try {
    const urlObj = new URL(url)
    return (
      urlObj.protocol === 'https:' &&
      urlObj.hostname.includes('.supabase.co') &&
      urlObj.hostname.length > 15 &&
      !urlObj.hostname.includes('placeholder') &&
      !urlObj.hostname.includes('votre-projet') &&
      !urlObj.hostname.includes('example')
    )
  } catch {
    return false
  }
}

/**
 * Valide que la clé Supabase est vraiment valide
 */
function isValidSupabaseKey(key: string): boolean {
  if (!key || key.trim() === '') return false
  return key.length > 100 && !key.includes('placeholder') && !key.includes('votre')
}

// Vérifier si Supabase est configuré avec des valeurs VALIDES
export const isSupabaseConfigured = Boolean(
  isValidSupabaseUrl(supabaseUrl) &&
  isValidSupabaseKey(supabaseAnonKey)
)

/**
 * Mock client complet qui ne fait JAMAIS de requêtes réseau
 */
function createMockClient(): SupabaseClient {
  const errorMessage = 'Supabase non configuré. Configurez les variables d\'environnement NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sur Vercel.'
  const mockError = { message: errorMessage, status: 0, statusCode: 0 }
  
  const mockQuery = {
    select: () => mockQuery,
    insert: () => mockQuery,
    update: () => mockQuery,
    delete: () => mockQuery,
    eq: () => mockQuery,
    neq: () => mockQuery,
    gt: () => mockQuery,
    gte: () => mockQuery,
    lt: () => mockQuery,
    lte: () => mockQuery,
    like: () => mockQuery,
    ilike: () => mockQuery,
    is: () => mockQuery,
    in: () => mockQuery,
    contains: () => mockQuery,
    maybeSingle: async () => ({ data: null, error: mockError }),
    single: async () => ({ data: null, error: mockError }),
  }
  
  return {
    auth: {
      getSession: async () => Promise.resolve({
        data: { session: null },
        error: mockError,
      }),
      getUser: async () => Promise.resolve({
        data: { user: null },
        error: mockError,
      }),
      signInWithPassword: async () => Promise.resolve({
        data: null,
        error: mockError,
      }),
      signUp: async () => Promise.resolve({
        data: null,
        error: mockError,
      }),
      signOut: async () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
        error: null,
      }),
      verifyOtp: async () => Promise.resolve({
        data: null,
        error: mockError,
      }),
    },
    from: () => mockQuery,
    rpc: async () => ({ data: null, error: mockError }),
  }
}

// Singleton du client
let supabaseClient: SupabaseClient | null = null

/**
 * Obtient le client Supabase - version sécurisée
 * Si Supabase n'est pas configuré, retourne TOUJOURS le mock
 */
function getSupabaseClient(): SupabaseClient {
  // Si Supabase n'est PAS configuré, retourner IMMÉDIATEMENT le mock
  if (!isSupabaseConfigured) {
    if (!supabaseClient) {
      supabaseClient = createMockClient()
    }
    return supabaseClient
  }

  // Si le client existe déjà, le retourner
  if (supabaseClient) {
    return supabaseClient
  }

  // Si configuré, créer le mock temporairement
  supabaseClient = createMockClient()
  
  // IMPORTANT : Vérifier isSupabaseConfigured AVANT l'import dynamique
  // Charger le vrai client en arrière-plan SEULEMENT si configuré
  if (typeof window !== 'undefined' && isSupabaseConfigured && supabaseUrl && supabaseAnonKey) {
    import('@supabase/supabase-js').then(({ createClient }) => {
      try {
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: true,
            storage: window.localStorage,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        })
      } catch (error) {
        // En cas d'erreur, garder le mock
        console.error('Erreur création client Supabase:', error)
      }
    }).catch(() => {
      // Si l'import échoue, garder le mock
    })
  }

  return supabaseClient
}

// Exporter le client - version synchrone
export const supabase = getSupabaseClient()

// Client admin pour le serveur
export const supabaseAdmin = null
