import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Vérifie l'authentification N8N via header apikey
 * Vérifie que la clé correspond à la service_role key de Supabase
 */
export async function verifyN8NAuth(request: NextRequest): Promise<{ valid: boolean; error?: string }> {
  const apikey = request.headers.get('apikey')
  
  if (!apikey) {
    return { valid: false, error: 'Header apikey manquant' }
  }
  
  // Vérifier que c'est la bonne clé (service_role key)
  const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!expectedKey) {
    return { valid: false, error: 'SUPABASE_SERVICE_ROLE_KEY non configurée' }
  }
  
  if (apikey !== expectedKey) {
    return { valid: false, error: 'Clé API invalide' }
  }
  
  return { valid: true }
}

/**
 * Récupère un document avec ses items pour N8N
 */
export async function getDocumentForN8N(documentId: string) {
  const supabase = createAdminClient()
  
  // Récupérer le document
  const { data: document, error: docError } = await supabase
    .from('billing_documents')
    .select('*')
    .eq('id', documentId)
    .single()
  
  if (docError || !document) {
    return { data: null, error: 'Document non trouvé' }
  }
  
  // Récupérer les items
  const { data: items } = await supabase
    .from('billing_document_items')
    .select('*')
    .eq('document_id', documentId)
    .order('position', { ascending: true })
  
  return {
    data: {
      ...document,
      items: items || []
    },
    error: null
  }
}

/**
 * Récupère les paramètres de facturation pour N8N
 */
export async function getBillingSettingsForN8N(companyId: string) {
  const supabase = createAdminClient()
  
  const { data: settings, error } = await supabase
    .from('billing_settings')
    .select('*')
    .eq('company_id', companyId)
    .single()
  
  if (error) {
    return { data: null, error: 'Paramètres non trouvés' }
  }
  
  return { data: settings, error: null }
}

/**
 * Récupère tous les devis expirant dans X jours
 */
export async function getExpiringQuotes(daysUntilExpiry: number) {
  const supabase = createAdminClient()
  
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + daysUntilExpiry)
  const targetDateStr = targetDate.toISOString().split('T')[0]
  
  const { data: quotes, error } = await supabase
    .from('billing_documents')
    .select('*')
    .eq('document_type', 'quote')
    .eq('status', 'sent')
    .eq('valid_until', targetDateStr)
  
  if (error) {
    return { data: [], error: error.message }
  }
  
  return { data: quotes || [], error: null }
}

/**
 * Récupère toutes les factures pour relances
 */
export async function getInvoicesForReminders() {
  const supabase = createAdminClient()
  
  const { data: invoices, error } = await supabase
    .from('billing_documents')
    .select('*')
    .eq('document_type', 'invoice')
    .in('status', ['sent', 'overdue', 'partial'])
    .not('due_date', 'is', null)
  
  if (error) {
    return { data: [], error: error.message }
  }
  
  return { data: invoices || [], error: null }
}

/**
 * Met à jour le statut d'un document
 */
export async function updateDocumentStatus(
  documentId: string,
  status: string,
  additionalData?: Record<string, any>
) {
  const supabase = createAdminClient()
  
  const { data: document, error } = await supabase
    .from('billing_documents')
    .update({
      status,
      ...additionalData,
      updated_at: new Date().toISOString()
    })
    .eq('id', documentId)
    .select()
    .single()
  
  if (error) {
    return { data: null, error: error.message }
  }
  
  return { data: document, error: null }
}

/**
 * Met à jour l'URL du PDF d'un document
 */
export async function updateDocumentPdfUrl(documentId: string, pdfUrl: string) {
  const supabase = createAdminClient()
  
  const { data: document, error } = await supabase
    .from('billing_documents')
    .update({
      pdf_url: pdfUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', documentId)
    .select()
    .single()
  
  if (error) {
    return { data: null, error: error.message }
  }
  
  return { data: document, error: null }
}

