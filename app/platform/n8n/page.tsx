'use client'

import { useEffect, useRef, useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import React from 'react'

// Variable globale pour persister l'iframe entre les remontages
let globalIframe: HTMLIFrameElement | null = null
let iframeLoaded = false

const N8NPageContent = React.memo(() => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !containerRef.current) {
      return
    }

    // Si l'iframe existe déjà, la réutiliser
    if (globalIframe) {
      if (globalIframe.parentNode !== containerRef.current) {
        containerRef.current.appendChild(globalIframe)
      }
      if (iframeLoaded) {
        setLoading(false)
      }
      return
    }

    // Créer l'iframe une seule fois
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
      setLoading(false)
      window.dispatchEvent(new CustomEvent('n8n-iframe-loaded'))
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

    return () => {
      clearTimeout(timeout)
      // Ne jamais supprimer l'iframe - elle reste en mémoire
    }
  }, [mounted])

  // S'assurer que l'iframe reste attachée lors des changements de visibilité
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (globalIframe && !globalIframe.parentNode && containerRef.current) {
        containerRef.current.appendChild(globalIframe)
      }
    }

    const handleFocus = () => {
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
        />
      </MainLayout>
    </ProtectedRoute>
  )
})

N8NPageContent.displayName = 'N8NPageContent'

export default function N8NPage() {
  return <N8NPageContent />
}
