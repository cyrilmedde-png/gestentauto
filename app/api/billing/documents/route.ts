import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { DocumentType } from '@/lib/services/billing'

/**
 * GET /api/billing/documents
 * Liste les documents de facturation avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient(request)
    
    // Vérifier authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }
    
    // Récupérer company_id de l'utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData) {
      return NextResponse.json({ success: false, error: 'Utilisateur non trouvé' }, { status: 404 })
    }
    
    // Récupérer les paramètres de recherche
    const searchParams = request.nextUrl.searchParams
    const documentType = searchParams.get('type') as DocumentType | null
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Construire la requête
    let query = supabase
      .from('billing_documents')
      .select('*', { count: 'exact' })
      .eq('company_id', userData.company_id)
      .order('issue_date', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Filtres
    if (documentType) {
      query = query.eq('document_type', documentType)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (search) {
      query = query.or(`document_number.ilike.%${search}%,customer_name.ilike.%${search}%,reference.ilike.%${search}%`)
    }
    
    if (dateFrom) {
      query = query.gte('issue_date', dateFrom)
    }
    
    if (dateTo) {
      query = query.lte('issue_date', dateTo)
    }
    
    // Exécuter la requête
    const { data: documents, error, count } = await query
    
    if (error) {
      console.error('Erreur récupération documents:', error)
      return NextResponse.json({ 
        success: false, 
        error: `Erreur récupération documents: ${error.message}` 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: documents,
      count,
      limit,
      offset
    })
    
  } catch (error: any) {
    console.error('Erreur API documents:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur interne: ${error.message}` 
    }, { status: 500 })
  }
}

