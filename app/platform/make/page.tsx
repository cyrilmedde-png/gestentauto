'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function MakePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)
  const iframeCreatedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    
    // Timeout de sécurité pour le chargement
    const timeout = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false)
      }
    }, 2000)

    return () => {
      mountedRef.current = false
      clearTimeout(timeout)
    }
  }, [])

  // Créer l'iframe une seule fois et la conserver
  useEffect(() => {
    if (loading || !containerRef.current) return

    // Vérifier si l'iframe existe déjà dans le container
    if (containerRef.current.querySelector('iframe')) {
      iframeRef.current = containerRef.current.querySelector('iframe') as HTMLIFrameElement
      return
    }

    // Créer l'iframe une seule fois
    const iframe = document.createElement('iframe')
    iframe.src = '/api/platform/make/proxy'
    iframe.className = 'w-full h-full border-0 rounded-lg'
    iframe.title = 'Make - Automatisation'
    iframe.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen')
    // Sandbox avec permissions pour JavaScript et cookies (allow-same-origin permet les cookies)
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation')
    iframe.setAttribute('loading', 'eager')
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.border = '0'
    iframe.style.borderRadius = '0.5rem'

    containerRef.current.appendChild(iframe)
    iframeRef.current = iframe
    iframeCreatedRef.current = true

    // Ne jamais supprimer l'iframe, même au unmount
    return () => {
      // Ne pas supprimer l'iframe pour préserver l'état
    }
  }, [loading])

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-center">
              <div className="bg-green-600 text-white p-4 rounded-lg mb-4 max-w-md mx-auto">
                <p className="font-bold text-lg">✅ DIAGNOSTIC : Page make/page.tsx chargée (loading)</p>
                <p className="text-sm mt-2">Timestamp: {new Date().toLocaleString('fr-FR')}</p>
              </div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement de Make...</p>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="bg-green-600 text-white p-2 rounded-lg mb-2 max-w-md mx-auto text-center">
          <p className="font-bold text-sm">✅ DIAGNOSTIC : Page make/page.tsx chargée (ready)</p>
          <p className="text-xs">Timestamp: {new Date().toLocaleString('fr-FR')}</p>
        </div>
        <div 
          ref={containerRef}
          className="w-full h-[calc(100vh-4rem)]"
          style={{ position: 'relative' }}
        />
      </MainLayout>
    </ProtectedRoute>
  )
}

