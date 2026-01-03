import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyN8NAuth } from '@/lib/services/n8n-helpers'
import { 
  getNextDocumentNumber, 
  validateSiren,
  calculateDueDate,
  calculateValidUntil
} from '@/lib/services/billing'

/**
 * POST /api/n8n/billing/documents/create
 * Crée un nouveau document de facturation (pour N8N)
 * Authentification via header apikey
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier authentification N8N
    const auth = await verifyN8NAuth(request)
    if (!auth.valid) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      )
    }

    const supabaseAdmin = createAdminClient()
    
    // Récupérer les données du document
    const documentData = await request.json()
    
    // Validations
    if (!documentData.document_type) {
      return NextResponse.json(
        { success: false, error: 'Type de document requis' },
        { status: 400 }
      )
    }
    
    if (!documentData.customer_name) {
      return NextResponse.json(
        { success: false, error: 'Nom du client requis' },
        { status: 400 }
      )
    }

    if (!documentData.company_id) {
      return NextResponse.json(
        { success: false, error: 'company_id requis' },
        { status: 400 }
      )
    }
    
    // Valider SIREN si fourni
    if (documentData.customer_siren && !validateSiren(documentData.customer_siren)) {
      return NextResponse.json({ 
        success: false, 
        error: 'SIREN invalide: doit être 9 chiffres' 
      }, { status: 400 })
    }
    
    // Générer le numéro de document
    const documentNumber = await getNextDocumentNumber(
      documentData.company_id,
      documentData.document_type
    )
    
    // Date d'émission par défaut
    const issueDate = documentData.issue_date || new Date().toISOString().split('T')[0]
    
    // Calculer dates automatiques
    let dueDate = documentData.due_date
    let validUntil = documentData.valid_until
    
    if (documentData.document_type === 'invoice' && !dueDate) {
      // Récupérer les paramètres par défaut
      const { data: settings } = await supabaseAdmin
        .from('billing_settings')
        .select('default_due_days')
        .eq('company_id', documentData.company_id)
        .single()
      
      const dueDays = settings?.default_due_days || 30
      dueDate = calculateDueDate(issueDate, dueDays)
    }
    
    if (documentData.document_type === 'quote' && !validUntil) {
      // Récupérer les paramètres par défaut
      const { data: settings } = await supabaseAdmin
        .from('billing_settings')
        .select('default_quote_validity_days')
        .eq('company_id', documentData.company_id)
        .single()
      
      const validityDays = settings?.default_quote_validity_days || 30
      validUntil = calculateValidUntil(issueDate, validityDays)
    }
    
    // Préparer les données à insérer
    const newDocument = {
      ...documentData,
      document_number: documentNumber,
      company_id: documentData.company_id,
      issue_date: issueDate,
      due_date: dueDate,
      valid_until: validUntil,
      status: documentData.status || 'draft',
      subtotal: documentData.subtotal || 0,
      tax_amount: documentData.tax_amount || 0,
      tax_rate: documentData.tax_rate || 20,
      discount_amount: documentData.discount_amount || 0,
      total_amount: documentData.total_amount || 0,
      paid_amount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Insérer le document
    const { data: document, error: insertError } = await supabaseAdmin
      .from('billing_documents')
      .insert(newDocument)
      .select()
      .single()
    
    if (insertError) {
      console.error('Erreur création document:', insertError)
      return NextResponse.json({ 
        success: false, 
        error: `Erreur création document: ${insertError.message}` 
      }, { status: 500 })
    }
    
    console.log('✅ Document créé via N8N:', document.document_number)
    
    return NextResponse.json({
      success: true,
      data: document,
      message: `${documentData.document_type === 'quote' ? 'Devis' : 'Document'} ${document.document_number} créé avec succès`
    })
    
  } catch (error: any) {
    console.error('Erreur API N8N création document:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur interne: ${error.message}` 
    }, { status: 500 })
  }
}

