'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import { FileStack } from 'lucide-react'

export default function DocumentsPage() {
  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              GED
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gestion électronique de documents
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-12 text-center">
            <FileStack className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">
              Module GED en cours de développement...
            </p>
          </div>
        </div>
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

