'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'

interface Interview {
  id?: string
  scheduled_at?: string | null
  status?: string
  meeting_link?: string | null
  notes?: string | null
}

interface InterviewFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  leadId: string
  interview?: Interview | null
}

const interviewStatusOptions = [
  { value: 'pending', label: 'En attente' },
  { value: 'scheduled', label: 'Planifié' },
  { value: 'completed', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' },
  { value: 'no_show', label: 'Absent' },
]

export function InterviewForm({
  isOpen,
  onClose,
  onSave,
  leadId,
  interview,
}: InterviewFormProps) {
  const [formData, setFormData] = useState({
    scheduled_at: '',
    scheduled_time: '',
    meeting_link: '',
    notes: '',
    status: 'scheduled',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (interview && isOpen) {
      // Convertir la date ISO en format pour les inputs datetime-local
      let scheduledDate = ''
      let scheduledTime = ''
      
      if (interview.scheduled_at) {
        const date = new Date(interview.scheduled_at)
        scheduledDate = date.toISOString().split('T')[0]
        scheduledTime = date.toTimeString().slice(0, 5) // HH:mm
      }

      setFormData({
        scheduled_at: scheduledDate,
        scheduled_time: scheduledTime,
        meeting_link: interview.meeting_link || '',
        notes: interview.notes || '',
        status: interview.status || 'scheduled',
      })
      setSuccess(false)
    } else if (isOpen) {
      // Définir une date par défaut (demain à 14h)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const defaultDate = tomorrow.toISOString().split('T')[0]
      const defaultTime = '14:00'

      setFormData({
        scheduled_at: defaultDate,
        scheduled_time: defaultTime,
        meeting_link: '',
        notes: '',
        status: 'scheduled',
      })
      setSuccess(false)
    }
    setError(null)
  }, [interview, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setSuccess(false)

    try {
      // Combiner date et heure en format ISO
      let scheduledAtISO: string | null = null
      if (formData.scheduled_at && formData.scheduled_time) {
        const dateTimeString = `${formData.scheduled_at}T${formData.scheduled_time}:00`
        scheduledAtISO = new Date(dateTimeString).toISOString()
      }

      const payload: {
        scheduled_at?: string
        meeting_link?: string
        notes?: string
        status?: string
      } = {}

      if (interview) {
        // Mode édition (PATCH)
        if (scheduledAtISO) payload.scheduled_at = scheduledAtISO
        if (formData.meeting_link) payload.meeting_link = formData.meeting_link
        if (formData.notes !== undefined) payload.notes = formData.notes
        payload.status = formData.status

        const response = await fetch(`/api/platform/leads/${leadId}/interview`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erreur lors de la mise à jour')
        }
      } else {
        // Mode création (POST)
        if (!scheduledAtISO) {
          throw new Error('La date et l\'heure sont requises')
        }

        payload.scheduled_at = scheduledAtISO
        if (formData.meeting_link) payload.meeting_link = formData.meeting_link
        if (formData.notes) payload.notes = formData.notes

        const response = await fetch(`/api/platform/leads/${leadId}/interview`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erreur lors de la planification')
        }
      }

      setSuccess(true)
      
      // Attendre un peu puis fermer
      setTimeout(() => {
        onSave()
        onClose()
      }, 1000)
    } catch (err) {
      console.error('Error saving interview:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const formatDisplayDate = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return ''
    try {
      const date = new Date(`${dateStr}T${timeStr}:00`)
      return date.toLocaleString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={interview ? 'Modifier l\'entretien' : 'Planifier un entretien'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
            ✓ Entretien {interview ? 'modifié' : 'planifié'} avec succès !
          </div>
        )}

        {/* Date et heure */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={formData.scheduled_at}
              onChange={(e) =>
                setFormData({ ...formData, scheduled_at: e.target.value })
              }
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required={!interview}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Heure <span className="text-red-400">*</span>
            </label>
            <input
              type="time"
              value={formData.scheduled_time}
              onChange={(e) =>
                setFormData({ ...formData, scheduled_time: e.target.value })
              }
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required={!interview}
            />
          </div>
        </div>

        {formData.scheduled_at && formData.scheduled_time && (
          <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <p className="text-sm text-muted-foreground">Date et heure sélectionnées :</p>
            <p className="text-foreground font-medium">
              {formatDisplayDate(formData.scheduled_at, formData.scheduled_time)}
            </p>
          </div>
        )}

        {/* Lien de réunion */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Lien de réunion (Zoom, Google Meet, etc.)
          </label>
          <input
            type="url"
            value={formData.meeting_link}
            onChange={(e) =>
              setFormData({ ...formData, meeting_link: e.target.value })
            }
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Lien de la visioconférence ou de la réunion (optionnel)
          </p>
        </div>

        {/* Statut (seulement en mode édition) */}
        {interview && (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {interviewStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            rows={4}
            placeholder="Notes sur l'entretien, points à aborder, etc."
            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

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
            disabled={loading || success}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading
              ? 'Enregistrement...'
              : success
              ? 'Enregistré ✓'
              : interview
              ? 'Modifier'
              : 'Planifier'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

