import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/billing/payments/list
 * Liste les paiements avec filtres optionnels
 */
export async function GET(request: NextRequest) {
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
    
    // Récupérer les paramètres de recherche
    const searchParams = request.nextUrl.searchParams
    const documentId = searchParams.get('document_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const paymentMethod = searchParams.get('payment_method')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Construire la requête
    let query = supabase
      .from('billing_payments')
      .select(`
        *,
        billing_documents!inner(
          id,
          document_number,
          document_type,
          customer_name,
          company_id
        )
      `, { count: 'exact' })
      .eq('billing_documents.company_id', userData.company_id)
      .order('payment_date', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Filtres
    if (documentId) {
      query = query.eq('document_id', documentId)
    }
    
    if (dateFrom) {
      query = query.gte('payment_date', dateFrom)
    }
    
    if (dateTo) {
      query = query.lte('payment_date', dateTo)
    }
    
    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod)
    }
    
    // Exécuter la requête
    const { data: payments, error, count } = await query
    
    if (error) {
      console.error('Erreur récupération paiements:', error)
      return NextResponse.json({ 
        success: false, 
        error: `Erreur récupération paiements: ${error.message}` 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: payments,
      count,
      limit,
      offset
    })
    
  } catch (error: any) {
    console.error('Erreur API liste paiements:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur interne: ${error.message}` 
    }, { status: 500 })
  }
}

