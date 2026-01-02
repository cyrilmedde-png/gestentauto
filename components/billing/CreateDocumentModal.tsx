'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Save, Send } from 'lucide-react'
import { 
  BillingDocument, 
  BillingDocumentItem, 
  DocumentType,
  calculateLineAmounts,
  calculateDocumentTotals,
  formatAmount
} from '@/lib/services/billing'

interface CreateDocumentModalProps {
  onClose: () => void
  onSuccess: () => void
  defaultType?: DocumentType
}

export function CreateDocumentModal({ onClose, onSuccess, defaultType = 'quote' }: CreateDocumentModalProps) {
  const [documentType, setDocumentType] = useState<DocumentType>(defaultType)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerSiren, setCustomerSiren] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('Paiement sous 30 jours')
  const [notes, setNotes] = useState('')
  
  const [items, setItems] = useState<BillingDocumentItem[]>([
    {
      document_id: '',
      position: 0,
      item_type: 'product',
      name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      unit: 'unité',
      tax_rate: 20,
      subtotal: 0,
      tax_amount: 0,
      total: 0
    }
  ])
  
  const [taxRate, setTaxRate] = useState(20)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendAfterCreate, setSendAfterCreate] = useState(false)

  // Calculer les totaux
  const totals = calculateDocumentTotals(items, discountAmount)

  // Ajouter une ligne
  const addItem = () => {
    setItems([...items, {
      document_id: '',
      position: items.length,
      item_type: 'product',
      name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      unit: 'unité',
      tax_rate: taxRate,
      subtotal: 0,
      tax_amount: 0,
      total: 0
    }])
  }

  // Supprimer une ligne
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  // Mettre à jour une ligne
  const updateItem = (index: number, field: keyof BillingDocumentItem, value: any) => {
    const newItems = [...items]
    const item = { ...newItems[index] }
    
    if (field === 'quantity' || field === 'unit_price' || field === 'tax_rate') {
      item[field] = parseFloat(value) || 0
      
      // Recalculer les montants de la ligne
      const amounts = calculateLineAmounts(
        item.quantity,
        item.unit_price,
        item.tax_rate
      )
      item.subtotal = amounts.subtotal
      item.tax_amount = amounts.taxAmount
      item.total = amounts.total
    } else {
      (item as any)[field] = value
    }
    
    newItems[index] = item
    setItems(newItems)
  }

  // Valider le formulaire
  const validate = (): boolean => {
    if (!customerName.trim()) {
      setError('Le nom du client est requis')
      return false
    }
    
    if (items.length === 0 || items.every(item => !item.name.trim())) {
      setError('Au moins une ligne est requise')
      return false
    }
    
    if (items.some(item => item.quantity <= 0 || item.unit_price < 0)) {
      setError('Les quantités et prix doivent être valides')
      return false
    }
    
    if (customerSiren && !/^[0-9]{9}$/.test(customerSiren)) {
      setError('SIREN invalide (doit contenir 9 chiffres)')
      return false
    }
    
    return true
  }

  // Créer le document
  const handleCreate = async () => {
    if (!validate()) return
    
    setLoading(true)
    setError(null)

    try {
      // Filtrer les lignes vides
      const validItems = items.filter(item => item.name.trim())
      
      if (validItems.length === 0) {
        setError('Au moins une ligne valide est requise')
        setLoading(false)
        return
      }

      // Créer le document
      const documentData: Partial<BillingDocument> = {
        document_type: documentType,
        customer_name: customerName,
        customer_email: customerEmail || undefined,
        customer_address: customerAddress || undefined,
        customer_siren: customerSiren || undefined,
        issue_date: issueDate,
        due_date: documentType === 'invoice' ? (dueDate || undefined) : undefined,
        valid_until: documentType === 'quote' ? (validUntil || undefined) : undefined,
        payment_terms: paymentTerms || undefined,
        notes: notes || undefined,
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        tax_rate: taxRate,
        discount_amount: discountAmount,
        total_amount: totals.total,
        status: 'draft'
      }

      const response = await fetch('/api/billing/documents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documentData)
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la création')
      }

      const documentId = data.data.id

      // Ajouter les lignes
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i]
        const itemData = {
          ...item,
          document_id: documentId,
          position: i,
          tax_rate: item.tax_rate || taxRate
        }

        const itemResponse = await fetch('/api/billing/items/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        })

        const itemDataResult = await itemResponse.json()
        if (!itemDataResult.success) {
          console.error('Erreur création ligne:', itemDataResult.error)
        }
      }

      // Si demandé, envoyer via N8N
      if (sendAfterCreate && customerEmail) {
        const webhookUrl = documentType === 'quote'
          ? 'https://n8n.talosprimes.com/webhook/envoyer-devis'
          : 'https://n8n.talosprimes.com/webhook/envoyer-facture'

        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              document_id: documentId,
              customer_email: customerEmail,
              customer_name: customerName
            })
          })
        } catch (sendError) {
          console.error('Erreur envoi N8N:', sendError)
          // Ne pas bloquer si l'envoi échoue
        }
      }

      onSuccess()
    } catch (err: any) {
      console.error('Erreur création document:', err)
      setError(err.message || 'Erreur lors de la création du document')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto my-4">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-foreground">
            Créer un {documentType === 'quote' ? 'Devis' : 'Facture'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Erreur */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Type de document */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Type de document
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="quote">Devis</option>
              <option value="invoice">Facture</option>
              <option value="proforma">Proforma</option>
            </select>
          </div>

          {/* Informations client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nom du client <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                SIREN (9 chiffres)
              </label>
              <input
                type="text"
                value={customerSiren}
                onChange={(e) => setCustomerSiren(e.target.value.replace(/\D/g, '').slice(0, 9))}
                className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date d'émission
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {documentType === 'invoice' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Date d'échéance
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}

            {documentType === 'quote' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Valide jusqu'au
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Adresse
            </label>
            <textarea
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Lignes du document */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-foreground">
                Lignes du document
              </label>
              <button
                onClick={addItem}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter une ligne
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-muted/30 rounded-lg">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      placeholder="Description"
                      className="w-full px-3 py-2 bg-background border border-border/50 rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full px-2 py-2 bg-background border border-border/50 rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="Prix unitaire"
                      className="w-full px-2 py-2 bg-background border border-border/50 rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      value={item.tax_rate}
                      onChange={(e) => updateItem(index, 'tax_rate', e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="TVA %"
                      className="w-full px-2 py-2 bg-background border border-border/50 rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-end text-sm font-medium text-foreground">
                    {formatAmount(item.total)}
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(index)}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Remise */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                Remise (€)
              </label>
              <input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                Conditions de paiement
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Totaux */}
          <div className="border-t border-border pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Sous-total HT</span>
                  <span>{formatAmount(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>TVA</span>
                  <span>{formatAmount(totals.taxAmount)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-400">
                    <span>Remise</span>
                    <span>-{formatAmount(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                  <span>Total TTC</span>
                  <span>{formatAmount(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Option envoi automatique */}
          {customerEmail && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendAfterCreate"
                checked={sendAfterCreate}
                onChange={(e) => setSendAfterCreate(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <label htmlFor="sendAfterCreate" className="text-sm text-foreground">
                Envoyer automatiquement par email après création (via N8N)
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border p-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                Création...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Créer le document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

