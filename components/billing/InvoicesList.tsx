'use client'

import { Receipt, Download } from 'lucide-react'

export default function InvoicesList() {
  // TODO: Implémenter la récupération des factures via API Stripe
  // Pour l'instant, composant placeholder

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Receipt className="w-5 h-5 mr-2" />
        Factures & Reçus
      </h3>

      <div className="text-center py-8">
        <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Aucune facture disponible
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Vos factures apparaîtront ici après votre premier paiement
        </p>
      </div>
    </div>
  )
}

