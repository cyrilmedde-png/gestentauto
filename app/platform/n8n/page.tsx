'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function N8NPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Timeout de sécurité pour le chargement
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 2000)

    // Gérer la visibilité de l'onglet pour éviter le re-render
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsVisible(true)
        // L'iframe existe déjà, ne pas recharger
      } else {
        setIsVisible(false)
      }
    }

    // Gérer le focus de la fenêtre pour éviter le rechargement
    const handleFocus = () => {
      // Quand l'onglet redevient actif, ne pas recharger l'iframe
      // Elle existe déjà avec sa session
    }

    // Empêcher le re-render automatique de Next.js quand l'onglet redevient actif
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Ne rien faire, juste empêcher le rechargement inutile
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus, { passive: true })
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearTimeout(timeout)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

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
          <iframe
            ref={iframeRef}
            key="n8n-iframe-persistent" // Key fixe pour éviter la recréation par React
            src="https://n8n.talosprimes.com"
            className="w-full h-full border-0 rounded-lg"
            title="N8N - Automatisation"
            allow="clipboard-read; clipboard-write; fullscreen"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            style={{ display: isVisible ? 'block' : 'none' }}
          />
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
