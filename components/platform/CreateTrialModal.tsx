'use client'

import { useState } from 'react'
import { X, Rocket, AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react'

interface CreateTrialModalProps {
  isOpen: boolean
  onClose: () => void
  leadId: string
  leadName: string
  leadEmail: string
}

export function CreateTrialModal({
  isOpen,
  onClose,
  leadId,
  leadName,
  leadEmail,
}: CreateTrialModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [trialData, setTrialData] = useState<any>(null)
  const [duration, setDuration] = useState(14)
  const [modules, setModules] = useState<string[]>(['leads', 'clients', 'invoices'])
  const [copied, setCopied] = useState(false)

  const availableModules = [
    { id: 'leads', name: 'CRM & Leads', description: 'Gestion des leads et opportunités' },
    { id: 'clients', name: 'Clients', description: 'Gestion de la base clients' },
    { id: 'invoices', name: 'Facturation', description: 'Devis et factures' },
    { id: 'quotes', name: 'Devis', description: 'Création de devis' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/platform/trials/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          lead_id: leadId,
          duration_days: duration,
          enabled_modules: modules,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Erreur lors de la création de l\'essai')
        return
      }

      setSuccess(true)
      setTrialData(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyPassword = () => {
    if (trialData?.password) {
      navigator.clipboard.writeText(trialData.password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleToggleModule = (moduleId: string) => {
    if (modules.includes(moduleId)) {
      setModules(modules.filter((m) => m !== moduleId))
    } else {
      setModules([...modules, moduleId])
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Rocket className="w-6 h-6 text-blue-400" />
              Créer un essai gratuit
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Pour : <strong className="text-blue-400">{leadName}</strong> ({leadEmail})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Durée */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-3">
                  Durée de l'essai
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDuration(days)}
                      className={`py-3 px-4 rounded-lg border transition-all ${
                        duration === days
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <div className="text-2xl font-bold">{days}</div>
                      <div className="text-xs">jours</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Modules */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-3">
                  Modules à activer
                </label>
                <div className="space-y-2">
                  {availableModules.map((module) => (
                    <label
                      key={module.id}
                      className="flex items-start gap-3 p-4 bg-gray-700 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-600 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={modules.includes(module.id)}
                        onChange={() => handleToggleModule(module.id)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-white font-medium">{module.name}</div>
                        <div className="text-sm text-gray-400">{module.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || modules.length === 0}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      Créer l'essai
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Succès */}
              <div className="bg-green-900/20 border border-green-500 rounded-lg p-6 flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-400 mb-1">
                    Essai créé avec succès !
                  </h3>
                  <p className="text-sm text-green-300">
                    Les identifiants ont été envoyés par email au client.
                  </p>
                </div>
              </div>

              {/* Identifiants */}
              <div className="bg-gray-700 rounded-lg p-5 space-y-4">
                <h3 className="font-semibold text-white mb-3">
                  📋 Informations de connexion
                </h3>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email</label>
                  <div className="bg-gray-800 px-3 py-2 rounded text-sm text-gray-200">
                    {trialData?.email}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Mot de passe</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-800 px-3 py-2 rounded text-sm font-mono text-blue-400">
                      {trialData?.password}
                    </div>
                    <button
                      onClick={handleCopyPassword}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                      title="Copier le mot de passe"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <Copy className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Lien de connexion</label>
                  <a
                    href={trialData?.login_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {trialData?.login_url}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Expire le</label>
                  <div className="bg-gray-800 px-3 py-2 rounded text-sm text-yellow-400">
                    {new Date(trialData?.trial_end_date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Terminé
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

