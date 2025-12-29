import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'

/**
 * PATCH /api/platform/modules/[id]
 * Mettre à jour un module (activer/désactiver, modifier config)
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

    // Vérifier que le module n'appartient pas à la plateforme
    const { data: existingModule, error: fetchError } = await supabase
      .from('modules')
      .select('company_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingModule) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      )
    }

    if (existingModule.company_id === platformId) {
      return NextResponse.json(
        { error: 'Cannot modify platform modules' },
        { status: 403 }
      )
    }

    // Mettre à jour le module
    const { data: module, error: updateError } = await supabase
      .from('modules')
      .update({
        is_active: body.is_active !== undefined ? body.is_active : undefined,
        config: body.config !== undefined ? body.config : undefined,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ module })
  } catch (error) {
    console.error('Error in PATCH /api/platform/modules/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/platform/modules/[id]
 * Désactiver un module (soft delete via is_active: false)
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

    // Vérifier que le module n'appartient pas à la plateforme
    const { data: existingModule, error: fetchError } = await supabase
      .from('modules')
      .select('company_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingModule) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      )
    }

    if (existingModule.company_id === platformId) {
      return NextResponse.json(
        { error: 'Cannot delete platform modules' },
        { status: 403 }
      )
    }

    // Désactiver le module (soft delete)
    const { data: module, error: updateError } = await supabase
      .from('modules')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ module })
  } catch (error) {
    console.error('Error in DELETE /api/platform/modules/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}







