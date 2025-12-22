'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/components/auth/AuthProvider'

interface Questionnaire {
  id?: string
  request_type?: string | null
  business_sector?: string | null
  business_size?: string | null
  current_tools?: string[] | null
  main_needs?: string[] | null
  budget_range?: string | null
  timeline?: string | null
  additional_info?: string | null
  recommended_modules?: string[] | null
  trial_config?: {
    type: string
    duration_days: number
    enabled_modules: string[]
  } | null
}

interface QuestionnaireFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  leadId: string
  questionnaire?: Questionnaire | null
}

const requestTypeOptions = [
  { value: 'trial_7days', label: 'Essai gratuit 7 jours' },
  { value: 'company_creation', label: 'Création d\'entreprise' },
  { value: 'platform', label: 'Plateforme pour mon entreprise' },
]

const businessSectorOptions = [
  { value: 'commerce', label: 'Commerce' },
  { value: 'restauration', label: 'Restauration' },
  { value: 'immobilier', label: 'Immobilier' },
  { value: 'sante', label: 'Santé' },
  { value: 'education', label: 'Éducation' },
  { value: 'transport', label: 'Transport' },
  { value: 'conseil', label: 'Conseil' },
  { value: 'autre', label: 'Autre' },
]

const businessSizeOptions = [
  { value: 'startup', label: 'Startup (< 10 personnes)' },
  { value: 'pme', label: 'PME (10-50 personnes)' },
  { value: 'grande_entreprise', label: 'Grande entreprise (> 50 personnes)' },
]

const commonTools = [
  'Excel',
  'Word',
  'Google Sheets',
  'Google Docs',
  'Sage',
  'Ciel',
  'EBP',
  'Quicken',
  'Autre outil',
]

const mainNeedsOptions = [
  { value: 'gestion_stock', label: 'Gestion de stock' },
  { value: 'facturation', label: 'Facturation' },
  { value: 'crm', label: 'CRM / Gestion clients' },
  { value: 'comptabilite', label: 'Comptabilité' },
  { value: 'rh', label: 'RH / Paie' },
  { value: 'projets', label: 'Gestion de projets' },
  { value: 'documents', label: 'Gestion documentaire' },
  { value: 'reporting', label: 'Reporting / Statistiques' },
]

const budgetRangeOptions = [
  { value: '<100', label: '< 100€/mois' },
  { value: '100-500', label: '100-500€/mois' },
  { value: '500-1000', label: '500-1000€/mois' },
  { value: '>1000', label: '> 1000€/mois' },
]

const timelineOptions = [
  { value: 'immediate', label: 'Immédiat' },
  { value: '1_month', label: '1 mois' },
  { value: '2-3_months', label: '2-3 mois' },
  { value: '>3_months', label: '> 3 mois' },
]

export function QuestionnaireForm({
  isOpen,
  onClose,
  onSave,
  leadId,
  questionnaire,
}: QuestionnaireFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    request_type: '',
    business_sector: '',
    custom_sector: '',
    business_size: '',
    current_tools: [] as string[],
    custom_tool: '',
    main_needs: [] as string[],
    budget_range: '',
    timeline: '',
    additional_info: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<{
    modules: string[]
    trial_config: {
      type: string
      duration_days: number
      enabled_modules: string[]
    }
    next_step: string
  } | null>(null)

  useEffect(() => {
    if (questionnaire && isOpen) {
      const sector = questionnaire.business_sector || ''
      const isCustomSector = sector && !businessSectorOptions.find(opt => opt.value === sector)
      
      setFormData({
        request_type: questionnaire.request_type || '',
        business_sector: isCustomSector ? 'autre' : sector,
        custom_sector: isCustomSector ? sector : '',
        business_size: questionnaire.business_size || '',
        current_tools: questionnaire.current_tools || [],
        custom_tool: '',
        main_needs: questionnaire.main_needs || [],
        budget_range: questionnaire.budget_range || '',
        timeline: questionnaire.timeline || '',
        additional_info: questionnaire.additional_info || '',
      })
      if (questionnaire.recommended_modules && questionnaire.trial_config) {
        setRecommendations({
          modules: questionnaire.recommended_modules,
          trial_config: questionnaire.trial_config,
          next_step: 'interview',
        })
      }
    } else if (isOpen) {
      setFormData({
        request_type: '',
        business_sector: '',
        custom_sector: '',
        business_size: '',
        current_tools: [],
        custom_tool: '',
        main_needs: [],
        budget_range: '',
        timeline: '',
        additional_info: '',
      })
      setRecommendations(null)
    }
    setError(null)
  }, [questionnaire, isOpen])

  const handleToolToggle = (tool: string) => {
    setFormData((prev) => {
      const tools = prev.current_tools.includes(tool)
        ? prev.current_tools.filter((t) => t !== tool)
        : [...prev.current_tools, tool]
      return { ...prev, current_tools: tools }
    })
  }

  const handleNeedToggle = (need: string) => {
    setFormData((prev) => {
      const needs = prev.main_needs.includes(need)
        ? prev.main_needs.filter((n) => n !== need)
        : [...prev.main_needs, need]
      return { ...prev, main_needs: needs }
    })
  }

  const handleAddCustomTool = () => {
    if (formData.custom_tool.trim()) {
      setFormData((prev) => ({
        ...prev,
        current_tools: [...prev.current_tools, prev.custom_tool.trim()],
        custom_tool: '',
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setRecommendations(null)

    try {
      const businessSector = formData.business_sector === 'autre'
        ? formData.custom_sector
        : formData.business_sector

      const payload = {
        request_type: formData.request_type,
        business_sector: businessSector || null,
        business_size: formData.business_size || null,
        current_tools: formData.current_tools.length > 0 ? formData.current_tools : null,
        main_needs: formData.main_needs.length > 0 ? formData.main_needs : null,
        budget_range: formData.budget_range || null,
        timeline: formData.timeline || null,
        additional_info: formData.additional_info || null,
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch(`/api/platform/leads/${leadId}/questionnaire`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      const data = await response.json()
      
      // Afficher les recommandations
      if (data.recommendations) {
        setRecommendations(data.recommendations)
      }

      // Attendre un peu pour que l'utilisateur voie les recommandations
      setTimeout(() => {
        onSave()
        onClose()
      }, 2000)
    } catch (err) {
      console.error('Error saving questionnaire:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={questionnaire ? 'Modifier le questionnaire' : 'Compléter le questionnaire'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {recommendations && (
          <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
            <h3 className="text-green-400 font-semibold mb-2">✓ Questionnaire enregistré !</h3>
            <div className="text-sm text-foreground space-y-1">
              <p><strong>Modules recommandés:</strong> {recommendations.modules.join(', ')}</p>
              <p><strong>Configuration essai:</strong> {recommendations.trial_config.duration_days} jours - {recommendations.trial_config.type}</p>
              <p><strong>Prochaine étape:</strong> {recommendations.next_step === 'trial' ? 'Essai gratuit' : recommendations.next_step === 'interview' ? 'Entretien' : 'Contact'}</p>
            </div>
          </div>
        )}

        {/* Type de demande */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Type de demande <span className="text-red-400">*</span>
          </label>
          <div className="space-y-2">
            {requestTypeOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-card transition-colors"
              >
                <input
                  type="radio"
                  name="request_type"
                  value={option.value}
                  checked={formData.request_type === option.value}
                  onChange={(e) =>
                    setFormData({ ...formData, request_type: e.target.value })
                  }
                  className="w-4 h-4 text-primary"
                  required
                />
                <span className="text-foreground">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Secteur d'activité */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Secteur d'activité
          </label>
          <select
            value={formData.business_sector}
            onChange={(e) =>
              setFormData({ ...formData, business_sector: e.target.value, custom_sector: '' })
            }
            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Sélectionnez un secteur</option>
            {businessSectorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {formData.business_sector === 'autre' && (
            <input
              type="text"
              placeholder="Précisez votre secteur d'activité..."
              value={formData.custom_sector}
              onChange={(e) =>
                setFormData({ ...formData, custom_sector: e.target.value })
              }
              className="w-full mt-2 bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required={formData.business_sector === 'autre'}
            />
          )}
        </div>

        {/* Taille de l'entreprise */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Taille de l'entreprise
          </label>
          <select
            value={formData.business_size}
            onChange={(e) =>
              setFormData({ ...formData, business_size: e.target.value })
            }
            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Sélectionnez une taille</option>
            {businessSizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Outils actuels */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Outils actuels utilisés
          </label>
          <div className="space-y-2">
            {commonTools.map((tool) => (
              <label
                key={tool}
                className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-card transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formData.current_tools.includes(tool)}
                  onChange={() => handleToolToggle(tool)}
                  className="w-4 h-4 text-primary rounded border-border"
                />
                <span className="text-foreground">{tool}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="Ajouter un autre outil..."
              value={formData.custom_tool}
              onChange={(e) =>
                setFormData({ ...formData, custom_tool: e.target.value })
              }
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCustomTool()
                }
              }}
              className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleAddCustomTool}
              className="px-4 py-2 bg-background border border-border rounded-lg text-foreground hover:bg-card transition-colors"
            >
              Ajouter
            </button>
          </div>
          {formData.current_tools.length > 0 && (
            <div className="mt-2 text-sm text-muted-foreground">
              Sélectionnés: {formData.current_tools.join(', ')}
            </div>
          )}
        </div>

        {/* Besoins principaux */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Besoins principaux
          </label>
          <div className="grid grid-cols-2 gap-2">
            {mainNeedsOptions.map((need) => (
              <label
                key={need.value}
                className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-card transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formData.main_needs.includes(need.value)}
                  onChange={() => handleNeedToggle(need.value)}
                  className="w-4 h-4 text-primary rounded border-border"
                />
                <span className="text-foreground text-sm">{need.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Budget mensuel prévu
          </label>
          <select
            value={formData.budget_range}
            onChange={(e) =>
              setFormData({ ...formData, budget_range: e.target.value })
            }
            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Sélectionnez un budget</option>
            {budgetRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Délai */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Délai de mise en place souhaité
          </label>
          <select
            value={formData.timeline}
            onChange={(e) =>
              setFormData({ ...formData, timeline: e.target.value })
            }
            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Sélectionnez un délai</option>
            {timelineOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Informations complémentaires */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Informations complémentaires
          </label>
          <textarea
            value={formData.additional_info}
            onChange={(e) =>
              setFormData({ ...formData, additional_info: e.target.value })
            }
            rows={4}
            placeholder="Décrivez vos besoins spécifiques, vos attentes..."
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
            disabled={loading || !!recommendations}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : recommendations ? 'Enregistré ✓' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

