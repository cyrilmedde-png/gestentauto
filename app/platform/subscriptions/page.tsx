'use client'

import { useState, useEffect } from 'react'
import { Plus, Package, Users, TrendingUp, DollarSign } from 'lucide-react'
import CreateCustomPlanModal from '@/components/admin/CreateCustomPlanModal'

export default function SubscriptionsAdminPage() {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                💳 Gestion des Abonnements
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gérer les formules et créer des abonnements sur-mesure
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Créer Formule Custom</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Abonnements Actifs
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalSubscriptions}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Revenu Mensuel
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalRevenue.toFixed(2)}€
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Clients Actifs
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.activeCustomers}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Formules Disponibles */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Formules Disponibles
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                >
                  {/* Badge Custom */}
                  {plan.name.startsWith('custom_') && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        🎨 Custom
                      </span>
                    </div>
                  )}

                  {/* Nom */}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {plan.displayName}
                  </h3>

                  {/* Prix */}
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {plan.price}€
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">/mois</span>
                  </div>

                  {/* Quotas */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Users:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {plan.quotas.maxUsers || '∞'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Leads:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {plan.quotas.maxLeads || '∞'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Storage:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {plan.quotas.maxStorageGb ? `${plan.quotas.maxStorageGb} GB` : '∞'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Workflows:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {plan.quotas.maxWorkflows || '∞'}
                      </span>
                    </div>
                  </div>

                  {/* Stripe IDs */}
                  {plan.stripeProductId && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 break-all">
                        Product: {plan.stripeProductId}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 break-all">
                        Price: {plan.stripePriceId}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Card Créer Custom */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex flex-col items-center justify-center min-h-[300px] group"
              >
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Plus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Créer Formule Custom
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Créer une formule sur-mesure pour un client spécifique
                </p>
              </button>
            </div>
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
