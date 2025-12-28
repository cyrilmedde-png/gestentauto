'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Variable globale pour persister l'iframe - CRÉÉE UNE SEULE FOIS
let globalN8NIframe: HTMLIFrameElement | null = null
const IFRAME_ID = 'n8n-persistent-iframe-container'

function N8NIframe() {
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !containerRef.current) return

    // Si l'iframe globale existe déjà quelque part dans le DOM, la déplacer ici
    const existingIframe = document.getElementById(IFRAME_ID)?.querySelector('iframe') as HTMLIFrameElement | null
    if (existingIframe) {
      globalN8NIframe = existingIframe
      // Si elle est dans un autre container, la déplacer
      if (existingIframe.parentNode && existingIframe.parentNode !== containerRef.current) {
        containerRef.current.appendChild(existingIframe)
      } else if (!containerRef.current.contains(existingIframe)) {
        containerRef.current.appendChild(existingIframe)
      }
      return
    }

    // Si l'iframe globale existe en mémoire mais pas dans le DOM
    if (globalN8NIframe) {
      if (globalN8NIframe.parentNode && globalN8NIframe.parentNode !== containerRef.current) {
        containerRef.current.appendChild(globalN8NIframe)
      } else if (!containerRef.current.contains(globalN8NIframe)) {
        containerRef.current.appendChild(globalN8NIframe)
      }
      return
    }

    // Créer l'iframe UNE SEULE FOIS
    if (!globalN8NIframe && containerRef.current) {
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
      globalN8NIframe = iframe
    }

    // Ne JAMAIS supprimer l'iframe lors du cleanup
    return () => {
      // Ne rien faire - l'iframe doit persister même si le composant se démonte
    }
  }, [mounted])

  return (
    <div 
      id={IFRAME_ID}
      ref={containerRef}
      className="w-full h-[calc(100vh-4rem)]"
      style={{ position: 'relative' }}
    />
  )
}

export default function N8NPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Timeout de sécurité pour le chargement
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 1500)

    return () => {
      clearTimeout(timeout)
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
        <N8NIframe />
      </MainLayout>
    </ProtectedRoute>
  )
}
