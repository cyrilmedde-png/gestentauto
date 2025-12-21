'use client'

import { useEffect, useRef } from 'react'

interface DNASegment {
  id: number
  x: number
  y: number
  opacity: number
}

export function AnimatedDNA() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)

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

    const segments: DNASegment[] = []
    const segmentCount = 20
    const segmentSpacing = window.innerHeight / segmentCount
    const speed = 1

    // Créer les segments initiaux
    for (let i = 0; i < segmentCount; i++) {
      segments.push({
        id: i,
        x: 0,
        y: i * segmentSpacing,
        opacity: 1 - (i / segmentCount) * 0.5,
      })
    }

    const drawDNASegment = (x: number, y: number, opacity: number, side: 'left' | 'right') => {
      ctx.save()
      ctx.globalAlpha = opacity * 0.6
      
      const baseY = y
      const segmentHeight = 80
      
      // Couleurs pour l'effet robotisé
      const gradient = ctx.createLinearGradient(x, baseY, x, baseY + segmentHeight)
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)') // Violet
      gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.9)') // Bleu
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0.8)') // Violet
      
      ctx.strokeStyle = gradient
      ctx.fillStyle = gradient
      ctx.lineWidth = 2

      // Dessiner l'hélice d'ADN robotisé
      const centerX = side === 'left' ? 50 : window.innerWidth - 50
      const radius = 15
      const turns = 3

      for (let i = 0; i < segmentHeight; i += 2) {
        const progress = i / segmentHeight
        const angle = progress * Math.PI * 2 * turns
        const offsetX = Math.cos(angle) * radius
        const currentY = baseY + i

        // Pointillés pour effet robotisé
        if (i % 4 === 0) {
          ctx.beginPath()
          ctx.arc(centerX + offsetX, currentY, 2, 0, Math.PI * 2)
          ctx.fill()
        }

        // Ligne de connexion (points de données)
        if (i % 8 === 0 && i > 0) {
          ctx.beginPath()
          ctx.moveTo(centerX - radius, currentY)
          ctx.lineTo(centerX + radius, currentY)
          ctx.stroke()
        }
      }

      // Lignes verticales principales (structure)
      ctx.globalAlpha = opacity * 0.3
      ctx.beginPath()
      ctx.moveTo(centerX - radius, baseY)
      ctx.lineTo(centerX - radius, baseY + segmentHeight)
      ctx.moveTo(centerX + radius, baseY)
      ctx.lineTo(centerX + radius, baseY + segmentHeight)
      ctx.stroke()

      // Points de connexion robotisés (nœuds)
      for (let i = 0; i <= turns; i++) {
        const y = baseY + (i / turns) * segmentHeight
        const angle = (i / turns) * Math.PI * 2 * turns
        const offsetX = Math.cos(angle) * radius

        ctx.fillStyle = 'rgba(139, 92, 246, 0.9)'
        ctx.beginPath()
        ctx.arc(centerX + offsetX, y, 3, 0, Math.PI * 2)
        ctx.fill()

        // Ligne de connexion entre les deux brins
        ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.4})`
        ctx.beginPath()
        ctx.moveTo(centerX - radius, y)
        ctx.lineTo(centerX + radius, y)
        ctx.stroke()
      }

      ctx.restore()
    }

    let lastTime = 0
    const animate = (currentTime: number) => {
      if (!lastTime) lastTime = currentTime
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Dessiner les segments d'ADN sur le côté gauche
      segments.forEach((segment) => {
        drawDNASegment(segment.x, segment.y, segment.opacity, 'left')
      })

      // Dessiner les segments d'ADN sur le côté droit
      segments.forEach((segment) => {
        drawDNASegment(segment.x, segment.y, segment.opacity, 'right')
      })

      // Animer les segments (défilement vers le bas)
      segments.forEach((segment) => {
        segment.y += speed * (deltaTime / 16) // Normaliser par 16ms (60fps)
        
        // Réinitialiser quand le segment sort de l'écran
        if (segment.y > canvas.height) {
          segment.y = -segmentSpacing
          segment.opacity = 1
        }

        // Réduire l'opacité progressivement
        const progress = (segment.y + segmentSpacing) / (canvas.height + segmentSpacing)
        segment.opacity = 1 - progress * 0.7
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate(0)

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

