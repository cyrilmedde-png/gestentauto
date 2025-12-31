'use client'

import { useState, useEffect } from 'react'
import { Plus, Package, Users, TrendingUp, DollarSign } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import CreateCustomPlanModal from '@/components/admin/CreateCustomPlanModal'

function SubscriptionsAdminContent() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    totalRevenue: 0,
    activeCustomers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Charger les formules
      const plansResponse = await fetch('/api/stripe/plans/list')
      const plansData = await plansResponse.json()
      if (plansData.success) {
        setPlans(plansData.plans)
      }

      // TODO: Charger les abonnements actifs
      // const subsResponse = await fetch('/api/admin/subscriptions/list')
      // const subsData = await subsResponse.json()

      // Calculer les stats
      // setStats({
      //   totalSubscriptions: subsData.subscriptions.length,
      //   totalRevenue: subsData.subscriptions.reduce((acc, sub) => acc + sub.amount, 0),
      //   activeCustomers: new Set(subsData.subscriptions.map(s => s.company_id)).size
      // })

    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              💳 Gestion des Abonnements
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gérer les formules et créer des abonnements sur-mesure
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Créer Formule Custom</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="border border-border/50 rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                Abonnements Actifs
              </p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {stats.totalSubscriptions}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="border border-border/50 rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                Revenu Mensuel
              </p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {stats.totalRevenue.toFixed(2)}€
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="border border-border/50 rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                Clients Actifs
              </p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {stats.activeCustomers}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Formules Disponibles */}
      <div className="border border-border/50 rounded-lg">
        <div className="p-4 sm:p-6 border-b border-border/50">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Formules Disponibles
          </h2>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="border border-border/50 rounded-lg p-4 sm:p-6 hover:border-primary/50 transition-colors"
              >
                {/* Badge Custom */}
                {plan.name.startsWith('custom_') && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600">
                      🎨 Custom
                    </span>
                  </div>
                )}

                {/* Nom */}
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">
                  {plan.displayName}
                </h3>

                {/* Prix */}
                <div className="mb-4">
                  <span className="text-2xl sm:text-3xl font-bold text-foreground">
                    {plan.price}€
                  </span>
                  <span className="text-sm text-muted-foreground">/mois</span>
                </div>

                {/* Quotas */}
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Users:</span>
                    <span className="font-medium text-foreground">
                      {plan.quotas.maxUsers || '∞'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Leads:</span>
                    <span className="font-medium text-foreground">
                      {plan.quotas.maxLeads || '∞'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Storage:</span>
                    <span className="font-medium text-foreground">
                      {plan.quotas.maxStorageGb ? `${plan.quotas.maxStorageGb} GB` : '∞'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Workflows:</span>
                    <span className="font-medium text-foreground">
                      {plan.quotas.maxWorkflows || '∞'}
                    </span>
                  </div>
                </div>

                {/* Stripe IDs */}
                {plan.stripeProductId && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground break-all">
                      Product: {plan.stripeProductId}
                    </p>
                    <p className="text-xs text-muted-foreground break-all">
                      Price: {plan.stripePriceId}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Card Créer Custom */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="border-2 border-dashed border-border/50 rounded-lg p-4 sm:p-6 hover:border-primary/50 transition-colors flex flex-col items-center justify-center min-h-[300px] group"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Plus className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                Créer Formule Custom
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                Créer une formule sur-mesure pour un client spécifique
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Créer Custom */}
      {showCreateModal && (
        <CreateCustomPlanModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  )
}

// Export avec les wrappers
export default function SubscriptionsAdminPage() {
  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <SubscriptionsAdminContent />
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}
