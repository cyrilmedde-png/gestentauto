'use client'

import { useEffect, useRef } from 'react'

interface DNASegment {
  id: number
  y: number
  rotation: number
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
    const segmentCount = 12
    const segmentHeight = 120
    const segmentSpacing = window.innerHeight / segmentCount
    const speed = 1.2

    // Créer les segments initiaux
    for (let i = 0; i < segmentCount; i++) {
      segments.push({
        id: i,
        y: i * segmentSpacing,
        rotation: (i * Math.PI * 2) / 8, // Rotation initiale pour créer l'hélice
        opacity: 1 - (i / segmentCount) * 0.5,
      })
    }

    const drawDNASegment = (y: number, rotation: number, opacity: number, side: 'left' | 'right') => {
      ctx.save()
      
      const centerX = side === 'left' ? 70 : window.innerWidth - 70
      const radius = 25
      
      // Couleurs robotisées (orange/bronze et bleu)
      const color1 = `rgba(234, 88, 12, ${opacity * 0.85})` // Orange
      const color2 = `rgba(59, 130, 246, ${opacity * 0.85})` // Bleu
      const colorConnection = `rgba(217, 119, 6, ${opacity * 0.7})` // Bronze pour connexions

      // Dessiner plusieurs niveaux de l'hélice pour créer la structure ADN
      const steps = 24 // Nombre de points pour créer une hélice complète
      
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2 + rotation
        const x1 = centerX - radius * Math.cos(angle)
        const x2 = centerX + radius * Math.cos(angle)
        const currentY = y + (i / steps) * segmentHeight

        // Brin gauche - cercles robotisés avec bordure
        if (i % 2 === 0) {
          ctx.fillStyle = color1
          ctx.strokeStyle = color1
          ctx.lineWidth = 2
          
          // Cercle principal
          ctx.beginPath()
          ctx.arc(x1, currentY, 3.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
          
          // Effet de glow
          ctx.shadowBlur = 8
          ctx.shadowColor = color1
          ctx.beginPath()
          ctx.arc(x1, currentY, 3.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
          
          // Point central lumineux
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8})`
          ctx.beginPath()
          ctx.arc(x1, currentY, 1, 0, Math.PI * 2)
          ctx.fill()
        }

        // Brin droit - cercles robotisés avec bordure
        if (i % 2 === 0) {
          ctx.fillStyle = color2
          ctx.strokeStyle = color2
          ctx.lineWidth = 2
          
          // Cercle principal
          ctx.beginPath()
          ctx.arc(x2, currentY, 3.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
          
          // Effet de glow
          ctx.shadowBlur = 8
          ctx.shadowColor = color2
          ctx.beginPath()
          ctx.arc(x2, currentY, 3.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
          
          // Point central lumineux
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8})`
          ctx.beginPath()
          ctx.arc(x2, currentY, 1, 0, Math.PI * 2)
          ctx.fill()
        }

        // Lignes de connexion horizontales (toutes les 4 étapes)
        if (i % 4 === 0 && i > 0) {
          const prevAngle = ((i - 4) / steps) * Math.PI * 2 + rotation
          const prevX1 = centerX - radius * Math.cos(prevAngle)
          const prevX2 = centerX + radius * Math.cos(prevAngle)
          const prevY = y + ((i - 4) / steps) * segmentHeight
          
          ctx.strokeStyle = colorConnection
          ctx.lineWidth = 2
          ctx.setLineDash([3, 3]) // Ligne pointillée robotisée
          
          ctx.beginPath()
          ctx.moveTo(prevX1, prevY)
          ctx.lineTo(prevX2, prevY)
          ctx.stroke()
          
          ctx.setLineDash([])
        }
      }

      // Lignes principales des brins (structure de l'hélice)
      // Brin gauche
      ctx.strokeStyle = `rgba(234, 88, 12, ${opacity * 0.3})`
      ctx.lineWidth = 1.5
      ctx.setLineDash([2, 2])
      ctx.beginPath()
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * Math.PI * 2 + rotation
        const x = centerX - radius * Math.cos(angle)
        const currentY = y + (i / steps) * segmentHeight
        if (i === 0) {
          ctx.moveTo(x, currentY)
        } else {
          ctx.lineTo(x, currentY)
        }
      }
      ctx.stroke()
      ctx.setLineDash([])

      // Brin droit
      ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.3})`
      ctx.lineWidth = 1.5
      ctx.setLineDash([2, 2])
      ctx.beginPath()
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * Math.PI * 2 + rotation
        const x = centerX + radius * Math.cos(angle)
        const currentY = y + (i / steps) * segmentHeight
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
        drawDNASegment(segment.y, segment.rotation, segment.opacity, 'left')
      })

      // Dessiner les segments d'ADN sur le côté droit
      segments.forEach((segment) => {
        drawDNASegment(segment.y, segment.rotation, segment.opacity, 'right')
      })

      // Animer les segments (défilement vers le bas et rotation)
      segments.forEach((segment) => {
        segment.y += speed * (deltaTime / 16)
        segment.rotation += 0.03 // Rotation continue de l'hélice
        
        // Réinitialiser quand le segment sort de l'écran
        if (segment.y > canvas.height + segmentHeight) {
          segment.y = -segmentHeight
          segment.opacity = 1
        }

        // Réduire l'opacité progressivement
        const progress = (segment.y + segmentHeight) / (canvas.height + segmentHeight * 2)
        segment.opacity = Math.max(0.3, 1 - progress * 0.7)
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
