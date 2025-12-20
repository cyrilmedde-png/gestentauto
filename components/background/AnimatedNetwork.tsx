'use client'

import { useEffect, useRef } from 'react'

interface Point {
  x: number
  y: number
  vx: number
  vy: number
  color: string
}

export function AnimatedNetwork() {
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

    const colors = [
      'rgba(139, 92, 246, 0.8)', // violet
      'rgba(59, 130, 246, 0.8)', // blue
      'rgba(236, 72, 153, 0.8)', // rose
      'rgba(34, 197, 94, 0.8)',  // green
      'rgba(249, 115, 22, 0.8)', // orange
      'rgba(168, 85, 247, 0.8)', // dark violet
    ]

    const points: Point[] = []
    const numPoints = 50

    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 3.0,
        vy: (Math.random() - 0.5) * 3.0,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    interface Particle {
      x: number
      y: number
      vx: number
      vy: number
      life: number
      color: string
    }

    const particles: Particle[] = []
    const maxDistance = 150

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update points
      for (let i = 0; i < points.length; i++) {
        points[i].x += points[i].vx
        points[i].y += points[i].vy

        if (points[i].x < 0 || points[i].x > canvas.width) points[i].vx *= -1
        if (points[i].y < 0 || points[i].y > canvas.height) points[i].vy *= -1

        points[i].x = Math.max(0, Math.min(canvas.width, points[i].x))
        points[i].y = Math.max(0, Math.min(canvas.height, points[i].y))
      }

      // Draw connections
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x
          const dy = points[i].y - points[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.4
            ctx.strokeStyle = points[i].color.replace('0.8', opacity.toString())
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(points[i].x, points[i].y)
            ctx.lineTo(points[j].x, points[j].y)
            ctx.stroke()
          }

          // Collision detection for particles
          if (distance < 10 && Math.random() > 0.95) {
            for (let k = 0; k < 8; k++) {
              const angle = (Math.PI * 2 * k) / 8
              const speed = 1 + Math.random() * 2
              particles.push({
                x: points[i].x,
                y: points[i].y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: points[i].color,
              })
            }
          }
        }
      }

      // Draw points
      for (const point of points) {
        ctx.fillStyle = point.color
        ctx.beginPath()
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life -= 0.02

        if (p.life > 0) {
          ctx.fillStyle = p.color.replace('0.8', p.life.toString())
          ctx.beginPath()
          ctx.arc(p.x, p.y, 0.8, 0, Math.PI * 2)
          ctx.fill()
        } else {
          particles.splice(i, 1)
        }
      }

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
      style={{ background: '#080808' }}
    />
  )
}

