'use client'

import { useEffect, useRef, useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import React from 'react'

// Variable globale pour persister l'iframe entre les remontages
// Cela empêche le rechargement lors du changement d'onglet
let globalIframe: HTMLIFrameElement | null = null
let iframeLoaded = false

const N8NPageContent = React.memo(() => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(!iframeLoaded)

  useEffect(() => {
    if (!containerRef.current) return

    // Si l'iframe globale existe déjà, la réutiliser
    if (globalIframe) {
      // Si l'iframe est dans un autre conteneur, la déplacer
      if (globalIframe.parentNode && globalIframe.parentNode !== containerRef.current) {
        containerRef.current.appendChild(globalIframe)
      } else if (!globalIframe.parentNode) {
        // Si l'iframe n'a pas de parent, l'ajouter
        containerRef.current.appendChild(globalIframe)
      }
      
      // Si déjà chargée, ne pas afficher le loader
      if (iframeLoaded) {
        setLoading(false)
      }
      return
    }

    // Créer l'iframe une seule fois dans toute la vie de l'application
    const iframe = document.createElement('iframe')
    iframe.src = 'https://n8n.talosprimes.com'
    iframe.className = 'w-full h-full border-0 rounded-lg'
    iframe.title = 'N8N - Automatisation'
    iframe.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen')
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox')
    
    iframe.onload = () => {
      iframeLoaded = true
      setLoading(false)
    }

    globalIframe = iframe
    containerRef.current.appendChild(iframe)

    // Timeout de sécurité
    const timeout = setTimeout(() => {
      if (!iframeLoaded) {
        iframeLoaded = true
        setLoading(false)
      }
    }, 5000)

    // Ne jamais nettoyer - garder l'iframe en mémoire pour éviter le rechargement
    return () => {
      clearTimeout(timeout)
      // Ne pas supprimer l'iframe du DOM - elle reste en mémoire
    }
  }, [])

  // Empêcher le rechargement lors des événements de visibilité
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Ne rien faire - l'iframe reste en mémoire
    }

    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true })
    
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
          suppressHydrationWarning
        />
      </MainLayout>
    </ProtectedRoute>
  )
})

N8NPageContent.displayName = 'N8NPageContent'

export default function N8NPage() {
  return <N8NPageContent />
}
