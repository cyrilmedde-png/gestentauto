/**
 * Service Facturation
 * Fonctions utilitaires pour la gestion des documents de facturation
 */

import { createAdminClient } from '@/lib/supabase/server'

// Types
export type DocumentType = 'quote' | 'proforma' | 'invoice' | 'credit_note' | 'purchase_invoice'
export type DocumentStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'converted'
export type OperationCategory = 'goods' | 'services' | 'both'
export type ElectronicFormat = 'factur-x' | 'ubl' | 'cii'

export interface BillingDocument {
  id?: string
  document_type: DocumentType
  document_number?: string
  reference?: string
  issue_date: string
  due_date?: string
  valid_until?: string
  status: DocumentStatus
  
  // Client
  company_id: string
  customer_id?: string
  customer_name: string
  customer_email?: string
  customer_address?: string
  customer_vat_number?: string
  customer_siren?: string
  
  // Catégorie & Livraison
  operation_category?: OperationCategory
  vat_on_debit?: boolean
  delivery_address?: string
  delivery_city?: string
  delivery_postal_code?: string
  delivery_country?: string
  
  // Montants
  subtotal?: number
  tax_amount?: number
  tax_rate?: number
  discount_amount?: number
  total_amount?: number
  
  // Paiement
  payment_method?: string
  payment_terms?: string
  paid_amount?: number
  
  // Relations
  parent_document_id?: string
  converted_from_id?: string
  
  // Facturation électronique
  electronic_format?: ElectronicFormat
  electronic_status?: string
  platform_name?: string
  
  // Notes
  notes?: string
  internal_notes?: string
  terms_and_conditions?: string
  
  // Métadonnées
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface BillingDocumentItem {
  id?: string
  document_id: string
  position: number
  item_type: 'product' | 'service' | 'discount' | 'shipping'
  name: string
  description?: string
  sku?: string
  quantity: number
  unit_price: number
  unit?: string
  tax_rate: number
  subtotal: number
  tax_amount: number
  total: number
}

/**
 * Générer le prochain numéro de document
 */
export async function getNextDocumentNumber(
  companyId: string,
  documentType: DocumentType,
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
 * Calculer les montants d'une ligne
 */
export function calculateLineAmounts(
  quantity: number,
  unitPrice: number,
  taxRate: number = 20
): { subtotal: number, taxAmount: number, total: number } {
  const subtotal = Math.round(quantity * unitPrice * 100) / 100
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100
  const total = Math.round((subtotal + taxAmount) * 100) / 100
  
  return { subtotal, taxAmount, total }
}

/**
 * Calculer les totaux d'un document depuis ses lignes
 */
export function calculateDocumentTotals(
  items: BillingDocumentItem[],
  discountAmount: number = 0
): { subtotal: number, taxAmount: number, total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const taxAmount = items.reduce((sum, item) => sum + item.tax_amount, 0)
  const total = subtotal + taxAmount - discountAmount
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100
  }
}

/**
 * Valider SIREN (9 chiffres)
 */
export function validateSiren(siren: string): boolean {
  return /^[0-9]{9}$/.test(siren)
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

/**
 * Obtenir le préfixe par type de document
 */
export function getDocumentPrefix(documentType: DocumentType): string {
  const prefixes = {
    quote: 'DEV',
    proforma: 'PRO',
    invoice: 'FAC',
    credit_note: 'AVO',
    purchase_invoice: 'ACH'
  }
  return prefixes[documentType]
}

/**
 * Obtenir le libellé par type de document
 */
export function getDocumentLabel(documentType: DocumentType): string {
  const labels = {
    quote: 'Devis',
    proforma: 'Proforma',
    invoice: 'Facture',
    credit_note: 'Avoir',
    purchase_invoice: "Facture d'achat"
  }
  return labels[documentType]
}

/**
 * Calculer la date d'échéance (N jours après émission)
 */
export function calculateDueDate(issueDate: string, dueDays: number = 30): string {
  const date = new Date(issueDate)
  date.setDate(date.getDate() + dueDays)
  return date.toISOString().split('T')[0]
}

/**
 * Calculer la date de validité d'un devis (N jours après émission)
 */
export function calculateValidUntil(issueDate: string, validityDays: number = 30): string {
  return calculateDueDate(issueDate, validityDays)
}

/**
 * Vérifier si un document est en retard de paiement
 */
export function isOverdue(dueDate: string, status: DocumentStatus): boolean {
  if (status === 'paid') return false
  const today = new Date()
  const due = new Date(dueDate)
  return today > due
}

/**
 * Formater un montant en euros
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

