'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function BillingPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Factures
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gestion de vos factures
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-8 sm:p-12">
            <div className="text-center">
              <p className="text-lg text-muted-foreground mb-4">
                Cette fonctionnalité sera bientôt disponible
              </p>
              <p className="text-sm text-muted-foreground">
                Le module de facturation est en cours de développement
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}






