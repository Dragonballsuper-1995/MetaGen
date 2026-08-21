"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Sparkles, FileText, CheckCircle2, AlertTriangle, RotateCcw, Hash, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LoadingMatrixProps {
  scriptSnippet?: string
  streamTokens?: string
  streamProgressPercent?: number
  streamTags?: string[] | null
  error?: string | null
  onRetry?: () => void
  onCancel?: () => void
}

export function LoadingMatrix({
  scriptSnippet = "",
  streamTokens = "",
  streamProgressPercent,
  streamTags = null,
  error = null,
  onRetry,
  onCancel,
}: LoadingMatrixProps) {
  const [internalStep, setInternalStep] = React.useState(0)
  const [internalProgress, setInternalProgress] = React.useState(24)

  React.useEffect(() => {
    if (streamProgressPercent !== undefined) return

    const t1 = setTimeout(() => { setInternalStep(1); setInternalProgress(52) }, 600)
    const t2 = setTimeout(() => { setInternalStep(2); setInternalProgress(84) }, 1600)
    const t3 = setTimeout(() => { setInternalStep(3); setInternalProgress(98) }, 2600)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [streamProgressPercent])

  const effectiveProgress = streamProgressPercent !== undefined
    ? Math.round(streamProgressPercent)
    : internalProgress

  const steps = [
    "Analyzing script cadence and key semantic entities...",
    "Synthesizing high-CTR title variations & curiosity hooks...",
    "Generating SEO description with keywords & structured tags...",
  ]

  const activeStep = streamTokens
    ? 2
    : streamTags && streamTags.length > 0
    ? 1
    : internalStep

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-start">
      {/* Left Column: Source Script Snapshot */}
      {scriptSnippet && (
        <div className="lg:col-span-4 bento-card p-5 md:p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Source Script
            </span>
          </div>
          <div className="max-h-[300px] overflow-hidden opacity-70">
            <p className="font-sans text-xs md:text-sm text-foreground/80 leading-relaxed line-clamp-10">
              {scriptSnippet}
            </p>
          </div>
        </div>
      )}

      {/* Right Column: Loading Synthesis Cards */}
      <div className={scriptSnippet ? "lg:col-span-8 flex flex-col gap-5" : "lg:col-span-12 flex flex-col gap-5 max-w-3xl mx-auto w-full"}>
        <div className="bento-card p-6 md:p-8 flex flex-col gap-6">
          {/* Top Status */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              {error ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-semibold text-destructive">Generation Error</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
                  <span className="text-sm font-semibold text-foreground">
                    {streamTokens ? "Streaming Live AI Tokens..." : "Synthesizing Metadata..."}
                  </span>
                </>
              )}
            </div>
            <span className="font-dot text-base font-bold text-primary">{effectiveProgress}%</span>
          </div>

          {/* Error Banner */}
          {error ? (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs md:text-sm flex flex-col gap-3">
              <p className="font-medium leading-relaxed">{error}</p>
              <div className="flex items-center gap-2 mt-1">
                {onRetry && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={onRetry}
                    className="h-8 px-3 rounded-lg text-xs font-semibold bg-destructive hover:bg-destructive/90 text-white"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Retry
                  </Button>
                )}
                {onCancel && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCancel}
                    className="h-8 px-3 rounded-lg text-xs font-medium border-border"
                  >
                    Back to Editor
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Steps */}
              <div className="flex flex-col gap-4">
                {steps.map((text, idx) => {
                  const isDone = activeStep > idx
                  const isCurrent = activeStep === idx

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: activeStep >= idx ? 1 : 0.3, y: 0 }}
                      className="flex items-center justify-between gap-3 text-xs md:text-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        ) : isCurrent ? (
                          <Sparkles className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-border flex-shrink-0" />
                        )}
                        <span
                          className={
                            isDone
                              ? "text-foreground font-medium"
                              : isCurrent
                              ? "text-primary font-semibold"
                              : "text-muted-foreground"
                          }
                        >
                          {text}
                        </span>
                      </div>

                      {isDone && (
                        <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Done
                        </span>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              {/* Early Streamed Tags */}
              {streamTags && streamTags.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Hash className="w-3 h-3 text-primary" />
                    <span>Instant Extracted Keywords:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {streamTags.slice(0, 6).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium border border-border text-foreground/80"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Token Stream Terminal Preview */}
              {streamTokens && (
                <div className="p-3.5 rounded-xl bg-black/40 border border-border/60 font-mono text-xs text-foreground/80 max-h-[140px] overflow-y-auto leading-relaxed flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-primary text-[10px] uppercase tracking-wider font-semibold">
                    <Terminal className="w-3 h-3" />
                    <span>LPU Inference Stream</span>
                  </div>
                  <p className="whitespace-pre-wrap">
                    {streamTokens.slice(-350)}
                    <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 animate-pulse align-middle" />
                  </p>
                </div>
              )}

              {/* Progress Bar */}
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden relative mt-2">
                <motion.div
                  className="h-full bg-primary rounded-full shadow-sm"
                  initial={{ width: "15%" }}
                  animate={{ width: `${effectiveProgress}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
