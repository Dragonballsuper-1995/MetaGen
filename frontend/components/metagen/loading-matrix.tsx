"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Sparkles, FileText, CheckCircle2 } from "lucide-react"

interface LoadingMatrixProps {
  scriptSnippet?: string
}

export function LoadingMatrix({ scriptSnippet = "" }: LoadingMatrixProps) {
  const [step, setStep] = React.useState(0)
  const [progress, setProgress] = React.useState(24)

  React.useEffect(() => {
    const t1 = setTimeout(() => { setStep(1); setProgress(52) }, 500)
    const t2 = setTimeout(() => { setStep(2); setProgress(84) }, 1300)
    const t3 = setTimeout(() => { setStep(3); setProgress(98) }, 2100)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  const steps = [
    "Analyzing script cadence and key semantic entities...",
    "Synthesizing high-CTR title variations & curiosity hooks...",
    "Generating SEO description with keywords & structured tags...",
  ]

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
              <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
              <span className="text-sm font-semibold text-foreground">
                Synthesizing Metadata...
              </span>
            </div>
            <span className="font-dot text-base font-bold text-primary">{progress}%</span>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-4">
            {steps.map((text, idx) => {
              const isDone = step > idx
              const isCurrent = step === idx

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: step >= idx ? 1 : 0.3, y: 0 }}
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

          {/* Progress Bar */}
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden relative mt-2">
            <motion.div
              className="h-full bg-primary rounded-full shadow-sm"
              initial={{ width: "15%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
