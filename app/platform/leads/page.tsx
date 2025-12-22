'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import { LeadFormModal } from '@/components/leads/LeadFormModal'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface Lead {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  company_name: string | null
  status: string
  onboarding_step: string
  created_at: string
  updated_at: string
}

const statusLabels: Record<string, string> = {
  pre_registered: 'Pré-inscrit',
  questionnaire_completed: 'Questionnaire complété',
  interview_scheduled: 'Entretien planifié',
  trial_started: 'Essai démarré',
  converted: 'Converti',
  abandoned: 'Abandonné',
}

const statusColors: Record<string, string> = {
  pre_registered: 'bg-blue-500/20 text-blue-400',
  questionnaire_completed: 'bg-yellow-500/20 text-yellow-400',
  interview_scheduled: 'bg-purple-500/20 text-purple-400',
  trial_started: 'bg-green-500/20 text-green-400',
  converted: 'bg-emerald-500/20 text-emerald-400',
  abandoned: 'bg-red-500/20 text-red-400',
}

const stepLabels: Record<string, string> = {
  form: 'Formulaire',
  questionnaire: 'Questionnaire',
  interview: 'Entretien',
  trial: 'Essai',
  completed: 'Terminé',
}

export default function LeadsPage() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterStep, setFilterStep] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    loadLeads()
  }, [filterStatus, filterStep])

  const loadLeads = async () => {
    try {
      setLoading(true)
      setError(null)

      let url = '/api/platform/leads'
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterStep !== 'all') params.append('step', filterStep)
      if (params.toString()) url += '?' + params.toString()

      // Préparer les headers avec l'ID utilisateur
      const headers: HeadersInit = {}
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch(url, {
        credentials: 'include', // Important : envoyer les cookies de session
        headers,
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors du chargement des leads')
      }

      const data = await response.json()
      setLeads(data.leads || [])
    } catch (err) {
      console.error('Error loading leads:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead)
    setIsEditModalOpen(true)
  }

  const handleDelete = async (leadId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce lead ? Cette action est irréversible.')) {
      return
    }

    try {
      setError(null)
      
      // Préparer les headers avec l'ID utilisateur
      const headers: HeadersInit = {}
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }
      
      const response = await fetch(`/api/platform/leads/${leadId}`, {
        method: 'DELETE',
        credentials: 'include', // Important : envoyer les cookies de session
        headers,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      loadLeads()
    } catch (err) {
      console.error('Error deleting lead:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  const handleModalSave = () => {
    loadLeads()
    setIsCreateModalOpen(false)
    setIsEditModalOpen(false)
    setEditingLead(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
      <ProtectedPlatformRoute>
      <MainLayout>
        <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  Leads d'onboarding
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                  Gestion des pré-inscriptions et parcours d'onboarding
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors min-h-[44px] touch-manipulation w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm sm:text-base">Créer un lead</span>
              </button>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-foreground">
                {leads.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Total leads</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">
                {leads.filter((l) => l.status === 'trial_started').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Essais actifs</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">
                {leads.filter((l) => l.status === 'questionnaire_completed').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Questionnaires</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-emerald-400">
                {leads.filter((l) => l.status === 'converted').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Convertis</div>
            </div>
          </div>

          {/* Filtres */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
              <div className="flex-1 sm:flex-initial sm:min-w-[140px]">
                <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                  Statut
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base text-foreground min-h-[44px] touch-manipulation"
                >
                  <option value="all">Tous</option>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 sm:flex-initial sm:min-w-[140px]">
                <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                  Étape
                </label>
                <select
                  value={filterStep}
                  onChange={(e) => setFilterStep(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base text-foreground min-h-[44px] touch-manipulation"
                >
                  <option value="all">Toutes</option>
                  {Object.entries(stepLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={loadLeads}
                  className="w-full sm:w-auto bg-primary text-primary-foreground px-4 py-3 rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors min-h-[44px] touch-manipulation text-sm sm:text-base"
                >
                  Actualiser
                </button>
              </div>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Liste des leads */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Chargement...
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucun lead trouvé
            </div>
          ) : (
            <>
              {/* Version Mobile (cartes) */}
              <div className="lg:hidden space-y-4">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4"
                  >
                    {/* Nom */}
                    <div className="mb-3">
                      <div className="text-base font-semibold text-foreground">
                        {lead.first_name || lead.last_name
                          ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                          : lead.email}
                      </div>
                      {lead.first_name || lead.last_name ? (
                        <div className="text-sm text-muted-foreground mt-1">
                          {lead.email}
                        </div>
                      ) : null}
                    </div>

                    {/* Statut */}
                    <div className="mb-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          statusColors[lead.status] || 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {statusLabels[lead.status] || lead.status}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-border/30">
                      <button
                        onClick={() => handleEdit(lead)}
                        className="flex-1 text-yellow-400 hover:text-yellow-300 active:text-yellow-200 text-sm font-medium px-3 py-2.5 min-h-[44px] touch-manipulation bg-yellow-400/10 hover:bg-yellow-400/20 rounded-lg transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="flex-1 text-red-400 hover:text-red-300 active:text-red-200 text-sm font-medium px-3 py-2.5 min-h-[44px] touch-manipulation bg-red-400/10 hover:bg-red-400/20 rounded-lg transition-colors"
                      >
                        Supprimer
                      </button>
                      <Link
                        href={`/platform/leads/${lead.id}`}
                        className="flex-1 text-primary hover:text-primary/80 active:text-primary/60 text-sm font-medium px-3 py-2.5 min-h-[44px] touch-manipulation bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors text-center"
                      >
                        Détails →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Version Desktop (tableau) */}
              <div className="hidden lg:block bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-card/80 border-b border-border/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Nom
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Entreprise
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Statut
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Étape
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-card/50 transition-colors">
                          <td className="px-4 py-3 text-sm text-foreground">
                            {lead.email}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">
                            {lead.first_name || lead.last_name
                              ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">
                            {lead.company_name || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                statusColors[lead.status] || 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {statusLabels[lead.status] || lead.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {stepLabels[lead.onboarding_step] || lead.onboarding_step}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {formatDate(lead.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <button
                                onClick={() => handleEdit(lead)}
                                className="text-yellow-400 hover:text-yellow-300 active:text-yellow-200 text-sm font-medium px-2 py-1.5 min-h-[36px] touch-manipulation"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => handleDelete(lead.id)}
                                className="text-red-400 hover:text-red-300 active:text-red-200 text-sm font-medium px-2 py-1.5 min-h-[36px] touch-manipulation"
                              >
                                Supprimer
                              </button>
                              <Link
                                href={`/platform/leads/${lead.id}`}
                                className="text-primary hover:text-primary/80 active:text-primary/60 text-sm font-medium px-2 py-1.5 min-h-[36px] touch-manipulation inline-block"
                              >
                                Détails →
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modals */}
        <LeadFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleModalSave}
          lead={null}
        />
        <LeadFormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingLead(null)
          }}
          onSave={handleModalSave}
          lead={editingLead}
        />
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

