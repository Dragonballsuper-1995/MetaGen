"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface LedVuMeterProps {
  level: number // Normalized 0 to 1
  segments?: number
  orientation?: "horizontal" | "vertical"
  label?: string
  className?: string
}

export function LedVuMeter({
  level,
  segments = 12,
  orientation = "horizontal",
  label = "VU LEVEL",
  className,
}: LedVuMeterProps) {
  const activeCount = Math.round(Math.min(1, Math.max(0, level)) * segments)

  const segmentIndices = Array.from({ length: segments }, (_, i) => i)

  return (
    <div
      className={cn(
        "flex font-mono select-none gap-1.5 p-1.5 bg-chassis-inset border border-border/70",
        orientation === "vertical" ? "flex-col-reverse items-center" : "flex-col",
        className
      )}
    >
      {label && (
        <div className="flex justify-between items-center text-[8px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
          <span>{label}</span>
          <span>{Math.round(level * 100)}%</span>
        </div>
      )}

      <div
        className={cn(
          "flex gap-1",
          orientation === "vertical" ? "flex-col-reverse h-32 w-3" : "flex-row w-full h-3"
        )}
      >
        {segmentIndices.map((index) => {
          const isActive = index < activeCount
          const ratio = index / segments

          // Green for normal (0-65%), Yellow for warning (65-85%), Red for peak (85-100%)
          let activeClass = "bg-[#00FF66] shadow-[0_0_4px_#00FF66]"
          if (ratio > 0.85) {
            activeClass = "bg-[#FF3B00] shadow-[0_0_6px_#FF3B00]"
          } else if (ratio > 0.65) {
            activeClass = "bg-[#FFB800] shadow-[0_0_5px_#FFB800]"
          }

          const inactiveClass = "bg-muted/40 opacity-20 border border-border/40"

          return (
            <div
              key={index}
              className={cn(
                "flex-1 transition-colors duration-75 rounded-none",
                isActive ? activeClass : inactiveClass
              )}
            />
          )
        })}
      </div>
    </div>
  )
}
