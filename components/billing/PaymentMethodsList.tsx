'use client'

import { CreditCard, Plus } from 'lucide-react'

export default function PaymentMethodsList() {
  // TODO: Implémenter la récupération des moyens de paiement via API
  // Pour l'instant, composant placeholder
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <CreditCard className="w-5 h-5 mr-2" />
        Moyens de Paiement
      </h3>

      <div className="space-y-3">
        {/* Placeholder pour afficher qu'aucune carte n'est enregistrée */}
        <div className="text-center py-8">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Géré automatiquement par Stripe Checkout
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Vos moyens de paiement sont sécurisés par Stripe
          </p>
        </div>
      </div>
    </div>
  )
}

