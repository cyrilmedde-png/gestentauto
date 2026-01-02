import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'

/**
 * GET /api/platform/modules/categories
 * Liste toutes les catégories de modules
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createPlatformClient()

    // Récupérer toutes les catégories
    const { data: categories, error } = await supabase
      .from('module_categories')
      .select('*')
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      categories: categories || [],
    })
  } catch (error) {
    console.error('Error in GET /api/platform/modules/categories:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/platform/modules/categories
 * Créer une nouvelle catégorie (admin plateforme uniquement)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createPlatformClient()

    // Vérifier si c'est un admin plateforme
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier si admin plateforme
    const { data: isPlatform } = await supabase.rpc('is_platform_user')
    if (!isPlatform) {
      return NextResponse.json(
        { success: false, error: 'Accès refusé - Admin plateforme requis' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, display_name, description, icon, color, order_index, is_platform_only, is_core } = body

    // Validation
    if (!name || !display_name || !icon) {
      return NextResponse.json(
        { success: false, error: 'Champs requis: name, display_name, icon' },
        { status: 400 }
      )
    }

    // Créer la catégorie
    const { data: category, error } = await supabase
      .from('module_categories')
      .insert({
        name,
        display_name,
        description,
        icon,
        color,
        order_index: order_index || 0,
        is_platform_only: is_platform_only || false,
        is_core: is_core || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      category,
    })
  } catch (error) {
    console.error('Error in POST /api/platform/modules/categories:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

