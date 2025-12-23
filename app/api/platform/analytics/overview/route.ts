import { NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'

/**
 * GET /api/platform/analytics/overview
 * Vue d'ensemble des analytics de la plateforme
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
    const { count: totalCompanies, error: companiesError } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .neq('id', platformId)

    if (companiesError) throw companiesError

    // Compter les utilisateurs clients
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .neq('company_id', platformId)

    if (usersError) throw usersError

    // Compter les modules activés
    const { count: activeModules, error: modulesError } = await supabase
      .from('modules')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .neq('company_id', platformId)

    if (modulesError) throw modulesError

    // Nouveaux clients ce mois
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: newCompaniesThisMonth, error: newCompaniesError } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .neq('id', platformId)
      .gte('created_at', startOfMonth.toISOString())

    if (newCompaniesError) throw newCompaniesError

    // Nouveaux utilisateurs ce mois
    const { count: newUsersThisMonth, error: newUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .neq('company_id', platformId)
      .gte('created_at', startOfMonth.toISOString())

    if (newUsersError) throw newUsersError

    return NextResponse.json({
      overview: {
        total_companies: totalCompanies || 0,
        total_users: totalUsers || 0,
        active_modules: activeModules || 0,
        new_companies_this_month: newCompaniesThisMonth || 0,
        new_users_this_month: newUsersThisMonth || 0,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/platform/analytics/overview:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}


