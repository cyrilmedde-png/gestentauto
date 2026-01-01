import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { isPlatformCompany } from '@/lib/platform/supabase'

/**
 * POST /api/admin/users/remove-admin
 * Retire les droits admin d'un utilisateur
 */
export async function POST(request: NextRequest) {
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

    // Récupérer les données de la requête
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id requis' },
        { status: 400 }
      )
    }

    // Empêcher de se retirer soi-même
    if (user_id === user.id) {
      return NextResponse.json(
        { success: false, error: 'Vous ne pouvez pas retirer vos propres droits admin' },
        { status: 400 }
      )
    }

    // Récupérer l'user à retirer
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('email, company_id')
      .eq('id', user_id)
      .single()

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Récupérer le platform_company_id pour vérifier
    const { data: platformSetting } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'platform_company_id')
      .single()

    const platformCompanyId = typeof platformSetting?.value === 'string' 
      ? platformSetting.value 
      : (platformSetting?.value as any)?.[0] || platformSetting?.value

    // Vérifier qu'il est bien admin avant de retirer
    if (targetUser.company_id !== platformCompanyId) {
      return NextResponse.json(
        { success: false, error: 'Cet utilisateur n\'est pas administrateur' },
        { status: 400 }
      )
    }

    // Mettre company_id à NULL (retire les droits admin)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        company_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id)

    if (updateError) {
      console.error('Erreur update user:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    // Optionnel : Envoyer un email de notification
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetUser.email,
          subject: 'Modification de vos droits d\'accès',
          html: `
            <h2>Modification de vos accès</h2>
            <p>Bonjour,</p>
            <p>Vos droits d'administrateur plateforme ont été retirés.</p>
            <p>Vous conservez votre compte utilisateur, mais n'avez plus accès aux fonctionnalités d'administration.</p>
            <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter un administrateur.</p>
          `
        })
      })
    } catch (emailError) {
      console.warn('Erreur envoi email (non bloquant):', emailError)
    }

    return NextResponse.json({
      success: true,
      message: `Droits admin retirés pour ${targetUser.email}`
    })

  } catch (error) {
    console.error('❌ Erreur remove-admin:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}

