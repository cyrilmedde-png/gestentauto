'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import { LeadFormModal } from '@/components/leads/LeadFormModal'
import { QuestionnaireForm } from '@/components/leads/QuestionnaireForm'
import { InterviewForm } from '@/components/leads/InterviewForm'
import { TrialCredentialsModal } from '@/components/leads/TrialCredentialsModal'
import Link from 'next/link'
import { Edit, Trash2 } from 'lucide-react'

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

interface Questionnaire {
  id: string
  request_type: string | null
  business_sector: string | null
  business_size: string | null
  current_tools: string[] | null
  main_needs: string[] | null
  budget_range: string | null
  timeline: string | null
  additional_info: string | null
  recommended_modules: string[] | null
  trial_config: {
    type: string
    duration_days: number
    enabled_modules: string[]
  } | null
  created_at: string
}

interface Interview {
  id: string
  scheduled_at: string | null
  status: string
  meeting_link: string | null
  notes: string | null
  created_at: string
}

interface Trial {
  id: string
  start_date: string
  end_date: string
  duration_days: number
  status: string
  enabled_modules: string[] | null
  trial_type: string | null
  company_id: string | null
  created_at: string
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.id as string

  const [lead, setLead] = useState<Lead | null>(null)
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [interview, setInterview] = useState<Interview | null>(null)
  const [trial, setTrial] = useState<Trial | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isQuestionnaireModalOpen, setIsQuestionnaireModalOpen] = useState(false)
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false)
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false)
  const [trialCredentials, setTrialCredentials] = useState<{
    email: string
    temporary_password: string
    login_url: string
    modules_activated?: string[]
  } | null>(null)

  useEffect(() => {
    loadLeadDetails()
  }, [leadId])

  const loadLeadDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/platform/leads/${leadId}`)
      if (!response.ok) {
        // Vérifier si la réponse est du JSON
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          throw new Error(data.error || 'Erreur lors du chargement')
        } else {
          throw new Error(`Erreur serveur (${response.status})`)
        }
      }

      const data = await response.json()
      setLead(data.lead)
      setQuestionnaire(data.questionnaire)
      setInterview(data.interview)
      setTrial(data.trial)
    } catch (err) {
      console.error('Error loading lead details:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce lead ? Cette action est irréversible et supprimera également le questionnaire, l\'entretien et l\'essai associés.')) {
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

      router.push('/platform/leads')
    } catch (err) {
      console.error('Error deleting lead:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  const handleModalSave = () => {
    loadLeadDetails()
    setIsEditModalOpen(false)
  }

  const handleStartTrial = async () => {
    if (!confirm('Voulez-vous démarrer un essai gratuit pour ce lead ?')) {
      return
    }

    try {
      setError(null)
      const response = await fetch(`/api/platform/leads/${leadId}/trial`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors du démarrage de l\'essai')
      }

      const data = await response.json()
      
      // Sauvegarder les identifiants et ouvrir la modal
      setTrialCredentials({
        email: data.credentials.email,
        temporary_password: data.credentials.temporary_password,
        login_url: data.credentials.login_url,
        modules_activated: data.modules_activated || [],
      })
      setIsCredentialsModalOpen(true)
      
      loadLeadDetails() // Recharger les données
    } catch (err) {
      console.error('Error starting trial:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du démarrage')
    }
  }

  const handleResendCredentialsEmail = async () => {
    try {
      const response = await fetch(`/api/platform/leads/${leadId}/trial/resend-credentials`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de l\'envoi de l\'email')
      }

      return Promise.resolve()
    } catch (err) {
      console.error('Error resending credentials email:', err)
      throw err
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <ProtectedPlatformRoute>
        <MainLayout>
          <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="text-center py-12 text-muted-foreground">
              Chargement...
            </div>
          </div>
        </MainLayout>
      </ProtectedPlatformRoute>
    )
  }

  if (error || !lead) {
    return (
      <ProtectedPlatformRoute>
        <MainLayout>
          <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error || 'Lead non trouvé'}</p>
              <Link
                href="/platform/leads"
                className="text-primary hover:text-primary/80"
              >
                ← Retour à la liste
              </Link>
            </div>
          </div>
        </MainLayout>
      </ProtectedPlatformRoute>
    )
  }

  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/platform/leads"
              className="text-muted-foreground hover:text-foreground mb-4 inline-block"
            >
              ← Retour à la liste
            </Link>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 break-words">
                  Lead : {lead.email}
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 active:bg-yellow-500/40 transition-colors min-h-[44px] touch-manipulation text-sm sm:text-base flex-1 sm:flex-initial"
                >
                  <Edit className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 active:bg-red-500/40 transition-colors min-h-[44px] touch-manipulation text-sm sm:text-base flex-1 sm:flex-initial"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer</span>
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

          {/* Informations principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Informations du lead
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <div className="text-foreground">{lead.email}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Nom:</span>
                  <div className="text-foreground">
                    {lead.first_name || lead.last_name
                      ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                      : '-'}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Téléphone:</span>
                  <div className="text-foreground">{lead.phone || '-'}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Entreprise:</span>
                  <div className="text-foreground">{lead.company_name || '-'}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Statut:</span>
                  <div className="text-foreground">{lead.status}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Étape:</span>
                  <div className="text-foreground">{lead.onboarding_step}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Créé le:</span>
                  <div className="text-foreground">{formatDate(lead.created_at)}</div>
                </div>
              </div>
            </div>

            {/* Questionnaire */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-foreground">
                  Questionnaire
                </h2>
                {questionnaire && (
                  <button
                    onClick={() => setIsQuestionnaireModalOpen(true)}
                    className="px-3 py-1.5 text-sm bg-background border border-border rounded-lg hover:bg-card transition-colors text-foreground"
                  >
                    Modifier
                  </button>
                )}
              </div>
              {questionnaire ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Type de demande:</span>
                    <div className="text-foreground">{questionnaire.request_type || '-'}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Secteur:</span>
                    <div className="text-foreground">{questionnaire.business_sector || '-'}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Taille:</span>
                    <div className="text-foreground">{questionnaire.business_size || '-'}</div>
                  </div>
                  {questionnaire.main_needs && questionnaire.main_needs.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground">Besoins:</span>
                      <div className="text-foreground">
                        {questionnaire.main_needs.join(', ')}
                      </div>
                    </div>
                  )}
                  {questionnaire.recommended_modules && questionnaire.recommended_modules.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground">Modules recommandés:</span>
                      <div className="text-foreground">
                        {questionnaire.recommended_modules.join(', ')}
                      </div>
                    </div>
                  )}
                  {questionnaire.trial_config && (
                    <div>
                      <span className="text-sm text-muted-foreground">Config essai:</span>
                      <div className="text-foreground text-sm">
                        {questionnaire.trial_config.duration_days} jours - {questionnaire.trial_config.type}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground text-sm">
                    Questionnaire non complété
                  </div>
                  <button
                    onClick={() => setIsQuestionnaireModalOpen(true)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors text-sm sm:text-base min-h-[44px] touch-manipulation"
                  >
                    Compléter le questionnaire
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Entretien */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                Entretien
              </h2>
              <button
                onClick={() => setIsInterviewModalOpen(true)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2.5 bg-background border border-border rounded-lg hover:bg-card active:bg-card/80 transition-colors text-foreground min-h-[44px] touch-manipulation text-sm sm:text-base"
              >
                {interview ? 'Modifier' : 'Planifier'}
              </button>
            </div>
            {interview ? (
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Statut:</span>
                  <div className="text-foreground">{interview.status}</div>
                </div>
                {interview.scheduled_at && (
                  <div>
                    <span className="text-sm text-muted-foreground">Planifié le:</span>
                    <div className="text-foreground">{formatDate(interview.scheduled_at)}</div>
                  </div>
                )}
                {interview.meeting_link && (
                  <div>
                    <span className="text-sm text-muted-foreground">Lien:</span>
                    <div>
                      <a
                        href={interview.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        {interview.meeting_link}
                      </a>
                    </div>
                  </div>
                )}
                {interview.notes && (
                  <div>
                    <span className="text-sm text-muted-foreground">Notes:</span>
                    <div className="text-foreground">{interview.notes}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                Aucun entretien planifié
              </div>
            )}
          </div>

          {/* Essai */}
          {trial && (
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                Essai gratuit
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Statut:</span>
                  <div className="text-foreground">{trial.status}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Période:</span>
                  <div className="text-foreground">
                    Du {formatDate(trial.start_date)} au {formatDate(trial.end_date)}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Durée:</span>
                  <div className="text-foreground">{trial.duration_days} jours</div>
                </div>
                {trial.enabled_modules && trial.enabled_modules.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Modules activés:</span>
                    <div className="text-foreground">
                      {trial.enabled_modules.join(', ')}
                    </div>
                  </div>
                )}
                {trial.company_id && (
                  <div>
                    <span className="text-sm text-muted-foreground">Entreprise ID:</span>
                    <div className="text-foreground font-mono text-sm">{trial.company_id}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {lead.status !== 'trial_started' && questionnaire && (
            <div className="mt-4 sm:mt-6 flex justify-end">
              <button
                onClick={handleStartTrial}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors min-h-[44px] touch-manipulation text-sm sm:text-base"
              >
                Démarrer l'essai gratuit
              </button>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        <LeadFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleModalSave}
          lead={lead}
        />
        <QuestionnaireForm
          isOpen={isQuestionnaireModalOpen}
          onClose={() => setIsQuestionnaireModalOpen(false)}
          onSave={loadLeadDetails}
          leadId={leadId}
          questionnaire={questionnaire}
        />
        <InterviewForm
          isOpen={isInterviewModalOpen}
          onClose={() => setIsInterviewModalOpen(false)}
          onSave={loadLeadDetails}
          leadId={leadId}
          interview={interview}
        />
        {trialCredentials && (
          <TrialCredentialsModal
            isOpen={isCredentialsModalOpen}
            onClose={() => {
              setIsCredentialsModalOpen(false)
              setTrialCredentials(null)
            }}
            credentials={trialCredentials}
            leadName={lead?.first_name && lead?.last_name
              ? `${lead.first_name} ${lead.last_name}`
              : lead?.first_name || lead?.company_name || undefined}
            onResendEmail={handleResendCredentialsEmail}
          />
        )}
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

