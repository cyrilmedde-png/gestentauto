import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * API Route pour l'inscription
 * Utilise le service role key pour créer l'entreprise et l'utilisateur
 * Cette route doit être appelée après la création du compte Supabase Auth
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, companyName, email, firstName, lastName } = body

    if (!userId || !companyName || !email) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // 1. Vérifier que l'utilisateur existe bien dans auth.users
    // Si l'utilisateur n'existe pas encore, attendre un peu et réessayer
    let authUser = null
    let authUserError = null
    let retries = 3
    
    for (let i = 0; i < retries; i++) {
      const result = await adminClient.auth.admin.getUserById(userId)
      authUser = result.data
      authUserError = result.error
      
      if (!authUserError && authUser?.user) {
        break
      }
      
      if (i < retries - 1) {
        // Attendre avant de réessayer (délai de propagation Supabase)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    if (authUserError || !authUser?.user) {
      console.error('Utilisateur non trouvé après retries:', { userId, authUserError })
      return NextResponse.json(
        { 
          error: 'Utilisateur non trouvé dans Supabase Auth. L\'utilisateur a peut-être besoin de confirmer son email.',
          hint: 'Vérifiez votre boîte email ou désactivez la confirmation email dans Supabase Settings > Authentication > Email Auth'
        },
        { status: 400 }
      )
    }

    // 2. Créer l'entreprise
    const { data: companyData, error: companyError } = await adminClient
      .from('companies')
      .insert({
        name: companyName,
      })
      .select()
      .single()

    if (companyError || !companyData) {
      return NextResponse.json(
        { error: companyError?.message || 'Erreur lors de la création de l\'entreprise' },
        { status: 500 }
      )
    }

    // 3. Créer l'entrée dans la table users avec l'ID exact de auth.users
    const { error: userError } = await adminClient
      .from('users')
      .insert({
        id: authUser.user.id, // Utiliser l'ID de auth.users pour garantir la correspondance
        company_id: companyData.id,
        email: email,
        first_name: firstName || null,
        last_name: lastName || null,
      })

    if (userError) {
      console.error('Erreur création utilisateur:', userError)
      // Nettoyage : supprimer l'entreprise créée
      try {
        await adminClient.from('companies').delete().eq('id', companyData.id)
      } catch (cleanupError) {
        console.error('Erreur lors du nettoyage:', cleanupError)
      }
      
      return NextResponse.json(
        { 
          error: `Erreur lors de la création de l'utilisateur: ${userError.message}`,
          details: userError.details,
          hint: userError.hint,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, companyId: companyData.id })
  } catch (error) {
    console.error('Erreur inattendue dans register API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

