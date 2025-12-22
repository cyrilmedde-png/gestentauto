import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'

/**
 * GET /api/platform/companies/[id]
 * Détails d'une entreprise cliente
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createPlatformClient()
    const platformId = await getPlatformCompanyId()

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform not configured' },
        { status: 500 }
      )
    }

    const { id } = await params

    // Vérifier que ce n'est pas la plateforme elle-même
    if (id === platformId) {
      return NextResponse.json(
        { error: 'Cannot access platform company details' },
        { status: 403 }
      )
    }

    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ company })
  } catch (error) {
    console.error('Error in GET /api/platform/companies/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/platform/companies/[id]
 * Mettre à jour une entreprise cliente
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createPlatformClient()
    const platformId = await getPlatformCompanyId()

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform not configured' },
        { status: 500 }
      )
    }

    const { id } = await params

    // Vérifier que ce n'est pas la plateforme elle-même
    if (id === platformId) {
      return NextResponse.json(
        { error: 'Cannot update platform company' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const { data: company, error } = await supabase
      .from('companies')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ company })
  } catch (error) {
    console.error('Error in PATCH /api/platform/companies/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/platform/companies/[id]
 * Supprimer une entreprise cliente
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createPlatformClient()
    const platformId = await getPlatformCompanyId()

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform not configured' },
        { status: 500 }
      )
    }

    const { id } = await params

    // Vérifier que ce n'est pas la plateforme elle-même
    if (id === platformId) {
      return NextResponse.json(
        { error: 'Cannot delete platform company' },
        { status: 403 }
      )
    }

    // Vérifier que l'entreprise existe
    const { data: company, error: fetchError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Supprimer l'entreprise (cascade supprimera les données associées selon les contraintes de la DB)
    const { error: deleteError } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ 
      message: `Company "${company.name}" deleted successfully` 
    })
  } catch (error) {
    console.error('Error in DELETE /api/platform/companies/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

