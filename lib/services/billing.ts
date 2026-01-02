/**
 * Service Facturation (Server-side)
 * Fonctions serveur pour la gestion des documents de facturation
 */

import { createAdminClient } from '@/lib/supabase/server'

// Réexporter tous les types et fonctions utilitaires depuis billing-utils
export * from '@/lib/services/billing-utils'

/**
 * Générer le prochain numéro de document
 */
export async function getNextDocumentNumber(
  companyId: string,
  documentType: import('@/lib/services/billing-utils').DocumentType,
  year?: number
): Promise<string> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .rpc('get_next_document_number', {
      p_company_id: companyId,
      p_document_type: documentType,
      p_year: year || new Date().getFullYear()
    })
  
  if (error) {
    throw new Error(`Erreur génération numéro: ${error.message}`)
  }
  
  return data
}

/**
 * Vérifier conformité facturation électronique
 */
export async function checkElectronicCompliance(documentId: string): Promise<{
  isCompliant: boolean
  missingFields: string[]
}> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .rpc('check_electronic_invoice_compliance', {
      p_document_id: documentId
    })
  
  if (error) {
    throw new Error(`Erreur vérification conformité: ${error.message}`)
  }
  
  return {
    isCompliant: data.is_compliant,
    missingFields: data.missing_fields || []
  }
}
