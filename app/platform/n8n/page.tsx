'use client'

import { useEffect, useState, useRef } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function N8NPage() {
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    // Créer l'iframe une seule fois, jamais la recréer
    if (isInitializedRef.current || !containerRef.current) return

    // Vérifier si l'iframe existe déjà (au cas où le DOM persiste)
    const existingIframe = containerRef.current.querySelector('iframe') as HTMLIFrameElement | null
    if (existingIframe) {
      iframeRef.current = existingIframe
      isInitializedRef.current = true
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

    // Événement onload pour arrêter le loading
    iframe.onload = () => {
      setLoading(false)
    }

    // Timeout de sécurité
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 3000)

    containerRef.current.appendChild(iframe)
    iframeRef.current = iframe
    isInitializedRef.current = true

    // Cleanup : Ne JAMAIS supprimer l'iframe, seulement le timeout
    return () => {
      clearTimeout(timeout)
      // NE PAS supprimer l'iframe ici - elle doit persister
    }
  }, []) // Dépendances vides = exécute une seule fois

  // Gérer le changement d'onglet pour préserver l'iframe
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Ne rien faire - juste préserver l'iframe
      // L'iframe N8N gère elle-même la reconnexion WebSocket
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
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
        <div 
          ref={containerRef}
          className="w-full h-[calc(100vh-4rem)]"
          style={{ position: 'relative' }}
        />
      </MainLayout>
    </ProtectedRoute>
  )
}
