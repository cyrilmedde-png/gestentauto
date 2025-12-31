'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle2, Copy } from 'lucide-react'

interface CreateCustomPlanModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateCustomPlanModal({ onClose, onSuccess }: CreateCustomPlanModalProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [companies, setCompanies] = useState<any[]>([])
  const [formData, setFormData] = useState({
    clientName: '',
    companyId: '',
    price: '',
    maxUsers: '',
    maxLeads: '',
    maxStorageGb: '',
    maxWorkflows: '',
    billingEmail: '',
    features: ''
  })

  // Charger les companies au montage
  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      // Vous pouvez créer une API pour lister les companies
      // Pour l'instant, on laisse l'utilisateur entrer manuellement
    } catch (error) {
      console.error('Erreur chargement companies:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/subscriptions/create-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: formData.clientName,
          companyId: formData.companyId,
          price: parseFloat(formData.price),
          maxUsers: formData.maxUsers ? parseInt(formData.maxUsers) : null,
          maxLeads: formData.maxLeads ? parseInt(formData.maxLeads) : null,
          maxStorageGb: formData.maxStorageGb ? parseInt(formData.maxStorageGb) : null,
          maxWorkflows: formData.maxWorkflows ? parseInt(formData.maxWorkflows) : null,
          billingEmail: formData.billingEmail,
          features: formData.features.split(',').map(f => f.trim()).filter(f => f)
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setCheckoutUrl(data.checkoutUrl)
        // Auto-fermer après 10 secondes
        setTimeout(() => {
          onSuccess()
        }, 10000)
      } else {
        alert(`Erreur : ${data.error}`)
        setLoading(false)
      }
    } catch (error) {
      alert('Erreur lors de la création de la formule custom')
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(checkoutUrl)
    alert('Lien copié dans le presse-papier !')
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              🎉 Formule Custom Créée !
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              La formule sur-mesure pour <strong>{formData.clientName}</strong> a été créée avec succès.
            </p>
          </div>

          {/* Checkout URL */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              🔗 Lien de Paiement Stripe
            </h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={checkoutUrl}
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copier</span>
              </button>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
              Envoyez ce lien au client pour qu'il puisse effectuer le paiement
            </p>
          </div>

          {/* Résumé */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-left">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              📊 Résumé de la Formule
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Client :</span>
                <span className="font-medium text-gray-900 dark:text-white">{formData.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Prix :</span>
                <span className="font-medium text-gray-900 dark:text-white">{formData.price}€/mois</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Utilisateurs :</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formData.maxUsers || 'Illimité'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Stockage :</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formData.maxStorageGb ? `${formData.maxStorageGb} GB` : 'Illimité'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={onSuccess}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Fermer
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Cette fenêtre se fermera automatiquement dans 10 secondes
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              🎨 Créer Formule Sur-Mesure
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Créer une formule personnalisée pour un client spécifique
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section Informations Client */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📋 Informations Client
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nom Client */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom du Client <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Entreprise ABC"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email de Facturation <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.billingEmail}
                  onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="contact@entreprise.com"
                />
              </div>

              {/* Company ID */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="uuid-xxx-xxx-xxx"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  UUID de la company dans la table companies
                </p>
              </div>
            </div>
          </div>

          {/* Section Tarification */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              💰 Tarification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Prix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prix Mensuel (€) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="350.00"
                />
              </div>
            </div>
          </div>

          {/* Section Quotas */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 Quotas (laisser vide = illimité)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Max Users */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Utilisateurs
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="10 (vide = illimité)"
                />
              </div>

              {/* Max Leads */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Leads/mois
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxLeads}
                  onChange={(e) => setFormData({ ...formData, maxLeads: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="1000 (vide = illimité)"
                />
              </div>

              {/* Max Storage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stockage (GB)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxStorageGb}
                  onChange={(e) => setFormData({ ...formData, maxStorageGb: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="50 (vide = illimité)"
                />
              </div>

              {/* Max Workflows */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Workflows N8N
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxWorkflows}
                  onChange={(e) => setFormData({ ...formData, maxWorkflows: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="20 (vide = illimité)"
                />
              </div>
            </div>
          </div>

          {/* Section Fonctionnalités */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              ✨ Fonctionnalités
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Liste des fonctionnalités (séparées par des virgules)
              </label>
              <textarea
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="10 utilisateurs, 1000 leads/mois, Support prioritaire, API complète, Formation personnalisée"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Exemple: "10 utilisateurs, 1000 leads/mois, Support 24/7"
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                '🚀 Créer & Générer Lien de Paiement'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

