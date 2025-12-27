'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import MakePageClient from './make-page-client'

/**
 * Page Make.com - Client Component
 * Utilise ProtectedPlatformRoute pour la vérification d'authentification
 * (comme les autres pages platform qui fonctionnent)
 */
export default function MakePage() {
  return (
    <ProtectedPlatformRoute>
      <MakePageClient />
    </ProtectedPlatformRoute>
  )
}

