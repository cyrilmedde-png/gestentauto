import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Client Supabase - Version robuste qui ne lance JAMAIS d'erreur
 * 
 * Les variables NEXT_PUBLIC_* sont injectées au moment du BUILD par Next.js
 * Si elles ne sont pas configurées sur Vercel au moment du build, elles seront undefined
 */

// Fonction pour obtenir les variables d'environnement de manière sûre
function getEnvVar(name: string): string {
  if (typeof window === 'undefined') {
    // Côté serveur
    return process.env[name] || ''
  } else {
    // Côté client - les variables NEXT_PUBLIC_* sont injectées dans le bundle
    // On utilise une approche qui fonctionne même si undefined
    try {
      // @ts-ignore - process.env peut ne pas être typé correctement côté client
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
// On vérifie que les variables ne sont pas vides et sont des URLs/clés valides
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== '' &&
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey.length > 20 // Les clés Supabase font au moins 100+ caractères
)

// Créer un singleton du client Supabase
let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  // Si le client existe déjà, le retourner
  if (supabaseClient) {
    return supabaseClient
  }

  // Si Supabase n'est pas configuré, créer un client "dummy" qui ne fait rien
  if (!isSupabaseConfigured) {
    // Créer un client avec des valeurs invalides mais qui ne lancera pas d'erreur
    // Ce client retournera toujours des erreurs mais ne plantera pas l'app
    try {
      supabaseClient = createClient(
        'https://not-configured.supabase.co',
        'not-configured-key',
        { 
          auth: { 
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        }
      ) as SupabaseClient
    } catch (error) {
      // Si même la création du client échoue, créer un objet minimal
      // Ce ne sera jamais utilisé car isSupabaseConfigured sera false
      supabaseClient = {} as SupabaseClient
    }
    
    return supabaseClient
  }

  // Créer le client normal avec les vraies variables
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
    // En cas d'erreur, utiliser un client placeholder
    console.error('Error creating Supabase client:', error)
    supabaseClient = createClient(
      'https://not-configured.supabase.co',
      'not-configured-key',
      { auth: { persistSession: false, autoRefreshToken: false } }
    ) as SupabaseClient
  }

  return supabaseClient
}

// Exporter le client - cette ligne ne doit JAMAIS lancer d'erreur
export const supabase = getSupabaseClient()

// Client admin pour le serveur
export const supabaseAdmin = (isSupabaseConfigured && supabaseServiceRoleKey && supabaseServiceRoleKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null
