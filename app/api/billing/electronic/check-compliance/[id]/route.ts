import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { checkElectronicCompliance } from '@/lib/services/billing'

/**
 * GET /api/billing/electronic/check-compliance/[id]
 * Vérifie la conformité d'un document pour la facturation électronique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    
    // Vérifier que le document existe et appartient à l'entreprise
    const { data: document } = await supabase
      .from('billing_documents')
      .select('id, document_number, document_type')
      .eq('id', id)
      .eq('company_id', userData.company_id)
      .single()
    
    if (!document) {
      return NextResponse.json({ success: false, error: 'Document non trouvé' }, { status: 404 })
    }
    
    // Vérifier la conformité via SQL function
    const compliance = await checkElectronicCompliance(id)
    
    return NextResponse.json({
      success: true,
      data: {
        documentNumber: document.document_number,
        documentType: document.document_type,
        isCompliant: compliance.isCompliant,
        missingFields: compliance.missingFields,
        warnings: compliance.isCompliant ? [] : [
          'Ce document ne respecte pas les obligations de la facturation électronique.',
          `Risque de sanction: ${compliance.missingFields.length * 15}€`,
          'Veuillez compléter les champs manquants avant envoi.'
        ]
      }
    })
    
  } catch (error: any) {
    console.error('Erreur vérification conformité:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur interne: ${error.message}` 
    }, { status: 500 })
  }
}

