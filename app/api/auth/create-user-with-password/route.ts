import { createClient } from '@/lib/supabase/server'
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

    const supabase = await createClient()

    // 1. Créer l'utilisateur dans Supabase Auth
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
      console.error('Erreur création auth:', authError)
      return NextResponse.json(
        {
          success: false,
          error: authError.message,
        },
        { status: 400 }
      )
    }

    // 2. Créer l'utilisateur dans la table users
    const { error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      first_name,
      last_name,
      phone,
      company,
      user_type: 'user',
      password_change_required,
      created_at: new Date().toISOString(),
    })

    if (userError) {
      console.error('Erreur création user:', userError)
      // Supprimer l'utilisateur auth si la création de user échoue
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur lors de la création du profil utilisateur',
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

