"use client"

import * as React from "react"
import { TapeDeck } from "@/components/metagen/tape-deck"
import { LedVuMeter } from "@/components/ui/led-vu-meter"
import { RotaryKnob } from "@/components/ui/rotary-knob"
import { HardwareButton } from "@/components/ui/hardware-button"
import { DymoBadge } from "@/components/ui/dymo-badge"
import { sound } from "@/lib/audio-engine"
import { Zap, Play, FileText, Sparkles, AlertCircle, CornerDownLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SynthesisParams {
  creativity: number // 0 to 1
  seoIntensity: number // 0 to 1
  lengthMode: number // 0 to 1
}

interface HardwareWorkspaceProps {
  onInitiateSequence: (script: string, params: SynthesisParams) => void
  isGenerating?: boolean
}

export function HardwareWorkspace({
  onInitiateSequence,
  isGenerating = false,
}: HardwareWorkspaceProps) {
  const [script, setScript] = React.useState("")
  const [params, setParams] = React.useState<SynthesisParams>({
    creativity: 0.7,
    seoIntensity: 0.8,
    lengthMode: 0.5,
  })

  // Tape Progress calculated based on text length (max 4000 chars)
  const tapeProgress = Math.min(1, Math.max(0.08, script.length / 3000))
  // VU Meter level based on recent typing / length
  const vuLevel = isGenerating ? 0.95 : Math.min(1, 0.15 + (script.length % 200) / 200 * 0.75)

  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setScript(e.target.value)
    // Audio tick on typing every 5 characters
    if (e.target.value.length % 4 === 0) {
      sound.playClick(1200 + (e.target.value.length % 40) * 10)
    }
  }

  const SAMPLE_SCRIPTS = [
    {
      title: "TECH / AI VIDEO ESSAY",
      body: "Welcome back! Today we are doing a complete architectural breakdown of the new reasoning models and how LPU hardware is fundamentally shifting inference economics. We will explore transformers, token latency, and benchmarks.",
    },
    {
      title: "CODING / DEV TUTORIAL",
      body: "In this full project build, we are creating a full-stack Next.js 16 application with Tailwind v4, Framer Motion, and Web Audio API from absolute scratch. Grab your coffee and let's jump straight into the terminal.",
    },
    {
      title: "FINANCE / MARKET DEEP DIVE",
      body: "Why are microchip supply chains suddenly tightening again? In this video, we analyze semiconductor manufacturing, global logistics, market demand cycles, and what it means for tech investors over the next 18 months.",
    },
  ]

  const injectSample = (sampleText: string) => {
    sound.playRelaySnap()
    setScript(sampleText)
  }

  const handleTrigger = () => {
    if (script.trim().length === 0 || isGenerating) return
    onInitiateSequence(script, params)
  }

  // Label formatting for Rotary Knobs
  const getCreativityLabel = (val: number) => {
    if (val < 0.35) return "0.3 (STRICT)"
    if (val < 0.75) return "0.7 (OPTIMAL)"
    return "1.0 (CHAOTIC)"
  }

  const getSeoLabel = (val: number) => {
    if (val < 0.35) return "CONSERVATIVE"
    if (val < 0.75) return "BALANCED"
    return "VIRAL HOOK"
  }

  const getLengthLabel = (val: number) => {
    if (val < 0.35) return "COMPACT"
    if (val < 0.75) return "STANDARD"
    return "DETAILED"
  }

  const lineCount = script ? script.split("\n").length : 1
  const lineNumbers = Array.from({ length: Math.max(12, lineCount) }, (_, i) => i + 1)

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 font-mono">
      {/* Master Chassis Rack Frame */}
      <div className="chassis-faceplate p-4 md:p-6 relative">
        {/* Four Corner Hex Fastener Rivets */}
        <div className="absolute top-2.5 left-2.5 screw-rivet" />
        <div className="absolute top-2.5 right-2.5 screw-rivet" />
        <div className="absolute bottom-2.5 left-2.5 screw-rivet" />
        <div className="absolute bottom-2.5 right-2.5 screw-rivet" />

        {/* Rack Header Label Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-border pb-4 mb-5">
          <div className="flex items-center gap-3">
            <DymoBadge variant="black">RACK-01 // INGESTION DECK</DymoBadge>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest hidden sm:inline-block">
              ANALOG TO DIGITAL BUFFER
            </span>
          </div>

          {/* Quick-Load Sample Selector Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground mr-1 hidden md:inline">
              PRESET TAPES:
            </span>
            {SAMPLE_SCRIPTS.map((sample, idx) => (
              <HardwareButton
                key={idx}
                size="sm"
                variant="subtle"
                onClick={() => injectSample(sample.body)}
                className="text-[9px] h-7 px-2"
              >
                TAPE-0{idx + 1}
              </HardwareButton>
            ))}
          </div>
        </div>

        {/* Main Grid: Left Tape & Script Editor | Right Hardware Parameter Bay */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Bay (8 Cols): Tape Visualizer + Monospace Editor */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            
            {/* Top Tape Deck Module */}
            <TapeDeck
              isPlaying={isGenerating}
              tapeProgress={tapeProgress}
              label="INPUT SCRIPT // REEL-01"
            />

            {/* Script Ingestion Terminal with Line Numbers */}
            <div className="chassis-inset relative flex flex-col">
              {/* Terminal Title Bar */}
              <div className="bg-chassis px-3 py-1.5 border-b border-border/80 flex items-center justify-between text-[9px] text-muted-foreground uppercase tracking-widest">
                <span className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-primary" />
                  RAW SCRIPT INGESTION BUFFER
                </span>
                <span className="font-doto text-foreground font-bold">
                  {script.length} CHARS // {Math.ceil(script.length / 4)} TOKENS (EST)
                </span>
              </div>

              {/* Editor Workspace */}
              <div className="flex min-h-[260px] bg-background/95 relative overflow-hidden">
                {/* Line Numbers Track */}
                <div className="w-10 py-3 bg-chassis-inset border-r border-border/60 select-none text-right pr-2.5 text-[10px] font-mono text-muted-foreground/50 leading-relaxed">
                  {lineNumbers.map((n) => (
                    <div key={n}>{n.toString().padStart(2, "0")}</div>
                  ))}
                </div>

                {/* Textarea Area */}
                <textarea
                  value={script}
                  onChange={handleScriptChange}
                  placeholder="> PASTE RAW VIDEO SCRIPT, TRANSCRIPT, OR BULLET POINTS HERE..."
                  className="flex-1 bg-transparent px-3 py-3 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none selection:bg-orange-500/30 selection:text-orange-200"
                  spellCheck={false}
                />
              </div>

              {/* Bottom Ingestion Telemetry Bar */}
              <div className="bg-chassis px-3 py-2 border-t border-border/80 flex flex-wrap items-center justify-between gap-3 text-[9px] font-mono tracking-widest uppercase">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="text-foreground font-bold font-doto">
                    BUFFER: [{Math.round((script.length / 4000) * 100)}%]
                  </span>
                  <span>ENCODING: UTF-8</span>
                  <span className="hidden sm:inline">SAMPLE RATE: 1.0X</span>
                </div>

                {script.length > 0 && (
                  <button
                    onClick={() => {
                      sound.playClick()
                      setScript("")
                    }}
                    className="text-[9px] text-[#FF3B00] hover:underline uppercase font-bold"
                  >
                    [ CLEAR BUFFER ]
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Bay (4 Cols): Synthesizer Parameter Encoders & Master Trigger */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-5 bg-chassis-sub p-4 border-2 border-border relative">
            
            {/* Bay Title */}
            <div className="border-b border-border/80 pb-2 flex items-center justify-between">
              <span className="text-[10px] font-doto font-bold uppercase tracking-widest text-foreground">
                MODULATION BAY
              </span>
              <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
            </div>

            {/* Rotary Encoders (Knobs) Matrix */}
            <div className="grid grid-cols-3 gap-2 py-2 bg-chassis-inset p-3 border border-border/70">
              <RotaryKnob
                label="CREATIVITY"
                value={params.creativity}
                onChange={(val) => setParams((p) => ({ ...p, creativity: val }))}
                displayValue={getCreativityLabel(params.creativity)}
                color="orange"
                size="sm"
              />

              <RotaryKnob
                label="SEO FOCUS"
                value={params.seoIntensity}
                onChange={(val) => setParams((p) => ({ ...p, seoIntensity: val }))}
                displayValue={getSeoLabel(params.seoIntensity)}
                color="yellow"
                size="sm"
              />

              <RotaryKnob
                label="LENGTH"
                value={params.lengthMode}
                onChange={(val) => setParams((p) => ({ ...p, lengthMode: val }))}
                displayValue={getLengthLabel(params.lengthMode)}
                color="green"
                size="sm"
              />
            </div>

            {/* Live Token Oscilloscope / LED Level Meter */}
            <div className="flex flex-col gap-1.5">
              <LedVuMeter
                level={vuLevel}
                segments={14}
                label="INPUT SIGNAL INTENSITY"
              />
            </div>

            {/* Master Trigger Bay (The Iconic Red Button) */}
            <div className="pt-2 flex flex-col gap-2">
              <HardwareButton
                variant="record"
                size="lg"
                onClick={handleTrigger}
                disabled={script.trim().length === 0 || isGenerating}
                hasLed
                ledColor="orange"
                ledActive={isGenerating}
                className="w-full h-14 text-sm font-doto tracking-widest shadow-[4px_4px_0_0_#801A00]"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-white animate-ping" />
                    SYNTHESIZING...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    (●) INITIATE SEQUENCE
                  </span>
                )}
              </HardwareButton>

              <div className="flex items-center justify-between text-[8px] text-muted-foreground uppercase tracking-widest px-1">
                <span>HOTKEY: CTRL+ENTER</span>
                <span>STATUS: {script.length > 0 ? "ARMED" : "STANDBY"}</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
