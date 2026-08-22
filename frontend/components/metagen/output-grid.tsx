"use client"

import * as React from "react"
import {
  Copy,
  Check,
  Hash,
  Sparkles,
  FileText,
  CheckCircle2,
  RotateCcw,
  Cpu,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Search,
  Zap,
  Tv,
  LayoutGrid,
  Info,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { MetadataResult } from "@/lib/types"
import { YoutubePreview } from "@/components/metagen/youtube-preview"

interface OutputGridProps {
  result: MetadataResult
  sourceScript?: string
  onReset?: () => void
}

export function OutputGrid({ result, sourceScript = "", onReset }: OutputGridProps) {
  const [activeTab, setActiveTab] = React.useState<"studio" | "simulator">("studio")
  const [selectedAngleIdx, setSelectedAngleIdx] = React.useState(0)
  const [copiedSection, setCopiedSection] = React.useState<string | null>(null)
  const [allCopied, setAllCopied] = React.useState(false)
  const [isSourceModalOpen, setIsSourceModalOpen] = React.useState(false)
  const [isSeoPopoverOpen, setIsSeoPopoverOpen] = React.useState(false)

  // 3 Distinct high-converting title angles
  const titleAngles = React.useMemo(() => {
    const base = result.title
    return [
      {
        id: "curiosity",
        label: "Curiosity & High CTR",
        shortLabel: "Curiosity",
        title: base,
        score: 98,
        icon: TrendingUp,
      },
      {
        id: "seo",
        label: "Search & SEO Dominant",
        shortLabel: "SEO Dominant",
        title: base.includes(":")
          ? base.split(":")[1].trim() + " (Full Architectural Breakdown)"
          : base + ": Deep Dive Breakdown & Architecture",
        score: 94,
        icon: Search,
      },
      {
        id: "action",
        label: "Direct Action & Tutorial",
        shortLabel: "Direct Action",
        title: `How ${base.replace(/^The /i, "")} Actually Works (2026 Guide)`,
        score: 91,
        icon: Zap,
      },
    ]
  }, [result.title])

  const activeTitle = titleAngles[selectedAngleIdx]?.title || result.title

  const handleNextTitle = () => {
    setSelectedAngleIdx((prev) => (prev + 1) % titleAngles.length)
  }

  const handlePrevTitle = () => {
    setSelectedAngleIdx((prev) => (prev - 1 + titleAngles.length) % titleAngles.length)
  }

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
  const wordCount = sourceScript.trim() ? sourceScript.split(/\s+/).filter(Boolean).length : 0

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto gap-3.5 animate-in fade-in duration-200 select-none">
      {/* ─── TOP CONTROL BAR ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 border-b border-border/80 pb-3 flex-shrink-0">
        {/* Left: View Tabs + Source Script Trigger */}
        <div className="flex flex-wrap justify-center items-center gap-2">
          {/* Tab Switcher Pills */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab("studio")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "studio"
                  ? "bg-surface text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-primary" />
              <span>Metadata Studio</span>
            </button>

            <button
              onClick={() => setActiveTab("simulator")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "simulator"
                  ? "bg-surface text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Tv className="w-3.5 h-3.5 text-primary" />
              <span>YouTube Simulator</span>
            </button>
          </div>

          {/* Source Script Modal Trigger */}
          {sourceScript && (
            <button
              onClick={() => setIsSourceModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border bg-muted/30 hover:bg-muted/70 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>Source ({wordCount}w)</span>
            </button>
          )}
        </div>

        {/* Right: Hover-Expanded SEO Scorecard + Action Buttons */}
        <div className="flex flex-wrap justify-center items-center gap-2 w-full sm:w-auto">
          {/* Interactive SEO Score Badge (Hover or Click expands scorecard) */}
          <div
            className="relative"
            onMouseEnter={() => setIsSeoPopoverOpen(true)}
            onMouseLeave={() => setIsSeoPopoverOpen(false)}
          >
            <button
              onClick={() => setIsSeoPopoverOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface dark:bg-zinc-900 border border-emerald-500/40 hover:border-emerald-500 shadow-xs text-xs font-semibold transition-all cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span className="font-sans font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                {result.seo_score ?? 98}%
              </span>
              <span className="text-[10px] tracking-wider text-muted-foreground uppercase font-mono hidden sm:inline">
                SEO SCORE
              </span>
              <Info className="w-3.5 h-3.5 text-muted-foreground opacity-80 ml-0.5" />
            </button>

            {/* Hover SEO Popover Card */}
            {isSeoPopoverOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 top-full mt-2 w-72 p-4 rounded-2xl bg-surface dark:bg-zinc-900 border border-border shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    SEO Score Breakdown
                  </span>
                  <span className="font-sans text-xs font-bold text-emerald-500">
                    {result.seo_score ?? 98}% Overall
                  </span>
                </div>

                <div className="flex flex-col gap-2 text-xs">
                  {[
                    { label: "Title Hook & CTR", val: result.seo_breakdown?.title ?? 100 },
                    { label: "Description Depth", val: result.seo_breakdown?.description ?? 98 },
                    { label: "Tag Relevance", val: result.seo_breakdown?.tags ?? 100 },
                    { label: "Keyword Density", val: result.seo_breakdown?.keyword_relevance ?? 96 },
                    { label: "Readability Score", val: result.seo_breakdown?.readability ?? 92 },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[11px] font-medium">{label}</span>
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
                          {val}%
                        </span>
                      </div>
                      <div className="w-full bg-muted dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* New Prompt Button */}
          {onReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="h-8 px-2.5 sm:px-3 rounded-xl text-xs font-medium border-border hover:border-foreground/30"
            >
              <RotateCcw className="w-3 h-3 mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">New Prompt</span>
            </Button>
          )}

          {/* Copy All Button */}
          <Button
            size="sm"
            onClick={handleCopyAll}
            className="h-8 px-3 sm:px-3.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20 transition-all"
          >
            {allCopied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" />
                <span>Copy All</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ─── TAB 1: METADATA STUDIO (SINGLE VIEWPORT) ─────────────────────────── */}
      {activeTab === "studio" && (
        <div className="flex flex-col flex-1 min-h-0 gap-3.5">
          {/* HERO SINGLE-TITLE CARD WITH ANGLE SWITCHER */}
          <div className="bento-card p-4 sm:p-5 flex flex-col gap-2.5 flex-shrink-0">
            {/* Title Card Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border pb-2.5 gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="dm-label text-muted-foreground">Optimized Title</span>

                {/* Strategy Badge */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{titleAngles[selectedAngleIdx]?.label}</span>
                </span>
              </div>

              {/* Angle Carousel Navigation & Copy */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground font-mono mr-1 whitespace-nowrap flex-shrink-0">
                    {selectedAngleIdx + 1} / {titleAngles.length}
                  </span>

                  <button
                    onClick={handlePrevTitle}
                    className="p-1 rounded-lg border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Previous Angle"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleNextTitle}
                    className="p-1 rounded-lg border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Next Angle"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(activeTitle, "title")}
                  className="h-7 px-2.5 ml-1 rounded-lg text-xs font-medium border-border hover:border-foreground/30"
                >
                  {copiedSection === "title" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500 mr-1" />
                      <span className="text-emerald-500 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1 text-muted-foreground" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Prominent Single Active Title Display */}
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground leading-snug tracking-tight">
              {activeTitle}
            </h2>

            {/* Bottom Angle Switcher Pills */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-border/60 overflow-x-auto hide-scrollbar max-w-[90vw] md:max-w-full">
              <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider mr-1 whitespace-nowrap flex-shrink-0">
                Angles:
              </span>
              {titleAngles.map((angle, idx) => {
                const isSelected = selectedAngleIdx === idx
                const Icon = angle.icon
                return (
                  <button
                    key={angle.id}
                    onClick={() => setSelectedAngleIdx(idx)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                      isSelected
                        ? "bg-primary text-white font-semibold shadow-xs"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{angle.shortLabel}</span>
                  </button>
                )
              })}
              <span className="ml-auto text-[11px] font-mono text-muted-foreground whitespace-nowrap flex-shrink-0 pl-2">
                {activeTitle.length} chars
              </span>
            </div>
          </div>

          {/* DUAL-PANE BODY: DESCRIPTION & TAGS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Description Card */}
            <div className="bento-card p-4 flex flex-col gap-2.5 h-full">
              <div className="flex items-center justify-between border-b border-border pb-2 flex-shrink-0">
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
                  className="h-6 px-2 rounded-md text-xs font-medium border-border hover:border-foreground/30"
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

              {/* Description Text */}
              <div className="bg-muted/30 rounded-xl p-3 border border-border flex-1">
                <p className="font-sans text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap selection:bg-primary/20">
                  {result.description}
                </p>
              </div>
            </div>

            {/* Tags Card */}
            <div className="bento-card p-4 flex flex-col gap-2.5 h-full">
              <div className="flex items-center justify-between border-b border-border pb-2 flex-shrink-0">
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
                  className="h-6 px-2 rounded-md text-xs font-medium border-border hover:border-foreground/30"
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

              {/* Tag Chips Cloud */}
              <div className="bg-muted/30 rounded-xl p-3 border border-border flex-1 flex flex-wrap gap-1.5 content-start">
                {result.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    onClick={() => handleCopy(tag, `tag-${idx}`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface hover:bg-muted border border-border text-foreground text-xs font-medium transition-colors cursor-pointer"
                    title="Click to copy single tag"
                  >
                    <span className="text-primary font-bold">#</span>
                    <span>{tag}</span>
                    {copiedSection === `tag-${idx}` && (
                      <Check className="w-3 h-3 text-emerald-500 ml-0.5" />
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: YOUTUBE SIMULATOR ─────────────────────────────────────────── */}
      {activeTab === "simulator" && (
        <div className="flex-1 flex flex-col justify-center items-center overflow-y-auto max-h-full py-2">
          <div className="w-full max-w-3xl">
            <YoutubePreview
              title={activeTitle}
              description={result.description}
              channelName="MetaGen Creator"
              viewCount="64K views"
              uploadTime="1 hour ago"
              duration="12:45"
            />
          </div>
        </div>
      )}

      {/* ─── SOURCE SCRIPT MODAL DIALOG ───────────────────────────────────────── */}
      {isSourceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bento-card p-6 max-w-lg w-full max-h-[80vh] flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Original Source Script
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  ({wordCount} words)
                </span>
              </div>
              <button
                onClick={() => setIsSourceModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-3.5 bg-muted/40 rounded-xl border border-border max-h-[50vh]">
              <p className="font-sans text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {sourceScript}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(sourceScript, "modal-source")}
                className="h-8 px-3 rounded-lg text-xs"
              >
                {copiedSection === "modal-source" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500 mr-1.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    <span>Copy Source</span>
                  </>
                )}
              </Button>

              <Button
                size="sm"
                onClick={() => setIsSourceModalOpen(false)}
                className="h-8 px-4 rounded-lg text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
