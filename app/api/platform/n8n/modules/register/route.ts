import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'

/**
 * API pour enregistrer un nouveau module créé par N8N
 * POST /api/platform/n8n/modules/register
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est un admin plateforme
    const { isPlatform, error: authError } = await verifyPlatformUser(request)
    if (!isPlatform) {
      return NextResponse.json(
        { error: authError || 'Non autorisé - Plateforme uniquement' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      display_name,
      description,
      price_monthly,
      price_yearly,
      icon = 'Package',
      category = 'custom',
      features = [],
      n8n_workflow_id,
      route_slug,
      table_name,
    } = body

    // Validation des champs requis
    if (!name || !display_name || !price_monthly) {
      return NextResponse.json(
        { error: 'Champs requis manquants: name, display_name, price_monthly' },
        { status: 400 }
      )
    }

    // Validation du format du nom (slug)
    if (!/^[a-z0-9-]+$/.test(name)) {
      return NextResponse.json(
        { error: 'Le nom du module doit être un slug (minuscules, chiffres, tirets uniquement)' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Vérifier si le module existe déjà
    const { data: existingModule } = await supabase
      .from('available_modules')
      .select('id')
      .eq('name', name)
      .single()

    if (existingModule) {
      return NextResponse.json(
        { error: 'Un module avec ce nom existe déjà' },
        { status: 409 }
      )
    }

    // Créer le module
    const { data: newModule, error: createError } = await supabase
      .from('available_modules')
      .insert({
        name,
        display_name,
        description,
        price_monthly: parseFloat(price_monthly),
        price_yearly: price_yearly ? parseFloat(price_yearly) : null,
        icon,
        category,
        features: Array.isArray(features) ? features : [],
        is_n8n_created: true,
        n8n_workflow_id: n8n_workflow_id || null,
        route_slug: route_slug || name,
        table_name: table_name || null,
        is_active: true,
      })
      .select()
      .single()

    if (createError) {
      console.error('Erreur lors de la création du module:', createError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du module', details: createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      module: newModule,
    }, { status: 201 })
  } catch (error) {
    console.error('Erreur dans /api/platform/n8n/modules/register:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

