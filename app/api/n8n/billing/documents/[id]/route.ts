import { NextRequest, NextResponse } from 'next/server'
import { verifyN8NAuth, getDocumentForN8N } from '@/lib/services/n8n-helpers'

/**
 * GET /api/n8n/billing/documents/[id]
 * Récupère un document avec ses items (pour N8N)
 * Authentification via header apikey
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Vérifier authentification N8N
    const auth = await verifyN8NAuth(request)
    if (!auth.valid) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      )
    }
    
    // Récupérer le document
    const { data, error } = await getDocumentForN8N(id)
    
    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error || 'Document non trouvé' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data
    })
    
  } catch (error: any) {
    console.error('Erreur API N8N document:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

