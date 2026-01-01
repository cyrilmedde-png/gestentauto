import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isPlatformCompany } from '@/lib/platform/supabase'

/**
 * GET /api/admin/users/list-admins
 * Liste tous les administrateurs plateforme
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient(request)

    // Vérifier authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier que c'est un admin plateforme
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userData || !userData.company_id) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    const isAdmin = await isPlatformCompany(userData.company_id)
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      )
    }

    // Récupérer le platform_company_id
    const { data: platformSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'platform_company_id')
      .single()

    if (!platformSetting) {
      return NextResponse.json(
        { success: false, error: 'Configuration plateforme non trouvée' },
        { status: 500 }
      )
    }

    const platformCompanyId = platformSetting.value as any

    // Récupérer tous les users avec ce company_id
    const { data: admins, error: adminsError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, created_at, company_id')
      .eq('company_id', typeof platformCompanyId === 'string' ? platformCompanyId : platformCompanyId[0])
      .order('created_at', { ascending: false })

    if (adminsError) {
      console.error('Erreur récupération admins:', adminsError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des admins' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      admins: admins || []
    })

  } catch (error) {
    console.error('❌ Erreur list-admins:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}

