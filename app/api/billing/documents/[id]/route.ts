import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { BillingDocument, validateSiren } from '@/lib/services/billing'

/**
 * GET /api/billing/documents/[id]
 * Récupère un document spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient(request)
    
    // Vérifier authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }
    
    // Récupérer company_id
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (!userData) {
      return NextResponse.json({ success: false, error: 'Utilisateur non trouvé' }, { status: 404 })
    }
    
    // Récupérer le document
    const { data: document, error } = await supabase
      .from('billing_documents')
      .select('*')
      .eq('id', params.id)
      .eq('company_id', userData.company_id)
      .single()
    
    if (error) {
      return NextResponse.json({ success: false, error: 'Document non trouvé' }, { status: 404 })
    }
    
    // Récupérer les lignes
    const { data: items } = await supabase
      .from('billing_document_items')
      .select('*')
      .eq('document_id', params.id)
      .order('position', { ascending: true })
    
    return NextResponse.json({
      success: true,
      data: {
        ...document,
        items: items || []
      }
    })
    
  } catch (error: any) {
    console.error('Erreur récupération document:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur interne: ${error.message}` 
    }, { status: 500 })
  }
}

/**
 * PUT /api/billing/documents/[id]
 * Met à jour un document
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient(request)
    const supabaseAdmin = createAdminClient()
    
    // Vérifier authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }
    
    // Récupérer company_id
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (!userData) {
      return NextResponse.json({ success: false, error: 'Utilisateur non trouvé' }, { status: 404 })
    }
    
    // Vérifier que le document existe et appartient à l'entreprise
    const { data: existingDoc } = await supabase
      .from('billing_documents')
      .select('id, status')
      .eq('id', params.id)
      .eq('company_id', userData.company_id)
      .single()
    
    if (!existingDoc) {
      return NextResponse.json({ success: false, error: 'Document non trouvé' }, { status: 404 })
    }
    
    // Récupérer les données de mise à jour
    const updateData: Partial<BillingDocument> = await request.json()
    
    // Valider SIREN si fourni
    if (updateData.customer_siren && !validateSiren(updateData.customer_siren)) {
      return NextResponse.json({ 
        success: false, 
        error: 'SIREN invalide: doit être 9 chiffres' 
      }, { status: 400 })
    }
    
    // Ne pas permettre de modifier un document payé ou annulé
    if (existingDoc.status === 'paid' || existingDoc.status === 'cancelled') {
      return NextResponse.json({ 
        success: false, 
        error: `Impossible de modifier un document ${existingDoc.status === 'paid' ? 'payé' : 'annulé'}` 
      }, { status: 400 })
    }
    
    // Mettre à jour le document
    const { data: document, error: updateError } = await supabaseAdmin
      .from('billing_documents')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Erreur mise à jour document:', updateError)
      return NextResponse.json({ 
        success: false, 
        error: `Erreur mise à jour: ${updateError.message}` 
      }, { status: 500 })
    }
    
    console.log('✅ Document mis à jour:', document.document_number)
    
    return NextResponse.json({
      success: true,
      data: document,
      message: 'Document mis à jour avec succès'
    })
    
  } catch (error: any) {
    console.error('Erreur API mise à jour document:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur interne: ${error.message}` 
    }, { status: 500 })
  }
}

/**
 * DELETE /api/billing/documents/[id]
 * Supprime un document (seulement si brouillon)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient(request)
    const supabaseAdmin = createAdminClient()
    
    // Vérifier authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }
    
    // Récupérer company_id
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (!userData) {
      return NextResponse.json({ success: false, error: 'Utilisateur non trouvé' }, { status: 404 })
    }
    
    // Vérifier que le document existe et est en brouillon
    const { data: document } = await supabase
      .from('billing_documents')
      .select('document_number, status')
      .eq('id', params.id)
      .eq('company_id', userData.company_id)
      .single()
    
    if (!document) {
      return NextResponse.json({ success: false, error: 'Document non trouvé' }, { status: 404 })
    }
    
    if (document.status !== 'draft') {
      return NextResponse.json({ 
        success: false, 
        error: 'Seuls les documents en brouillon peuvent être supprimés' 
      }, { status: 400 })
    }
    
    // Supprimer le document (cascade sur les items)
    const { error: deleteError } = await supabaseAdmin
      .from('billing_documents')
      .delete()
      .eq('id', params.id)
    
    if (deleteError) {
      console.error('Erreur suppression document:', deleteError)
      return NextResponse.json({ 
        success: false, 
        error: `Erreur suppression: ${deleteError.message}` 
      }, { status: 500 })
    }
    
    console.log('✅ Document supprimé:', document.document_number)
    
    return NextResponse.json({
      success: true,
      message: `Document ${document.document_number} supprimé avec succès`
    })
    
  } catch (error: any) {
    console.error('Erreur API suppression document:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur interne: ${error.message}` 
    }, { status: 500 })
  }
}

