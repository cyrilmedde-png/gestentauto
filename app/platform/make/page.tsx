'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'

/**
 * Page Make.com - Client Component
 * Structure ultra-simple identique à /platform/dashboard qui fonctionne
 */
export default function MakePage() {
  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <div className="w-full h-[calc(100vh-4rem)]" style={{ position: 'relative' }}>
          <iframe
            src="/api/platform/make/proxy"
            className="w-full h-full border-0 rounded-lg"
            title="Make - Automatisation"
            allow="clipboard-read; clipboard-write; fullscreen"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            style={{ width: '100%', height: '100%', border: '0', borderRadius: '0.5rem' }}
          />
        </div>
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

