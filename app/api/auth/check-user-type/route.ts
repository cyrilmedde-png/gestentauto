import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getPlatformCompanyId } from '@/lib/platform/supabase'

/**
 * GET /api/auth/check-user-type
 * Vérifie si l'utilisateur connecté est de la plateforme ou un client
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Vérifier l'authentification
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Récupérer les données utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', authUser.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Vérifier si c'est la plateforme
    const platformId = await getPlatformCompanyId()
    const isPlatform = platformId === userData.company_id

    return NextResponse.json({
      isPlatform,
      companyId: userData.company_id,
    })
  } catch (error) {
    console.error('Error in GET /api/auth/check-user-type:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

