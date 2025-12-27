import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'

/**
 * GET /api/platform/roles
 * Liste tous les rôles des entreprises clientes
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
      .from('roles')
      .select(`
        id,
        company_id,
        name,
        permissions,
        created_at,
        updated_at,
        companies (
          id,
          name
        )
      `)
      .neq('company_id', platformId) // Exclure les rôles de la plateforme

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data: roles, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ roles: roles || [] })
  } catch (error) {
    console.error('Error in GET /api/platform/roles:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/platform/roles
 * Créer un nouveau rôle pour une entreprise
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
    const { company_id, name, permissions } = body

    if (!company_id || !name || !permissions) {
      return NextResponse.json(
        { error: 'company_id, name, and permissions are required' },
        { status: 400 }
      )
    }

    // Vérifier que ce n'est pas la plateforme elle-même
    if (company_id === platformId) {
      return NextResponse.json(
        { error: 'Cannot create roles for platform' },
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

    // Créer le rôle
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert({
        company_id,
        name,
        permissions: permissions || {},
      })
      .select()
      .single()

    if (roleError) {
      throw roleError
    }

    return NextResponse.json({ role }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/platform/roles:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}





