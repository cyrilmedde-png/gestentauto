import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/modules/available
 * Récupère les modules disponibles pour l'utilisateur connecté
 * Filtre selon:
 *   - Modules activés pour son entreprise
 *   - Modules selon son plan d'abonnement (si configuré)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient(request)

    // Vérifier authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer company_id de l'utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Récupérer modules activés pour cette entreprise
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select(`
        id,
        module_name,
        display_name,
        description,
        icon,
        color,
        route,
        is_active,
        config,
        order_index,
        category_id,
        min_plan,
        status,
        default_limits,
        module_categories (
          id,
          name,
          display_name,
          icon,
          color,
          order_index,
          is_platform_only
        )
      `)
      .eq('company_id', userData.company_id)
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (modulesError) {
      console.error('Error fetching modules:', modulesError)
      return NextResponse.json(
        { success: false, error: modulesError.message },
        { status: 500 }
      )
    }

    // Grouper par catégorie
    const modulesByCategory = (modules || []).reduce((acc, module) => {
      const category = module.module_categories as any
      const categoryName = category?.name || 'uncategorized'

      if (!acc[categoryName]) {
        acc[categoryName] = {
          category: category || { name: 'uncategorized', display_name: 'Non catégorisé' },
          modules: [],
        }
      }

      acc[categoryName].modules.push(module)
      return acc
    }, {} as Record<string, any>)

    // Convertir en array et trier par order_index
    const categoriesArray = Object.values(modulesByCategory).sort(
      (a: any, b: any) => (a.category.order_index || 0) - (b.category.order_index || 0)
    )

    return NextResponse.json({
      success: true,
      modules: modules || [],
      categories: categoriesArray,
      total: (modules || []).length,
    })
  } catch (error) {
    console.error('Error in GET /api/modules/available:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

