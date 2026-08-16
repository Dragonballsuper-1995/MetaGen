import * as React from "react"
import { cn } from "@/lib/utils"

interface TelemetryBarProps extends React.HTMLAttributes<HTMLDivElement> {
  scriptLength: number
}

export function TelemetryBar({ scriptLength, className, ...props }: TelemetryBarProps) {
  // Rough estimations
  const bytes = scriptLength
  const estimatedTokens = Math.ceil(scriptLength / 4)

  return (
    <div 
      className={cn(
        "flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest uppercase text-muted-foreground",
        className
      )}
      {...props}
    >
      <span className="text-primary animate-pulse select-none">&gt;</span>
      <span>{bytes} BYTES</span>
      <span className="text-border">|</span>
      <span>{estimatedTokens} TOKENS (EST)</span>
    </div>
  )
}
