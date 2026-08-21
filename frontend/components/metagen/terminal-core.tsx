"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { LoadingMatrix } from "@/components/metagen/loading-matrix"
import { OutputGrid } from "@/components/metagen/output-grid"
import {
  Sparkles,
  Play,
  FileText,
  Clock,
  BookOpen,
  Cpu,
  Zap,
} from "lucide-react"
import { MetadataResult, ModelChoice } from "@/lib/types"

export type AppState = "input" | "loading" | "output"

interface TerminalCoreProps {
  appState: AppState
  onInitiateSequence: (script: string) => void
  result?: MetadataResult
  onReset: () => void
  onScriptChange?: (script: string) => void
  selectedModel?: ModelChoice
  onModelChange?: (model: ModelChoice) => void
  streamTokens?: string
  streamProgressPercent?: number
  streamTags?: string[] | null
  streamError?: string | null
  onRetry?: () => void
}

const SAMPLE_PRESETS = [
  {
    name: "Tech Review",
    text: "Unboxing and complete engineering teardown of the newest tactile portable synthesizer. We analyze the custom aluminum chassis, PCB routing, mechanical rotary encoders, low-noise DAC convertors, and how physical-digital design principles create an unforgettable user experience.",
  },
  {
    name: "Vlog / Lifestyle",
    text: "Join me on a 48-hour solo photography trip to the foggy mountains of Kyoto. I share my street photography camera settings, composition techniques, finding hidden espresso bars, and reflecting on creative burnout and finding inspiration in daily routines.",
  },
  {
    name: "Educational",
    text: "Welcome back to the channel! Today we're diving deep into the architecture of neural networks and how transformers process natural language. We'll explore attention mechanisms, token embeddings, and how modern LLMs understand context to generate human-like code and text.",
  },
  {
    name: "Architecture",
    text: "In this video, we dive deep into the world of sustainable architecture. We'll explore how modern skyscrapers are incorporating vertical forests, advanced solar harvesting, and closed-loop water systems from Singapore's Jewel Changi to Milan's Bosco Verticale.",
  },
]

// Height of the collapsed pill bar in pixels
const COLLAPSED_HEIGHT = 60

export function TerminalCore({
  appState,
  onInitiateSequence,
  result,
  onReset,
  onScriptChange,
  selectedModel = "auto",
  onModelChange,
  streamTokens = "",
  streamProgressPercent,
  streamTags = null,
  streamError = null,
  onRetry,
}: TerminalCoreProps) {
  const [script, setScript] = React.useState("")
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [selectedPresetIndex, setSelectedPresetIndex] = React.useState<number | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
  const cardRef = React.useRef<HTMLDivElement | null>(null)

  const wordCount = React.useMemo(() => {
    return script.trim() ? script.trim().split(/\s+/).length : 0
  }, [script])

  const estSpeakingTime = React.useMemo(() => {
    if (wordCount === 0) return "0s"
    const totalSeconds = Math.round((wordCount / 130) * 60)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
  }, [wordCount])

  // Click-outside to collapse — only when script is empty
  React.useEffect(() => {
    if (!isExpanded) return
    const handler = (e: MouseEvent) => {
      if (
        cardRef.current &&
        !cardRef.current.contains(e.target as Node) &&
        script.trim() === ""
      ) {
        setIsExpanded(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [isExpanded, script])

  const handleExpand = () => {
    setIsExpanded(true)
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 300)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setScript(val)
    if (onScriptChange) onScriptChange(val)
    setSelectedPresetIndex(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      if (script.trim().length > 0) {
        onInitiateSequence(script)
      }
    }
  }

  const handlePresetSelect = (presetIndex: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const preset = SAMPLE_PRESETS[presetIndex]
    setScript(preset.text)
    setSelectedPresetIndex(presetIndex)
    setIsExpanded(true)
    if (onScriptChange) onScriptChange(preset.text)
  }

  const handleGenerate = () => {
    if (script.trim().length === 0) return
    onInitiateSequence(script)
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center h-full py-2">
      {/* 1. INPUT STAGE */}
      {appState === "input" && (
        <div className="w-full max-w-4xl flex flex-col items-center text-center gap-4 sm:gap-6 my-auto">
          {/* Hero Headline */}
          <div className="flex flex-col items-center gap-2">
            {/* Model Selector Pill */}
            {onModelChange && (
              <div className="inline-flex items-center p-1 bg-surface border border-border rounded-full shadow-sm">
                <button
                  type="button"
                  onClick={() => onModelChange("auto")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedModel === "auto"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto</span>
                </button>

                <button
                  type="button"
                  onClick={() => onModelChange("groq")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedModel === "groq"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>Groq 120B</span>
                </button>

                <button
                  type="button"
                  onClick={() => onModelChange("groq-20b")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedModel === "groq-20b"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>Groq 20B</span>
                </button>

                <button
                  type="button"
                  onClick={() => onModelChange("mistral")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedModel === "mistral"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Cpu className="w-3 h-3" />
                  <span>Mistral 7B</span>
                </button>
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.08] text-foreground">
              Elevate Your <br />
              <span className="text-gradient-blue">Video Metadata</span>
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-0.5">
              Transform scripts into SEO-optimized titles, descriptions, and tags in seconds.
            </p>
          </div>


          {/* ─── SINGLE CONTINUOUS PHYSICAL MORPHING CARD ─────────────── */}
          <div className="w-full flex justify-center">
            <div
              ref={cardRef}
              className={`morph-card ${isExpanded ? "expanded" : "collapsed"}`}
              onClick={!isExpanded ? handleExpand : undefined}
              role="region"
              aria-expanded={isExpanded}
            >
              {/* ── 1. COLLAPSED PANEL (Rounded-Corner Rectangle) ── */}
              <div className="collapsed-panel">
                <div className="flex items-center gap-3.5 text-muted-foreground min-w-0 pr-3 select-none">
                  <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-[14px] md:text-[15px] truncate font-medium text-foreground/80">
                    {script.trim()
                      ? script.length > 55
                        ? script.slice(0, 55) + "..."
                        : script
                      : "Paste script or click for samples..."}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleExpand()
                  }}
                  className="btn-play-trigger"
                  aria-label="Expand script input"
                  title="Expand input"
                >
                  <Play className="w-3.5 h-3.5 fill-white text-white translate-x-0.5" />
                </button>
              </div>

              {/* ── 2. EXPANDED PANEL (Staggered Progressive Reveal) ── */}
              <div className="expanded-panel">
                {/* Header & Presets */}
                <div className="morph-header-bar pb-3 border-b border-border">
                  <div className="flex items-center gap-2 select-none">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span className="dm-label text-muted-foreground">Input Script</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {SAMPLE_PRESETS.map((preset, idx) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={(e) => handlePresetSelect(idx, e)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          selectedPresetIndex === idx
                            ? "bg-primary text-white shadow-sm font-semibold"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border"
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editor Frame */}
                <div className="morph-editor-frame">
                  <textarea
                    ref={textareaRef}
                    placeholder="Describe your video or paste script here..."
                    value={script}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                  />
                </div>

                {/* Footer Bar: Stats + Action */}
                <div className="morph-footer-bar pt-2 border-t border-border">
                  {/* Dot-matrix stats */}
                  <div className="flex items-center gap-2.5 text-muted-foreground select-none">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span className="dm-digit" style={{ fontSize: "0.8rem" }}>{estSpeakingTime}</span>
                    </div>
                    <span className="opacity-30 text-xs">•</span>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="dm-digit" style={{ fontSize: "0.8rem" }}>{wordCount}</span>
                      <span className="text-[11px] opacity-60">words</span>
                    </div>
                    <span className="opacity-30 text-xs">•</span>
                    <span className="dm-digit" style={{ fontSize: "0.8rem" }}>{script.length}</span>
                    <span className="text-[11px] opacity-60">chars</span>
                  </div>

                  {/* Generate Button */}
                  <Button
                    type="button"
                    onClick={handleGenerate}
                    disabled={script.trim().length === 0}
                    className={`h-10 px-6 rounded-full tracking-wide transition-all shadow-md ${
                      script.trim().length > 0
                        ? "bg-primary hover:bg-primary/90 text-white shadow-primary/25 cursor-pointer"
                        : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                    <span className="dm-label" style={{ fontSize: "0.68rem" }}>Generate Metadata</span>
                    <span className="ml-2 text-[10px] opacity-70 font-mono hidden sm:inline">(⌘ + ↵)</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. LOADING STAGE */}
      {appState === "loading" && (
        <div className="w-full max-w-3xl">
          <LoadingMatrix
            scriptSnippet={script}
            streamTokens={streamTokens}
            streamProgressPercent={streamProgressPercent}
            streamTags={streamTags}
            error={streamError}
            onRetry={onRetry}
            onCancel={onReset}
          />
        </div>
      )}

      {/* 3. STUDIO RESULTS STAGE */}
      {appState === "output" && result && (
        <div className="w-full h-full min-h-0 flex flex-col">
          <OutputGrid result={result} sourceScript={script} onReset={onReset} />
        </div>
      )}
    </div>
  )
}
