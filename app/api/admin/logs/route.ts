import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isPlatformCompany } from '@/lib/platform/supabase'

/**
 * GET /api/admin/logs
 * Récupère les logs avec filtres
 * 
 * Query params:
 * - event_type: string (optionnel)
 * - status: success|error|warning|info (optionnel)
 * - company_id: uuid (optionnel)
 * - subscription_id: string (optionnel)
 * - date_from: ISO date (optionnel)
 * - date_to: ISO date (optionnel)
 * - limit: number (default 50)
 * - offset: number (default 0)
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

    // Vérifier que c'est un admin plateforme
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userData || !userData.company_id) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    const isAdmin = await isPlatformCompany(userData.company_id)
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      )
    }

    // Récupérer les paramètres de recherche
    const searchParams = request.nextUrl.searchParams
    const event_type = searchParams.get('event_type')
    const status = searchParams.get('status')
    const company_id = searchParams.get('company_id')
    const subscription_id = searchParams.get('subscription_id')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Construire la requête
    let query = supabase
      .from('subscription_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Appliquer les filtres
    if (event_type) {
      query = query.eq('event_type', event_type)
    }

    if (status) {
      // Support pour plusieurs status séparés par virgule (ex: "error,warning")
      const statusList = status.split(',').map(s => s.trim()).filter(s => s)
      if (statusList.length === 1) {
        query = query.eq('status', statusList[0])
      } else if (statusList.length > 1) {
        query = query.in('status', statusList)
      }
    }

    if (company_id) {
      query = query.eq('company_id', company_id)
    }

    if (subscription_id) {
      query = query.eq('subscription_id', subscription_id)
    }

    if (date_from) {
      query = query.gte('created_at', date_from)
    }

    if (date_to) {
      query = query.lte('created_at', date_to)
    }

    const { data: logs, error: logsError, count } = await query

    if (logsError) {
      console.error('❌ Erreur récupération logs:', logsError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des logs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      logs,
      total: count,
      limit,
      offset,
      hasMore: count ? (offset + limit) < count : false
    })

  } catch (error) {
    console.error('❌ Erreur API logs:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur serveur'
      },
      { status: 500 }
    )
  }
}

