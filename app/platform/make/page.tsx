'use client'

import { useEffect, useState, useRef } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'

/**
 * Page Make.com - Client Component
 * Utilise ProtectedPlatformRoute pour la vérification d'authentification
 * (structure identique aux autres pages platform qui fonctionnent)
 */
export default function MakePage() {
  const [loading, setLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    
    const timeout = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false)
      }
    }, 1000)

    return () => {
      mountedRef.current = false
      clearTimeout(timeout)
    }
  }, [])

  // Créer l'iframe une seule fois et la conserver
  useEffect(() => {
    if (loading || !containerRef.current) return

    // Vérifier si l'iframe existe déjà dans le container
    if (containerRef.current.querySelector('iframe')) {
      iframeRef.current = containerRef.current.querySelector('iframe') as HTMLIFrameElement
      return
    }

    // Créer l'iframe Make.com via proxy
    const iframe = document.createElement('iframe')
    iframe.src = '/api/platform/make/proxy'
    iframe.className = 'w-full h-full border-0 rounded-lg'
    iframe.title = 'Make - Automatisation'
    iframe.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen')
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox')
    iframe.setAttribute('loading', 'eager')
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.border = '0'
    iframe.style.borderRadius = '0.5rem'

    // Écouter le chargement de l'iframe pour arrêter le loading
    iframe.onload = () => {
      if (mountedRef.current) {
        setLoading(false)
      }
    }

    containerRef.current.appendChild(iframe)
    iframeRef.current = iframe

    return () => {
      // Ne pas supprimer l'iframe pour préserver l'état
    }
  }, [loading])

  if (loading) {
    return (
      <ProtectedPlatformRoute>
        <MainLayout>
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement de Make...</p>
            </div>
          </div>
        </MainLayout>
      </ProtectedPlatformRoute>
    )
  }

  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <div 
          ref={containerRef}
          className="w-full h-[calc(100vh-4rem)]"
          style={{ position: 'relative' }}
        />
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

