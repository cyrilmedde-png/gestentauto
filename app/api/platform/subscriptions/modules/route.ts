import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAvailableModules, getActiveModules } from '@/lib/modules/subscriptions'

/**
 * GET /api/platform/subscriptions/modules
 * Récupère tous les modules disponibles et les modules activés pour l'entreprise de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer l'entreprise de l'utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.company_id) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      )
    }

    // Récupérer tous les modules disponibles
    const availableModules = await getAvailableModules()

    // Récupérer les modules activés pour cette entreprise
    const activeModules = await getActiveModules(userData.company_id)

    // Créer un map des modules activés pour faciliter la vérification
    const activeModuleIds = new Set(activeModules.map(m => m.module_id))
    const activeModuleNames = new Set(activeModules.map(m => m.module.name))

    // Ajouter le module "starter" si l'entreprise existe (toujours inclus)
    if (!activeModuleNames.has('starter')) {
      const starterModule = availableModules.find(m => m.name === 'starter')
      if (starterModule) {
        activeModuleNames.add('starter')
      }
    }

    return NextResponse.json({
      available: availableModules,
      active: activeModules,
      activeModuleIds: Array.from(activeModuleIds),
      activeModuleNames: Array.from(activeModuleNames),
    })
  } catch (error) {
    console.error('Erreur dans /api/platform/subscriptions/modules:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}




