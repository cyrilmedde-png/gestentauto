import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'

/**
 * GET /api/platform/settings
 * Liste tous les settings des entreprises clientes
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
      .from('settings')
      .select(`
        id,
        company_id,
        key,
        value,
        created_at,
        updated_at,
        companies (
          id,
          name
        )
      `)
      .neq('company_id', platformId) // Exclure les settings de la plateforme (sauf platform_company_id)

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data: settings, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ settings: settings || [] })
  } catch (error) {
    console.error('Error in GET /api/platform/settings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/platform/settings
 * Créer ou mettre à jour un setting pour une entreprise
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
    const { company_id, key, value } = body

    if (!company_id || !key || value === undefined) {
      return NextResponse.json(
        { error: 'company_id, key, and value are required' },
        { status: 400 }
      )
    }

    // Vérifier que ce n'est pas la plateforme elle-même (sauf pour certaines clés autorisées)
    if (company_id === platformId && key !== 'platform_company_id') {
      return NextResponse.json(
        { error: 'Cannot modify platform settings' },
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

    // Créer ou mettre à jour le setting
    const { data: setting, error: settingError } = await supabase
      .from('settings')
      .upsert({
        company_id,
        key,
        value: typeof value === 'string' ? value : value, // JSONB accepte tout
      }, {
        onConflict: 'company_id,key'
      })
      .select()
      .single()

    if (settingError) {
      throw settingError
    }

    return NextResponse.json({ setting }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/platform/settings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}







