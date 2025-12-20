import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'
import type { RoleUpdate } from '@/lib/types/onboarding'

/**
 * PATCH /api/platform/roles/[id]
 * Mettre à jour un rôle
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

    // Vérifier que le rôle n'appartient pas à la plateforme
    const { data: existingRole, error: fetchError } = await supabase
      .from('roles')
      .select('company_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    if (existingRole.company_id === platformId) {
      return NextResponse.json(
        { error: 'Cannot modify platform roles' },
        { status: 403 }
      )
    }

    // Mettre à jour le rôle
    const updateData: Partial<RoleUpdate> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.permissions !== undefined) updateData.permissions = body.permissions

    const { data: role, error: updateError } = await supabase
      .from('roles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ role })
  } catch (error) {
    console.error('Error in PATCH /api/platform/roles/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/platform/roles/[id]
 * Supprimer un rôle
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

    // Vérifier que le rôle n'appartient pas à la plateforme
    const { data: existingRole, error: fetchError } = await supabase
      .from('roles')
      .select('company_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    if (existingRole.company_id === platformId) {
      return NextResponse.json(
        { error: 'Cannot delete platform roles' },
        { status: 403 }
      )
    }

    // Vérifier si des utilisateurs utilisent ce rôle
    const { data: usersWithRole, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('role_id', id)
      .limit(1)

    if (usersError) {
      throw usersError
    }

    if (usersWithRole && usersWithRole.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role: users are still assigned to this role' },
        { status: 400 }
      )
    }

    // Supprimer le rôle
    const { error: deleteError } = await supabase
      .from('roles')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/platform/roles/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

