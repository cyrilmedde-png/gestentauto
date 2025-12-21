'use client'

import { useEffect, useRef } from 'react'

interface DNASegment {
  id: number
  y: number
  offset: number
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
    const segmentCount = 15
    const segmentSpacing = window.innerHeight / segmentCount
    const speed = 0.8

    // Créer les segments initiaux
    for (let i = 0; i < segmentCount; i++) {
      segments.push({
        id: i,
        y: i * segmentSpacing,
        offset: (i % 2) * Math.PI, // Décalage alterné pour créer l'hélice
        opacity: 1 - (i / segmentCount) * 0.6,
      })
    }

    const drawDNASegment = (y: number, offset: number, opacity: number, side: 'left' | 'right') => {
      ctx.save()
      
      const centerX = side === 'left' ? 60 : window.innerWidth - 60
      const radius = 20
      const segmentHeight = 100
      const turns = 2.5
      
      // Couleurs robotisées (violet/bleu pour s'harmoniser avec le fond)
      const color1 = `rgba(147, 51, 234, ${opacity * 0.8})` // Violet
      const color2 = `rgba(59, 130, 246, ${opacity * 0.7})` // Bleu
      const colorConnection = `rgba(168, 85, 247, ${opacity * 0.5})` // Violet clair pour connexions

      // Dessiner l'hélice d'ADN robotisé
      for (let i = 0; i <= segmentHeight; i++) {
        const progress = i / segmentHeight
        const angle = (progress * Math.PI * 2 * turns) + offset
        const x1 = centerX - radius + Math.cos(angle) * radius
        const x2 = centerX + radius + Math.cos(angle + Math.PI) * radius
        const currentY = y + i

        // Brin gauche (avec effet segmenté robotisé)
        if (i % 3 === 0) {
          ctx.fillStyle = color1
          ctx.beginPath()
          ctx.arc(x1, currentY, 2.5, 0, Math.PI * 2)
          ctx.fill()
          
          // Effet de glow robotisé
          ctx.shadowBlur = 8
          ctx.shadowColor = color1
          ctx.fill()
          ctx.shadowBlur = 0
        }

        // Brin droit
        if (i % 3 === 0) {
          ctx.fillStyle = color2
          ctx.beginPath()
          ctx.arc(x2, currentY, 2.5, 0, Math.PI * 2)
          ctx.fill()
          
          // Effet de glow robotisé
          ctx.shadowBlur = 8
          ctx.shadowColor = color2
          ctx.fill()
          ctx.shadowBlur = 0
        }

        // Lignes de connexion horizontales (toutes les 8 unités)
        if (i % 8 === 0 && i > 0) {
          ctx.strokeStyle = colorConnection
          ctx.lineWidth = 1.5
          ctx.setLineDash([4, 3]) // Ligne pointillée robotisée
          
          ctx.beginPath()
          ctx.moveTo(x1, currentY)
          ctx.lineTo(x2, currentY)
          ctx.stroke()
          ctx.setLineDash([])
        }

        // Points de connexion robotisés (nœuds)
        if (i % 16 === 0) {
          // Point de connexion gauche
          ctx.fillStyle = color1
          ctx.beginPath()
          ctx.arc(x1, currentY, 4, 0, Math.PI * 2)
          ctx.fill()
          
          // Cercle extérieur pour effet robotisé
          ctx.strokeStyle = color1
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(x1, currentY, 6, 0, Math.PI * 2)
          ctx.stroke()

          // Point de connexion droit
          ctx.fillStyle = color2
          ctx.beginPath()
          ctx.arc(x2, currentY, 4, 0, Math.PI * 2)
          ctx.fill()
          
          // Cercle extérieur pour effet robotisé
          ctx.strokeStyle = color2
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(x2, currentY, 6, 0, Math.PI * 2)
          ctx.stroke()

          // Ligne de connexion entre les nœuds (plus épaisse)
          ctx.strokeStyle = colorConnection
          ctx.lineWidth = 2
          ctx.setLineDash([6, 4])
          ctx.beginPath()
          ctx.moveTo(x1, currentY)
          ctx.lineTo(x2, currentY)
          ctx.stroke()
          ctx.setLineDash([])
        }
      }

      // Lignes verticales principales (structure robotisée)
      const startAngle = offset
      const endAngle = (segmentHeight / segmentHeight) * Math.PI * 2 * turns + offset
      
      // Brin gauche - ligne de structure
      ctx.strokeStyle = `rgba(147, 51, 234, ${opacity * 0.2})`
      ctx.lineWidth = 1
      ctx.setLineDash([2, 4])
      ctx.beginPath()
      for (let i = 0; i <= segmentHeight; i += 2) {
        const progress = i / segmentHeight
        const angle = (progress * Math.PI * 2 * turns) + offset
        const x = centerX - radius + Math.cos(angle) * radius
        const currentY = y + i
        if (i === 0) {
          ctx.moveTo(x, currentY)
        } else {
          ctx.lineTo(x, currentY)
        }
      }
      ctx.stroke()
      ctx.setLineDash([])

      // Brin droit - ligne de structure
      ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.2})`
      ctx.lineWidth = 1
      ctx.setLineDash([2, 4])
      ctx.beginPath()
      for (let i = 0; i <= segmentHeight; i += 2) {
        const progress = i / segmentHeight
        const angle = (progress * Math.PI * 2 * turns) + offset + Math.PI
        const x = centerX + radius + Math.cos(angle) * radius
        const currentY = y + i
        if (i === 0) {
          ctx.moveTo(x, currentY)
        } else {
          ctx.lineTo(x, currentY)
        }
      }
      ctx.stroke()
      ctx.setLineDash([])

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
        drawDNASegment(segment.y, segment.offset, segment.opacity, 'left')
      })

      // Dessiner les segments d'ADN sur le côté droit
      segments.forEach((segment) => {
        drawDNASegment(segment.y, segment.offset, segment.opacity, 'right')
      })

      // Animer les segments (défilement vers le bas et rotation de l'hélice)
      segments.forEach((segment) => {
        segment.y += speed * (deltaTime / 16)
        segment.offset += 0.02 // Rotation continue de l'hélice
        
        // Réinitialiser quand le segment sort de l'écran
        if (segment.y > canvas.height + segmentSpacing) {
          segment.y = -segmentSpacing
          segment.opacity = 1
          segment.offset = (segment.id % 2) * Math.PI
        }

        // Réduire l'opacité progressivement
        const progress = (segment.y + segmentSpacing) / (canvas.height + segmentSpacing * 2)
        segment.opacity = Math.max(0.2, 1 - progress * 0.8)
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

