import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { validatePassword } from '@/lib/utils/passwordGenerator'

export async function POST(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Les deux mots de passe sont requis' },
        { status: 400 }
      )
    }

    // Valider le nouveau mot de passe
    const validation = validatePassword(newPassword)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Vérifier que l'utilisateur est connecté
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Changer le mot de passe
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      )
    }

    // Mettre à jour le flag password_change_required dans la table users
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ password_change_required: false })
      .eq('id', user.id)

    if (userUpdateError) {
      console.error('Erreur lors de la mise à jour du flag:', userUpdateError)
      // Ne pas bloquer si cette étape échoue
    }

    return NextResponse.json({
      success: true,
      message: 'Mot de passe changé avec succès',
    })
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}

