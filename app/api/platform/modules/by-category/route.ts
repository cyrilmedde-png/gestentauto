import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'

/**
 * GET /api/platform/modules/by-category
 * Récupère tous les modules groupés par catégorie
 * Query params:
 *   - company_id: filtrer modules par entreprise
 *   - include_platform: inclure modules plateforme (défaut: true si admin)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createPlatformClient()
    const platformId = await getPlatformCompanyId()

    if (!platformId) {
      return NextResponse.json(
        { success: false, error: 'Platform not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const includePlatform = searchParams.get('include_platform') !== 'false'

    // Vérifier si admin plateforme
    const { data: isPlatform } = await supabase.rpc('is_platform_user')

    // Récupérer toutes les catégories
    let categoriesQuery = supabase
      .from('module_categories')
      .select('*')
      .order('order_index', { ascending: true })

    // Filtrer catégories plateforme si pas admin
    if (!isPlatform || !includePlatform) {
      categoriesQuery = categoriesQuery.eq('is_platform_only', false)
    }

    const { data: categories, error: categoriesError } = await categoriesQuery

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      return NextResponse.json(
        { success: false, error: categoriesError.message },
        { status: 500 }
      )
    }

    // Pour chaque catégorie, récupérer les modules
    const categoriesWithModules = await Promise.all(
      (categories || []).map(async (category) => {
        // Query modules de cette catégorie
        let modulesQuery = supabase
          .from('modules')
          .select('*')
          .eq('category_id', category.id)
          .order('order_index', { ascending: true })

        // Filtrer par company_id si spécifié
        if (companyId) {
          modulesQuery = modulesQuery.eq('company_id', companyId)
        } else {
          // Par défaut, récupérer modules de la plateforme (catalogue)
          modulesQuery = modulesQuery.eq('company_id', platformId)
        }

        const { data: modules, error: modulesError } = await modulesQuery

        if (modulesError) {
          console.error('Error fetching modules for category:', category.name, modulesError)
          return {
            ...category,
            modules: [],
          }
        }

        return {
          ...category,
          modules: modules || [],
          modules_count: (modules || []).length,
          active_modules_count: (modules || []).filter(m => m.is_active).length,
        }
      })
    )

    // Filtrer catégories sans modules (optionnel)
    const filteredCategories = categoriesWithModules.filter(cat => cat.modules_count > 0)

    return NextResponse.json({
      success: true,
      categories: filteredCategories,
      total_categories: filteredCategories.length,
      total_modules: filteredCategories.reduce((sum, cat) => sum + cat.modules_count, 0),
    })
  } catch (error) {
    console.error('Error in GET /api/platform/modules/by-category:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

