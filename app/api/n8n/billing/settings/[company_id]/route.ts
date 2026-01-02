import { NextRequest, NextResponse } from 'next/server'
import { verifyN8NAuth, getBillingSettingsForN8N } from '@/lib/services/n8n-helpers'

/**
 * GET /api/n8n/billing/settings/[company_id]
 * Récupère les paramètres de facturation (pour N8N)
 * Authentification via header apikey
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ company_id: string }> }
) {
  try {
    const { company_id } = await params
    
    // Vérifier authentification N8N
    const auth = await verifyN8NAuth(request)
    if (!auth.valid) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      )
    }
    
    // Récupérer les settings
    const { data, error } = await getBillingSettingsForN8N(company_id)
    
    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error || 'Paramètres non trouvés' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data
    })
    
  } catch (error: any) {
    console.error('Erreur API N8N settings:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

