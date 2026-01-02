'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import { 
  Plus, 
  FileText, 
  Receipt, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  Send,
  Download,
  Eye,
  MoreVertical,
  Edit,
  Trash2,
  Euro
} from 'lucide-react'
import { CreateDocumentModal } from '@/components/billing/CreateDocumentModal'

interface BillingDocument {
  id: string
  document_type: 'quote' | 'invoice' | 'proforma' | 'credit_note'
  document_number: string
  customer_name: string
  customer_email: string
  issue_date: string
  due_date?: string
  valid_until?: string
  status: string
  total_amount: number
  paid_amount: number
  created_at: string
}

interface DocumentStats {
  total_revenue: number
  pending_amount: number
  overdue_amount: number
  quotes_count: number
  invoices_count: number
}

export default function PlatformFacturationPage() {
  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <FacturationContent />
        </div>
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

function FacturationContent() {
  const [documents, setDocuments] = useState<BillingDocument[]>([])
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [filterType, filterStatus])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Construire l'URL avec filtres
      const params = new URLSearchParams()
      if (filterType !== 'all') params.append('document_type', filterType)
      if (filterStatus !== 'all') params.append('status', filterStatus)

      // Charger les documents
      const docsResponse = await fetch(`/api/billing/documents?${params.toString()}`)
      const docsData = await docsResponse.json()

      if (docsData.success) {
        setDocuments(docsData.data || [])
      } else {
        throw new Error(docsData.error || 'Erreur chargement documents')
      }

      // Charger les statistiques
      const statsResponse = await fetch('/api/billing/stats')
      const statsData = await statsResponse.json()

      if (statsData.success && statsData.data?.stats) {
        const apiStats = statsData.data.stats
        // Mapper la structure de l'API vers celle attendue par le composant
        setStats({
          total_revenue: apiStats.revenue || 0,
          pending_amount: apiStats.pendingInvoices?.amount || 0,
          overdue_amount: apiStats.overdueInvoices?.amount || 0,
          quotes_count: apiStats.quotes?.total || 0,
          invoices_count: apiStats.pendingInvoices?.count || 0
        })
      } else {
        // Valeurs par défaut si l'API ne retourne pas de stats
        setStats({
          total_revenue: 0,
          pending_amount: 0,
          overdue_amount: 0,
          quotes_count: 0,
          invoices_count: 0
        })
      }
    } catch (err: any) {
      console.error('Erreur:', err)
      setError(err.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      quote: 'Devis',
      invoice: 'Facture',
      proforma: 'Proforma',
      credit_note: 'Avoir',
    }
    return labels[type] || type
  }

  const handleSendDocument = async (documentId: string, documentType: string) => {
    try {
      setError(null)
      setSuccess(null)
      
      const document = documents.find(d => d.id === documentId)
      if (!document) {
        throw new Error('Document non trouvé')
      }

      if (!document.customer_email) {
        throw new Error('Email client manquant')
      }

      // Déterminer le type de document pour l'URL du webhook
      // Pour quote : webhook devis, pour les autres (invoice, proforma, credit_note) : webhook facture
      const docTypeForWebhook = documentType === 'quote' ? 'quote' : 'invoice'
      const webhookUrl = docTypeForWebhook === 'quote' 
        ? 'https://n8n.talosprimes.com/webhook/envoyer-devis'
        : 'https://n8n.talosprimes.com/webhook/envoyer-facture'

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: documentId,
          customer_email: document.customer_email,
          customer_name: document.customer_name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur lors de l\'envoi')
      }

      const responseData = await response.json()
      const documentLabel = getDocumentTypeLabel(documentType)
      setSuccess(`${documentLabel} envoyé(e) avec succès à ${document.customer_email} !`)
      setTimeout(() => setSuccess(null), 5000)
      
      // Recharger les données après un court délai
      setTimeout(() => {
        loadData()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi')
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleUpdateStatus = async (documentId: string, newStatus: string) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/billing/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          ...(newStatus === 'sent' && { sent_at: new Date().toISOString() }),
          ...(newStatus === 'paid' && { paid_at: new Date().toISOString() }),
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }

      const statusLabels: Record<string, string> = {
        sent: 'envoyé',
        paid: 'payé',
      }

      setSuccess(`Statut mis à jour : ${statusLabels[newStatus] || newStatus}`)
      setTimeout(() => setSuccess(null), 3000)
      loadData()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du statut')
      setTimeout(() => setError(null), 5000)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string; icon: any }> = {
      draft: { label: 'Brouillon', className: 'bg-gray-500/20 text-gray-400', icon: Clock },
      sent: { label: 'Envoyé', className: 'bg-blue-500/20 text-blue-400', icon: Send },
      accepted: { label: 'Accepté', className: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      paid: { label: 'Payé', className: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      partially_paid: { label: 'Partiellement payé', className: 'bg-yellow-500/20 text-yellow-400', icon: AlertCircle },
      overdue: { label: 'En retard', className: 'bg-red-500/20 text-red-400', icon: AlertCircle },
      cancelled: { label: 'Annulé', className: 'bg-red-500/20 text-red-400', icon: AlertCircle },
    }

    const badge = badges[status] || badges.draft
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    )
  }

  const filteredDocuments = documents.filter(doc => 
    doc.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.document_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Facturation
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gérez vos devis, factures et paiements
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nouveau</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400">
          {success}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {(stats.total_revenue || 0).toFixed(2)} €
                </p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-lg">
                <Euro className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {(stats.pending_amount || 0).toFixed(2)} €
                </p>
              </div>
              <div className="bg-yellow-500/20 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Devis</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats.quotes_count}
                </p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Factures</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats.invoices_count}
                </p>
              </div>
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <Receipt className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un client ou numéro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all">Tous les types</option>
          <option value="quote">Devis</option>
          <option value="invoice">Factures</option>
          <option value="proforma">Proforma</option>
          <option value="credit_note">Avoirs</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="sent">Envoyé</option>
          <option value="paid">Payé</option>
          <option value="overdue">En retard</option>
        </select>
      </div>

      {/* Liste des documents */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg overflow-hidden">
        {filteredDocuments.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Aucun document ne correspond à votre recherche' : 'Aucun document pour le moment'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Créer votre premier document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-medium text-foreground">{doc.document_number}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-muted-foreground">
                        {getDocumentTypeLabel(doc.document_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-foreground">{doc.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{doc.customer_email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(doc.issue_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-medium text-foreground">{(doc.total_amount || 0).toFixed(2)} €</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Bouton Renvoyer par email (toujours visible si email client présent) */}
                        {doc.customer_email && (
                          <button
                            onClick={() => handleSendDocument(doc.id, doc.document_type)}
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Renvoyer par email"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {/* Bouton Marquer comme envoyé (draft → sent) */}
                        {doc.status === 'draft' && (
                          <button
                            onClick={() => handleUpdateStatus(doc.id, 'sent')}
                            className="p-2 text-gray-400 hover:bg-gray-500/10 rounded-lg transition-colors"
                            title="Marquer comme envoyé"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {/* Bouton Marquer comme payé (sent → paid) */}
                        {doc.status === 'sent' && (
                          <button
                            onClick={() => handleUpdateStatus(doc.id, 'paid')}
                            className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Marquer comme payé"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                          title="Télécharger PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Création */}
      {showCreateModal && (
        <CreateDocumentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadData()
          }}
        />
      )}
    </>
  )
}


