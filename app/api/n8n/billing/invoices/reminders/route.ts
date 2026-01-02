import { NextRequest, NextResponse } from 'next/server'
import { verifyN8NAuth, getInvoicesForReminders } from '@/lib/services/n8n-helpers'

/**
 * GET /api/n8n/billing/invoices/reminders
 * Récupère toutes les factures pour relances (pour N8N cron)
 * Authentification via header apikey
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
    
    // Récupérer les factures
    const { data, error } = await getInvoicesForReminders()
    
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
    console.error('Erreur API N8N invoices reminders:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

