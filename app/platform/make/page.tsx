'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ExternalLink } from 'lucide-react'

const MAKE_URL = process.env.NEXT_PUBLIC_MAKE_URL || 'https://eu1.make.com/organization/5837397/dashboard'

export default function MakePage() {
  const [redirecting, setRedirecting] = useState(true)

  useEffect(() => {
    // Redirection après un court délai pour afficher le message
    const timer = setTimeout(() => {
      window.open(MAKE_URL, '_blank')
      setRedirecting(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center max-w-md mx-auto p-8">
            {redirecting ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground mb-4">Redirection vers Make.com...</p>
              </>
            ) : (
              <>
                <ExternalLink className="w-16 h-16 text-primary mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Make.com s'ouvre dans un nouvel onglet
                </h2>
                <p className="text-muted-foreground mb-6">
                  Make.com bloque l'embedding dans une iframe pour des raisons de sécurité.
                  Il s'ouvre dans un nouvel onglet pour une meilleure expérience.
                </p>
                <a
                  href={MAKE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ouvrir Make.com
                </a>
              </>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}

