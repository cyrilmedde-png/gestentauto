'use client'

import { useEffect, useState, useRef } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Stocker l'iframe globalement pour éviter la recréation
let globalIframe: HTMLIFrameElement | null = null
let globalIframeContainer: HTMLDivElement | null = null

export default function N8NPage() {
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    
    // Timeout de sécurité pour le chargement
    const timeout = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false)
      }
    }, 2000)

    return () => {
      mountedRef.current = false
      clearTimeout(timeout)
    }
  }, [])

  // Créer/récupérer l'iframe une seule fois
  useEffect(() => {
    if (loading || !containerRef.current) return

    // Si l'iframe globale existe déjà, la réutiliser
    if (globalIframe && globalIframeContainer && globalIframeContainer.parentNode) {
      // L'iframe existe déjà ailleurs, la déplacer ici si nécessaire
      if (containerRef.current !== globalIframeContainer) {
        // Si l'iframe est dans un autre container, la déplacer
        if (globalIframe.parentNode && globalIframe.parentNode !== containerRef.current) {
          containerRef.current.appendChild(globalIframe)
        } else if (!containerRef.current.contains(globalIframe)) {
          containerRef.current.appendChild(globalIframe)
        }
      }
      globalIframeContainer = containerRef.current
      setLoading(false)
      return
    }

    // Vérifier si l'iframe existe déjà dans le container
    const existingIframe = containerRef.current.querySelector('iframe') as HTMLIFrameElement | null
    if (existingIframe) {
      globalIframe = existingIframe
      globalIframeContainer = containerRef.current
      setLoading(false)
      return
    }

    // Créer l'iframe une seule fois
    const iframe = document.createElement('iframe')
    iframe.src = 'https://n8n.talosprimes.com'
    iframe.className = 'w-full h-full border-0 rounded-lg'
    iframe.title = 'N8N - Automatisation'
    iframe.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen')
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox')
    iframe.setAttribute('loading', 'eager')
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.border = '0'
    iframe.style.borderRadius = '0.5rem'

    containerRef.current.appendChild(iframe)
    globalIframe = iframe
    globalIframeContainer = containerRef.current
    setLoading(false)

    // Ne jamais supprimer l'iframe
    return () => {
      // Ne pas supprimer l'iframe pour préserver l'état
    }
  }, [loading])

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
        <div 
          ref={containerRef}
          className="w-full h-[calc(100vh-4rem)]"
          style={{ position: 'relative' }}
        />
      </MainLayout>
    </ProtectedRoute>
  )
}
