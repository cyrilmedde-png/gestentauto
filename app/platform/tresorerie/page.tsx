'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import { TrendingUp } from 'lucide-react'

export default function TresoreriePage() {
  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Trésorerie
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Suivi de trésorerie et prévisions
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-12 text-center">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">
              Module Trésorerie en cours de développement...
            </p>
          </div>
        </div>
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

