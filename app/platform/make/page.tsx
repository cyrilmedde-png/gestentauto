'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import MakePageClient from './make-page-client'

export default function MakePage() {
  return (
    <ProtectedPlatformRoute>
      <MakePageClient />
    </ProtectedPlatformRoute>
  )
}

