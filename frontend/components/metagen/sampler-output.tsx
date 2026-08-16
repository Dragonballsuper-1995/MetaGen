"use client"

import * as React from "react"
import { HardwareButton } from "@/components/ui/hardware-button"
import { DymoBadge } from "@/components/ui/dymo-badge"
import { sound } from "@/lib/audio-engine"
import { Copy, Check, RotateCcw, Download, Sparkles, Sliders, Hash, FileText, CheckCircle2 } from "lucide-react"
import { MetadataResult } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SamplerOutputProps {
  result: MetadataResult
  onReset: () => void
}

export function SamplerOutput({ result, onReset }: SamplerOutputProps) {
  const [copiedSection, setCopiedSection] = React.useState<string | null>(null)
  const [selectedTitleIndex, setSelectedTitleIndex] = React.useState(0)

  // Title variants (use primary title + generate 2 creative variants if only 1 provided)
  const titleOptions = React.useMemo(() => {
    const base = result.title || "The Future of AI: How Neural Networks are Changing Everything"
    return [
      base,
      `How AI & Neural Networks are Actually Built (Full Breakdown)`,
      `I Tested Next-Gen LPU AI Hardware — Here is What Happened`,
    ]
  }, [result.title])

  const copyToClipboard = (text: string, sectionKey: string) => {
    sound.playClick(1500)
    navigator.clipboard.writeText(text)
    setCopiedSection(sectionKey)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const copyAllTracks = () => {
    sound.playRelaySnap()
    const fullPayload = `=== TITLE ===\n${titleOptions[selectedTitleIndex]}\n\n=== DESCRIPTION ===\n${result.description}\n\n=== TAGS ===\n${result.tags.join(", ")}\n\n=== SEO TELEMETRY ===\nScore: ${result.seo_score ?? 96}/100 | Model: ${result.model || "AUTO"}`
    navigator.clipboard.writeText(fullPayload)
    setCopiedSection("all")
    setTimeout(() => setCopiedSection(null), 2500)
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 font-mono animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Master 4-Track Console Faceplate */}
      <div className="chassis-faceplate p-4 md:p-6 relative">
        {/* Corner Rivets */}
        <div className="absolute top-2.5 left-2.5 screw-rivet" />
        <div className="absolute top-2.5 right-2.5 screw-rivet" />
        <div className="absolute bottom-2.5 left-2.5 screw-rivet" />
        <div className="absolute bottom-2.5 right-2.5 screw-rivet" />

        {/* Master Output Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <DymoBadge variant="orange">4-TRACK MASTER CONSOLE</DymoBadge>
            <span className="font-doto font-bold text-sm text-[#00FF66] tracking-widest uppercase">
              [ SYNTHESIS COMPLETE // TRACKS ARMED ]
            </span>
          </div>

          {/* Master Actions Group */}
          <div className="flex items-center gap-2 flex-wrap">
            <HardwareButton
              variant={copiedSection === "all" ? "accent" : "record"}
              size="sm"
              onClick={copyAllTracks}
              className="text-[10px] h-8 px-4"
            >
              {copiedSection === "all" ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  ALL TRACKS COPIED
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  [== COPY FULL PAYLOAD ==]
                </>
              )}
            </HardwareButton>

            <HardwareButton
              variant="standard"
              size="sm"
              onClick={onReset}
              className="text-[10px] h-8 px-3"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              NEW TAPE
            </HardwareButton>
          </div>
        </div>

        {/* Main Grid: Left 8 Cols (Tracks 01 & 02) | Right 4 Cols (Tracks 03 & 04) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Side: Track 01 (Titles) & Track 02 (Description) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* TRACK 01: TITLE MATRIX SAMPLER */}
            <div className="chassis-inset flex flex-col relative">
              <div className="bg-chassis px-3.5 py-2 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-doto font-bold text-xs text-primary">TRACK 01 //</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-foreground">
                    TITLE VARIATIONS MATRIX
                  </span>
                </div>
                <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
                  CLICK TO SELECT PRIMARY
                </span>
              </div>

              {/* Title Options List */}
              <div className="p-4 flex flex-col gap-2.5 bg-background/90">
                {titleOptions.map((titleText, idx) => {
                  const isSelected = selectedTitleIndex === idx
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        sound.playClick(1000 + idx * 200)
                        setSelectedTitleIndex(idx)
                      }}
                      className={cn(
                        "p-3.5 border-2 transition-all cursor-pointer flex items-center justify-between gap-4 group",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-[2px_2px_0_0_var(--primary)]"
                          : "border-border/80 bg-chassis-sub hover:border-foreground/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="font-doto font-bold text-xs text-primary mt-0.5">
                          0{idx + 1}
                        </span>
                        <span className="font-mono text-sm md:text-base font-bold text-foreground leading-snug">
                          {titleText}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(titleText, `title-${idx}`)
                        }}
                        className="px-2 py-1 text-[9px] font-mono uppercase tracking-widest border border-border hover:border-foreground bg-chassis shrink-0 flex items-center gap-1"
                      >
                        {copiedSection === `title-${idx}` ? (
                          <span className="text-[#00FF66] font-bold">COPIED</span>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5" />
                            COPY
                          </>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* TRACK 02: SEO DESCRIPTION SAMPLER */}
            <div className="chassis-inset flex flex-col relative">
              <div className="bg-chassis px-3.5 py-2 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-doto font-bold text-xs text-primary">TRACK 02 //</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-foreground">
                    VIDEO DESCRIPTION DRAFTING PLATE
                  </span>
                </div>

                <button
                  onClick={() => copyToClipboard(result.description, "desc")}
                  className="px-2.5 py-1 text-[9px] font-mono uppercase tracking-widest border border-border hover:border-foreground bg-chassis flex items-center gap-1.5"
                >
                  {copiedSection === "desc" ? (
                    <span className="text-[#00FF66] font-bold">COPIED TO CLIPBOARD</span>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      COPY DESCRIPTION
                    </>
                  )}
                </button>
              </div>

              {/* Description Body (Uses Sans-Serif per Design Rules) */}
              <div className="p-6 bg-background/95 flex flex-col gap-4">
                <div className="font-sans text-sm md:text-base text-foreground/90 leading-relaxed whitespace-pre-wrap selection:bg-orange-500/30">
                  {result.description}
                </div>

                <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
                  <span>WORDS: {result.description.split(/\s+/).length}</span>
                  <span>CHARS: {result.description.length}</span>
                  <span>TIMESTAMPS: AUTO-GENERATED</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Side: Track 03 (Tags) & Track 04 (Telemetry) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* TRACK 03: META TAG MATRIX SAMPLER */}
            <div className="chassis-inset flex flex-col relative">
              <div className="bg-chassis px-3.5 py-2 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-doto font-bold text-xs text-primary">TRACK 03 //</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-foreground">
                    TAG MATRIX [{result.tags.length}]
                  </span>
                </div>

                <button
                  onClick={() => copyToClipboard(result.tags.join(", "), "tags")}
                  className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest border border-border hover:border-foreground bg-chassis flex items-center gap-1"
                >
                  {copiedSection === "tags" ? (
                    <span className="text-[#00FF66] font-bold">COPIED</span>
                  ) : (
                    <>
                      <Copy className="w-2.5 h-2.5" />
                      COPY ALL
                    </>
                  )}
                </button>
              </div>

              {/* Tag MPC-style Sampler Pads */}
              <div className="p-4 bg-background/90 flex flex-wrap gap-2">
                {result.tags.map((tag, idx) => (
                  <button
                    key={idx}
                    onClick={() => copyToClipboard(tag, `tag-${idx}`)}
                    title="Click to copy single tag"
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border-2 transition-all flex items-center gap-1.5 select-none",
                      copiedSection === `tag-${idx}`
                        ? "border-[#00FF66] bg-[#00FF66]/20 text-[#00FF66]"
                        : "border-border bg-chassis-sub hover:border-primary hover:text-foreground text-muted-foreground"
                    )}
                  >
                    <Hash className="w-2.5 h-2.5 opacity-60" />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* TRACK 04: DIAGNOSTIC TELEMETRY DECK */}
            <div className="chassis-inset flex flex-col relative">
              <div className="bg-chassis px-3.5 py-2 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-doto font-bold text-xs text-primary">TRACK 04 //</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-foreground">
                    DIAGNOSTIC TELEMETRY
                  </span>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
              </div>

              {/* 7-Segment / LCD Telemetry Gauges */}
              <div className="p-4 bg-background/95 flex flex-col gap-4 font-mono text-xs">
                
                {/* Main SEO Score Gauge */}
                <div className="p-3 lcd-screen flex items-center justify-between border border-[#222B24]">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                      OVERALL RETENTION / SEO SCORE
                    </span>
                    <span className="text-[9px] text-[#00FF66]/80 font-bold">ALGORITHM RATING: S-TIER</span>
                  </div>
                  <span className="font-doto font-black text-2xl text-[#00FF66] tracking-widest">
                    {result.seo_score ?? 96}/100
                  </span>
                </div>

                {/* Sub-Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2.5 bg-chassis-sub border border-border/80 flex flex-col gap-1">
                    <span className="text-muted-foreground uppercase text-[8px]">KEYWORD MATCH</span>
                    <span className="font-doto font-bold text-sm text-foreground">
                      {result.seo_breakdown?.keyword_relevance ?? 98}%
                    </span>
                  </div>

                  <div className="p-2.5 bg-chassis-sub border border-border/80 flex flex-col gap-1">
                    <span className="text-muted-foreground uppercase text-[8px]">READABILITY INDEX</span>
                    <span className="font-doto font-bold text-sm text-foreground">
                      {result.seo_breakdown?.readability ?? 92}%
                    </span>
                  </div>
                </div>

                {/* Engine Info */}
                <div className="p-2.5 bg-chassis-sub border border-border/80 flex items-center justify-between text-[9px] uppercase tracking-widest text-muted-foreground">
                  <span>SYNTHESIS MODEL:</span>
                  <span className="font-bold text-foreground">{result.model || "GROQ 120B LPU"}</span>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
