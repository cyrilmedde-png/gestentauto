import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/billing/payments/create
 * Enregistre un paiement pour un document
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
    
    // Récupérer les données du paiement
    const { 
      document_id, 
      amount, 
      payment_method, 
      payment_date, 
      transaction_reference, 
      notes 
    } = await request.json()
    
    // Validations
    if (!document_id) {
      return NextResponse.json({ success: false, error: 'ID document requis' }, { status: 400 })
    }
    
    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Montant invalide' }, { status: 400 })
    }
    
    if (!payment_method) {
      return NextResponse.json({ success: false, error: 'Méthode de paiement requise' }, { status: 400 })
    }
    
    // Récupérer le document
    const { data: document, error: docError } = await supabase
      .from('billing_documents')
      .select('id, document_number, total_amount, paid_amount, status')
      .eq('id', document_id)
      .eq('company_id', userData.company_id)
      .single()
    
    if (docError || !document) {
      return NextResponse.json({ success: false, error: 'Document non trouvé' }, { status: 404 })
    }
    
    // Vérifier que le document n'est pas déjà payé
    if (document.status === 'paid') {
      return NextResponse.json({ success: false, error: 'Document déjà payé' }, { status: 400 })
    }
    
    // Vérifier que le montant ne dépasse pas le solde dû
    const remainingAmount = document.total_amount - (document.paid_amount || 0)
    if (amount > remainingAmount) {
      return NextResponse.json({ 
        success: false, 
        error: `Montant trop élevé. Solde restant: ${remainingAmount.toFixed(2)}€` 
      }, { status: 400 })
    }
    
    // Créer le paiement
    const newPayment = {
      document_id,
      amount,
      payment_method,
      payment_date: payment_date || new Date().toISOString().split('T')[0],
      transaction_reference: transaction_reference || null,
      notes: notes || null,
      created_by: user.id,
      created_at: new Date().toISOString()
    }
    
    const { data: payment, error: insertError } = await supabaseAdmin
      .from('billing_payments')
      .insert(newPayment)
      .select()
      .single()
    
    if (insertError) {
      console.error('Erreur création paiement:', insertError)
      return NextResponse.json({ 
        success: false, 
        error: `Erreur création paiement: ${insertError.message}` 
      }, { status: 500 })
    }
    
    // Le trigger met automatiquement à jour le document (paid_amount, status, paid_at)
    
    // Récupérer le document mis à jour
    const { data: updatedDoc } = await supabase
      .from('billing_documents')
      .select('paid_amount, status')
      .eq('id', document_id)
      .single()
    
    console.log(`✅ Paiement enregistré: ${amount}€ pour ${document.document_number}`)
    
    return NextResponse.json({
      success: true,
      data: {
        payment,
        document: updatedDoc
      },
      message: `Paiement de ${amount}€ enregistré avec succès`
    })
    
  } catch (error: any) {
    console.error('Erreur API création paiement:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur interne: ${error.message}` 
    }, { status: 500 })
  }
}

