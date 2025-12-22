import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getPlatformCompanyId } from '@/lib/platform/supabase'

/**
 * GET /api/settings/company
 * Récupère les données de l'entreprise du client connecté
 * ⚠️ Accès réservé aux clients (non plateforme)
 */
export async function GET(request: NextRequest) {
  try {
    // Priorité 1 : Récupérer depuis le header X-User-Id (plus fiable)
    let userId = request.headers.get('X-User-Id')
    
    // Priorité 2 : Essayer depuis les cookies si pas de header
    if (!userId) {
      const supabase = await createServerClient(request)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (user) {
        userId = user.id
      }
    }
    
    if (!userId) {
      console.error('No user ID found in header or cookies')
      return NextResponse.json(
        { error: 'Not authenticated. Please log in or provide X-User-Id header.' },
        { status: 401 }
      )
    }
    
    // Utiliser le client admin pour récupérer les données (bypass RLS si nécessaire)
    const supabase = await createServerClient(request)

    // Récupérer les données utilisateur avec son company_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Vérifier que ce n'est pas un utilisateur plateforme
    const platformId = await getPlatformCompanyId()
    if (platformId && userData.company_id === platformId) {
      return NextResponse.json(
        { error: 'Platform users should use /api/settings/platform' },
        { status: 403 }
      )
    }

    // Récupérer les données de l'entreprise du client
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', userData.company_id)
      .single()

    if (companyError) {
      throw companyError
    }

    return NextResponse.json({ company })
  } catch (error) {
    console.error('Erreur API company settings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/company
 * Met à jour les données de l'entreprise du client connecté
 * ⚠️ Accès réservé aux clients (non plateforme)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Priorité 1 : Récupérer depuis le header X-User-Id (plus fiable)
    let userId = request.headers.get('X-User-Id')
    
    // Priorité 2 : Essayer depuis les cookies si pas de header
    if (!userId) {
      const supabase = await createServerClient(request)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (user) {
        userId = user.id
      }
    }
    
    if (!userId) {
      console.error('No user ID found in header or cookies')
      return NextResponse.json(
        { error: 'Not authenticated. Please log in or provide X-User-Id header.' },
        { status: 401 }
      )
    }
    
    const supabase = await createServerClient(request)

    // Récupérer les données utilisateur avec son company_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Vérifier que ce n'est pas un utilisateur plateforme
    const platformId = await getPlatformCompanyId()
    if (platformId && userData.company_id === platformId) {
      return NextResponse.json(
        { error: 'Platform users should use /api/settings/platform' },
        { status: 403 }
      )
    }

    // Mettre à jour uniquement l'entreprise du client connecté
    const { data: updated, error: updateError } = await supabase
      .from('companies')
      .update({
        name: body.name,
        siret: body.siret || null,
        vat_number: body.vat_number || null,
        address: body.address || null,
        city: body.city || null,
        postal_code: body.postal_code || null,
        country: body.country || 'FR',
        phone: body.phone || null,
        email: body.email || null
      })
      .eq('id', userData.company_id) // ⚠️ Important : seulement SON entreprise
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ company: updated })
  } catch (error) {
    console.error('Erreur API company settings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}

