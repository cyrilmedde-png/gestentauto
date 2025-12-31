import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)
    const supabaseAdmin = createAdminClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur est admin plateforme
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_id, roles(name)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier le rôle
    const roleName = (userData.roles as any)?.name || (userData.roles as any)?.[0]?.name
    if (roleName !== 'Administrateur Plateforme') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé. Réservé aux administrateurs.' },
        { status: 403 }
      )
    }

    // Récupérer les données
    const { planId, isActive } = await request.json()

    if (!planId || isActive === undefined) {
      return NextResponse.json(
        { success: false, error: 'Plan ID et statut requis' },
        { status: 400 }
      )
    }

    // Mettre à jour le statut
    const { data: updatedPlan, error: updateError } = await supabaseAdmin
      .from('subscription_plans')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single()

    if (updateError) {
      console.error('Erreur toggle plan:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    console.log(`✅ Plan ${isActive ? 'activé' : 'désactivé'}:`, updatedPlan.display_name)

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      message: `Plan ${isActive ? 'activé' : 'désactivé'} avec succès`
    })

  } catch (error) {
    console.error('❌ Erreur toggle plan:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}

