"use client"

import * as React from "react"

interface VuMeterProps {
  activityLevel?: number // 0 to 1
  active?: boolean
  barsCount?: number
  dotsPerBar?: number
  className?: string
}

export function VuMeter({
  activityLevel = 0,
  active = false,
  barsCount = 12,
  dotsPerBar = 7,
  className = "",
}: VuMeterProps) {
  const [levels, setLevels] = React.useState<number[]>(() =>
    Array(barsCount).fill(1)
  )

  React.useEffect(() => {
    let animId: number
    let time = 0

    const update = () => {
      time += 0.05
      setLevels((prev) =>
        prev.map((_, i) => {
          if (active) {
            // High energy dynamic frequency simulation
            const noise = Math.sin(time * 6 + i * 0.8) * 0.5 + 0.5
            const rand = Math.random() * 0.3
            const target = Math.min(dotsPerBar, Math.max(1, Math.round((noise + rand + activityLevel * 0.8) * dotsPerBar)))
            return target
          } else {
            // Gentle ambient idle pulse (breathing wave)
            const idle = Math.sin(time * 1.5 + i * 0.4) * 0.5 + 0.5
            return Math.max(1, Math.round(idle * (dotsPerBar * 0.4)))
          }
        })
      )
      animId = requestAnimationFrame(update)
    }

    animId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(animId)
  }, [active, activityLevel, barsCount, dotsPerBar])

  return (
    <div className={`inline-flex items-end gap-[3px] p-1.5 bg-black/40 dark:bg-black/60 border border-border/40 rounded-[2px] ${className}`}>
      {levels.map((level, colIndex) => (
        <div key={colIndex} className="flex flex-col-reverse gap-[2px]">
          {Array.from({ length: dotsPerBar }).map((_, dotIndex) => {
            const isLit = dotIndex < level
            const isPeak = dotIndex >= dotsPerBar - 2

            let litColor = "bg-foreground/80 shadow-[0_0_3px_rgba(255,255,255,0.4)]"
            if (isPeak) {
              litColor = "bg-primary shadow-[0_0_4px_var(--primary)]"
            }

            return (
              <div
                key={dotIndex}
                className={`w-[4px] h-[3px] rounded-[0.5px] transition-colors duration-75 ${
                  isLit ? litColor : "bg-muted/25"
                }`}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
