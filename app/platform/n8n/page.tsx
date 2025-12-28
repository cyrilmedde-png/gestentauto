'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

const IFRAME_ID = 'n8n-persistent-iframe'
const IFRAME_CONTAINER_ID = 'n8n-iframe-container'

export default function N8NPage() {
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true

    // Fonction pour créer/monter l'iframe une seule fois
    const initializeIframe = () => {
      if (!containerRef.current) return

      // Chercher si l'iframe existe déjà
      let iframe = document.getElementById(IFRAME_ID) as HTMLIFrameElement | null
      
      if (!iframe) {
        // Créer l'iframe une seule fois
        iframe = document.createElement('iframe')
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
        iframe.style.position = 'absolute'
        iframe.style.top = '0'
        iframe.style.left = '0'
        iframe.style.right = '0'
        iframe.style.bottom = '0'
      }

      // Si l'iframe n'est pas dans notre container, la déplacer
      if (iframe.parentNode !== containerRef.current) {
        // Retirer de l'ancien parent si présent
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe)
        }
        // Ajouter au nouveau container
        containerRef.current.appendChild(iframe)
      }

      setLoading(false)
    }

    // Timeout de sécurité
    const timeout = setTimeout(() => {
      if (isMountedRef.current) {
        initializeIframe()
      }
    }, 100)

    // Essayer immédiatement aussi
    if (containerRef.current) {
      initializeIframe()
    } else {
      // Attendre que le container soit disponible
      const checkInterval = setInterval(() => {
        if (containerRef.current && isMountedRef.current) {
          clearInterval(checkInterval)
          initializeIframe()
        }
      }, 50)

      return () => {
        clearInterval(checkInterval)
        clearTimeout(timeout)
      }
    }

    return () => {
      clearTimeout(timeout)
      // NE PAS supprimer l'iframe - elle doit persister
    }
  }, [pathname])

  // Nettoyer seulement quand on quitte complètement la page N8N
  useEffect(() => {
    return () => {
      // Vérifier si on quitte vraiment la page N8N (pas juste un re-render)
      const timer = setTimeout(() => {
        if (!window.location.pathname.includes('/platform/n8n')) {
          // On a vraiment quitté la page, mais on ne supprime toujours pas l'iframe
          // pour qu'elle soit réutilisable si on revient
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [pathname])

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
          id={IFRAME_CONTAINER_ID}
          ref={containerRef}
          className="w-full h-[calc(100vh-4rem)]"
          style={{ position: 'relative' }}
        />
      </MainLayout>
    </ProtectedRoute>
  )
}
