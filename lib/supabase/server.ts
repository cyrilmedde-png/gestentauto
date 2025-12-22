import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * Client Supabase pour les Server Components et API Routes
 * Récupère automatiquement les cookies pour la session
 */
export async function createServerClient(request?: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not set')
  }

  // Récupérer les cookies
  let cookieHeader = ''
  if (request) {
    // Dans les API Routes, utiliser les cookies de la requête
    cookieHeader = request.headers.get('cookie') || ''
  } else {
    // Dans les Server Components, utiliser next/headers
    const cookieStore = await cookies()
    cookieHeader = cookieStore.toString()
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    },
  })

  // Si on a des cookies, essayer de récupérer la session
  if (cookieHeader) {
    // Extraire le token depuis les cookies Supabase
    const cookiesArray = cookieHeader.split(';').map(c => c.trim())
    const accessTokenCookie = cookiesArray.find(c => c.startsWith('sb-') && c.includes('auth-token'))
    
    if (accessTokenCookie) {
      try {
        // Les cookies Supabase sont généralement au format: sb-<project-ref>-auth-token=<token>
        const tokenMatch = cookieHeader.match(/sb-[^-]+-auth-token=([^;]+)/)
        if (tokenMatch) {
          // Essayer de récupérer la session depuis le token
          const { data: { session } } = await client.auth.getSession()
          if (session) {
            // La session est déjà disponible
            return client
          }
        }
      } catch (e) {
        // Ignorer les erreurs de parsing
      }
    }
  }

  return client
}

/**
 * Client Supabase avec Service Role Key pour les opérations admin
 * ⚠️ À utiliser uniquement dans les API Routes, jamais côté client
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase environment variables are not set')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

