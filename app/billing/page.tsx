'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Package, Receipt, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import CurrentPlan from '@/components/billing/CurrentPlan'
import UpgradePlanModal from '@/components/billing/UpgradePlanModal'
import PaymentMethodsList from '@/components/billing/PaymentMethodsList'
import InvoicesList from '@/components/billing/InvoicesList'
import UsageStats from '@/components/billing/UsageStats'
import CancelSubscriptionModal from '@/components/billing/CancelSubscriptionModal'

function BillingContent() {
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
          Gestion de l'Abonnement
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Gérez votre formule, moyens de paiement et factures
        </p>
      </div>

      {/* Success/Cancel Messages */}
      {success && (
        <div className="mb-6 bg-green-500/10 border border-green-500/50 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-600">
              Paiement réussi !
            </h3>
            <p className="text-sm text-green-600 mt-1">
              Votre abonnement a été activé avec succès. Bienvenue sur Talos Prime !
            </p>
          </div>
        </div>
      )}

      {canceled && (
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-600">
              Paiement annulé
            </h3>
            <p className="text-sm text-yellow-600 mt-1">
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
          <div className="border border-border/50 rounded-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Actions Rapides
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="w-full flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm sm:text-base"
              >
                <Package className="w-4 h-4 mr-2" />
                Changer de formule
              </button>
              <button
                onClick={() => router.push('/support')}
                className="w-full flex items-center justify-center px-4 py-2 border border-border/50 hover:bg-muted text-foreground rounded-lg transition-colors text-sm sm:text-base"
              >
                Contacter le support
              </button>
            </div>
          </div>

          {/* Help Box */}
          <div className="bg-primary/10 rounded-lg p-4 sm:p-6 border border-primary/20">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2">
              💡 Besoin d'aide ?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">
              Notre équipe est disponible pour vous aider avec votre abonnement.
            </p>
            <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
              <p>📧 billing@talosprimes.com</p>
              <p>📱 +33 X XX XX XX XX</p>
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

export default function BillingPage() {
  return (
    <MainLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement de la page de facturation...</p>
          </div>
        </div>
      }>
        <BillingContent />
      </Suspense>
    </MainLayout>
  )
}
