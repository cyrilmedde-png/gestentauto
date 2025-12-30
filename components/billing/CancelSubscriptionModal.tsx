'use client'

import { useState } from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'

interface CancelSubscriptionModalProps {
  subscription: any
  onClose: () => void
  onSuccess: () => void
}

export default function CancelSubscriptionModal({
  subscription,
  onClose,
  onSuccess,
}: CancelSubscriptionModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [cancelImmediately, setCancelImmediately] = useState(false)

  const handleCancel = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/stripe/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason || undefined,
          cancel_at_period_end: !cancelImmediately,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Erreur lors de l\'annulation')
        setLoading(false)
        return
      }

      // Succès
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Annuler l'Abonnement
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Warning */}
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              ⚠️ Nous sommes désolés de vous voir partir. Êtes-vous sûr de vouloir annuler votre abonnement ?
            </p>
          </div>

          {/* Current Plan Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Abonnement actuel
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>Formule : <span className="font-medium">{subscription?.plan?.displayName}</span></p>
              <p>Prix : <span className="font-medium">{subscription?.amount}€/mois</span></p>
              <p>Fin de période : <span className="font-medium">{formatDate(subscription?.currentPeriodEnd)}</span></p>
            </div>
          </div>

          {/* Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pourquoi annulez-vous ? (optionnel)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Dites-nous ce que nous pourrions améliorer..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Cancel Options */}
          <div className="mb-6 space-y-3">
            <label className="flex items-start space-x-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
              <input
                type="radio"
                name="cancel_type"
                checked={!cancelImmediately}
                onChange={() => setCancelImmediately(false)}
                className="mt-1"
                disabled={loading}
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  Annuler à la fin de la période (recommandé)
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Vous conservez l'accès jusqu'au <strong>{formatDate(subscription?.currentPeriodEnd)}</strong>.
                  Aucun nouveau prélèvement ne sera effectué.
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-red-300 dark:hover:border-red-600 transition-colors">
              <input
                type="radio"
                name="cancel_type"
                checked={cancelImmediately}
                onChange={() => setCancelImmediately(true)}
                className="mt-1"
                disabled={loading}
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  Annuler immédiatement
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Votre accès sera coupé immédiatement. Aucun remboursement ne sera effectué.
                </p>
              </div>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
            >
              Garder mon abonnement
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Annulation...
                </>
              ) : (
                'Confirmer l\'annulation'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

