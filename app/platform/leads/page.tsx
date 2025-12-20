'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LeadFormModal } from '@/components/leads/LeadFormModal'
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

      const response = await fetch(url)
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
      const response = await fetch(`/api/platform/leads/${leadId}`, {
        method: 'DELETE',
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
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                Leads d'onboarding
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Gestion des pré-inscriptions et parcours d'onboarding
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Créer un lead</span>
            </button>
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
          <div className="mb-6 flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Statut
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-card border border-border rounded-lg px-4 py-2 text-foreground"
              >
                <option value="all">Tous</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Étape
              </label>
              <select
                value={filterStep}
                onChange={(e) => setFilterStep(e.target.value)}
                className="bg-card border border-border rounded-lg px-4 py-2 text-foreground"
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
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Actualiser
              </button>
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
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg overflow-hidden">
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
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleEdit(lead)}
                              className="text-yellow-400 hover:text-yellow-300 text-sm font-medium"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDelete(lead.id)}
                              className="text-red-400 hover:text-red-300 text-sm font-medium"
                            >
                              Supprimer
                            </button>
                            <Link
                              href={`/platform/leads/${lead.id}`}
                              className="text-primary hover:text-primary/80 text-sm font-medium"
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
    </ProtectedRoute>
  )
}

