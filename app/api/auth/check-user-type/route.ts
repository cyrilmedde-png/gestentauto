import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getPlatformCompanyId } from '@/lib/platform/supabase'

/**
 * GET /api/auth/check-user-type
 * Vérifie si l'utilisateur connecté est de la plateforme ou un client
 * Utilise uniquement company_id pour la vérification (PAS user_id)
 */
export async function GET(request: NextRequest) {
  try {
    // Récupérer l'utilisateur depuis la session
    const supabase = await createServerClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // Récupérer le company_id de l'utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData || !userData.company_id) {
      return NextResponse.json(
        { error: 'User company not found' },
        { status: 404 }
      )
    }
    
    // Vérifier si c'est la plateforme en comparant company_id
    const platformId = await getPlatformCompanyId()
    
    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform not configured' },
        { status: 500 }
      )
    }
    
    const normalizedUserCompanyId = String(userData.company_id).trim().toLowerCase()
    const normalizedPlatformId = String(platformId).trim().toLowerCase()
    
    const isPlatform = normalizedUserCompanyId === normalizedPlatformId
    
    // Logs pour déboguer (seulement en développement)
    if (process.env.NODE_ENV === 'development') {
      console.log('Debug check-user-type:', {
        email: user.email,
        userCompanyId: userData.company_id,
        platformId: platformId,
        normalizedUserCompanyId,
        normalizedPlatformId,
        areEqual: isPlatform,
      })
    }
    
    return NextResponse.json({
      isPlatform,
      companyId: userData.company_id,
      platformId: platformId,
    })
  } catch (error) {
    console.error('Error in GET /api/auth/check-user-type:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

