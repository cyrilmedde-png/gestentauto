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
    console.log('[API N8N] Requête GET document ID:', id)
    console.log('[API N8N] URL complète:', request.url)
    
    // Vérifier authentification N8N
    const auth = await verifyN8NAuth(request)
    if (!auth.valid) {
      console.error('[API N8N] Authentification échouée:', auth.error)
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      )
    }
    
    console.log('[API N8N] Authentification OK')
    
    // Récupérer le document
    const { data, error } = await getDocumentForN8N(id)
    
    if (error || !data) {
      console.error('[API N8N] Document non trouvé ou erreur:', error)
      return NextResponse.json(
        { success: false, error: error || 'Document non trouvé' },
        { status: 404 }
      )
    }
    
    console.log('[API N8N] Document récupéré avec succès')
    return NextResponse.json({
      success: true,
      data
    })
    
  } catch (error: any) {
    console.error('[API N8N] Erreur inattendue:', error)
    console.error('[API N8N] Stack:', error.stack)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

