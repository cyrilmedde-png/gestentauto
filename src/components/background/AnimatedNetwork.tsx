'use client'

/**
 * Composant de réseau animé pour le background
 * Points reliés par des traits qui bougent
 */

import { useEffect, useRef, useState } from 'react'

interface Point {
  x: number
  y: number
  vx: number
  vy: number
  color?: string
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  maxLife: number
}

export function AnimatedNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const isMountedRef = useRef(true)
  const [isClient, setIsClient] = useState(false)

  // S'assurer que le composant ne s'exécute que côté client
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Ne rien faire si on est côté serveur
    if (!isClient) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // Réinitialiser l'état
    isMountedRef.current = true
    animationFrameRef.current = undefined

    // Ajuster la taille du canvas
    const resizeCanvas = () => {
      if (!isMountedRef.current) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Paramètres
    const numPoints = 50
    const connectionDistance = 150
    const pointRadius = 2
    const lineOpacity = 0.4
    const collisionDistance = 20 // Distance pour déclencher l'effet feu d'artifice
    const previousDistances: number[][] = [] // Stocker les distances précédentes

    // Couleurs variées pour les points
    const colors = [
      'rgba(139, 92, 246, 0.6)',   // Violet
      'rgba(59, 130, 246, 0.6)',   // Bleu
      'rgba(236, 72, 153, 0.6)',   // Rose
      'rgba(34, 197, 94, 0.6)',    // Vert
      'rgba(251, 146, 60, 0.6)',   // Orange
      'rgba(168, 85, 247, 0.6)',   // Violet foncé
    ]

    // Créer les points
    const points: (Point & { color: string })[] = []
    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 3.6,
        vy: (Math.random() - 0.5) * 3.6,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    // Initialiser le tableau des distances précédentes
    for (let i = 0; i < numPoints; i++) {
      previousDistances[i] = []
      for (let j = 0; j < numPoints; j++) {
        previousDistances[i][j] = Infinity
      }
    }

    // Particules pour l'effet feu d'artifice
    const particles: Particle[] = []

    // Fonction d'animation
    const animate = () => {
      if (!isMountedRef.current) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Mettre à jour les positions
      points.forEach((point) => {
        point.x += point.vx
        point.y += point.vy

        // Rebond sur les bords
        if (point.x < 0 || point.x > canvas.width) point.vx *= -1
        if (point.y < 0 || point.y > canvas.height) point.vy *= -1

        // Garder dans les limites
        point.x = Math.max(0, Math.min(canvas.width, point.x))
        point.y = Math.max(0, Math.min(canvas.height, point.y))
      })

      // Dessiner les connexions et détecter les collisions
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x
          const dy = points[i].y - points[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          // Détecter collision (quand deux points se croisent)
          if (distance < collisionDistance && previousDistances[i][j] > collisionDistance) {
            // Créer des particules feu d'artifice
            const centerX = (points[i].x + points[j].x) / 2
            const centerY = (points[i].y + points[j].y) / 2
            const particleCount = 8
            const particleColor = points[i].color || 'rgba(139, 92, 246, 1)'
            
            for (let p = 0; p < particleCount; p++) {
              const angle = (Math.PI * 2 * p) / particleCount
              const speed = 2 + Math.random() * 2
              particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: particleColor,
                life: 1,
                maxLife: 1,
              })
            }
          }

          previousDistances[i][j] = distance

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * lineOpacity
            // Utiliser la couleur du premier point pour la ligne
            const color = points[i].color || 'rgba(139, 92, 246, 1)'
            // Extraire les valeurs RGB de la couleur et appliquer l'opacité
            const r = color.match(/rgba?\((\d+)/)?.[1] || '139'
            const g = color.match(/rgba?\(\d+,\s*(\d+)/)?.[1] || '92'
            const b = color.match(/rgba?\(\d+,\s*\d+,\s*(\d+)/)?.[1] || '246'
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(points[i].x, points[i].y)
            ctx.lineTo(points[j].x, points[j].y)
            ctx.stroke()
          }
        }
      }

      // Mettre à jour et dessiner les particules
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i]
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life -= 0.02
        particle.vx *= 0.98
        particle.vy *= 0.98

        if (particle.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        const opacity = particle.life
        const r = particle.color.match(/rgba?\((\d+)/)?.[1] || '139'
        const g = particle.color.match(/rgba?\(\d+,\s*(\d+)/)?.[1] || '92'
        const b = particle.color.match(/rgba?\(\d+,\s*\d+,\s*(\d+)/)?.[1] || '246'
        
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, 0.8, 0, Math.PI * 2)
        ctx.fill()

        // Effet de glow
        ctx.shadowBlur = 3
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${opacity})`
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // Dessiner les points
      points.forEach((point) => {
        const pointColor = point.color || 'rgba(139, 92, 246, 0.6)'
        ctx.fillStyle = pointColor
        ctx.beginPath()
        ctx.arc(point.x, point.y, pointRadius, 0, Math.PI * 2)
        ctx.fill()

        // Effet de glow avec la couleur du point
        ctx.shadowBlur = 10
        ctx.shadowColor = pointColor.replace('0.6', '0.5')
        ctx.fill()
        ctx.shadowBlur = 0
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Démarrer l'animation
    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      isMountedRef.current = false
      window.removeEventListener('resize', resizeCanvas)
      
      // Nettoyer l'animation en cours
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = undefined
      }
      
      // Nettoyer le canvas
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [isClient])

  // Ne rien rendre côté serveur
  if (!isClient) {
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  )
}

