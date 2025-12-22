import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerClient } from '@/lib/supabase/server'

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
      .select('company_id')
      .eq('id', finalUserId)
      .single()
    
    console.log('[verifyPlatformUser] User data fetch result:', {
      hasUserData: !!userData,
      userCompanyId: userData?.company_id,
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
    const userCompanyIdValue = String(userData.company_id).trim().toLowerCase()

    // Comparaison directe : user.company_id === platform_company_id
    console.log('[verifyPlatformUser] Platform check (direct from settings):', {
      userId: finalUserId,
      userCompanyId: userData.company_id,
      userCompanyIdValue: userCompanyIdValue,
      platformCompanyIdValue: platformCompanyIdValue,
      rawPlatformValue: platformSetting.value,
      match: platformCompanyIdValue === userCompanyIdValue,
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

