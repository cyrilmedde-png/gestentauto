import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/modules/core/components/ProtectedRoute'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Tableau de bord
          </h1>
          <p className="text-gray-400 mb-6">Vue d'ensemble de votre entreprise</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-transparent rounded-xl p-6 border border-white/5 hover:border-white/10 transition-all">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Clients
              </h3>
              <p className="text-3xl font-bold text-white">0</p>
            </div>
            
            <div className="bg-transparent rounded-xl p-6 border border-white/5 hover:border-white/10 transition-all">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Factures
              </h3>
              <p className="text-3xl font-bold text-white">0</p>
            </div>
            
            <div className="bg-transparent rounded-xl p-6 border border-white/5 hover:border-white/10 transition-all">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Revenus
              </h3>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">0 €</p>
            </div>
            
            <div className="bg-transparent rounded-xl p-6 border border-white/5 hover:border-white/10 transition-all">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Projets
              </h3>
              <p className="text-3xl font-bold text-white">0</p>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}

