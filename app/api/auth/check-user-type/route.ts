import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'

/**
 * GET /api/auth/check-user-type
 * Vérifie si l'utilisateur connecté est de la plateforme ou un client
 * Le client doit envoyer son user ID dans le header X-User-Id
 */
export async function GET(request: NextRequest) {
  try {
    // Récupérer l'ID utilisateur depuis le header (envoyé par le client)
    const userId = request.headers.get('X-User-Id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not provided. Please send X-User-Id header.' },
        { status: 400 }
      )
    }

    // Utiliser le client platform pour accéder à toutes les données
    const supabase = createPlatformClient()

    // Récupérer les données utilisateur directement
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Vérifier si c'est la plateforme
    const platformId = await getPlatformCompanyId()
    
    // Normaliser les UUIDs pour la comparaison (enlever les espaces, convertir en minuscules)
    const normalizedUserCompanyId = String(userData.company_id).trim().toLowerCase()
    const normalizedPlatformId = platformId ? String(platformId).trim().toLowerCase() : null
    
    const isPlatform = normalizedPlatformId === normalizedUserCompanyId

    // Logs pour déboguer (seulement en développement)
    if (process.env.NODE_ENV === 'development') {
      console.log('Debug check-user-type:', {
        userId: userId,
        userCompanyId: userData.company_id,
        platformId: platformId,
        normalizedUserCompanyId,
        normalizedPlatformId,
        areEqual: isPlatform,
        types: {
          userCompanyIdType: typeof userData.company_id,
          platformIdType: typeof platformId
        }
      })
    }

    return NextResponse.json({
      isPlatform,
      companyId: userData.company_id,
      platformId: platformId, // Ajouter pour debug
    })
  } catch (error) {
    console.error('Error in GET /api/auth/check-user-type:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

