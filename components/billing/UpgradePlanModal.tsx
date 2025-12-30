'use client'

import { useState } from 'react'
import { X, Check, ArrowRight, Loader2 } from 'lucide-react'

interface UpgradePlanModalProps {
  currentPlan: any
  availablePlans: any[]
  onClose: () => void
  onSuccess: () => void
}

export default function UpgradePlanModal({
  currentPlan,
  availablePlans,
  onClose,
  onSuccess,
}: UpgradePlanModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectPlan = async (planId: string) => {
    try {
      setLoading(true)
      setError(null)

      // Si c'est le premier abonnement, créer une session checkout
      if (!currentPlan) {
        const response = await fetch('/api/stripe/checkout/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_id: planId }),
        })

        const data = await response.json()

        if (!data.success) {
          setError(data.error || 'Erreur lors de la création de la session')
          setLoading(false)
          return
        }

        // Rediriger vers Stripe Checkout
        window.location.href = data.url
        return
      }

      // Sinon, changer de formule
      const response = await fetch('/api/stripe/subscriptions/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_plan_id: planId }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Erreur lors du changement de formule')
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

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'starter':
        return '🥉'
      case 'business':
        return '🥈'
      case 'enterprise':
        return '🥇'
      default:
        return '📦'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentPlan ? 'Changer de Formule' : 'Choisir une Formule'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Plans Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availablePlans.map((plan) => {
              const isCurrentPlan = currentPlan?.id === plan.id
              const isUpgrade = currentPlan && plan.price > currentPlan.price
              const isDowngrade = currentPlan && plan.price < currentPlan.price

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-lg border-2 p-6 ${
                    isCurrentPlan
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  } transition-all`}
                >
                  {/* Badge Current */}
                  {isCurrentPlan && (
                    <div className="absolute top-0 right-0 -mt-3 -mr-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white">
                        Formule actuelle
                      </span>
                    </div>
                  )}

                  {/* Badge Recommended */}
                  {plan.name === 'business' && !isCurrentPlan && (
                    <div className="absolute top-0 right-0 -mt-3 -mr-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-600 text-white">
                        ⭐ Recommandé
                      </span>
                    </div>
                  )}

                  {/* Icon */}
                  <div className="text-4xl mb-4">{getPlanIcon(plan.name)}</div>

                  {/* Plan Name */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.displayName}
                  </h3>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {plan.price}€
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">/mois</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {plan.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {plan.features.slice(0, 5).map((feature: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading || isCurrentPlan}
                    className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center ${
                      isCurrentPlan
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : isUpgrade
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : isDowngrade
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Chargement...
                      </>
                    ) : isCurrentPlan ? (
                      'Formule actuelle'
                    ) : isUpgrade ? (
                      <>
                        Passer à {plan.displayName}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : isDowngrade ? (
                      <>
                        Revenir à {plan.displayName}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Choisir {plan.displayName}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Info Box */}
          {currentPlan && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                💡 Le prorata sera automatiquement calculé. Vous serez crédité ou facturé selon le changement de formule.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

