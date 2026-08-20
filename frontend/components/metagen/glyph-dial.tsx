"use client"

import * as React from "react"
import { motion } from "framer-motion"

interface GlyphDialProps {
  score: number // 0 to 100
  size?: number
  label?: string
}

export function GlyphDial({ score = 96, size = 130, label = "OVERALL_SEO" }: GlyphDialProps) {
  const TOTAL_DOTS = 32
  const activeDotsCount = Math.round((score / 100) * TOTAL_DOTS)
  const [animatedDots, setAnimatedDots] = React.useState(0)

  React.useEffect(() => {
    let current = 0
    const stepInterval = 600 / TOTAL_DOTS
    const timer = setInterval(() => {
      current++
      if (current <= activeDotsCount) {
        setAnimatedDots(current)
      } else {
        clearInterval(timer)
      }
    }, stepInterval)

    return () => clearInterval(timer)
  }, [activeDotsCount])

  const center = size / 2
  const radius = size / 2 - 14

  return (
    <div className="flex flex-col items-center justify-center p-3 relative">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="overflow-visible">
          {Array.from({ length: TOTAL_DOTS }).map((_, index) => {
            // Start from 12 o'clock (-90 deg) and go clockwise
            const angle = ((index / TOTAL_DOTS) * 360 - 90) * (Math.PI / 180)
            const cx = center + radius * Math.cos(angle)
            const cy = center + radius * Math.sin(angle)
            const isLit = index < animatedDots

            return (
              <circle
                key={index}
                cx={cx}
                cy={cy}
                r={isLit ? 2.5 : 1.8}
                className={`transition-all duration-150 ${
                  isLit
                    ? "fill-primary filter drop-shadow-[0_0_3px_var(--primary)]"
                    : "fill-muted-foreground/20"
                }`}
              />
            )
          })}
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-baseline font-mono"
          >
            <span className="text-3xl font-black tracking-tight text-foreground font-dot">
              {score}
            </span>
            <span className="text-[10px] text-muted-foreground ml-0.5 font-bold">/100</span>
          </motion.div>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono mt-0.5">
            {label}
          </span>
        </div>
      </div>
    </div>
  )
}

interface SegmentedBarProps {
  label: string
  value: number // 0 to 100
  segments?: number
}

export function SegmentedBar({ label, value, segments = 10 }: SegmentedBarProps) {
  const activeSegments = Math.round((value / 100) * segments)

  return (
    <div className="flex flex-col gap-1.5 w-full font-mono text-xs">
      <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
        <span>{label}</span>
        <span className="text-foreground">{value}%</span>
      </div>
      <div className="flex gap-1 w-full">
        {Array.from({ length: segments }).map((_, i) => {
          const isLit = i < activeSegments
          return (
            <div
              key={i}
              className={`h-2 flex-1 rounded-[1px] transition-all duration-200 ${
                isLit
                  ? "bg-primary shadow-[0_0_3px_var(--primary)]"
                  : "bg-muted/40"
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}
