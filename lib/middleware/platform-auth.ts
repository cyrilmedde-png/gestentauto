import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerClient } from '@/lib/supabase/server'

/**
 * Vérifie que l'utilisateur est authentifié (plateforme ou client)
 * À utiliser pour les routes N8N qui doivent être accessibles à tous les utilisateurs authentifiés
 * 
 * @param request - La requête Next.js
 * @returns true si l'utilisateur est authentifié, false sinon
 */
export async function verifyAuthenticatedUser(
  request: NextRequest
): Promise<{ isAuthenticated: boolean; error?: string; userId?: string }> {
  try {
    // Vérifier si on est en mode build (pas de session pendant le build)
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                        process.env.NODE_ENV === 'production' && 
                        !request.headers.get('cookie') && 
                        !request.headers.get('authorization') &&
                        !request.headers.get('x-supabase-auth-token')
    
    // Log pour déboguer (seulement si pas en build)
    const cookieHeader = request.headers.get('cookie') || ''
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || ''
    const tokenHeader = request.headers.get('x-supabase-auth-token') || request.headers.get('X-Supabase-Auth-Token') || ''
    const jwtToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : (tokenHeader || null)
    
    const cookieKeys = cookieHeader 
      ? cookieHeader.split(';').map(c => {
          const equalIndex = c.indexOf('=')
          return equalIndex > 0 ? c.substring(0, equalIndex).trim() : c.trim()
        }).filter(Boolean)
      : []
    
    if (!isBuildTime) {
      console.log('[verifyAuthenticatedUser] 🔍 Checking authentication...', {
        url: request.url,
        hasCookies: !!cookieHeader,
        cookieLength: cookieHeader.length,
        cookieKeys: cookieKeys,
        hasAuthCookie: cookieKeys.some(k => k.includes('auth') || k.includes('supabase')),
        hasJwtToken: !!jwtToken,
        method: request.method,
      })
    }
    
    // Si un token JWT est fourni dans les headers, l'utiliser directement
    if (jwtToken) {
      console.log('[verifyAuthenticatedUser] 🔑 JWT token found in headers, validating it...')
      try {
        // Créer un client Supabase temporaire avec le token JWT dans les headers
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (supabaseUrl && supabaseAnonKey) {
          // CORRECTION : Utiliser le token dans les headers globaux au lieu de setSession
          // setSession nécessite un refresh_token valide, ce qui cause des échecs
          const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
            global: {
              headers: {
                Authorization: `Bearer ${jwtToken}`,
              },
            },
          })
          
          // Appeler getUser() - Supabase devrait utiliser le header Authorization
          const { data: { user }, error: tokenError } = await tempClient.auth.getUser()
          
          if (!tokenError && user) {
            console.log('[verifyAuthenticatedUser] ✅ User authenticated via JWT token:', {
              userId: user.id,
              email: user.email,
            })
            return {
              isAuthenticated: true,
              userId: user.id,
            }
          } else {
            console.warn('[verifyAuthenticatedUser] ⚠️ JWT token invalid, falling back to cookies:', {
              error: tokenError?.message,
              errorCode: tokenError?.status,
              errorName: tokenError?.name,
            })
          }
        }
      } catch (tokenErr) {
        console.warn('[verifyAuthenticatedUser] ⚠️ Error validating JWT token, falling back to cookies:', tokenErr)
      }
    }
    
    // Fallback : utiliser les cookies (méthode normale)
    const supabase = await createServerClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('[verifyAuthenticatedUser] ❌ User not authenticated:', {
        error: authError?.message,
        errorCode: authError?.status,
        errorName: authError?.name,
        errorStatus: authError?.status,
        hasUser: !!user,
        hasCookies: !!cookieHeader,
        cookieKeys: cookieKeys,
        url: request.url,
        method: request.method,
        hasJwtToken: !!jwtToken,
      })
      
      // Si on a un token JWT mais que getUser() échoue, essayer de créer un client avec le token directement
      if (jwtToken && authError) {
        console.log('[verifyAuthenticatedUser] 🔄 Retrying with JWT token directly...')
        try {
          const { createClient } = await import('@supabase/supabase-js')
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          
          if (supabaseUrl && supabaseAnonKey) {
            const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
              auth: {
                persistSession: false,
                autoRefreshToken: false,
              },
              global: {
                headers: {
                  Authorization: `Bearer ${jwtToken}`,
                },
              },
            })
            
            const { data: { user: jwtUser }, error: jwtError } = await tempClient.auth.getUser()
            
            if (!jwtError && jwtUser) {
              console.log('[verifyAuthenticatedUser] ✅ User authenticated via JWT token (retry):', {
                userId: jwtUser.id,
                email: jwtUser.email,
              })
              return {
                isAuthenticated: true,
                userId: jwtUser.id,
              }
            }
          }
        } catch (retryErr) {
          console.warn('[verifyAuthenticatedUser] ⚠️ JWT retry failed:', retryErr)
        }
      }
      
      // Message d'erreur plus détaillé
      let errorMessage = 'Not authenticated. Please log in.'
      if (authError) {
        if (authError.message.includes('JWT') || authError.message.includes('token')) {
          errorMessage = 'Session expired or invalid. Please log in again.'
        } else if (authError.message.includes('cookie')) {
          errorMessage = 'Session cookie missing. Please log in.'
        } else {
          errorMessage = `Authentication error: ${authError.message}`
        }
      }
      
      return {
        isAuthenticated: false,
        error: errorMessage,
      }
    }
    
    console.log('[verifyAuthenticatedUser] ✅ User authenticated:', {
      userId: user.id,
      email: user.email,
      url: request.url,
    })
    
    return {
      isAuthenticated: true,
      userId: user.id,
    }
  } catch (error) {
    console.error('[verifyAuthenticatedUser] ❌ Exception:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url,
      method: request.method,
    })
    return {
      isAuthenticated: false,
      error: error instanceof Error ? error.message : 'Authentication error',
    }
  }
}

/**
 * Middleware pour vérifier que l'utilisateur est un utilisateur plateforme
 * Utilise UNIQUEMENT company_id pour les vérifications d'accès (PAS user_id)
 * À utiliser dans les routes API /api/platform/*
 * 
 * @param request - La requête Next.js
 * @returns true si l'utilisateur est plateforme, false sinon
 */
export async function verifyPlatformUser(
  request: NextRequest
): Promise<{ isPlatform: boolean; error?: string }> {
  try {
    // Vérifier si on est en mode build
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                        process.env.NODE_ENV === 'production' && 
                        !request.headers.get('cookie') && 
                        !request.headers.get('authorization') &&
                        !request.headers.get('x-supabase-auth-token')
    
    // Récupérer l'utilisateur depuis la session Supabase
    const supabase = await createServerClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      // Ne pas logger d'erreurs pendant le build
      if (!isBuildTime) {
        console.error('[verifyPlatformUser] ❌ Session error:', {
          error: authError?.message,
          code: authError?.status,
          hasCookies: !!request.headers.get('cookie'),
        })
      }
      return {
        isPlatform: false,
        error: `Not authenticated. Please log in. ${authError?.message || ''}`,
      }
    }
    
    console.log('[verifyPlatformUser] ✅ User authenticated from session:', {
      email: user.email,
      // userId utilisé uniquement pour récupérer company_id, pas pour vérification
    })
    
    // Utiliser le client admin pour bypasser RLS
    const adminSupabase = createAdminClient()
    
    // Récupérer UNIQUEMENT le company_id de l'utilisateur (PAS l'ID utilisateur pour vérification)
    const { data: userData, error: userError } = await adminSupabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData) {
      console.error('[verifyPlatformUser] ❌ Error fetching user company_id:', {
        error: userError?.message,
        code: userError?.code,
        email: user.email,
      })
      return {
        isPlatform: false,
        error: `User not found in database: ${userError?.message || 'User data is null'}`,
      }
    }
    
    if (!userData.company_id) {
      console.error('[verifyPlatformUser] ❌ User company_id is NULL:', {
        email: user.email,
      })
      return {
        isPlatform: false,
        error: 'User company_id is not set. Please contact administrator.',
      }
    }
    
    const userCompanyId = String(userData.company_id).trim().toLowerCase()
    console.log('[verifyPlatformUser] 🔍 User company_id:', userCompanyId)
    
    // MÉTHODE 1 : Vérifier dans platform_n8n_access par company_id (prioritaire)
    const { data: n8nAccess, error: n8nAccessError } = await adminSupabase
      .from('platform_n8n_access')
      .select('is_platform_admin, has_n8n_access, access_level, company_id')
      .eq('company_id', userData.company_id) // Utiliser company_id, PAS user_id
      .eq('has_n8n_access', true)
      .maybeSingle()
    
    if (n8nAccess && !n8nAccessError) {
      console.log('[verifyPlatformUser] ✅ Company found in platform_n8n_access:', {
        companyId: userCompanyId,
        hasN8nAccess: n8nAccess.has_n8n_access,
        isPlatformAdmin: n8nAccess.is_platform_admin,
        accessLevel: n8nAccess.access_level,
      })
      
      // Vérifier que le company_id correspond à la plateforme
      const { data: platformSetting, error: platformError } = await adminSupabase
        .from('settings')
        .select('value')
        .eq('key', 'platform_company_id')
        .single()
      
      if (platformSetting) {
        let platformCompanyIdValue: string
        if (typeof platformSetting.value === 'string') {
          platformCompanyIdValue = platformSetting.value.trim().toLowerCase()
        } else {
          const jsonStr = JSON.stringify(platformSetting.value)
          platformCompanyIdValue = jsonStr.replace(/^"|"$/g, '').trim().toLowerCase()
        }
        
        if (userCompanyId === platformCompanyIdValue) {
          console.log('[verifyPlatformUser] ✅✅✅ Company is platform (platform_n8n_access + company_id match):', {
            companyId: userCompanyId,
          })
          return { isPlatform: true }
        }
      }
    }
    
    // MÉTHODE 2 : Fallback - Comparaison directe avec platform_company_id
    const { data: platformSetting, error: platformError } = await adminSupabase
      .from('settings')
      .select('value')
      .eq('key', 'platform_company_id')
      .limit(1)
      .single()
    
    if (platformError || !platformSetting) {
      console.error('[verifyPlatformUser] ❌ platform_company_id not found in settings:', {
        error: platformError?.message,
        errorCode: platformError?.code,
      })
      return {
        isPlatform: false,
        error: 'Platform not configured - platform_company_id missing in settings',
      }
    }
    
    // Extraire la valeur du JSONB
    let platformCompanyIdValue: string
    if (typeof platformSetting.value === 'string') {
      platformCompanyIdValue = platformSetting.value.trim().toLowerCase()
    } else {
      try {
        const jsonStr = JSON.stringify(platformSetting.value)
        platformCompanyIdValue = jsonStr.replace(/^"|"$/g, '').trim().toLowerCase()
      } catch (e) {
        platformCompanyIdValue = String(platformSetting.value).trim().toLowerCase()
      }
    }
    
    // Comparaison directe : user.company_id === platform_company_id
    console.log('[verifyPlatformUser] 🔍 Platform check (company_id comparison):', {
      userCompanyId: userCompanyId,
      platformCompanyId: platformCompanyIdValue,
      match: userCompanyId === platformCompanyIdValue,
    })
    
    const isPlatform = userCompanyId === platformCompanyIdValue
    
    if (isPlatform) {
      console.log('[verifyPlatformUser] ✅✅✅ Company is platform (company_id match):', {
        companyId: userCompanyId,
      })
      return { isPlatform: true }
    }
    
    // Si pas plateforme, retourner false avec détails
    console.warn('[verifyPlatformUser] ❌ Company is NOT platform:', {
      userCompanyId: userCompanyId,
      platformCompanyId: platformCompanyIdValue,
    })
    
    return {
      isPlatform: false,
      error: `Company (${userCompanyId}) does not match platform_company_id (${platformCompanyIdValue})`
    }
  } catch (error) {
    console.error('[verifyPlatformUser] ❌ Exception:', error)
    return {
      isPlatform: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Helper pour créer une réponse d'erreur 403
 */
export function createForbiddenResponse(message: string = 'Access denied. Platform user required.') {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  )
}

