import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Client Supabase - Version finale qui fonctionne correctement
 */

// Fonction pour obtenir les variables d'environnement de manière sûre
function getEnvVar(name: string): string {
  if (typeof window === 'undefined') {
    // Côté serveur
    return process.env[name] || ''
  } else {
    // Côté client - les variables NEXT_PUBLIC_* sont injectées dans le bundle
    try {
      return (typeof process !== 'undefined' && process.env && process.env[name]) || ''
    } catch {
      return ''
    }
  }
}

// Récupérer les variables d'environnement
const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const supabaseServiceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY')

// Vérifier si Supabase est configuré
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== '' &&
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey.length > 20
)

// Créer un singleton du client Supabase
let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  // Si le client existe déjà, le retourner
  if (supabaseClient) {
    return supabaseClient
  }

  // Si Supabase n'est pas configuré, ne pas créer de client qui fera des requêtes réseau
  // Retourner un objet mock qui retourne toujours des erreurs
  if (!isSupabaseConfigured) {
    // Créer un objet mock qui imite l'interface SupabaseClient
    // mais ne fera jamais de requêtes réseau
    const mockClient = {
      auth: {
        getSession: async () => ({ 
          data: { session: null }, 
          error: { message: 'Supabase not configured' } as any 
        }),
        getUser: async () => ({ 
          data: { user: null }, 
          error: { message: 'Supabase not configured' } as any 
        }),
        signInWithPassword: async () => ({ 
          data: null, 
          error: { message: 'Supabase not configured. Please configure environment variables on Vercel.' } as any 
        }),
        signUp: async () => ({ 
          data: null, 
          error: { message: 'Supabase not configured. Please configure environment variables on Vercel.' } as any 
        }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ 
          data: { subscription: { unsubscribe: () => {} } } 
        }),
      }
    } as any as SupabaseClient
    
    supabaseClient = mockClient
    return supabaseClient
  }

  // Créer le client normal avec les vraies variables
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

// Exporter le client - cette initialisation ne doit jamais lancer d'erreur
export const supabase = getSupabaseClient()

// Client admin pour le serveur
export const supabaseAdmin = (isSupabaseConfigured && supabaseServiceRoleKey && supabaseServiceRoleKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null
