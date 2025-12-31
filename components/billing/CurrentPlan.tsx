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
      <div className="border border-border/50 rounded-lg p-6 sm:p-8 text-center">
        <Package className="w-14 h-14 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
          Aucun Abonnement Actif
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground mb-6">
          Choisissez une formule pour commencer à utiliser Talos Prime
        </p>
        <button
          onClick={onUpgrade}
          className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors text-sm sm:text-base"
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
          <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-500/10 text-green-600">
            ✅ Actif
          </span>
        )
      case 'past_due':
        return (
          <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-orange-500/10 text-orange-600">
            ⚠️ En retard
          </span>
        )
      case 'canceled':
        return (
          <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-muted text-muted-foreground">
            ❌ Annulé
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-muted text-muted-foreground">
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
    <div className="border border-border/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 px-4 sm:px-6 py-6 sm:py-8 text-primary-foreground">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <span className="text-3xl sm:text-4xl">{getPlanIcon()}</span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">{plan?.displayName}</h2>
                <p className="text-primary-foreground/80 text-xs sm:text-sm mt-1">{plan?.description}</p>
              </div>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6">
        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-bold text-foreground">
              {amount}€
            </span>
            <span className="text-sm sm:text-base text-muted-foreground">/mois</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-start space-x-3">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Prochain prélèvement</p>
              <p className="text-sm sm:text-base font-semibold text-foreground">
                {formatDate(currentPeriodEnd)}
              </p>
            </div>
          </div>

          {canceledAt && (
            <div className="flex items-start space-x-3">
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Annulé le</p>
                <p className="text-sm sm:text-base font-semibold text-foreground">
                  {formatDate(canceledAt)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        {plan?.features && plan.features.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-3">
              Fonctionnalités incluses
            </h3>
            <ul className="space-y-2">
              {plan.features.slice(0, 5).map((feature: string, index: number) => (
                <li key={index} className="flex items-start space-x-2 text-xs sm:text-sm">
                  <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onUpgrade}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors text-sm sm:text-base"
          >
            <Package className="w-4 h-4 mr-2" />
            Changer de formule
          </button>

          {status === 'active' && !canceledAt && (
            <button
              onClick={onCancel}
              className="flex-1 flex items-center justify-center px-4 py-2 border border-red-500/50 hover:bg-red-500/10 text-red-600 font-semibold rounded-lg transition-colors text-sm sm:text-base"
            >
              <X className="w-4 h-4 mr-2" />
              Annuler l'abonnement
            </button>
          )}
        </div>

        {canceledAt && (
          <div className="mt-4 p-3 sm:p-4 bg-orange-500/10 border border-orange-500/50 rounded-lg">
            <p className="text-xs sm:text-sm text-orange-600">
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

