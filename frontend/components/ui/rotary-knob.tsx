"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { sound } from "@/lib/audio-engine"

interface RotaryKnobProps {
  label: string
  value: number // Normalized 0 to 1
  onChange: (val: number) => void
  steps?: number
  displayValue?: string
  color?: "orange" | "yellow" | "green" | "cyan"
  size?: "sm" | "md"
}

export function RotaryKnob({
  label,
  value,
  onChange,
  steps = 10,
  displayValue,
  color = "orange",
  size = "md",
}: RotaryKnobProps) {
  const isDragging = React.useRef(false)
  const startY = React.useRef(0)
  const startVal = React.useRef(0)

  // Map 0..1 to -135deg .. +135deg
  const angle = -135 + value * 270

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true
    startY.current = e.clientY
    startVal.current = value
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    sound.playRatchet(1200)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    const deltaY = startY.current - e.clientY
    const deltaVal = deltaY / 120 // 120px drag for full scale
    let nextVal = Math.min(1, Math.max(0, startVal.current + deltaVal))

    if (steps > 1) {
      nextVal = Math.round(nextVal * steps) / steps
    }

    if (Math.abs(nextVal - value) > 0.001) {
      sound.playRatchet(1000 + nextVal * 800)
      onChange(nextVal)
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // Ignored
    }
  }

  // Click to advance one step
  const handleClick = () => {
    let next = value + 1 / steps
    if (next > 1.001) next = 0
    next = Math.round(next * steps) / steps
    sound.playRatchet(1400)
    onChange(next)
  }

  const colorThemes = {
    orange: "border-[#FF3B00] text-[#FF3B00]",
    yellow: "border-[#FFB800] text-[#FFB800]",
    green: "border-[#00FF66] text-[#00FF66]",
    cyan: "border-[#00E5FF] text-[#00E5FF]",
  }

  const pipColors = {
    orange: "bg-[#FF3B00] shadow-[0_0_6px_#FF3B00]",
    yellow: "bg-[#FFB800] shadow-[0_0_6px_#FFB800]",
    green: "bg-[#00FF66] shadow-[0_0_6px_#00FF66]",
    cyan: "bg-[#00E5FF] shadow-[0_0_6px_#00E5FF]",
  }

  const dimensions = size === "sm" ? "w-10 h-10" : "w-12 h-12"

  return (
    <div className="flex flex-col items-center gap-1.5 select-none font-mono">
      {/* Parameter Label */}
      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>

      {/* Rotary Cap */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleClick}
        className={cn(
          "relative rounded-full cursor-ns-resize touch-none flex items-center justify-center transition-transform",
          "bg-chassis border-2 shadow-[2px_2px_4px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.15)]",
          colorThemes[color],
          dimensions
        )}
      >
        {/* Radial Notches around perimeter */}
        <div className="absolute inset-0 rounded-full border border-dashed border-border/40 pointer-events-none" />

        {/* Rotating Core with Indicator Pip */}
        <div
          className="w-full h-full rounded-full relative"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          {/* Indicator Pip Line */}
          <div
            className={cn(
              "absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-2.5 rounded-none",
              pipColors[color]
            )}
          />
        </div>

        {/* Center Metal Cap Screw */}
        <div className="absolute w-3.5 h-3.5 rounded-full bg-border/80 border border-chassis flex items-center justify-center pointer-events-none">
          <div className="w-1.5 h-0.5 bg-background" />
        </div>
      </div>

      {/* Numerical / Value Readout */}
      <div className="px-1.5 py-0.5 bg-chassis-inset border border-border/60 text-[9px] font-mono font-bold tracking-tighter text-foreground">
        {displayValue ?? `${Math.round(value * 100)}%`}
      </div>
    </div>
  )
}
