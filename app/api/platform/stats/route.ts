import { NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'

/**
 * GET /api/platform/stats
 * Statistiques globales de la plateforme
 */
export async function GET() {
  try {
    const supabase = createPlatformClient()
    const platformId = await getPlatformCompanyId()

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform not configured' },
        { status: 500 }
      )
    }

    // Compter les entreprises clientes
    const { count: companiesCount, error: companiesError } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .neq('id', platformId)

    if (companiesError) {
      throw companiesError
    }

    // Compter les utilisateurs des clients
    const { count: usersCount, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .neq('company_id', platformId)

    if (usersError) {
      throw usersError
    }

    // Compter les modules activés
    const { count: modulesCount, error: modulesError } = await supabase
      .from('modules')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .neq('company_id', platformId)

    if (modulesError) {
      throw modulesError
    }

    return NextResponse.json({
      stats: {
        companies: companiesCount || 0,
        users: usersCount || 0,
        active_modules: modulesCount || 0,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/platform/stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

