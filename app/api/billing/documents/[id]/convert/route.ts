import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { getNextDocumentNumber } from '@/lib/services/billing'

/**
 * POST /api/billing/documents/[id]/convert
 * Convertit un document en un autre type (ex: devis → facture)
 */
export async function POST(
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
    
    // Récupérer le document source
    const { data: sourceDoc, error: fetchError } = await supabase
      .from('billing_documents')
      .select('*')
      .eq('id', params.id)
      .eq('company_id', userData.company_id)
      .single()
    
    if (fetchError || !sourceDoc) {
      return NextResponse.json({ success: false, error: 'Document non trouvé' }, { status: 404 })
    }
    
    // Récupérer les lignes du document source
    const { data: sourceItems } = await supabase
      .from('billing_document_items')
      .select('*')
      .eq('document_id', params.id)
      .order('position', { ascending: true })
    
    // Récupérer le type de conversion souhaité
    const { target_type } = await request.json()
    
    if (!target_type) {
      return NextResponse.json({ success: false, error: 'Type de conversion requis' }, { status: 400 })
    }
    
    // Vérifier que la conversion est valide
    const validConversions = {
      quote: ['invoice', 'proforma'],
      proforma: ['invoice']
    }
    
    if (!validConversions[sourceDoc.document_type as keyof typeof validConversions]?.includes(target_type)) {
      return NextResponse.json({ 
        success: false, 
        error: `Conversion de ${sourceDoc.document_type} vers ${target_type} non autorisée` 
      }, { status: 400 })
    }
    
    // Générer le numéro du nouveau document
    const newDocumentNumber = await getNextDocumentNumber(
      userData.company_id,
      target_type
    )
    
    // Préparer le nouveau document
    const newDocument = {
      ...sourceDoc,
      id: undefined, // Laisser Supabase générer un nouveau UUID
      document_type: target_type,
      document_number: newDocumentNumber,
      status: 'draft',
      issue_date: new Date().toISOString().split('T')[0],
      converted_from_id: sourceDoc.id,
      sent_at: null,
      paid_at: null,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Si conversion vers facture, ajouter date d'échéance
    if (target_type === 'invoice') {
      const { data: settings } = await supabaseAdmin
        .from('billing_settings')
        .select('default_due_days')
        .eq('company_id', userData.company_id)
        .single()
      
      const dueDays = settings?.default_due_days || 30
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + dueDays)
      newDocument.due_date = dueDate.toISOString().split('T')[0]
    }
    
    // Créer le nouveau document
    const { data: createdDoc, error: createError } = await supabaseAdmin
      .from('billing_documents')
      .insert(newDocument)
      .select()
      .single()
    
    if (createError) {
      console.error('Erreur création document converti:', createError)
      return NextResponse.json({ 
        success: false, 
        error: `Erreur conversion: ${createError.message}` 
      }, { status: 500 })
    }
    
    // Copier les lignes
    if (sourceItems && sourceItems.length > 0) {
      const newItems = sourceItems.map(item => ({
        ...item,
        id: undefined, // Nouveau UUID
        document_id: createdDoc.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      const { error: itemsError } = await supabaseAdmin
        .from('billing_document_items')
        .insert(newItems)
      
      if (itemsError) {
        console.error('Erreur copie lignes:', itemsError)
        // Ne pas bloquer, on continue
      }
    }
    
    // Marquer le document source comme converti
    await supabaseAdmin
      .from('billing_documents')
      .update({ 
        status: 'converted',
        updated_at: new Date().toISOString()
      })
      .eq('id', sourceDoc.id)
    
    console.log(`✅ Document converti: ${sourceDoc.document_number} → ${createdDoc.document_number}`)
    
    return NextResponse.json({
      success: true,
      data: createdDoc,
      message: `${sourceDoc.document_type === 'quote' ? 'Devis' : 'Document'} ${sourceDoc.document_number} converti en ${target_type === 'invoice' ? 'facture' : 'proforma'} ${createdDoc.document_number}`
    })
    
  } catch (error: any) {
    console.error('Erreur API conversion document:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur interne: ${error.message}` 
    }, { status: 500 })
  }
}

