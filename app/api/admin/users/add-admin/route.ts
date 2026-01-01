import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { isPlatformCompany } from '@/lib/platform/supabase'

/**
 * POST /api/admin/users/add-admin
 * Ajoute un administrateur plateforme
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
    const { email, first_name, last_name, send_email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Email invalide' },
        { status: 400 }
      )
    }

    // Récupérer le platform_company_id
    const { data: platformSetting } = await supabaseAdmin
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

    const platformCompanyId = typeof platformSetting.value === 'string' 
      ? platformSetting.value 
      : (platformSetting.value as any)[0] || platformSetting.value

    // Vérifier si l'user existe dans auth.users
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authUsersError) {
      console.error('Erreur listUsers:', authUsersError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la vérification des utilisateurs' },
        { status: 500 }
      )
    }

    const existingAuthUser = authUsers.users.find(u => u.email === email)

    if (!existingAuthUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: `L'email ${email} n'existe pas dans auth.users. L'utilisateur doit d'abord créer un compte.` 
        },
        { status: 400 }
      )
    }

    // Vérifier si l'user existe déjà dans public.users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, company_id')
      .eq('id', existingAuthUser.id)
      .single()

    if (existingUser) {
      // Vérifier s'il est déjà admin
      if (existingUser.company_id === platformCompanyId) {
        return NextResponse.json(
          { success: false, error: `${email} est déjà administrateur` },
          { status: 400 }
        )
      }

      // Mettre à jour le company_id
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ 
          company_id: platformCompanyId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAuthUser.id)

      if (updateError) {
        console.error('Erreur update user:', updateError)
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la mise à jour' },
          { status: 500 }
        )
      }
    } else {
      // Créer l'entrée dans public.users
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: existingAuthUser.id,
          email: email,
          first_name: first_name || null,
          last_name: last_name || null,
          company_id: platformCompanyId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Erreur insert user:', insertError)
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la création' },
          { status: 500 }
        )
      }
    }

    // Envoyer email de bienvenue si demandé
    if (send_email) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: 'Vous êtes maintenant Administrateur Plateforme',
            html: `
              <h2>Bienvenue en tant qu'Administrateur !</h2>
              <p>Bonjour ${first_name || email.split('@')[0]},</p>
              <p>Vous avez été promu administrateur de la plateforme.</p>
              <p><strong>Vos nouveaux accès :</strong></p>
              <ul>
                <li>Gestion des abonnements</li>
                <li>Gestion des plans</li>
                <li>Consultation des logs</li>
                <li>Gestion des administrateurs</li>
                <li>Analytics plateforme</li>
              </ul>
              <p>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/platform/dashboard" 
                   style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">
                  Accéder au Dashboard Admin
                </a>
              </p>
            `
          })
        })
      } catch (emailError) {
        console.warn('Erreur envoi email (non bloquant):', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${email} est maintenant administrateur`,
      user_id: existingAuthUser.id
    })

  } catch (error) {
    console.error('❌ Erreur add-admin:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}

