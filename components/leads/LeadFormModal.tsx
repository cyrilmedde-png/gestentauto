'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'

interface Lead {
  id?: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  company_name: string | null
  status?: string
  onboarding_step?: string
}

interface LeadFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  lead?: Lead | null
}

const statusOptions = [
  { value: 'pre_registered', label: 'Pré-inscrit' },
  { value: 'questionnaire_completed', label: 'Questionnaire complété' },
  { value: 'interview_scheduled', label: 'Entretien planifié' },
  { value: 'trial_started', label: 'Essai démarré' },
  { value: 'converted', label: 'Converti' },
  { value: 'abandoned', label: 'Abandonné' },
]

const stepOptions = [
  { value: 'form', label: 'Formulaire' },
  { value: 'questionnaire', label: 'Questionnaire' },
  { value: 'interview', label: 'Entretien' },
  { value: 'trial', label: 'Essai' },
  { value: 'completed', label: 'Terminé' },
]

export function LeadFormModal({ isOpen, onClose, onSave, lead }: LeadFormModalProps) {
  const [formData, setFormData] = useState<Lead>({
    email: '',
    first_name: null,
    last_name: null,
    phone: null,
    company_name: null,
    status: 'pre_registered',
    onboarding_step: 'form',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (lead) {
      setFormData({
        email: lead.email || '',
        first_name: lead.first_name || null,
        last_name: lead.last_name || null,
        phone: lead.phone || null,
        company_name: lead.company_name || null,
        status: lead.status || 'pre_registered',
        onboarding_step: lead.onboarding_step || 'form',
      })
    } else {
      setFormData({
        email: '',
        first_name: null,
        last_name: null,
        phone: null,
        company_name: null,
        status: 'pre_registered',
        onboarding_step: 'form',
      })
    }
    setError(null)
  }, [lead, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const url = lead?.id
        ? `/api/platform/leads/${lead.id}`
        : '/api/platform/leads'

      const method = lead?.id ? 'PATCH' : 'POST'

      // Pour la création, on utilise le endpoint POST /api/platform/leads
      // Pour la modification, on utilise PATCH
      const payload = lead?.id
        ? {
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            company_name: formData.company_name,
            status: formData.status,
            onboarding_step: formData.onboarding_step,
          }
        : {
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            company_name: formData.company_name,
          }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      onSave()
      onClose()
    } catch (err) {
      console.error('Error saving lead:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead?.id ? 'Modifier le lead' : 'Créer un nouveau lead'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Prénom
            </label>
            <input
              type="text"
              value={formData.first_name || ''}
              onChange={(e) =>
                setFormData({ ...formData, first_name: e.target.value || null })
              }
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Nom
            </label>
            <input
              type="text"
              value={formData.last_name || ''}
              onChange={(e) =>
                setFormData({ ...formData, last_name: e.target.value || null })
              }
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Téléphone
          </label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value || null })
            }
            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Entreprise
          </label>
          <input
            type="text"
            value={formData.company_name || ''}
            onChange={(e) =>
              setFormData({ ...formData, company_name: e.target.value || null })
            }
            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {lead?.id && (
          <>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Statut
              </label>
              <select
                value={formData.status || 'pre_registered'}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as string })
                }
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Étape
              </label>
              <select
                value={formData.onboarding_step || 'form'}
                onChange={(e) =>
                  setFormData({ ...formData, onboarding_step: e.target.value as string })
                }
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {stepOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : lead?.id ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

