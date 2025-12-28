'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function MakePage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="w-full h-[calc(100vh-4rem)]" style={{ position: 'relative' }}>
          <iframe
            src="/api/platform/make/proxy"
            className="w-full h-full border-0"
            title="Make - Automatisation"
          />
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}

