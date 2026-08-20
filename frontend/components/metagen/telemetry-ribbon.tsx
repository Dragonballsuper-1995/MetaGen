"use client"

import * as React from "react"
import { ModelChoice } from "@/lib/types"

interface TelemetryRibbonProps {
  selectedModel?: ModelChoice
  status?: "idle" | "loading" | "output"
  tokenCount?: number
  byteCount?: number
  seoScore?: number
}

export function TelemetryRibbon({
  selectedModel = "auto",
  status = "idle",
  seoScore = 97,
}: TelemetryRibbonProps) {
  const [timeStr, setTimeStr] = React.useState("")

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTimeStr(
        now.toTimeString().substring(0, 5)
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 10000)
    return () => clearInterval(timer)
  }, [])

  const modelLabel =
    selectedModel === "groq"
      ? "OPENAI GPT-OSS 120B (GROQ)"
      : selectedModel === "mistral"
      ? "MISTRAL 7B (HF)"
      : "AUTO-HYBRID ENGINE (GROQ)"

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md border-t border-border px-4 md:px-8 py-2 text-xs text-muted-foreground flex items-center justify-between select-none font-mono">
      {/* Left: Model Warm Indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>MODEL WARM (0.4S)</span>
        </div>
      </div>

      {/* Right: Telemetry Metrics */}
      <div className="flex items-center gap-3 sm:gap-5 text-[11px] uppercase">
        {status === "output" && (
          <div className="flex items-center gap-1 text-primary font-bold">
            <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-[9px]">
              {seoScore}
            </span>
            <span>SEO SCORE</span>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
          <span>LATENCY:</span>
          <strong className="text-foreground font-semibold">1.39S</strong>
        </div>

        <div className="hidden md:flex items-center gap-1 text-muted-foreground">
          <span>MODEL:</span>
          <strong className="text-foreground font-semibold">{modelLabel}</strong>
        </div>

        {timeStr && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>REF:</span>
            <strong className="text-foreground font-semibold">{timeStr}</strong>
          </div>
        )}
      </div>
    </footer>
  )
}
