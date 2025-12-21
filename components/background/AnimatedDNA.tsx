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
        offset: (i % 2) * Math.PI,
        opacity: 1 - (i / segmentCount) * 0.6,
      })
    }

    const drawDNASegment = (y: number, offset: number, opacity: number, side: 'left' | 'right') => {
      ctx.save()
      
      const centerX = side === 'left' ? 60 : window.innerWidth - 60
      const radius = 20
      const segmentHeight = 100
      const turns = 2.5
      
      // Couleurs robotisées (orange/bronze et bleu)
      const color1 = `rgba(234, 88, 12, ${opacity * 0.9})` // Orange
      const color2 = `rgba(59, 130, 246, ${opacity * 0.8})` // Bleu
      const colorConnection = `rgba(217, 119, 6, ${opacity * 0.6})` // Bronze pour connexions
      const colorData = `rgba(234, 88, 12, ${opacity * 0.4})` // Orange pour données

      // Dessiner l'hélice d'ADN robotisé avec formes géométriques
      for (let i = 0; i <= segmentHeight; i++) {
        const progress = i / segmentHeight
        const angle = (progress * Math.PI * 2 * turns) + offset
        const x1 = centerX - radius + Math.cos(angle) * radius
        const x2 = centerX + radius + Math.cos(angle + Math.PI) * radius
        const currentY = y + i

        // Brin gauche - segments rectangulaires robotisés (au lieu de cercles)
        if (i % 4 === 0) {
          ctx.fillStyle = color1
          ctx.strokeStyle = color1
          ctx.lineWidth = 1.5
          
          // Rectangle robotisé (au lieu de cercle)
          const rectSize = 4
          ctx.fillRect(x1 - rectSize/2, currentY - rectSize/2, rectSize, rectSize)
          
          // Bordure carrée pour effet robotisé
          ctx.strokeRect(x1 - rectSize/2, currentY - rectSize/2, rectSize, rectSize)
          
          // Effet de glow robotisé
          ctx.shadowBlur = 6
          ctx.shadowColor = color1
          ctx.fillRect(x1 - rectSize/2, currentY - rectSize/2, rectSize, rectSize)
          ctx.shadowBlur = 0
          
          // Petits points de pixels aux coins pour effet numérique
          ctx.fillStyle = `rgba(234, 88, 12, ${opacity})`
          ctx.fillRect(x1 - rectSize/2 - 1, currentY - rectSize/2 - 1, 1, 1) // Coin haut gauche
          ctx.fillRect(x1 + rectSize/2, currentY - rectSize/2 - 1, 1, 1) // Coin haut droit
          ctx.fillRect(x1 - rectSize/2 - 1, currentY + rectSize/2, 1, 1) // Coin bas gauche
          ctx.fillRect(x1 + rectSize/2, currentY + rectSize/2, 1, 1) // Coin bas droit
        }

        // Brin droit - segments rectangulaires robotisés
        if (i % 4 === 0) {
          ctx.fillStyle = color2
          ctx.strokeStyle = color2
          ctx.lineWidth = 1.5
          
          // Rectangle robotisé
          const rectSize = 4
          ctx.fillRect(x2 - rectSize/2, currentY - rectSize/2, rectSize, rectSize)
          
          // Bordure carrée pour effet robotisé
          ctx.strokeRect(x2 - rectSize/2, currentY - rectSize/2, rectSize, rectSize)
          
          // Effet de glow robotisé
          ctx.shadowBlur = 6
          ctx.shadowColor = color2
          ctx.fillRect(x2 - rectSize/2, currentY - rectSize/2, rectSize, rectSize)
          ctx.shadowBlur = 0
          
          // Petits points de pixels aux coins
          ctx.fillStyle = `rgba(59, 130, 246, ${opacity})`
          ctx.fillRect(x2 - rectSize/2 - 1, currentY - rectSize/2 - 1, 1, 1)
          ctx.fillRect(x2 + rectSize/2, currentY - rectSize/2 - 1, 1, 1)
          ctx.fillRect(x2 - rectSize/2 - 1, currentY + rectSize/2, 1, 1)
          ctx.fillRect(x2 + rectSize/2, currentY + rectSize/2, 1, 1)
        }

        // Lignes de connexion horizontales robotisées (segmentées)
        if (i % 8 === 0 && i > 0) {
          ctx.strokeStyle = colorConnection
          ctx.lineWidth = 2
          
          // Ligne segmentée robotisée (3 segments)
          const segmentLength = (x2 - x1) / 3
          ctx.beginPath()
          // Segment 1
          ctx.moveTo(x1, currentY)
          ctx.lineTo(x1 + segmentLength, currentY)
          ctx.stroke()
          // Segment 2
          ctx.beginPath()
          ctx.moveTo(x1 + segmentLength * 1.5, currentY)
          ctx.lineTo(x1 + segmentLength * 2.5, currentY)
          ctx.stroke()
          // Segment 3
          ctx.beginPath()
          ctx.moveTo(x1 + segmentLength * 3, currentY)
          ctx.lineTo(x2, currentY)
          ctx.stroke()
          
          // Points de connexion aux extrémités
          ctx.fillStyle = colorConnection
          ctx.fillRect(x1 - 1, currentY - 1, 2, 2)
          ctx.fillRect(x2 - 1, currentY - 1, 2, 2)
        }

        // Nœuds de connexion robotisés (tous les 16 pixels) - forme hexagonale
        if (i % 16 === 0) {
          // Nœud gauche - hexagone robotisé
          ctx.fillStyle = color1
          ctx.strokeStyle = color1
          ctx.lineWidth = 2
          
          const nodeSize = 5
          ctx.beginPath()
          for (let j = 0; j < 6; j++) {
            const angle = (j * Math.PI) / 3
            const nx = x1 + Math.cos(angle) * nodeSize
            const ny = currentY + Math.sin(angle) * nodeSize
            if (j === 0) ctx.moveTo(nx, ny)
            else ctx.lineTo(nx, ny)
          }
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
          
          // Carré central pour effet robotisé
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.6})`
          ctx.fillRect(x1 - 1.5, currentY - 1.5, 3, 3)

          // Nœud droit - hexagone robotisé
          ctx.fillStyle = color2
          ctx.strokeStyle = color2
          ctx.lineWidth = 2
          
          ctx.beginPath()
          for (let j = 0; j < 6; j++) {
            const angle = (j * Math.PI) / 3
            const nx = x2 + Math.cos(angle) * nodeSize
            const ny = currentY + Math.sin(angle) * nodeSize
            if (j === 0) ctx.moveTo(nx, ny)
            else ctx.lineTo(nx, ny)
          }
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
          
          // Carré central
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.6})`
          ctx.fillRect(x2 - 1.5, currentY - 1.5, 3, 3)

          // Ligne de connexion robotisée entre les nœuds (avec segments)
          ctx.strokeStyle = colorConnection
          ctx.lineWidth = 2.5
          const midX = (x1 + x2) / 2
          ctx.beginPath()
          ctx.moveTo(x1, currentY)
          ctx.lineTo(midX - 8, currentY)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(midX + 8, currentY)
          ctx.lineTo(x2, currentY)
          ctx.stroke()
          
          // Données binaires flottantes (effet robotisé)
          ctx.font = '8px monospace'
          ctx.fillStyle = colorData
          const binary = (i % 2 === 0) ? '1' : '0'
          ctx.fillText(binary, midX - 3, currentY - 8)
        }
      }

      // Lignes de structure robotisées (lignes droites segmentées)
      const startAngle = offset
      
      // Brin gauche - ligne de structure avec segments
      ctx.strokeStyle = `rgba(234, 88, 12, ${opacity * 0.25})`
      ctx.lineWidth = 1
      
      for (let i = 0; i <= segmentHeight; i += 8) {
        const progress = i / segmentHeight
        const angle = (progress * Math.PI * 2 * turns) + offset
        const x = centerX - radius + Math.cos(angle) * radius
        const currentY = y + i
        const nextProgress = Math.min(1, (i + 8) / segmentHeight)
        const nextAngle = (nextProgress * Math.PI * 2 * turns) + offset
        const nextX = centerX - radius + Math.cos(nextAngle) * radius
        const nextY = y + Math.min(segmentHeight, i + 8)
        
        ctx.beginPath()
        ctx.moveTo(x, currentY)
        ctx.lineTo(nextX, nextY)
        ctx.stroke()
      }

      // Brin droit - ligne de structure avec segments
      ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.25})`
      ctx.lineWidth = 1
      
      for (let i = 0; i <= segmentHeight; i += 8) {
        const progress = i / segmentHeight
        const angle = (progress * Math.PI * 2 * turns) + offset + Math.PI
        const x = centerX + radius + Math.cos(angle) * radius
        const currentY = y + i
        const nextProgress = Math.min(1, (i + 8) / segmentHeight)
        const nextAngle = (nextProgress * Math.PI * 2 * turns) + offset + Math.PI
        const nextX = centerX + radius + Math.cos(nextAngle) * radius
        const nextY = y + Math.min(segmentHeight, i + 8)
        
        ctx.beginPath()
        ctx.moveTo(x, currentY)
        ctx.lineTo(nextX, nextY)
        ctx.stroke()
      }

      // Grille de pixels robotisée autour des brins (effet numérique)
      ctx.fillStyle = `rgba(234, 88, 12, ${opacity * 0.15})`
      for (let i = 0; i <= segmentHeight; i += 20) {
        const progress = i / segmentHeight
        const angle = (progress * Math.PI * 2 * turns) + offset
        const x1 = centerX - radius + Math.cos(angle) * radius
        const x2 = centerX + radius + Math.cos(angle + Math.PI) * radius
        const currentY = y + i
        
        // Grille de pixels
        for (let px = -3; px <= 3; px++) {
          for (let py = -3; py <= 3; py++) {
            if ((px + py) % 2 === 0) {
              ctx.fillRect(x1 + px, currentY + py, 1, 1)
              ctx.fillRect(x2 + px, currentY + py, 1, 1)
            }
          }
        }
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
        drawDNASegment(segment.y, segment.offset, segment.opacity, 'left')
      })

      // Dessiner les segments d'ADN sur le côté droit
      segments.forEach((segment) => {
        drawDNASegment(segment.y, segment.offset, segment.opacity, 'right')
      })

      // Animer les segments
      segments.forEach((segment) => {
        segment.y += speed * (deltaTime / 16)
        segment.offset += 0.02
        
        if (segment.y > canvas.height + segmentSpacing) {
          segment.y = -segmentSpacing
          segment.opacity = 1
          segment.offset = (segment.id % 2) * Math.PI
        }

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
