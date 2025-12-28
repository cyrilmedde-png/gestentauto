'use client'

import { useEffect, useState, useRef } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

const IFRAME_ID = 'n8n-persistent-iframe'

// Variable globale pour l'iframe (en dehors du composant React)
let globalN8NIframe: HTMLIFrameElement | null = null

function getOrCreateIframe(): HTMLIFrameElement {
  // Si l'iframe existe déjà dans le DOM, la retourner
  if (globalN8NIframe && globalN8NIframe.isConnected) {
    return globalN8NIframe
  }

  // Chercher si elle existe déjà
  const existing = document.getElementById(IFRAME_ID) as HTMLIFrameElement | null
  if (existing) {
    globalN8NIframe = existing
    return existing
  }

  // Créer l'iframe une seule fois
  const iframe = document.createElement('iframe')
  iframe.id = IFRAME_ID
  iframe.src = 'https://n8n.talosprimes.com'
  iframe.className = 'w-full h-full border-0 rounded-lg'
  iframe.title = 'N8N - Automatisation'
  iframe.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen')
  iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox')
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  iframe.style.border = '0'
  iframe.style.borderRadius = '0.5rem'

  globalN8NIframe = iframe
  return iframe
}

export default function N8NPage() {
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    
    // Timeout de sécurité
    const timeout = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false)
      }
    }, 1500)

    return () => {
      mountedRef.current = false
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current || loading) return

    // Obtenir l'iframe globale
    const iframe = getOrCreateIframe()

    // Si l'iframe n'est pas dans notre container, la déplacer
    if (iframe.parentNode !== containerRef.current) {
      // Retirer de l'ancien parent si présent
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe)
      }
      // Ajouter au container
      containerRef.current.appendChild(iframe)
    }

    // Ne jamais supprimer l'iframe dans le cleanup
    return () => {
      // Ne rien faire - l'iframe doit persister même si le composant se démonte
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
