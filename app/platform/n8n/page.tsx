'use client'

import { useEffect, useState, useRef } from 'react'
import Script from 'next/script'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

const IFRAME_ID = 'n8n-persistent-iframe'

export default function N8NPage() {
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    
    // Timeout de sécurité
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 1500)

    return () => {
      mountedRef.current = false
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current || loading) return

    // Fonction pour monter l'iframe dans le container
    const mountIframe = () => {
      if (!containerRef.current) return

      // Utiliser la fonction globale pour obtenir l'iframe
      const getIframe = (window as any).getN8NIframe
      if (!getIframe) {
        // Si le script n'est pas encore chargé, réessayer
        setTimeout(mountIframe, 100)
        return
      }

      const iframe = getIframe()

      // Si l'iframe n'est pas dans notre container, la déplacer
      if (iframe.parentNode !== containerRef.current) {
        // Retirer de l'ancien parent si présent
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe)
        }
        // Ajouter au container
        containerRef.current.appendChild(iframe)
      }

      setLoading(false)
    }

    // Essayer de monter l'iframe
    mountIframe()

    // Ne jamais supprimer l'iframe dans le cleanup
    return () => {
      // Ne rien faire - l'iframe doit persister
    }
  }, [loading])

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <Script src="/n8n-iframe-init.js" strategy="beforeInteractive" />
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
        <Script src="/n8n-iframe-init.js" strategy="beforeInteractive" />
        <div 
          ref={containerRef}
          className="w-full h-[calc(100vh-4rem)]"
          style={{ position: 'relative' }}
        />
      </MainLayout>
    </ProtectedRoute>
  )
}
