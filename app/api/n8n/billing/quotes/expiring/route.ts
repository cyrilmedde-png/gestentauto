import { NextRequest, NextResponse } from 'next/server'
import { verifyN8NAuth, getExpiringQuotes } from '@/lib/services/n8n-helpers'

/**
 * GET /api/n8n/billing/quotes/expiring
 * Récupère les devis expirant dans X jours (pour N8N cron)
 * Authentification via header apikey
 * Query param: days (default: 3)
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier authentification N8N
    const auth = await verifyN8NAuth(request)
    if (!auth.valid) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      )
    }
    
    // Récupérer le nombre de jours
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '3')
    
    // Récupérer les devis
    const { data, error } = await getExpiringQuotes(days)
    
    if (error) {
      return NextResponse.json(
        { success: false, error },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data,
      count: data.length
    })
    
  } catch (error: any) {
    console.error('Erreur API N8N expiring quotes:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

