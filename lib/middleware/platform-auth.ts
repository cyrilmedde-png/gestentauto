import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerClient } from '@/lib/supabase/server'
import { getPlatformCompanyId } from '@/lib/platform/supabase'

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
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          return {
            isPlatform: false,
            error: 'Not authenticated. Please log in.',
          }
        }
        
        finalUserId = user.id
      } catch (sessionError) {
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

    // Utiliser le client admin pour bypasser RLS
    const adminSupabase = createAdminClient()

    // Récupérer les données utilisateur
    const { data: userData, error: userError } = await adminSupabase
      .from('users')
      .select('company_id')
      .eq('id', finalUserId)
      .single()

    if (userError) {
      console.error('[verifyPlatformUser] Error fetching user:', {
        userId: finalUserId,
        error: userError.message,
        code: userError.code,
        details: userError.details,
        hint: userError.hint,
      })
      return {
        isPlatform: false,
        error: `User not found: ${userError.message}`,
      }
    }

    if (!userData) {
      console.error('[verifyPlatformUser] User data is null:', {
        userId: finalUserId,
      })
      return {
        isPlatform: false,
        error: 'User not found in database',
      }
    }

    // Récupérer l'ID de la plateforme
    const platformId = await getPlatformCompanyId()

    if (!platformId) {
      console.error('[verifyPlatformUser] Platform ID not found')
      return {
        isPlatform: false,
        error: 'Platform not configured',
      }
    }

    // Normaliser les UUIDs pour la comparaison
    const normalizedUserCompanyId = String(userData.company_id).trim().toLowerCase()
    const normalizedPlatformId = String(platformId).trim().toLowerCase()

    console.log('[verifyPlatformUser] Company comparison:', {
      userId: finalUserId,
      userCompanyId: normalizedUserCompanyId,
      platformId: normalizedPlatformId,
      match: normalizedPlatformId === normalizedUserCompanyId,
    })

    const isPlatform = normalizedPlatformId === normalizedUserCompanyId

    if (!isPlatform) {
      console.warn('[verifyPlatformUser] User is not platform user:', {
        userId: finalUserId,
        userCompanyId: normalizedUserCompanyId,
        platformId: normalizedPlatformId,
      })
    }

    return { isPlatform }
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

