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
  Globe,
  Bot,
  ChevronDown,
  Check,
} from "lucide-react"
import { MetadataResult, ModelChoice } from "@/lib/types"

const CUSTOM_MODELS = [
  {
    id: "local-auto",
    name: "Auto (Local GGUF)",
    shortName: "Auto",
    badge: "Auto",
    desc: "Auto-detects fastest on-disk model",
    icon: Sparkles,
    color: "text-amber-400",
  },
  {
    id: "qwen-2.5-1.5b",
    name: "Qwen 2.5 1.5B",
    shortName: "Qwen 2.5 1.5B",
    badge: "~35 tok/s",
    desc: "Ultra-fast fine-tuned SLM (1.05 GB)",
    icon: Bot,
    color: "text-cyan-300",
  },
  {
    id: "llama-3.2-1b",
    name: "Llama 3.2",
    shortName: "Llama 3.2",
    badge: "~40 tok/s",
    desc: "Ultra-lightweight hook generator (750 MB)",
    icon: Cpu,
    color: "text-indigo-400",
  },
  {
    id: "phi-4-mini",
    name: "Phi-4 Mini",
    shortName: "Phi-4 Mini",
    badge: "CPU Fast",
    desc: "Microsoft lightweight fine-tune (2.4 GB)",
    icon: Zap,
    color: "text-emerald-400",
  },
  {
    id: "qwen-2.5-7b",
    name: "Qwen 2.5 7B",
    shortName: "Qwen 2.5 7B",
    badge: "High Accuracy",
    desc: "Fine-tuned for structured tags (4.4 GB)",
    icon: Bot,
    color: "text-cyan-400",
  },
  {
    id: "llama-3.1-8b",
    name: "Llama 3.1",
    shortName: "Llama 3.1",
    badge: "High CTR",
    desc: "Fine-tuned for hook retention (4.6 GB)",
    icon: Cpu,
    color: "text-blue-400",
  },
  {
    id: "mistral",
    name: "Mistral",
    shortName: "Mistral",
    badge: "Primary",
    desc: "Custom fine-tuned SEO model (4.1 GB)",
    icon: Cpu,
    color: "text-orange-400",
  },
]

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
    text:
      "Welcome back, everyone! In today's video, we are reviewing the newest flagship smartphone to hit the market. We're testing battery life, camera performance, low-light video capabilities, and gaming benchmarks. If you're deciding whether to upgrade this year, you've come to the right place!",
  },
  {
    name: "Tutorial & Tips",
    text:
      "Hey developers! In this step-by-step tutorial, we're building a full-stack Next.js application integrated with FastAPI and Docker. We'll cover environment setup, state management, asynchronous queue workers with Celery and Redis, and deploying everything live to production with zero downtime.",
  },
  {
    name: "Story & Vlog",
    text:
      "What is up, guys! Today, we are taking you behind the scenes of our 48-hour journey through Tokyo, Japan. From finding the most incredible hidden street food spots to exploring futuristic digital art museums, this trip pushed us way outside our comfort zone. Drop a comment with your favorite travel destination!",
  },
]

export function TerminalCore({
  appState,
  onInitiateSequence,
  result,
  onReset,
  onScriptChange,
  selectedModel = "auto",
  onModelChange,
  streamTokens = "",
  streamProgressPercent = 0,
  streamTags = null,
  streamError = null,
  onRetry,
}: TerminalCoreProps) {
  const [script, setScript] = React.useState("")
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [selectedPresetIndex, setSelectedPresetIndex] = React.useState<number | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const [isCustomDropdownOpen, setIsCustomDropdownOpen] = React.useState(false)
  const customDropdownRef = React.useRef<HTMLDivElement>(null)

  const activeCustomModel = React.useMemo(() => {
    return CUSTOM_MODELS.find((m) => m.id === selectedModel)
  }, [selectedModel])

  // Click-outside and Escape key listener for custom models dropdown
  React.useEffect(() => {
    if (!isCustomDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        customDropdownRef.current &&
        !customDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCustomDropdownOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCustomDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isCustomDropdownOpen])

  const wordCount = React.useMemo(() => {
    return script.trim().split(/\s+/).filter(Boolean).length
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
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center py-2 my-auto">
      {/* 1. INPUT STAGE */}
      {appState === "input" && (
        <div className="w-full max-w-4xl flex flex-col items-center text-center gap-3 sm:gap-5 my-auto">
          {/* Hero Headline */}
          <div className="flex flex-col items-center gap-2">
            {/* Model Selector Pill */}
            {/* Single Bigger Pill Incorporating Auto & Custom */}
            {onModelChange && (
              <div
                ref={customDropdownRef}
                className="relative inline-flex items-center p-1 sm:p-1.5 bg-surface/95 dark:bg-zinc-900/90 backdrop-blur-md border border-border/80 dark:border-white/10 rounded-full shadow-md gap-1 sm:gap-1.5 select-none z-30 transition-all"
              >
                {/* 1. Auto Pill */}
                <button
                  type="button"
                  onClick={() => {
                    onModelChange("auto")
                    setIsCustomDropdownOpen(false)
                  }}
                  className={`flex items-center justify-center gap-1.5 px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    selectedModel === "auto"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                  title="Automatic multi-tier failover: Groq -> Gemini -> Zen -> OpenRouter -> Local"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto</span>
                </button>

                {/* 2. Custom Pill (Adaptive width based on active text) */}
                <button
                  type="button"
                  onClick={() => setIsCustomDropdownOpen((prev) => !prev)}
                  aria-expanded={isCustomDropdownOpen}
                  className={`flex items-center gap-1.5 px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    selectedModel !== "auto"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                  title="Select custom fine-tuned GGUF models"
                >
                  {activeCustomModel ? (
                    React.createElement(activeCustomModel.icon, {
                      className: `w-3.5 h-3.5 flex-shrink-0 ${selectedModel !== "auto" ? "text-white" : activeCustomModel.color}`,
                    })
                  ) : (
                    <Cpu className="w-3.5 h-3.5 flex-shrink-0" />
                  )}
                  <span>
                    {activeCustomModel ? activeCustomModel.shortName : "Custom"}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${
                      isCustomDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Custom GGUF Models Dropdown Popover */}
                {isCustomDropdownOpen && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 sm:w-80 p-2 rounded-2xl bg-surface/98 dark:bg-zinc-900/98 backdrop-blur-xl border border-border shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1 text-left select-none">
                    <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/70 mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[11px] font-bold text-foreground uppercase tracking-wider font-mono">
                          Custom GGUF Models
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        Local Engine
                      </span>
                    </div>

                    <div
                      data-testid="custom-models-list"
                      className="flex flex-col gap-0.5 max-h-[190px] sm:max-h-[220px] overflow-y-auto pb-2 pr-1 custom-scrollbar"
                    >
                      {CUSTOM_MODELS.map((m, idx) => {
                        const Icon = m.icon
                        const isSelected = selectedModel === m.id
                        return (
                          <React.Fragment key={m.id}>
                            {idx === 1 && <div className="my-1 border-t border-border/50" />}
                            <button
                              type="button"
                              onClick={() => {
                                onModelChange(m.id)
                                setIsCustomDropdownOpen(false)
                              }}
                              className={`flex items-center justify-between p-1.5 sm:p-2 rounded-xl text-xs transition-colors cursor-pointer w-full text-left ${
                                isSelected
                                  ? "bg-primary/10 border border-primary/30 text-foreground"
                                  : "hover:bg-muted/70 text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`p-1.5 rounded-lg flex-shrink-0 ${isSelected ? "bg-primary text-white" : "bg-muted"}`}>
                                  <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : m.color}`} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-xs text-foreground truncate">{m.name}</span>
                                    <span className="text-[9px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                      {m.badge}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground truncate">{m.desc}</span>
                                </div>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 ml-1.5" />}
                            </button>
                          </React.Fragment>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight leading-[1.1] text-foreground">
              Elevate Your <br />
              <span className="text-gradient-blue">Video Metadata</span>
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-0.5 sm:mt-1">
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
                    id="script-input"
                    name="script_content"
                    aria-label="Video script or description"
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
        <div className="w-full max-w-3xl my-auto">
          <LoadingMatrix
            scriptSnippet={script}
            streamTokens={streamTokens}
            streamProgressPercent={streamProgressPercent}
            streamTags={streamTags}
            error={streamError}
            onRetry={onRetry}
            onCancel={onReset}
            modelChoice={selectedModel}
          />
        </div>
      )}

      {/* 3. STUDIO RESULTS STAGE */}
      {appState === "output" && result && (
        <div className="w-full flex-1 min-h-0 flex flex-col justify-start">
          <OutputGrid result={result} sourceScript={script} onReset={onReset} />
        </div>
      )}
    </div>
  )
}
