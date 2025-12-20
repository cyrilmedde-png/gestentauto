import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'

/**
 * GET /api/platform/users
 * Liste tous les utilisateurs des entreprises clientes
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
      .from('users')
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
        ),
        roles (
          id,
          name
        )
      `)
      .neq('company_id', platformId) // Exclure les utilisateurs plateforme

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data: users, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error('Error in GET /api/platform/users:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/platform/users
 * Créer un nouvel utilisateur pour un client
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
    const { company_id, email, password, first_name, last_name, role_id } = body

    if (!company_id || !email || !password) {
      return NextResponse.json(
        { error: 'company_id, email, and password are required' },
        { status: 400 }
      )
    }

    // Vérifier que ce n'est pas la plateforme elle-même
    if (company_id === platformId) {
      return NextResponse.json(
        { error: 'Cannot create users for platform' },
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

    // Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: first_name || null,
        last_name: last_name || null,
      },
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user' },
        { status: 400 }
      )
    }

    // Créer l'entrée dans la table users
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        company_id,
        email,
        first_name: first_name || null,
        last_name: last_name || null,
        role_id: role_id || null,
      })
      .select(`
        id,
        email,
        first_name,
        last_name,
        company_id,
        role_id,
        created_at,
        companies (
          id,
          name
        )
      `)
      .single()

    if (userError) {
      // Nettoyage : supprimer l'utilisateur Auth créé
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch {}
      
      return NextResponse.json(
        { error: userError.message || 'Failed to create user record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/platform/users:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

