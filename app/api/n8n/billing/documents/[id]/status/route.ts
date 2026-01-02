import { NextRequest, NextResponse } from 'next/server'
import { verifyN8NAuth, updateDocumentStatus } from '@/lib/services/n8n-helpers'

/**
 * PUT /api/n8n/billing/documents/[id]/status
 * Met à jour le statut d'un document (pour N8N)
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
    
    // Récupérer les données
    const body = await request.json()
    const { status, sent_at, ...additionalData } = body
    
    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status requis' },
        { status: 400 }
      )
    }
    
    // Mettre à jour le document
    const updateData: Record<string, any> = { ...additionalData }
    if (sent_at) {
      updateData.sent_at = sent_at
    }
    
    const { data, error } = await updateDocumentStatus(id, status, updateData)
    
    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error || 'Erreur mise à jour' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: 'Statut mis à jour'
    })
    
  } catch (error: any) {
    console.error('Erreur API N8N update status:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

