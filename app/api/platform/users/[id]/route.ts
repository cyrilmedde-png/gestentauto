import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'
import type { UserUpdate } from '@/lib/types/onboarding'

/**
 * PATCH /api/platform/users/[id]
 * Mettre à jour un utilisateur
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createPlatformClient()
    const platformId = await getPlatformCompanyId()
    const { id } = await params

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()

    // Vérifier que l'utilisateur n'appartient pas à la plateforme
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (existingUser.company_id === platformId) {
      return NextResponse.json(
        { error: 'Cannot modify platform users' },
        { status: 403 }
      )
    }

    // Mettre à jour l'utilisateur
    const updateData: Partial<UserUpdate> = {}
    if (body.first_name !== undefined) updateData.first_name = body.first_name
    if (body.last_name !== undefined) updateData.last_name = body.last_name
    if (body.role_id !== undefined) updateData.role_id = body.role_id

    const { data: user, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        email,
        first_name,
        last_name,
        company_id,
        role_id,
        created_at,
        updated_at,
        companies (
          id,
          name
        )
      `)
      .single()

    if (updateError) {
      throw updateError
    }

    // Mettre à jour également les métadonnées dans Auth si nécessaire
    if (body.first_name !== undefined || body.last_name !== undefined) {
      try {
        await supabase.auth.admin.updateUserById(id, {
          user_metadata: {
            first_name: body.first_name !== undefined ? body.first_name : user.first_name,
            last_name: body.last_name !== undefined ? body.last_name : user.last_name,
          },
        })
      } catch (err) {
        console.error('Error updating auth metadata:', err)
        // On continue quand même
      }
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error in PATCH /api/platform/users/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/platform/users/[id]
 * Supprimer un utilisateur
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createPlatformClient()
    const platformId = await getPlatformCompanyId()
    const { id } = await params

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform not configured' },
        { status: 500 }
      )
    }

    // Vérifier que l'utilisateur n'appartient pas à la plateforme
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (existingUser.company_id === platformId) {
      return NextResponse.json(
        { error: 'Cannot delete platform users' },
        { status: 403 }
      )
    }

    // Supprimer l'utilisateur de Auth (cela supprimera automatiquement l'entrée dans users via CASCADE)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/platform/users/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/platform/users/[id]/reset-password
 * Réinitialiser le mot de passe d'un utilisateur
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createPlatformClient()
    const platformId = await getPlatformCompanyId()
    const { id } = await params

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { new_password } = body

    if (!new_password || new_password.length < 6) {
      return NextResponse.json(
        { error: 'new_password is required and must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur n'appartient pas à la plateforme
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (existingUser.company_id === platformId) {
      return NextResponse.json(
        { error: 'Cannot reset password for platform users' },
        { status: 403 }
      )
    }

    // Mettre à jour le mot de passe dans Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(id, {
      password: new_password,
    })

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/platform/users/[id]/reset-password:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

