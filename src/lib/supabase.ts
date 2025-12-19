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
  // Les clés Supabase sont généralement très longues (base64)
  return key.length > 100 && !key.includes('placeholder') && !key.includes('votre')
}

// Vérifier si Supabase est configuré avec des valeurs VALIDES
export const isSupabaseConfigured = Boolean(
  isValidSupabaseUrl(supabaseUrl) &&
  isValidSupabaseKey(supabaseAnonKey)
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
  // Double vérification pour être absolument sûr que les valeurs sont valides
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.trim() === '' || supabaseAnonKey.trim() === '') {
    supabaseClient = createMockClient()
    return supabaseClient
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: typeof window !== 'undefined',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        // Désactiver les fetch automatiques si jamais quelque chose essaie de se connecter
        fetch: typeof window !== 'undefined' ? window.fetch : undefined,
      },
    })
  } catch (error) {
    // En cas d'erreur lors de la création, utiliser le mock
    if (process.env.NODE_ENV === 'development') {
      console.error('Erreur lors de la création du client Supabase:', error)
    }
    supabaseClient = createMockClient()
  }

  return supabaseClient
}

// Exporter le client - cette initialisation ne doit jamais lancer d'erreur
export const supabase = getSupabaseClient()

// Client admin pour le serveur (seulement si configuré ET toutes les valeurs sont valides)
export const supabaseAdmin = (() => {
  if (!isSupabaseConfigured) {
    return null
  }
  if (!supabaseServiceRoleKey || supabaseServiceRoleKey.trim() === '' || supabaseServiceRoleKey.length < 50) {
    return null
  }
  try {
    return createClient(supabaseUrl, supabaseServiceRoleKey)
  } catch {
    return null
  }
})()
