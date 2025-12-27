'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import MakePageClient from './make-page-client'

// Forcer le rendu dynamique - ne pas pré-rendre statiquement
// Note: revalidate ne peut pas être utilisé dans les client components
export const dynamic = 'force-dynamic'

export default function MakePage() {
  return (
    <ProtectedPlatformRoute>
      <MakePageClient />
    </ProtectedPlatformRoute>
  )
}

