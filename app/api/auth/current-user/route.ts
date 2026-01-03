import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/auth/current-user
 * Récupère les informations de l'utilisateur connecté (y compris company_id)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient(request)
    const supabaseAdmin = createAdminClient()
    
    // Vérifier authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }
    
    // Récupérer les données utilisateur avec company_id
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, company_id')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: userData.id,
        email: userData.email,
        company_id: userData.company_id
      }
    })
  } catch (error: any) {
    console.error('Erreur API current-user:', error)
    return NextResponse.json(
      { success: false, error: `Erreur interne: ${error.message}` },
      { status: 500 }
    )
  }
}

