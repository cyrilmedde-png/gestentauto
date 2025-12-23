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
          
          // Log pour déboguer (seulement en développement ou si cookie auth recherché)
          if (name.includes('auth') || name.includes('token') || name.includes('supabase')) {
            console.log('[createServerClient] Cookie lookup:', {
              requestedName: name,
              found: !!cookies[name],
              allCookieKeys: Object.keys(cookies),
              cookiePreview: cookies[name] ? cookies[name].substring(0, 50) + '...' : 'not found',
              cookieHeaderLength: cookieHeader.length,
            })
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

