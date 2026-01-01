import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isPlatformCompany } from '@/lib/services/auth-helpers'

/**
 * GET /api/admin/logs/stats
 * Récupère les statistiques des logs
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

    // Vérifier admin
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userData || !isPlatformCompany(userData.company_id)) {
      return NextResponse.json(
        { success: false, error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      )
    }

    // Paramètres
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '7')

    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)

    // Stats globales
    const { data: stats } = await supabase
      .from('subscription_logs')
      .select('status, event_type, created_at')
      .gte('created_at', dateFrom.toISOString())

    if (!stats) {
      return NextResponse.json({
        success: true,
        totalLogs: 0,
        byStatus: {},
        byEventType: {},
        successRate: 0,
        errorRate: 0
      })
    }

    // Calculer les statistiques
    const totalLogs = stats.length
    const successCount = stats.filter(l => l.status === 'success').length
    const errorCount = stats.filter(l => l.status === 'error').length
    const warningCount = stats.filter(l => l.status === 'warning').length
    const infoCount = stats.filter(l => l.status === 'info').length

    // Par type d'événement
    const byEventType: Record<string, number> = {}
    stats.forEach(log => {
      byEventType[log.event_type] = (byEventType[log.event_type] || 0) + 1
    })

    // Par jour (derniers 7 jours)
    const byDay: Record<string, { success: number; error: number; warning: number; info: number }> = {}
    stats.forEach(log => {
      const day = new Date(log.created_at).toISOString().split('T')[0]
      if (!byDay[day]) {
        byDay[day] = { success: 0, error: 0, warning: 0, info: 0 }
      }
      byDay[day][log.status as 'success' | 'error' | 'warning' | 'info']++
    })

    return NextResponse.json({
      success: true,
      totalLogs,
      byStatus: {
        success: successCount,
        error: errorCount,
        warning: warningCount,
        info: infoCount
      },
      byEventType,
      byDay,
      successRate: totalLogs > 0 ? Math.round((successCount / totalLogs) * 100) : 0,
      errorRate: totalLogs > 0 ? Math.round((errorCount / totalLogs) * 100) : 0,
      period: {
        from: dateFrom.toISOString(),
        to: new Date().toISOString(),
        days
      }
    })

  } catch (error) {
    console.error('❌ Erreur API stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur serveur'
      },
      { status: 500 }
    )
  }
}

