import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Récupère les variables d'environnement de manière sûre
 */
function getEnvVar(name: string): string {
  if (typeof window === 'undefined') {
    // Côté serveur
    return process.env[name] || ''
  } else {
    // Côté client - les variables NEXT_PUBLIC_* sont injectées dans le bundle
    return (process.env[name] || '')
  }
}

// Variables d'environnement
const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const supabaseServiceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY')

// Vérifier si Supabase est configuré avec des valeurs VALIDES
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey.trim() !== '' &&
  supabaseUrl.length > 20 &&
  supabaseAnonKey.length > 50 &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('not-configured') &&
  !supabaseUrl.includes('votre-projet') &&
  supabaseUrl.includes('.supabase.co')
)

/**
 * Mock client complet qui ne fait JAMAIS de requêtes réseau
 * Toutes les méthodes retournent des Promises résolues immédiatement
 * avec des erreurs explicites
 */
function createMockClient(): SupabaseClient {
  const errorMessage = 'Supabase non configuré. Configurez les variables d\'environnement NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sur Vercel.'
  const mockError = { message: errorMessage, status: 0, statusCode: 0 } as any
  
  // Créer un objet mock qui intercepte TOUS les appels
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
    } as any,
    from: () => mockQuery as any,
    rpc: async () => ({ data: null, error: mockError }),
  } as unknown as SupabaseClient
}

// Singleton du client
let supabaseClient: SupabaseClient | null = null

/**
 * Obtient le client Supabase - version sécurisée
 * Ne crée JAMAIS un vrai client si Supabase n'est pas configuré
 */
function getSupabaseClient(): SupabaseClient {
  // Si le client existe déjà, le retourner
  if (supabaseClient) {
    return supabaseClient
  }

  // Si Supabase n'est PAS configuré, retourner IMMÉDIATEMENT le mock
  // SANS JAMAIS appeler createClient()
  if (!isSupabaseConfigured) {
    supabaseClient = createMockClient()
    return supabaseClient
  }

  // Ici, Supabase EST configuré, on peut créer le vrai client
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: typeof window !== 'undefined',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  } catch (error) {
    // En cas d'erreur lors de la création, utiliser le mock
    console.error('Erreur lors de la création du client Supabase:', error)
    supabaseClient = createMockClient()
  }

  return supabaseClient
}

// Exporter le client - cette initialisation ne doit jamais lancer d'erreur
export const supabase = getSupabaseClient()

// Client admin pour le serveur (seulement si configuré)
export const supabaseAdmin =
  isSupabaseConfigured && supabaseServiceRoleKey && supabaseServiceRoleKey.trim() !== '' && supabaseServiceRoleKey.length > 50
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null
