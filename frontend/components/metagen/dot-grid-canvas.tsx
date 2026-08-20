"use client"

import * as React from "react"
import { useTheme } from "next-themes"

interface Ripple {
  x: number
  y: number
  radius: number
  maxRadius: number
  speed: number
  opacity: number
  color: string
}

type RippleListener = (x: number, y: number, color?: string) => void
const rippleListeners = new Set<RippleListener>()

export function triggerGlobalRipple(x?: number, y?: number, color: string = "#0084FF") {
  const targetX = x ?? (typeof window !== "undefined" ? window.innerWidth / 2 : 0)
  const targetY = y ?? (typeof window !== "undefined" ? window.innerHeight / 2 : 0)
  rippleListeners.forEach((fn) => fn(targetX, targetY, color))
}

export function DotGridCanvas() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const { resolvedTheme } = useTheme()
  const mouseRef = React.useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  })
  const ripplesRef = React.useRef<Ripple[]>([])

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    let animationFrameId: number
    let width = 0
    let height = 0
    const DOT_SPACING = 22
    const INFLUENCE_RADIUS = 110

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.scale(dpr, dpr)
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
        active: true,
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current.active = false
    }

    const onCustomRipple: RippleListener = (rx, ry, color) => {
      ripplesRef.current.push({
        x: rx,
        y: ry,
        radius: 0,
        maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.8,
        speed: 20,
        opacity: 0.7,
        color: color || "#0084FF",
      })
    }

    rippleListeners.add(onCustomRipple)
    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    document.addEventListener("mouseleave", handleMouseLeave)

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      const isDark = resolvedTheme === "dark"
      const baseDotColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.09)"

      const mouse = mouseRef.current
      const ripples = ripplesRef.current

      // Update ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]
        r.radius += r.speed
        r.opacity *= 0.965
        if (r.opacity < 0.01 || r.radius > r.maxRadius) {
          ripples.splice(i, 1)
        }
      }

      // Draw dots
      const cols = Math.ceil(width / DOT_SPACING) + 1
      const rows = Math.ceil(height / DOT_SPACING) + 1

      for (let c = 0; c < cols; c++) {
        const x = c * DOT_SPACING
        for (let r = 0; r < rows; r++) {
          const y = r * DOT_SPACING

          let dotRadius = 0.65
          let dotColor = baseDotColor
          let glow = 0

          // Cursor magnetism & illumination
          if (mouse.active) {
            const dx = x - mouse.x
            const dy = y - mouse.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < INFLUENCE_RADIUS) {
              const factor = 1 - dist / INFLUENCE_RADIUS
              dotRadius = 0.65 + factor * 1.5
              const alpha = (isDark ? 0.08 : 0.09) + factor * (isDark ? 0.45 : 0.4)
              dotColor = isDark ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`
            }
          }

          // Ripple wave illumination
          for (let k = 0; k < ripples.length; k++) {
            const rip = ripples[k]
            const dx = x - rip.x
            const dy = y - rip.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const ringThickness = 50

            if (Math.abs(dist - rip.radius) < ringThickness) {
              const waveFactor = (1 - Math.abs(dist - rip.radius) / ringThickness) * rip.opacity
              if (waveFactor > 0.08) {
                dotRadius = Math.max(dotRadius, 0.65 + waveFactor * 1.8)
                dotColor = rip.color
                glow = waveFactor
              }
            }
          }

          ctx.beginPath()
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
          ctx.fillStyle = dotColor
          if (glow > 0.3) {
            ctx.shadowColor = dotColor
            ctx.shadowBlur = 4
          } else {
            ctx.shadowBlur = 0
          }
          ctx.fill()
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
      rippleListeners.delete(onCustomRipple)
      cancelAnimationFrame(animationFrameId)
    }
  }, [resolvedTheme])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  )
}
