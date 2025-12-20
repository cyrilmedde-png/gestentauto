import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'
import type { SettingUpdate } from '@/lib/types/onboarding'

/**
 * PATCH /api/platform/settings/[id]
 * Mettre à jour un setting
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

    // Vérifier que le setting n'appartient pas à la plateforme (sauf platform_company_id)
    const { data: existingSetting, error: fetchError } = await supabase
      .from('settings')
      .select('company_id, key')
      .eq('id', id)
      .single()

    if (fetchError || !existingSetting) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      )
    }

    if (existingSetting.company_id === platformId && existingSetting.key !== 'platform_company_id') {
      return NextResponse.json(
        { error: 'Cannot modify platform settings' },
        { status: 403 }
      )
    }

    // Mettre à jour le setting
    const updateData: Partial<SettingUpdate> = {}
    if (body.value !== undefined) updateData.value = body.value

    const { data: setting, error: updateError } = await supabase
      .from('settings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ setting })
  } catch (error) {
    console.error('Error in PATCH /api/platform/settings/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/platform/settings/[id]
 * Supprimer un setting
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

    // Vérifier que le setting n'appartient pas à la plateforme
    const { data: existingSetting, error: fetchError } = await supabase
      .from('settings')
      .select('company_id, key')
      .eq('id', id)
      .single()

    if (fetchError || !existingSetting) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      )
    }

    // Ne pas permettre la suppression de platform_company_id
    if (existingSetting.key === 'platform_company_id') {
      return NextResponse.json(
        { error: 'Cannot delete platform_company_id setting' },
        { status: 403 }
      )
    }

    if (existingSetting.company_id === platformId) {
      return NextResponse.json(
        { error: 'Cannot delete platform settings' },
        { status: 403 }
      )
    }

    // Supprimer le setting
    const { error: deleteError } = await supabase
      .from('settings')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/platform/settings/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

