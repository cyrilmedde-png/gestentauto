import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'

/**
 * GET /api/platform/modules
 * Liste tous les modules activés par entreprise
 * Query params: ?company_id=xxx pour filtrer par entreprise
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createPlatformClient()
    const platformId = await getPlatformCompanyId()

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    let query = supabase
      .from('modules')
      .select(`
        id,
        company_id,
        module_name,
        is_active,
        config,
        created_at,
        updated_at,
        companies (
          id,
          name
        )
      `)
      .neq('company_id', platformId) // Exclure les modules de la plateforme

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data: modules, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ modules: modules || [] })
  } catch (error) {
    console.error('Error in GET /api/platform/modules:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/platform/modules
 * Activer un module pour une entreprise
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createPlatformClient()
    const platformId = await getPlatformCompanyId()

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { company_id, module_name, config } = body

    if (!company_id || !module_name) {
      return NextResponse.json(
        { error: 'company_id and module_name are required' },
        { status: 400 }
      )
    }

    // Vérifier que ce n'est pas la plateforme elle-même
    if (company_id === platformId) {
      return NextResponse.json(
        { error: 'Cannot manage platform modules' },
        { status: 403 }
      )
    }

    // Vérifier que l'entreprise existe
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Créer ou mettre à jour le module
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .upsert({
        company_id,
        module_name,
        is_active: true,
        config: config || null,
      }, {
        onConflict: 'company_id,module_name'
      })
      .select()
      .single()

    if (moduleError) {
      throw moduleError
    }

    return NextResponse.json({ module }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/platform/modules:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}


