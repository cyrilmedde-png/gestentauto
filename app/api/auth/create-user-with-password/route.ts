import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      company,
      password_change_required = true,
    } = body

    // Validation des champs requis
    if (!email || !password || !first_name || !last_name || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Les champs email, password, first_name, last_name et phone sont requis',
        },
        { status: 400 }
      )
    }

    // Validation du format du téléphone (+33)
    if (!phone.startsWith('+33')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Le numéro de téléphone doit commencer par +33',
        },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1. Créer l'utilisateur dans Supabase Auth
    console.log('🔐 Création utilisateur Auth...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmer l'email automatiquement
      user_metadata: {
        first_name,
        last_name,
        phone,
        company,
        password_change_required,
      },
    })

    if (authError) {
      console.error('❌ Erreur création auth:', authError)
      return NextResponse.json(
        {
          success: false,
          error: authError.message,
        },
        { status: 400 }
      )
    }

    console.log('✅ Utilisateur Auth créé:', authData.user.id)

    try {
      // 2. Créer une company pour le client
      console.log('🏢 Création de la company...')
      const companyName = company || `${first_name} ${last_name}`
      
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          email: email,
          phone: phone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (companyError) {
        console.error('❌ Erreur création company:', companyError)
        throw new Error('Erreur lors de la création de l\'entreprise')
      }

      console.log('✅ Company créée:', companyData.id)

      // 3. Créer un rôle "Propriétaire" pour cette company
      console.log('👑 Création du rôle Propriétaire...')
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .insert({
          company_id: companyData.id,
          name: 'Propriétaire',
          permissions: {
            all: true,
            admin: true,
            manage_users: true,
            manage_modules: true,
            manage_billing: true,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (roleError) {
        console.error('❌ Erreur création role:', roleError)
        throw new Error('Erreur lors de la création du rôle')
      }

      console.log('✅ Rôle créé:', roleData.id)

      // 4. Créer l'utilisateur dans la table users
      console.log('👤 Création utilisateur dans table users...')
      const { error: userError } = await supabase.from('users').insert({
        id: authData.user.id,
        company_id: companyData.id,
        email,
        first_name,
        last_name,
        phone,
        company: companyName,
        role_id: roleData.id,
        password_change_required,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (userError) {
        console.error('❌ Erreur création user:', userError)
        throw new Error('Erreur lors de la création du profil utilisateur')
      }

      console.log('✅ Utilisateur créé avec succès !')

    } catch (error) {
      console.error('💥 Erreur dans le processus de création:', error)
      // Rollback : Supprimer l'utilisateur auth si quelque chose échoue
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Erreur lors de la création du compte',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user_id: authData.user.id,
      message: 'Utilisateur créé avec succès',
    })
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}

