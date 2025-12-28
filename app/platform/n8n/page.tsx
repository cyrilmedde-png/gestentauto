'use client'

import { useEffect, useState, useRef } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Variable globale pour l'iframe - créée une seule fois pour toute l'application
let globalN8NIframe: HTMLIFrameElement | null = null
const IFRAME_ID = 'n8n-global-iframe'

// Fonction pour créer l'iframe une seule fois au niveau global
function getOrCreateGlobalIframe(): HTMLIFrameElement {
  if (globalN8NIframe && globalN8NIframe.parentNode) {
    return globalN8NIframe
  }

  // Chercher si l'iframe existe déjà dans le DOM
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
  iframe.setAttribute('loading', 'eager')
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  iframe.style.border = '0'
  iframe.style.borderRadius = '0.5rem'
  iframe.style.position = 'fixed'
  iframe.style.top = '0'
  iframe.style.left = '0'
  iframe.style.zIndex = '-1'
  iframe.style.display = 'none'

  // Ajouter l'iframe au body si elle n'existe pas encore
  if (!document.getElementById(IFRAME_ID)) {
    document.body.appendChild(iframe)
  }

  globalN8NIframe = iframe
  return iframe
}

export default function N8NPage() {
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Créer/récupérer l'iframe globale
    const iframe = getOrCreateGlobalIframe()

    // Timeout de sécurité
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 1000)

    // Quand le composant est monté, déplacer l'iframe dans notre container
    if (containerRef.current && iframe.parentNode !== containerRef.current) {
      // Retirer l'iframe de son parent actuel
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe)
      }
      // Réinitialiser les styles pour l'affichage normal
      iframe.style.position = 'relative'
      iframe.style.top = 'auto'
      iframe.style.left = 'auto'
      iframe.style.zIndex = 'auto'
      iframe.style.display = 'block'
      // Ajouter au container
      containerRef.current.appendChild(iframe)
    } else if (containerRef.current && !containerRef.current.contains(iframe)) {
      // Si l'iframe n'est pas dans le container, la déplacer
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe)
      }
      iframe.style.position = 'relative'
      iframe.style.top = 'auto'
      iframe.style.left = 'auto'
      iframe.style.zIndex = 'auto'
      iframe.style.display = 'block'
      containerRef.current.appendChild(iframe)
    }

    // Cleanup : Ne JAMAIS supprimer l'iframe, juste la cacher
    return () => {
      clearTimeout(timeout)
      if (iframe && iframe.parentNode === containerRef.current) {
        // Déplacer l'iframe vers le body et la cacher au lieu de la supprimer
        containerRef.current.removeChild(iframe)
        iframe.style.position = 'fixed'
        iframe.style.top = '0'
        iframe.style.left = '0'
        iframe.style.zIndex = '-1'
        iframe.style.display = 'none'
        if (!document.getElementById(IFRAME_ID)) {
          document.body.appendChild(iframe)
        }
      }
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
