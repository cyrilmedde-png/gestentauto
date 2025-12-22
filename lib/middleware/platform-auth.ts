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
    // Récupérer l'ID utilisateur depuis le header ou le body
    let finalUserId = userId || request.headers.get('X-User-Id')

    if (!finalUserId) {
      // Essayer de récupérer depuis le body (pour POST/PATCH)
      try {
        const body = await request.clone().json()
        finalUserId = body.userId
      } catch {
        // Si le body n'est pas JSON ou vide, continuer
      }
    }

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

    if (userError || !userData) {
      return {
        isPlatform: false,
        error: 'User not found',
      }
    }

    // Récupérer l'ID de la plateforme
    const platformId = await getPlatformCompanyId()

    if (!platformId) {
      return {
        isPlatform: false,
        error: 'Platform not configured',
      }
    }

    // Normaliser les UUIDs pour la comparaison
    const normalizedUserCompanyId = String(userData.company_id).trim().toLowerCase()
    const normalizedPlatformId = String(platformId).trim().toLowerCase()

    const isPlatform = normalizedPlatformId === normalizedUserCompanyId

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

