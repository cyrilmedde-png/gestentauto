'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Package, Receipt, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import CurrentPlan from '@/components/billing/CurrentPlan'
import UpgradePlanModal from '@/components/billing/UpgradePlanModal'
import PaymentMethodsList from '@/components/billing/PaymentMethodsList'
import InvoicesList from '@/components/billing/InvoicesList'
import UsageStats from '@/components/billing/UsageStats'
import CancelSubscriptionModal from '@/components/billing/CancelSubscriptionModal'

export default function BillingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  // Success/Cancel messages
  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Charger l'abonnement actuel
      const subResponse = await fetch('/api/stripe/subscriptions/current')
      const subData = await subResponse.json()

      if (subData.success) {
        setSubscription(subData.subscription)
      }

      // Charger les formules disponibles
      const plansResponse = await fetch('/api/stripe/plans/list')
      const plansData = await plansResponse.json()

      if (plansData.success) {
        setPlans(plansData.plans)
      }
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgradeSuccess = () => {
    setShowUpgradeModal(false)
    loadData() // Recharger les données
  }

  const handleCancelSuccess = () => {
    setShowCancelModal(false)
    loadData() // Recharger les données
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestion de l'Abonnement
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez votre formule, moyens de paiement et factures
          </p>
        </div>

        {/* Success/Cancel Messages */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                Paiement réussi !
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Votre abonnement a été activé avec succès. Bienvenue sur Talos Prime !
              </p>
            </div>
          </div>
        )}

        {canceled && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                Paiement annulé
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Vous avez annulé le paiement. Vous pouvez réessayer à tout moment.
              </p>
            </div>
          </div>
        )}

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Plan */}
            <CurrentPlan
              subscription={subscription}
              onUpgrade={() => setShowUpgradeModal(true)}
              onCancel={() => setShowCancelModal(true)}
            />

            {/* Usage Stats */}
            <UsageStats subscription={subscription} />

            {/* Invoices */}
            <InvoicesList />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Payment Methods */}
            <PaymentMethodsList />

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Actions Rapides
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Changer de formule
                </button>
                <button
                  onClick={() => router.push('/support')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  Contacter le support
                </button>
              </div>
            </div>

            {/* Help Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 Besoin d'aide ?
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Notre équipe est disponible pour vous aider avec votre abonnement.
              </p>
              <div className="space-y-1 text-sm text-blue-600 dark:text-blue-400">
                <p>📧 billing@talosprimes.com</p>
                <p>📱 +33 X XX XX XX XX</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showUpgradeModal && (
        <UpgradePlanModal
          currentPlan={subscription?.plan}
          availablePlans={plans}
          onClose={() => setShowUpgradeModal(false)}
          onSuccess={handleUpgradeSuccess}
        />
      )}

      {showCancelModal && (
        <CancelSubscriptionModal
          subscription={subscription}
          onClose={() => setShowCancelModal(false)}
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  )
}
