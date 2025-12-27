'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import MakePageClient from './make-page-client'

// Forcer le rendu dynamique - ne pas pré-rendre statiquement
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function MakePage() {
  return (
    <ProtectedPlatformRoute>
      <MakePageClient />
    </ProtectedPlatformRoute>
  )
}

