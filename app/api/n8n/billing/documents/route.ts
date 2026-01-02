import { NextRequest, NextResponse } from 'next/server'
import { verifyN8NAuth, getDocumentForN8N } from '@/lib/services/n8n-helpers'

/**
 * GET /api/n8n/billing/documents?document_id=xxx
 * Récupère un document avec ses items (pour N8N) - version avec query parameter
 * Authentification via header apikey
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('document_id')
    
    console.log('[API N8N] Requête GET document ID (query param):', documentId)
    console.log('[API N8N] URL complète:', request.url)
    
    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Paramètre document_id manquant' },
        { status: 400 }
      )
    }
    
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
    const { data, error } = await getDocumentForN8N(documentId)
    
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

