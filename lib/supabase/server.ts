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
          const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, ...valueParts] = cookie.trim().split('=')
            if (key && valueParts.length > 0) {
              acc[key] = decodeURIComponent(valueParts.join('='))
            }
            return acc
          }, {} as Record<string, string>)
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

