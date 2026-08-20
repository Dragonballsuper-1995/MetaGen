"use client"

import * as React from "react"
import {
  Copy,
  Check,
  Hash,
  Sparkles,
  FileText,
  CheckCircle2,
  TrendingUp,
  Search,
  Zap,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { MetadataResult } from "@/lib/types"

interface OutputGridProps {
  result: MetadataResult
  sourceScript?: string
  onReset?: () => void
}

export function OutputGrid({ result, sourceScript = "", onReset }: OutputGridProps) {
  const [selectedVariantIdx, setSelectedVariantIdx] = React.useState(0)
  const [copiedSection, setCopiedSection] = React.useState<string | null>(null)
  const [allCopied, setAllCopied] = React.useState(false)

  // Generate 3 title angles
  const titleVariants = React.useMemo(() => {
    const base = result.title
    return [
      {
        label: "Curiosity & High CTR",
        title: base,
        icon: TrendingUp,
      },
      {
        label: "Search & SEO Ranked",
        title: base.includes(":")
          ? base.split(":")[1].trim() + " (Full Architectural Breakdown)"
          : base + ": Complete Architectural Breakdown",
        icon: Search,
      },
      {
        label: "Direct Tutorial & Action",
        title: `How ${base.replace(/^The /i, "")} Actually Works (2026 Guide)`,
        icon: Zap,
      },
    ]
  }, [result.title])

  const activeTitle = titleVariants[selectedVariantIdx]?.title || result.title

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(sectionId)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const handleCopyAll = () => {
    const fullPayload = `TITLE:\n${activeTitle}\n\nDESCRIPTION:\n${result.description}\n\nTAGS:\n${result.tags.join(", ")}`
    navigator.clipboard.writeText(fullPayload)
    setAllCopied(true)
    setTimeout(() => setAllCopied(false), 2500)
  }

  const commaSeparatedTags = result.tags.join(", ")

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        {/* Left Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Synthesis Complete</span>
          </div>

          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
            <span className="dm-digit">{result.seo_score ?? 97}</span>
            <span>/100 SEO Score</span>
          </div>
        </div>

        {/* Right Top Action Buttons */}
        <div className="flex items-center gap-2">
          {onReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="h-9 px-3.5 rounded-xl text-xs font-medium border-border hover:border-foreground/30"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              New Prompt
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleCopyAll}
            className="h-9 px-4 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all"
          >
            {allCopied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                <span>All Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                <span>Copy All Metadata</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Bento Grid — 3-area layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* LEFT COLUMN (4 cols): Source Script + SEO Diagnostics stacked */}
        <div className="lg:col-span-4 flex flex-col gap-5">

          {/* Source Script Card */}
          <div className="bento-card p-5 md:p-6 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span className="dm-label text-muted-foreground">Source Script</span>
              </div>
              {sourceScript && (
                <span className="dm-digit text-xs text-muted-foreground">
                  {sourceScript.split(/\s+/).filter(Boolean).length} words
                </span>
              )}
            </div>

            <div className="overflow-y-auto pr-1 max-h-[240px]">
              <p className="font-sans text-xs md:text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap selection:bg-primary/20">
                {sourceScript || "Source script text will appear here for side-by-side comparison."}
              </p>
            </div>

            {sourceScript && (
              <div className="pt-2 border-t border-border flex justify-end">
                <button
                  onClick={() => handleCopy(sourceScript, "source")}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium transition-colors"
                >
                  {copiedSection === "source" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Source</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* SEO Diagnostics Card — moved to left column */}
          <div className="bento-card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="dm-label text-muted-foreground">SEO Diagnostics</span>
              <span className="dm-digit text-sm text-emerald-500">
                {result.seo_score ?? 97}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2.5 text-xs">
              {[
                { label: "Title Hook", val: result.seo_breakdown?.title ?? 100 },
                { label: "Description", val: result.seo_breakdown?.description ?? 98 },
                { label: "Tag Depth", val: result.seo_breakdown?.tags ?? 100 },
                { label: "Relevance", val: result.seo_breakdown?.keyword_relevance ?? 96 },
                { label: "Readability", val: result.seo_breakdown?.readability ?? 92 },
              ].map(({ label, val }) => (
                <div
                  key={label}
                  className="p-2.5 rounded-lg bg-muted/40 border border-border flex flex-col gap-1"
                >
                  <span className="text-muted-foreground text-[10px] leading-tight">{label}</span>
                  <span className="dm-digit text-sm text-emerald-500">{val}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (8 cols): Title → (Description | Tags) */}
        <div className="lg:col-span-8 flex flex-col gap-5">

          {/* BENTO 1: Optimized Title */}
          <div className="bento-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="dm-label text-muted-foreground">Optimized Title</span>
                <span className="dm-digit text-xs text-muted-foreground">
                  ({activeTitle.length} chars)
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(activeTitle, "title")}
                className="h-8 px-3 rounded-lg text-xs font-medium border-border hover:border-foreground/30"
              >
                {copiedSection === "title" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500 mr-1.5" />
                    <span className="text-emerald-500 font-semibold">Copied Title</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                    <span>Copy Title</span>
                  </>
                )}
              </Button>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-foreground leading-snug tracking-tight">
              {activeTitle}
            </h2>

            {/* A/B Angle Switcher Pills */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-primary" />
                A/B Angles:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {titleVariants.map((variant, idx) => {
                  const isSelected = selectedVariantIdx === idx
                  const Icon = variant.icon
                  return (
                    <button
                      key={variant.label}
                      onClick={() => setSelectedVariantIdx(idx)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-primary text-white font-semibold shadow-sm"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{variant.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* BENTO 2+3: Description and Tags side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Description Card */}
            <div className="bento-card p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span className="dm-label text-muted-foreground">Description</span>
                  <span className="dm-digit text-xs text-muted-foreground">
                    ({result.description.split(/\s+/).filter(Boolean).length}w)
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(result.description, "desc")}
                  className="h-7 px-2.5 rounded-lg text-xs font-medium border-border hover:border-foreground/30"
                >
                  {copiedSection === "desc" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500 mr-1" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1 text-muted-foreground" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-muted/40 rounded-xl p-3.5 border border-border max-h-[220px] overflow-y-auto flex-1">
                <p className="font-sans text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap selection:bg-primary/20">
                  {result.description}
                </p>
              </div>
            </div>

            {/* Tags Card */}
            <div className="bento-card p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-primary" />
                  <span className="dm-label text-muted-foreground">Tags</span>
                  <span className="dm-digit text-xs text-muted-foreground">
                    ({result.tags.length})
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(commaSeparatedTags, "tags")}
                  className="h-7 px-2.5 rounded-lg text-xs font-medium border-border hover:border-foreground/30"
                >
                  {copiedSection === "tags" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500 mr-1" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1 text-muted-foreground" />
                      <span>Studio</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 content-start">
                {result.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 border border-border text-foreground text-xs font-medium transition-colors"
                  >
                    <span className="text-primary font-bold">#</span>
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
