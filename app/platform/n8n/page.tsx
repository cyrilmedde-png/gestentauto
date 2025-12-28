'use client'

import { useEffect, useState, useRef } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Variable globale pour persister l'iframe en dehors de React
let globalN8NIframe: HTMLIFrameElement | null = null
const IFRAME_ID = 'n8n-persistent-iframe'

export default function N8NPage() {
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    
    // Timeout de sécurité pour le chargement
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => {
      clearTimeout(timeout)
    }
  }, [])

  // Créer/récupérer l'iframe une seule fois
  useEffect(() => {
    if (!mounted || loading) return

    // Vérifier si l'iframe globale existe déjà dans le DOM
    const existingIframe = document.getElementById(IFRAME_ID) as HTMLIFrameElement | null
    if (existingIframe) {
      globalN8NIframe = existingIframe
      // Déplacer l'iframe dans notre container si nécessaire
      if (containerRef.current && existingIframe.parentNode !== containerRef.current) {
        containerRef.current.appendChild(existingIframe)
      }
      setLoading(false)
      return
    }

    // Si l'iframe globale existe en mémoire mais pas dans le DOM, la recréer
    if (globalN8NIframe && !globalN8NIframe.parentNode) {
      if (containerRef.current) {
        containerRef.current.appendChild(globalN8NIframe)
        setLoading(false)
        return
      }
    }

    // Créer l'iframe une seule fois
    if (containerRef.current && !globalN8NIframe) {
      const iframe = document.createElement('iframe')
      iframe.id = IFRAME_ID
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
      setLoading(false)
    }

    // Ne jamais supprimer l'iframe lors du cleanup
    return () => {
      // Ne rien faire - l'iframe doit persister
    }
  }, [mounted, loading])

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
