'use client'

import { useEffect, useState, useRef, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Mémoriser l'iframe pour éviter les re-renders
const N8NIframe = memo(({ isVisible }: { isVisible: boolean }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const hasLoadedRef = useRef(false)

  // Initialiser l'iframe une seule fois
  useEffect(() => {
    if (!hasLoadedRef.current && iframeRef.current) {
      hasLoadedRef.current = true
    }
  }, [])

  return (
    <iframe
      ref={iframeRef}
      key="n8n-iframe-persistent" // Key fixe
      src="https://n8n.talosprimes.com"
      className="w-full h-full border-0 rounded-lg"
      title="N8N - Automatisation"
      allow="clipboard-read; clipboard-write; fullscreen"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
      loading="eager" // Force le chargement immédiat
      style={{ 
        display: isVisible ? 'block' : 'none',
        // Empêcher le navigateur de suspendre l'iframe
        contentVisibility: 'visible'
      } as React.CSSProperties}
    />
  )
})

N8NIframe.displayName = 'N8NIframe'

export default function N8NPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(true)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    
    // Timeout de sécurité pour le chargement
    const timeout = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false)
      }
    }, 2000)

    // Gérer la visibilité sans re-render
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true })

    return () => {
      mountedRef.current = false
      clearTimeout(timeout)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Mémoriser le contenu pour éviter les re-renders
  const iframeContent = useMemo(() => (
    <N8NIframe isVisible={isVisible} />
  ), [isVisible])

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement de N8N...</p>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="w-full h-[calc(100vh-4rem)]">
          {iframeContent}
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
