'use client'

import { useEffect, useRef, useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import React from 'react'

// Variable globale pour persister l'iframe entre les remontages
// Stockée directement dans document.body pour éviter les remontages React
let globalIframe: HTMLIFrameElement | null = null
let iframeLoaded = false
let iframeContainer: HTMLDivElement | null = null

// Fonction pour créer/mettre à jour l'iframe de manière persistante
function ensureIframeExists(targetContainer: HTMLDivElement) {
  renderCount++
  console.log(`[N8N Iframe] Render count: ${renderCount}, Iframe exists: ${!!globalIframe}, Loaded: ${iframeLoaded}`)
  
  // Si l'iframe existe déjà, juste la déplacer si nécessaire
  if (globalIframe && iframeContainer) {
    if (globalIframe.parentNode !== targetContainer) {
      console.log('[N8N Iframe] Moving iframe to new container')
      // Déplacer l'iframe vers le nouveau conteneur
      targetContainer.appendChild(globalIframe)
      iframeContainer = targetContainer
    } else {
      console.log('[N8N Iframe] Iframe already in correct container')
    }
    return globalIframe
  }

  // Créer le conteneur si nécessaire
  if (!iframeContainer) {
    iframeContainer = targetContainer
  }

  // Créer l'iframe une seule fois
  if (!globalIframe) {
    console.log('[N8N Iframe] Creating new iframe')
    const iframe = document.createElement('iframe')
    iframe.src = 'https://n8n.talosprimes.com'
    iframe.className = 'w-full h-full border-0 rounded-lg'
    iframe.title = 'N8N - Automatisation'
    iframe.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen')
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox')
    iframe.style.display = 'block'
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    
    iframe.onload = () => {
      iframeLoaded = true
      console.log('[N8N Iframe] Iframe loaded successfully')
      // Déclencher un événement personnalisé pour notifier le chargement
      window.dispatchEvent(new CustomEvent('n8n-iframe-loaded'))
    }

    iframe.onerror = () => {
      console.error('[N8N Iframe] Iframe load error')
    }

    globalIframe = iframe
    iframeContainer.appendChild(iframe)
    console.log('[N8N Iframe] Iframe appended to container')
  }

  return globalIframe
}

const N8NPageContent = React.memo(() => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(!iframeLoaded)
  const [mounted, setMounted] = useState(false)

  // S'assurer que le composant est monté côté client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Gérer l'iframe de manière persistante
  useEffect(() => {
    if (!mounted || !containerRef.current) {
      return
    }

    // Créer/mettre à jour l'iframe
    ensureIframeExists(containerRef.current)

    // Écouter l'événement de chargement
    const handleIframeLoaded = () => {
      setLoading(false)
    }
    window.addEventListener('n8n-iframe-loaded', handleIframeLoaded)

    // Timeout de sécurité
    const timeout = setTimeout(() => {
      if (!iframeLoaded) {
        iframeLoaded = true
        setLoading(false)
      }
    }, 5000)

    // Si l'iframe est déjà chargée, ne pas afficher le loader
    if (iframeLoaded) {
      setLoading(false)
    }

    return () => {
      window.removeEventListener('n8n-iframe-loaded', handleIframeLoaded)
      clearTimeout(timeout)
      // NE JAMAIS supprimer l'iframe - elle reste en mémoire
    }
  }, [mounted])

  // Gérer la visibilité - simplement s'assurer que l'iframe reste attachée
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Si l'iframe a été perdue, la remettre
      if (globalIframe && !globalIframe.parentNode && containerRef.current) {
        containerRef.current.appendChild(globalIframe)
      }
    }

    const handleFocus = () => {
      // Vérifier que l'iframe est toujours là
      if (globalIframe && !globalIframe.parentNode && containerRef.current) {
        containerRef.current.appendChild(globalIframe)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true })
    window.addEventListener('focus', handleFocus, { passive: true })
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  if (!mounted) {
    return null
  }

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
          suppressHydrationWarning
          style={{ position: 'relative' }}
        />
      </MainLayout>
    </ProtectedRoute>
  )
})

N8NPageContent.displayName = 'N8NPageContent'

export default function N8NPage() {
  return <N8NPageContent />
}
