'use client'

import { Package, Calendar, CreditCard, ArrowRight, X } from 'lucide-react'

interface CurrentPlanProps {
  subscription: any
  onUpgrade: () => void
  onCancel: () => void
}

export default function CurrentPlan({ subscription, onUpgrade, onCancel }: CurrentPlanProps) {
  if (!subscription) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Aucun Abonnement Actif
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Choisissez une formule pour commencer à utiliser Talos Prime
        </p>
        <button
          onClick={onUpgrade}
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Choisir une formule
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    )
  }

  const { plan, status, currentPeriodEnd, canceledAt, amount, currency } = subscription

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            ✅ Actif
          </span>
        )
      case 'past_due':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
            ⚠️ En retard
          </span>
        )
      case 'canceled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            ❌ Annulé
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {status}
          </span>
        )
    }
  }

  const getPlanIcon = () => {
    switch (plan?.name) {
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-4xl">{getPlanIcon()}</span>
              <div>
                <h2 className="text-2xl font-bold">{plan?.displayName}</h2>
                <p className="text-blue-100 text-sm mt-1">{plan?.description}</p>
              </div>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {amount}€
            </span>
            <span className="text-gray-500 dark:text-gray-400">/mois</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Prochain prélèvement</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatDate(currentPeriodEnd)}
              </p>
            </div>
          </div>

          {canceledAt && (
            <div className="flex items-start space-x-3">
              <X className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Annulé le</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(canceledAt)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        {plan?.features && plan.features.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Fonctionnalités incluses
            </h3>
            <ul className="space-y-2">
              {plan.features.slice(0, 5).map((feature: string, index: number) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onUpgrade}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Package className="w-4 h-4 mr-2" />
            Changer de formule
          </button>

          {status === 'active' && !canceledAt && (
            <button
              onClick={onCancel}
              className="flex-1 flex items-center justify-center px-4 py-2 border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold rounded-lg transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Annuler l'abonnement
            </button>
          )}
        </div>

        {canceledAt && (
          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="text-sm text-orange-800 dark:text-orange-300">
              ⚠️ Votre abonnement sera définitivement annulé le{' '}
              <strong>{formatDate(currentPeriodEnd)}</strong>.
              Vous pouvez le réactiver à tout moment avant cette date.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

