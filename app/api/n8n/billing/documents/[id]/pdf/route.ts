import { NextRequest, NextResponse } from 'next/server'
import { verifyN8NAuth, updateDocumentPdfUrl } from '@/lib/services/n8n-helpers'

/**
 * PUT /api/n8n/billing/documents/[id]/pdf
 * Met à jour l'URL PDF d'un document (pour N8N)
 * Authentification via header apikey
 */
export async function PUT(
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
    
    // Récupérer l'URL du PDF
    const body = await request.json()
    const { pdf_url } = body
    
    if (!pdf_url) {
      return NextResponse.json(
        { success: false, error: 'pdf_url requis' },
        { status: 400 }
      )
    }
    
    // Mettre à jour le document
    const { data, error } = await updateDocumentPdfUrl(id, pdf_url)
    
    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error || 'Erreur mise à jour PDF' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: 'URL PDF mise à jour'
    })
    
  } catch (error: any) {
    console.error('Erreur API N8N update PDF:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

