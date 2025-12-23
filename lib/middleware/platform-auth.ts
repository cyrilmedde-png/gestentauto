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
    // Log pour déboguer
    const cookieHeader = request.headers.get('cookie') || ''
    console.log('[verifyAuthenticatedUser] Checking authentication...', {
      hasCookies: !!cookieHeader,
      cookieLength: cookieHeader.length,
      cookiePreview: cookieHeader.substring(0, 200) + (cookieHeader.length > 200 ? '...' : ''),
      url: request.url,
    })
    
    const supabase = await createServerClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('[verifyAuthenticatedUser] ❌ User not authenticated:', {
        error: authError?.message,
        errorCode: authError?.status,
        errorName: authError?.name,
        hasUser: !!user,
        hasCookies: !!cookieHeader,
        cookieKeys: cookieHeader ? cookieHeader.split(';').map(c => c.split('=')[0].trim()).filter(Boolean) : [],
      })
      return {
        isAuthenticated: false,
        error: authError?.message || 'Not authenticated. Please log in.',
      }
    }
    
    console.log('[verifyAuthenticatedUser] ✅ User authenticated:', {
      userId: user.id,
      email: user.email,
    })
    
    return {
      isAuthenticated: true,
      userId: user.id,
    }
  } catch (error) {
    console.error('[verifyAuthenticatedUser] ❌ Error:', error)
    return {
      isAuthenticated: false,
      error: error instanceof Error ? error.message : 'Authentication error',
    }
  }
}

/**
 * Middleware pour vérifier que l'utilisateur est un utilisateur plateforme
 * À utiliser dans les routes API /api/platform/*
 * 
 * @param request - La requête Next.js
 * @param userId - L'ID de l'utilisateur (depuis header ou body, optionnel)
 * @returns true si l'utilisateur est plateforme, false sinon
 */
export async function verifyPlatformUser(
  request: NextRequest,
  userId?: string
): Promise<{ isPlatform: boolean; error?: string }> {
  try {
    // Fonction helper pour nettoyer le userId
    const cleanUserId = (id: string | null | undefined): string | undefined => {
      if (!id) return undefined
      // Nettoyer les query params, fragments et caractères invalides
      let cleaned = id.split('?')[0].split('&')[0].split('#')[0].trim()
      // Vérifier format UUID basique
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleaned)) {
        console.error('[verifyPlatformUser] Invalid UUID format after cleanup:', { original: id, cleaned })
        return undefined
      }
      return cleaned
    }

    // Récupérer l'ID utilisateur depuis le header ou le body
    let finalUserId = cleanUserId(userId || request.headers.get('X-User-Id'))

    if (!finalUserId) {
      // Essayer de récupérer depuis le body (pour POST/PATCH)
      try {
        const body = await request.clone().json()
        finalUserId = cleanUserId(body.userId)
      } catch {
        // Si le body n'est pas JSON ou vide, continuer
      }
    }

    // Si aucun ID n'est fourni, essayer de récupérer depuis le cookie n8n_userId (pour iframe N8N)
    if (!finalUserId) {
      const cookieHeader = request.headers.get('cookie') || ''
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, ...valueParts] = cookie.trim().split('=')
        if (key && valueParts.length > 0) {
          acc[key.trim()] = decodeURIComponent(valueParts.join('='))
        }
        return acc
      }, {} as Record<string, string>)
      
      // Chercher n8n_userId (camelCase) ou n8n_userid (minuscule)
      finalUserId = cleanUserId(cookies['n8n_userId'] || cookies['n8n_userid'])
      
      // Log pour déboguer
      if (cookies['n8n_userId'] || cookies['n8n_userid']) {
        console.log('[verifyPlatformUser] Raw cookie value:', {
          n8n_userId: cookies['n8n_userId'],
          n8n_userid: cookies['n8n_userid'],
          cleaned: finalUserId
        })
      }
    }
    
    // Log final pour déboguer
    console.log('[verifyPlatformUser] Final userId after all cleanup:', {
      original: userId,
      fromHeader: request.headers.get('X-User-Id'),
      final: finalUserId,
      requestUrl: request.url
    })

    // Si aucun ID n'est fourni, essayer de récupérer depuis les cookies (session Supabase)
    if (!finalUserId) {
      try {
        const supabase = await createServerClient(request)
        
        // Log pour déboguer
        const cookieHeader = request.headers.get('cookie') || ''
        console.log('[verifyPlatformUser] Attempting to get user from session...', {
          hasCookies: !!cookieHeader,
          cookieLength: cookieHeader.length,
          cookiePreview: cookieHeader.substring(0, 150) + (cookieHeader.length > 150 ? '...' : ''),
          requestUrl: request.url,
        })
        
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        console.log('[verifyPlatformUser] Session check result:', {
          hasUser: !!user,
          userId: user?.id,
          userEmail: user?.email,
          authError: authError?.message,
          authErrorCode: authError?.status,
          authErrorName: authError?.name,
        })
        
        if (authError || !user) {
          console.error('[verifyPlatformUser] ❌ Session error:', {
            error: authError?.message,
            code: authError?.status,
            name: authError?.name,
            hasCookies: !!cookieHeader,
            cookieKeys: cookieHeader ? cookieHeader.split(';').map(c => c.split('=')[0].trim()).filter(Boolean) : [],
          })
          return {
            isPlatform: false,
            error: `Not authenticated. Please log in. ${authError?.message || ''}`,
          }
        }
        
        finalUserId = user.id
        console.log('[verifyPlatformUser] ✅ User ID retrieved from session:', finalUserId)
      } catch (sessionError) {
        console.error('[verifyPlatformUser] ❌ Session exception:', {
          error: sessionError instanceof Error ? sessionError.message : String(sessionError),
          stack: sessionError instanceof Error ? sessionError.stack : undefined,
        })
        return {
          isPlatform: false,
          error: 'Could not retrieve user session. Please provide X-User-Id header or log in.',
        }
      }
    }

    if (!finalUserId) {
      return {
        isPlatform: false,
        error: 'User ID is required. Please provide X-User-Id header, userId in request body, or log in.',
      }
    }

    // MÉTHODE PRINCIPALE : Vérification manuelle (plus fiable dans les routes API)
    console.log('[verifyPlatformUser] Starting manual verification for userId:', finalUserId)
    
    // Utiliser le client admin pour bypasser RLS
    const adminSupabase = createAdminClient()

    // Récupérer les données utilisateur
    const { data: userData, error: userError } = await adminSupabase
      .from('users')
      .select('company_id, email')
      .eq('id', finalUserId)
      .single()
    
    console.log('[verifyPlatformUser] User data fetch result:', {
      hasUserData: !!userData,
      userId: finalUserId,
      userEmail: userData?.email,
      userCompanyId: userData?.company_id,
      userCompanyIdType: typeof userData?.company_id,
      error: userError?.message,
      errorCode: userError?.code,
    })

    if (userError) {
      console.error('[verifyPlatformUser] Error fetching user:', {
        userId: finalUserId,
        error: userError.message,
        code: userError.code,
        details: userError.details,
        hint: userError.hint,
      })
      
      // Si l'utilisateur n'est pas trouvé, essayer la RPC comme fallback
      try {
        const supabase = await createServerClient(request)
        const { data: isPlatformRPC, error: rpcError } = await supabase.rpc('is_platform_user')
        
        if (!rpcError && isPlatformRPC === true) {
          console.log('[verifyPlatformUser] User is platform (via RPC fallback after user not found):', finalUserId)
          return { isPlatform: true }
        }
      } catch (rpcErr) {
        // Ignorer l'erreur RPC
      }
      
      return {
        isPlatform: false,
        error: `User not found: ${userError.message}`,
      }
    }

    if (!userData) {
      console.error('[verifyPlatformUser] User data is null:', {
        userId: finalUserId,
      })
      
      // Essayer la RPC comme fallback
      try {
        const supabase = await createServerClient(request)
        const { data: isPlatformRPC, error: rpcError } = await supabase.rpc('is_platform_user')
        
        if (!rpcError && isPlatformRPC === true) {
          console.log('[verifyPlatformUser] User is platform (via RPC fallback after null userData):', finalUserId)
          return { isPlatform: true }
        }
      } catch (rpcErr) {
        // Ignorer l'erreur RPC
      }
      
      return {
        isPlatform: false,
        error: 'User not found in database',
      }
    }

    // MÉTHODE 1 : Vérifier dans la table platform_n8n_access (prioritaire - table dédiée)
    console.log('[verifyPlatformUser] 🔍 Checking platform_n8n_access for userId:', finalUserId)

    const { data: n8nAccess, error: n8nAccessError } = await adminSupabase
      .from('platform_n8n_access')
      .select('is_platform_admin, has_n8n_access, access_level, company_id')
      .eq('user_id', finalUserId)
      .single()

    console.log('[verifyPlatformUser] platform_n8n_access query result:', {
      hasData: !!n8nAccess,
      hasError: !!n8nAccessError,
      errorCode: n8nAccessError?.code,
      errorMessage: n8nAccessError?.message,
      errorDetails: n8nAccessError?.details,
      errorHint: n8nAccessError?.hint,
      n8nAccess: n8nAccess ? {
        is_platform_admin: n8nAccess.is_platform_admin,
        has_n8n_access: n8nAccess.has_n8n_access,
        access_level: n8nAccess.access_level,
        company_id: n8nAccess.company_id,
      } : null,
    })

    // Si l'utilisateur est dans la table ET a accès
    if (n8nAccess && !n8nAccessError) {
      console.log('[verifyPlatformUser] ✅ User found in platform_n8n_access:', {
        userId: finalUserId,
        hasN8nAccess: n8nAccess.has_n8n_access,
        isPlatformAdmin: n8nAccess.is_platform_admin,
        accessLevel: n8nAccess.access_level,
        companyId: n8nAccess.company_id,
      })

      if (n8nAccess.has_n8n_access) {
        // Vérifier que le company_id correspond à la plateforme
        const { data: platformSetting, error: platformError } = await adminSupabase
          .from('settings')
          .select('value')
          .eq('key', 'platform_company_id')
          .single()

        if (platformError) {
          console.error('[verifyPlatformUser] ❌ Error fetching platform_company_id:', {
            error: platformError.message,
            code: platformError.code,
            details: platformError.details,
          })
        }

        if (platformSetting) {
          let platformCompanyIdValue: string
          if (typeof platformSetting.value === 'string') {
            platformCompanyIdValue = platformSetting.value.trim().toLowerCase()
          } else {
            const jsonStr = JSON.stringify(platformSetting.value)
            platformCompanyIdValue = jsonStr.replace(/^"|"$/g, '').trim().toLowerCase()
          }

          const n8nAccessCompanyId = String(n8nAccess.company_id).trim().toLowerCase()

          console.log('[verifyPlatformUser] Company ID comparison:', {
            n8nAccessCompanyId: n8nAccessCompanyId,
            platformCompanyIdValue: platformCompanyIdValue,
            match: n8nAccessCompanyId === platformCompanyIdValue,
            types: {
              n8nAccessCompanyIdType: typeof n8nAccess.company_id,
              platformCompanyIdValueType: typeof platformCompanyIdValue,
            },
          })

          if (n8nAccessCompanyId === platformCompanyIdValue) {
            console.log('[verifyPlatformUser] ✅✅✅ User has N8N access (platform_n8n_access table):', {
              userId: finalUserId,
              isPlatformAdmin: n8nAccess.is_platform_admin,
              hasN8nAccess: n8nAccess.has_n8n_access,
              accessLevel: n8nAccess.access_level,
            })
            return { isPlatform: true }
          } else {
            console.warn('[verifyPlatformUser] ⚠️ User in platform_n8n_access but company_id mismatch:', {
              userId: finalUserId,
              n8nAccessCompanyId: n8nAccessCompanyId,
              platformCompanyIdValue: platformCompanyIdValue,
            })
          }
        } else {
          console.warn('[verifyPlatformUser] ⚠️ platform_company_id not found in settings (will fallback)')
        }
      } else {
        console.warn('[verifyPlatformUser] ⚠️ User in platform_n8n_access but has_n8n_access is false:', {
          userId: finalUserId,
          hasN8nAccess: n8nAccess.has_n8n_access,
        })
      }
    } else if (n8nAccessError) {
      // PGRST116 = "no rows returned", ce qui est normal si l'utilisateur n'est pas dans la table
      if (n8nAccessError.code === 'PGRST116') {
        console.log('[verifyPlatformUser] ℹ️ User not in platform_n8n_access table (PGRST116 - will fallback to company_id check)')
      } else {
        console.warn('[verifyPlatformUser] ⚠️ Error checking platform_n8n_access (will fallback to company_id check):', {
          error: n8nAccessError.message,
          code: n8nAccessError.code,
          details: n8nAccessError.details,
          hint: n8nAccessError.hint,
        })
      }
    } else {
      console.log('[verifyPlatformUser] ℹ️ No data in platform_n8n_access (will fallback to company_id check)')
    }

    // MÉTHODE 2 : Fallback sur vérification par platform_company_id (méthode actuelle)
    // Récupérer directement platform_company_id depuis settings (source de vérité unique)
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
        key: 'platform_company_id',
      })
      return {
        isPlatform: false,
        error: 'Platform not configured - platform_company_id missing in settings',
      }
    }

    // Extraire la valeur du JSONB (comme dans SQL : value#>>'{}')
    let platformCompanyIdValue: string
    if (typeof platformSetting.value === 'string') {
      platformCompanyIdValue = platformSetting.value.trim().toLowerCase()
    } else {
      // JSONB : extraire la valeur brute
      try {
        const jsonStr = JSON.stringify(platformSetting.value)
        platformCompanyIdValue = jsonStr.replace(/^"|"$/g, '').trim().toLowerCase()
      } catch (e) {
        platformCompanyIdValue = String(platformSetting.value).trim().toLowerCase()
      }
    }

    // Normaliser le company_id de l'utilisateur
    const userCompanyIdValue = String(userData.company_id || '').trim().toLowerCase()

    // Comparaison directe : user.company_id === platform_company_id
    console.log('[verifyPlatformUser] 🔍 Platform check (direct from settings):', {
      userId: finalUserId,
      userEmail: userData.email,
      userCompanyId: userData.company_id,
      userCompanyIdValue: userCompanyIdValue,
      platformCompanyIdValue: platformCompanyIdValue,
      rawPlatformValue: platformSetting.value,
      platformValueType: typeof platformSetting.value,
      match: platformCompanyIdValue === userCompanyIdValue,
      userCompanyIdLength: userCompanyIdValue.length,
      platformCompanyIdLength: platformCompanyIdValue.length,
    })

    const isPlatform = platformCompanyIdValue === userCompanyIdValue

    if (isPlatform) {
      console.log('[verifyPlatformUser] ✅ User is platform (platform_company_id match):', finalUserId)
      return { isPlatform: true }
    }

    // Si pas plateforme, retourner false avec détails
    console.warn('[verifyPlatformUser] ❌ User is NOT platform:', {
      userId: finalUserId,
      userCompanyIdValue: userCompanyIdValue,
      platformCompanyIdValue: platformCompanyIdValue,
    })

    return {
      isPlatform: false,
      error: `User company (${userCompanyIdValue}) does not match platform_company_id (${platformCompanyIdValue})`
    }
  } catch (error) {
    console.error('Error in verifyPlatformUser:', error)
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

