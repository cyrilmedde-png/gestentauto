'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, LogIn, UserPlus } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Si l'utilisateur est déjà connecté, rediriger
    if (!loading && user) {
      fetch('/api/auth/check-user-type', {
        headers: {
          'X-User-Id': user.id,
        },
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.isPlatform) {
            router.push('/platform/dashboard')
          } else {
            router.push('/dashboard')
          }
        })
        .catch(() => {
          router.push('/dashboard')
        })
    } else if (!loading && !user) {
      // Afficher le contenu après un court délai pour l'animation
      setTimeout(() => setShowContent(true), 100)
    }
  }, [user, loading, router])

  // Si chargement ou utilisateur connecté, afficher un loader
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      {/* Hero Section avec image */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Image de fond */}
        <div className="absolute inset-0 z-0">
          <div className="relative w-full h-full">
            <Image
              src="/landing_page.png"
              alt="TalosPrime - Gestion d'entreprise complète"
              fill
              className="object-cover opacity-20"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />
          </div>
        </div>

        {/* Contenu */}
        <div className={`relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 transition-opacity duration-1000 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo/Image principale centrée */}
            <div className="mb-8 sm:mb-12 flex justify-center">
              <div className="relative w-full max-w-4xl h-auto">
                <Image
                  src="/landing_page.png"
                  alt="TalosPrime"
                  width={1600}
                  height={800}
                  className="rounded-lg shadow-2xl"
                  priority
                />
              </div>
            </div>

            {/* Titre et description */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6">
              TalosPrime
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto">
              La solution complète de gestion d'entreprise. 
              <br className="hidden sm:block" />
              Tous vos outils en un seul endroit.
            </p>

            {/* Boutons CTA */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
              <Link
                href="/auth/login"
                className="group flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
              >
                <LogIn className="w-5 h-5" />
                <span className="text-base sm:text-lg font-medium">Se connecter</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/auth/register"
                className="group flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-background border-2 border-primary text-primary rounded-lg hover:bg-primary/10 transition-all transform hover:scale-105"
              >
                <UserPlus className="w-5 h-5" />
                <span className="text-base sm:text-lg font-medium">Créer un compte</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Features rapides */}
            <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-left">
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Gestion complète</h3>
                <p className="text-sm text-muted-foreground">
                  Facturation, CRM, Comptabilité, RH, Stock et bien plus encore
                </p>
              </div>
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Multi-tenant</h3>
                <p className="text-sm text-muted-foreground">
                  Isolation totale des données, sécurité renforcée
                </p>
              </div>
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Modulaire</h3>
                <p className="text-sm text-muted-foreground">
                  Activez uniquement les modules dont vous avez besoin
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
