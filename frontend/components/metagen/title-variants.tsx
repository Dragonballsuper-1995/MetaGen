"use client"

import * as React from "react"
import { Check, Copy, Sparkles, TrendingUp, Search, Zap } from "lucide-react"

export interface TitleVariant {
  id: string
  title: string
  strategy: "curiosity" | "seo" | "action"
  strategyLabel: string
  ctrScore: number
  characterCount: number
}

interface TitleVariantsProps {
  baseTitle: string
  selectedTitle: string
  onSelectTitle: (title: string) => void
}

export function TitleVariants({
  baseTitle,
  selectedTitle,
  onSelectTitle,
}: TitleVariantsProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  const variants: TitleVariant[] = React.useMemo(() => {
    return [
      {
        id: "v1",
        title: baseTitle,
        strategy: "curiosity",
        strategyLabel: "Curiosity & High CTR",
        ctrScore: 98,
        characterCount: baseTitle.length,
      },
      {
        id: "v2",
        title: baseTitle.includes(":")
          ? baseTitle.split(":")[1].trim() + " (Full Architectural Breakdown)"
          : baseTitle + ": Deep Dive Breakdown & Architecture",
        strategy: "seo",
        strategyLabel: "Search & SEO Dominant",
        ctrScore: 94,
        characterCount: (
          baseTitle.includes(":")
            ? baseTitle.split(":")[1].trim() + " (Full Architectural Breakdown)"
            : baseTitle + ": Deep Dive Breakdown & Architecture"
        ).length,
      },
      {
        id: "v3",
        title: `How ${baseTitle.replace(/^The /i, "")} Actually Works (2026 Guide)`,
        strategy: "action",
        strategyLabel: "Direct Action & Tutorial",
        ctrScore: 91,
        characterCount: `How ${baseTitle.replace(/^The /i, "")} Actually Works (2026 Guide)`.length,
      },
    ]
  }, [baseTitle])

  const handleSelect = (variant: TitleVariant) => {
    onSelectTitle(variant.title)
  }

  const handleCopy = (variant: TitleVariant, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(variant.title)
    setCopiedId(variant.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="studio-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
            A/B Title Hook Angles ({variants.length} Generated)
          </span>
        </div>
        <span className="text-xs text-muted-foreground">Click to activate in preview</span>
      </div>

      {/* Title Options Grid */}
      <div className="flex flex-col gap-3">
        {variants.map((v) => {
          const isSelected = selectedTitle === v.title
          const isOptimalLength = v.characterCount <= 70

          return (
            <div
              key={v.id}
              onClick={() => handleSelect(v)}
              className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col gap-2.5 relative group ${
                isSelected
                  ? "bg-primary/10 border-primary shadow-sm"
                  : "bg-surface hover:bg-muted border-border hover:border-foreground/30"
              }`}
            >
              {/* Badge & Telemetry Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                      v.strategy === "curiosity"
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : v.strategy === "seo"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    {v.strategy === "curiosity" && <TrendingUp className="w-2.5 h-2.5" />}
                    {v.strategy === "seo" && <Search className="w-2.5 h-2.5" />}
                    {v.strategy === "action" && <Zap className="w-2.5 h-2.5" />}
                    {v.strategyLabel}
                  </span>

                  {isSelected && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                      • Active Preview
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-mono font-medium ${
                      isOptimalLength ? "text-muted-foreground" : "text-amber-500"
                    }`}
                  >
                    {v.characterCount} / 100
                  </span>

                  <button
                    onClick={(e) => handleCopy(v, e)}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Copy this title"
                  >
                    {copiedId === v.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Title Text */}
              <p
                className={`font-sans text-sm sm:text-base font-semibold leading-snug transition-colors ${
                  isSelected ? "text-foreground font-bold" : "text-foreground/90"
                }`}
              >
                {v.title}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
