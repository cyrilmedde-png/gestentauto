import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * Client Supabase pour les Server Components et API Routes
 * Utilise @supabase/ssr pour gérer correctement les cookies de session
 */
export async function createServerClient(request?: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not set')
  }

  // Pour les API Routes (request fourni)
  if (request) {
    return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          const cookieHeader = request.headers.get('cookie') || ''
          // Améliorer le parsing pour gérer les valeurs avec '=' (comme les JWT)
          const cookies: Record<string, string> = {}
          cookieHeader.split(';').forEach(cookie => {
            const trimmed = cookie.trim()
            const equalIndex = trimmed.indexOf('=')
            if (equalIndex > 0) {
              const key = trimmed.substring(0, equalIndex).trim()
              const value = trimmed.substring(equalIndex + 1).trim()
              if (key && value) {
                try {
                  cookies[key] = decodeURIComponent(value)
                } catch {
                  // Si decodeURIComponent échoue, utiliser la valeur brute
                  cookies[key] = value
                }
              }
            }
          })
          
          // Log seulement pour le cookie principal (sans suffixe .0, .1, etc.)
          // Ignorer les cookies fragmentés qui n'existent pas (normal)
          const isMainCookie = !name.match(/\.\d+$/) // Pas de suffixe .0, .1, etc.
          const isAuthCookie = name.includes('auth') || name.includes('token') || name.includes('supabase')
          const cookieFound = !!cookies[name]
          
          // Logger seulement le cookie principal :
          // - En développement : toujours
          // - En production : seulement si non trouvé (erreur)
          if (isAuthCookie && isMainCookie) {
            const shouldLog = process.env.NODE_ENV === 'development' || !cookieFound
            if (shouldLog) {
              console.log('[createServerClient] Cookie lookup:', {
                requestedName: name,
                found: cookieFound,
                cookiePreview: cookieFound ? cookies[name].substring(0, 50) + '...' : 'not found',
              })
            }
          }
          
          return cookies[name] || undefined
        },
        set() {
          // Read-only dans les API routes (on ne modifie pas les cookies dans les réponses API)
        },
        remove() {
          // Read-only dans les API routes
        },
      },
    })
  }

  // Pour les Server Components (pas de request)
  const cookieStore = await cookies()
  
  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set(name, value, options)
        } catch (error) {
          // Erreur attendue dans certains contextes (par exemple si les cookies sont déjà envoyés)
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        } catch (error) {
          // Erreur attendue dans certains contextes
        }
      },
    },
  })
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

