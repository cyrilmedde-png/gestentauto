'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  speed: number
  size: number
  opacity: number
  side: 'left' | 'right'
}

export function AnimatedSideParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Initialiser les particules
    const initParticles = () => {
      particlesRef.current = []
      const particleCount = 30

      for (let i = 0; i < particleCount; i++) {
        const side = i % 2 === 0 ? 'left' : 'right'
        particlesRef.current.push({
          x: side === 'left' ? 60 + Math.random() * 40 : window.innerWidth - 100 - Math.random() * 40,
          y: Math.random() * window.innerHeight,
          speed: 0.5 + Math.random() * 1,
          size: 2 + Math.random() * 3,
          opacity: 0.1 + Math.random() * 0.4,
          side,
        })
      }
    }

    initParticles()

    const drawParticle = (particle: Particle) => {
      ctx.save()
      ctx.globalAlpha = particle.opacity

      // Créer un gradient radial pour chaque particule
      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.size * 2
      )
      
      // Couleurs subtiles qui s'harmonisent avec le fond sombre
      gradient.addColorStop(0, 'rgba(147, 51, 234, 0.8)') // Violet subtil
      gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.4)') // Bleu subtil
      gradient.addColorStop(1, 'rgba(147, 51, 234, 0)') // Transparent

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2)
      ctx.fill()

      // Point central plus lumineux
      ctx.globalAlpha = particle.opacity * 1.5
      ctx.fillStyle = 'rgba(168, 85, 247, 0.6)'
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2)
      ctx.fill()

      // Lignes de connexion subtiles entre particules proches
      particlesRef.current.forEach((otherParticle) => {
        if (otherParticle.side === particle.side) {
          const dx = otherParticle.x - particle.x
          const dy = otherParticle.y - particle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150 && distance > 0) {
            ctx.globalAlpha = (particle.opacity * otherParticle.opacity * (1 - distance / 150)) * 0.2
            ctx.strokeStyle = 'rgba(147, 51, 234, 0.3)'
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.stroke()
          }
        }
      })

      ctx.restore()
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((particle) => {
        // Dessiner la particule
        drawParticle(particle)

        // Animer la particule (défilement vers le bas)
        particle.y += particle.speed

        // Réinitialiser quand la particule sort de l'écran
        if (particle.y > canvas.height + 50) {
          particle.y = -50
          particle.x = particle.side === 'left' 
            ? 60 + Math.random() * 40 
            : window.innerWidth - 100 - Math.random() * 40
          particle.speed = 0.5 + Math.random() * 1
          particle.opacity = 0.1 + Math.random() * 0.4
        }

        // Variation subtile d'opacité pour effet de pulsation
        particle.opacity += (Math.random() - 0.5) * 0.02
        particle.opacity = Math.max(0.1, Math.min(0.5, particle.opacity))
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  )
}







