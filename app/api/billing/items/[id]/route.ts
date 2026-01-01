import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { BillingDocumentItem, calculateLineAmounts } from '@/lib/services/billing'

/**
 * PUT /api/billing/items/[id]
 * Met à jour une ligne
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
    
    // Récupérer la ligne existante
    const { data: existingItem } = await supabase
      .from('billing_document_items')
      .select('*, billing_documents!inner(company_id, status)')
      .eq('id', params.id)
      .single()
    
    if (!existingItem) {
      return NextResponse.json({ success: false, error: 'Ligne non trouvée' }, { status: 404 })
    }
    
    // Vérifier que le document appartient à l'entreprise
    if ((existingItem.billing_documents as any).company_id !== userData.company_id) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 })
    }
    
    // Ne pas permettre de modifier un document payé ou annulé
    const docStatus = (existingItem.billing_documents as any).status
    if (docStatus === 'paid' || docStatus === 'cancelled') {
      return NextResponse.json({ 
        success: false, 
        error: `Impossible de modifier un document ${docStatus === 'paid' ? 'payé' : 'annulé'}` 
      }, { status: 400 })
    }
    
    // Récupérer les données de mise à jour
    const updateData: Partial<BillingDocumentItem> = await request.json()
    
    // Recalculer les montants si nécessaire
    let amounts = null
    if (updateData.quantity !== undefined || updateData.unit_price !== undefined || updateData.tax_rate !== undefined) {
      amounts = calculateLineAmounts(
        updateData.quantity ?? existingItem.quantity,
        updateData.unit_price ?? existingItem.unit_price,
        updateData.tax_rate ?? existingItem.tax_rate
      )
    }
    
    // Mettre à jour la ligne
    const { data: item, error: updateError } = await supabaseAdmin
      .from('billing_document_items')
      .update({
        ...updateData,
        ...(amounts && {
          subtotal: amounts.subtotal,
          tax_amount: amounts.taxAmount,
          total: amounts.total
        }),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Erreur mise à jour ligne:', updateError)
      return NextResponse.json({ 
        success: false, 
        error: `Erreur mise à jour: ${updateError.message}` 
      }, { status: 500 })
    }
    
    // Le trigger recalcule automatiquement les totaux du document
    console.log('✅ Ligne mise à jour:', item.name)
    
    return NextResponse.json({
      success: true,
      data: item,
      message: 'Ligne mise à jour avec succès'
    })
    
  } catch (error: any) {
    console.error('Erreur API mise à jour ligne:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur interne: ${error.message}` 
    }, { status: 500 })
  }
}

/**
 * DELETE /api/billing/items/[id]
 * Supprime une ligne
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
    
    // Récupérer la ligne existante
    const { data: existingItem } = await supabase
      .from('billing_document_items')
      .select('name, billing_documents!inner(company_id, status)')
      .eq('id', params.id)
      .single()
    
    if (!existingItem) {
      return NextResponse.json({ success: false, error: 'Ligne non trouvée' }, { status: 404 })
    }
    
    // Vérifier que le document appartient à l'entreprise
    if ((existingItem.billing_documents as any).company_id !== userData.company_id) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 })
    }
    
    // Ne pas permettre de modifier un document payé ou annulé
    const docStatus = (existingItem.billing_documents as any).status
    if (docStatus === 'paid' || docStatus === 'cancelled') {
      return NextResponse.json({ 
        success: false, 
        error: `Impossible de modifier un document ${docStatus === 'paid' ? 'payé' : 'annulé'}` 
      }, { status: 400 })
    }
    
    // Supprimer la ligne
    const { error: deleteError } = await supabaseAdmin
      .from('billing_document_items')
      .delete()
      .eq('id', params.id)
    
    if (deleteError) {
      console.error('Erreur suppression ligne:', deleteError)
      return NextResponse.json({ 
        success: false, 
        error: `Erreur suppression: ${deleteError.message}` 
      }, { status: 500 })
    }
    
    // Le trigger recalcule automatiquement les totaux du document
    console.log('✅ Ligne supprimée:', existingItem.name)
    
    return NextResponse.json({
      success: true,
      message: 'Ligne supprimée avec succès'
    })
    
  } catch (error: any) {
    console.error('Erreur API suppression ligne:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur interne: ${error.message}` 
    }, { status: 500 })
  }
}

