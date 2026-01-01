import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/billing/stats
 * Récupère les statistiques de facturation
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
    
    // Paramètres optionnels
    const searchParams = request.nextUrl.searchParams
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null
    
    // Construire les filtres de date
    let dateStart = `${year}-01-01`
    let dateEnd = `${year}-12-31`
    
    if (month) {
      const lastDay = new Date(year, month, 0).getDate()
      dateStart = `${year}-${month.toString().padStart(2, '0')}-01`
      dateEnd = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`
    }
    
    // Récupérer tous les documents de la période
    const { data: documents } = await supabase
      .from('billing_documents')
      .select('document_type, status, total_amount, paid_amount, issue_date')
      .eq('company_id', userData.company_id)
      .gte('issue_date', dateStart)
      .lte('issue_date', dateEnd)
    
    if (!documents) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erreur récupération documents' 
      }, { status: 500 })
    }
    
    // Calculer les statistiques
    const stats = {
      // Chiffre d'affaires (factures payées)
      revenue: documents
        .filter(d => d.document_type === 'invoice' && d.status === 'paid')
        .reduce((sum, d) => sum + (d.total_amount || 0), 0),
      
      // Factures en attente de paiement
      pendingInvoices: {
        count: documents.filter(d => d.document_type === 'invoice' && d.status !== 'paid' && d.status !== 'cancelled').length,
        amount: documents
          .filter(d => d.document_type === 'invoice' && d.status !== 'paid' && d.status !== 'cancelled')
          .reduce((sum, d) => sum + ((d.total_amount || 0) - (d.paid_amount || 0)), 0)
      },
      
      // Factures en retard
      overdueInvoices: {
        count: documents.filter(d => d.document_type === 'invoice' && d.status === 'overdue').length,
        amount: documents
          .filter(d => d.document_type === 'invoice' && d.status === 'overdue')
          .reduce((sum, d) => sum + ((d.total_amount || 0) - (d.paid_amount || 0)), 0)
      },
      
      // Devis
      quotes: {
        total: documents.filter(d => d.document_type === 'quote').length,
        sent: documents.filter(d => d.document_type === 'quote' && d.status === 'sent').length,
        accepted: documents.filter(d => d.document_type === 'quote' && d.status === 'accepted').length,
        rejected: documents.filter(d => d.document_type === 'quote' && d.status === 'rejected').length,
        converted: documents.filter(d => d.document_type === 'quote' && d.status === 'converted').length,
        amount: documents
          .filter(d => d.document_type === 'quote')
          .reduce((sum, d) => sum + (d.total_amount || 0), 0)
      },
      
      // Avoirs
      creditNotes: {
        count: documents.filter(d => d.document_type === 'credit_note').length,
        amount: documents
          .filter(d => d.document_type === 'credit_note')
          .reduce((sum, d) => sum + (d.total_amount || 0), 0)
      },
      
      // Factures d'achat (dépenses)
      expenses: {
        count: documents.filter(d => d.document_type === 'purchase_invoice').length,
        amount: documents
          .filter(d => d.document_type === 'purchase_invoice')
          .reduce((sum, d) => sum + (d.total_amount || 0), 0)
      },
      
      // Taux de conversion devis → facture
      conversionRate: (() => {
        const totalQuotes = documents.filter(d => d.document_type === 'quote' && d.status !== 'draft').length
        const convertedQuotes = documents.filter(d => d.document_type === 'quote' && d.status === 'converted').length
        return totalQuotes > 0 ? Math.round((convertedQuotes / totalQuotes) * 100) : 0
      })(),
      
      // Délai moyen de paiement (en jours)
      averagePaymentDelay: (() => {
        const paidInvoices = documents.filter(d => 
          d.document_type === 'invoice' && 
          d.status === 'paid' &&
          d.paid_amount === d.total_amount
        )
        // Note: Pour calculer précisément, il faudrait paid_at - issue_date
        // Pour l'instant on retourne null
        return null
      })()
    }
    
    // Récupérer les factures non conformes (e-invoicing)
    const { data: nonCompliant } = await supabase
      .from('billing_non_compliant_invoices')
      .select('*')
      .eq('company_id', userData.company_id)
    
    return NextResponse.json({
      success: true,
      data: {
        period: {
          year,
          month: month || 'all',
          dateStart,
          dateEnd
        },
        stats,
        nonCompliantInvoices: nonCompliant?.length || 0
      }
    })
    
  } catch (error: any) {
    console.error('Erreur API stats:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur interne: ${error.message}` 
    }, { status: 500 })
  }
}

