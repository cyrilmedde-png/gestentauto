import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { isPlatformCompany } from '@/lib/platform/supabase'
import { sendEmail } from '@/lib/services/email'

/**
 * POST /api/admin/users/update-admin
 * Met à jour les informations et permissions d'un administrateur
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient(request)
    const supabaseAdmin = createAdminClient()

    // 1. Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Non authentifié:', authError?.message)
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    // 2. Récupérer les données utilisateur
    const { data: userData, error: userFetchError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userFetchError || !userData) {
      console.error('❌ Erreur récupération user data:', userFetchError?.message)
      return NextResponse.json({ success: false, error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // 3. Vérifier que l'utilisateur est admin plateforme
    const isAdmin = await isPlatformCompany(userData.company_id)
    if (!isAdmin) {
      console.warn('⚠️ Accès non autorisé: Tentative de modification admin par non-admin', user.email)
      return NextResponse.json({ success: false, error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    // 4. Récupérer les données de la requête
    const { user_id, first_name, last_name, email, permissions } = await request.json()

    if (!user_id) {
      console.warn('⚠️ Données invalides: user_id manquant')
      return NextResponse.json({ success: false, error: 'ID utilisateur requis' }, { status: 400 })
    }

    console.log('🔄 Mise à jour admin:', { user_id, email, by: user.email })

    // 5. Mettre à jour le profil dans public.users
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name !== undefined) updateData.last_name = last_name
    if (email !== undefined) updateData.email = email
    if (permissions !== undefined) updateData.permissions = permissions

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user_id)

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour:', updateError.message)
      return NextResponse.json({ 
        success: false, 
        error: `Erreur lors de la mise à jour: ${updateError.message}` 
      }, { status: 500 })
    }

    // 6. Si l'email a changé, mettre à jour aussi auth.users
    if (email) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        user_id,
        { email }
      )

      if (authUpdateError) {
        console.error('⚠️ Erreur mise à jour email auth:', authUpdateError.message)
        // Continue quand même, c'est pas bloquant
      }
    }

    console.log('✅ Admin mis à jour avec succès:', email || user_id)

    // 7. Envoyer un email de notification (optionnel)
    if (email) {
      try {
        await sendEmail({
          to: email,
          subject: 'Mise à jour de votre profil administrateur',
          html: `
            <p>Bonjour ${first_name || ''},</p>
            <p>Votre profil administrateur a été mis à jour.</p>
            ${permissions ? `
            <p><strong>Vos permissions :</strong></p>
            <ul>
              ${permissions.logs ? '<li>✅ Logs Système</li>' : '<li>❌ Logs Système</li>'}
              ${permissions.plans ? '<li>✅ Gestion des Plans</li>' : '<li>❌ Gestion des Plans</li>'}
              ${permissions.subscriptions ? '<li>✅ Abonnements</li>' : '<li>❌ Abonnements</li>'}
              ${permissions.admins ? '<li>✅ Administrateurs</li>' : '<li>❌ Administrateurs</li>'}
              ${permissions.analytics ? '<li>✅ Analytics</li>' : '<li>❌ Analytics</li>'}
              ${permissions.clients ? '<li>✅ Clients</li>' : '<li>❌ Clients</li>'}
              ${permissions.users ? '<li>✅ Utilisateurs</li>' : '<li>❌ Utilisateurs</li>'}
              ${permissions.modules ? '<li>✅ Modules</li>' : '<li>❌ Modules</li>'}
            </ul>
            ` : ''}
            <p>Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement l'administrateur principal.</p>
            <p>Cordialement,</p>
            <p>L'équipe Talosprime</p>
          `,
        })
      } catch (emailError) {
        console.warn('⚠️ Erreur envoi email notification:', emailError)
        // Ne pas bloquer la requête
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Administrateur mis à jour avec succès' 
    })

  } catch (error: any) {
    console.error('❌ Erreur inattendue lors de la mise à jour admin:', error.message)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur interne du serveur: ${error.message}` 
    }, { status: 500 })
  }
}

