import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { BillingDocumentItem, calculateLineAmounts } from '@/lib/services/billing'

/**
 * POST /api/billing/items/create
 * Ajoute une ligne à un document
 */
export async function POST(request: NextRequest) {
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
    
    // Récupérer les données de la ligne
    const itemData: BillingDocumentItem = await request.json()
    
    // Validations
    if (!itemData.document_id) {
      return NextResponse.json({ success: false, error: 'ID document requis' }, { status: 400 })
    }
    
    if (!itemData.name) {
      return NextResponse.json({ success: false, error: 'Nom requis' }, { status: 400 })
    }
    
    if (!itemData.quantity || itemData.quantity <= 0) {
      return NextResponse.json({ success: false, error: 'Quantité invalide' }, { status: 400 })
    }
    
    if (!itemData.unit_price || itemData.unit_price < 0) {
      return NextResponse.json({ success: false, error: 'Prix unitaire invalide' }, { status: 400 })
    }
    
    // Vérifier que le document existe et appartient à l'entreprise
    const { data: document } = await supabase
      .from('billing_documents')
      .select('id, status')
      .eq('id', itemData.document_id)
      .eq('company_id', userData.company_id)
      .single()
    
    if (!document) {
      return NextResponse.json({ success: false, error: 'Document non trouvé' }, { status: 404 })
    }
    
    // Ne pas permettre de modifier un document payé ou annulé
    if (document.status === 'paid' || document.status === 'cancelled') {
      return NextResponse.json({ 
        success: false, 
        error: `Impossible de modifier un document ${document.status === 'paid' ? 'payé' : 'annulé'}` 
      }, { status: 400 })
    }
    
    // Calculer les montants
    const amounts = calculateLineAmounts(
      itemData.quantity,
      itemData.unit_price,
      itemData.tax_rate || 20
    )
    
    // Obtenir la prochaine position
    const { data: lastItem } = await supabase
      .from('billing_document_items')
      .select('position')
      .eq('document_id', itemData.document_id)
      .order('position', { ascending: false })
      .limit(1)
      .single()
    
    const position = lastItem ? lastItem.position + 1 : 0
    
    // Préparer la ligne
    const newItem = {
      document_id: itemData.document_id,
      position,
      item_type: itemData.item_type || 'product',
      name: itemData.name,
      description: itemData.description || null,
      sku: itemData.sku || null,
      quantity: itemData.quantity,
      unit_price: itemData.unit_price,
      unit: itemData.unit || 'unité',
      tax_rate: itemData.tax_rate || 20,
      subtotal: amounts.subtotal,
      tax_amount: amounts.taxAmount,
      total: amounts.total,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Insérer la ligne
    const { data: item, error: insertError } = await supabaseAdmin
      .from('billing_document_items')
      .insert(newItem)
      .select()
      .single()
    
    if (insertError) {
      console.error('Erreur création ligne:', insertError)
      return NextResponse.json({ 
        success: false, 
        error: `Erreur création ligne: ${insertError.message}` 
      }, { status: 500 })
    }
    
    // Le trigger recalcule automatiquement les totaux du document
    console.log('✅ Ligne ajoutée:', item.name)
    
    return NextResponse.json({
      success: true,
      data: item,
      message: 'Ligne ajoutée avec succès'
    })
    
  } catch (error: any) {
    console.error('Erreur API création ligne:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur interne: ${error.message}` 
    }, { status: 500 })
  }
}

