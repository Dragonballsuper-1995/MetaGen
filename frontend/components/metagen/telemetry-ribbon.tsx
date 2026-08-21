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
  const [isWarmHovered, setIsWarmHovered] = React.useState(false)

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
      : selectedModel === "groq-20b"
      ? "OPENAI GPT-OSS 20B (GROQ)"
      : selectedModel === "mistral"
      ? "MISTRAL 7B (HF)"
      : "AUTO-HYBRID ENGINE (GROQ)"

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md border-t border-border px-4 md:px-8 py-2 text-xs text-muted-foreground flex items-center justify-between select-none font-mono">
      {/* Left: Interactive Model Warm Indicator */}
      <div className="flex items-center gap-2">
        <div
          className="relative flex items-center"
          onMouseEnter={() => setIsWarmHovered(true)}
          onMouseLeave={() => setIsWarmHovered(false)}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 text-[11px] font-bold cursor-pointer transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>MODEL WARM (0.4S)</span>
          </div>

          {/* Rich Diagnostics Hover Card */}
          {isWarmHovered && (
            <div className="absolute left-0 bottom-full mb-2 w-72 sm:w-80 p-4 rounded-2xl bg-surface dark:bg-zinc-900 border border-border shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 flex flex-col gap-2.5 font-sans">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-foreground">Engine Diagnostics</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                  Pre-Warmed (0.4s)
                </span>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">Primary Cloud Engine</span>
                  <span className="font-semibold text-foreground text-xs">
                    Groq LPU — OpenAI GPT-OSS 120B
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Speed: ~500 T/s • TTFT: ~0.37s • Latency: &lt;1.0s
                  </span>
                </div>

                <div className="flex flex-col gap-0.5 border-t border-border/50 pt-2">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">Failover Cascade Hierarchy</span>
                  <div className="flex flex-col gap-1 text-[11px] font-mono text-foreground/90">
                    <div className="flex items-center justify-between">
                      <span>1. openai/gpt-oss-20b</span>
                      <span className="text-emerald-500 font-semibold">1000 T/s (0.59s)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>2. qwen/qwen3.6-27b</span>
                      <span className="text-emerald-500 font-semibold">500 T/s (0.63s)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>3. Mistral 7B (GGUF)</span>
                      <span className="text-zinc-500">Local CPU Offline</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-1.5 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Heartbeat Keep-Warm:</span>
                  <span className="text-emerald-500 font-semibold">Active (Every 240s)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Telemetry Metrics */}
      <div className="flex items-center gap-3 sm:gap-5 text-[11px] uppercase">
        {status === "output" && (
          <div className="flex items-center gap-1.5 text-primary font-bold">
            <span className="font-bold text-[12px] text-emerald-500 dark:text-emerald-400">{seoScore}%</span>
            <span className="text-[10px] tracking-wider text-muted-foreground">SEO SCORE</span>
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
