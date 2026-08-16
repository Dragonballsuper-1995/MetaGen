"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { TapeDeck } from "@/components/metagen/tape-deck"
import { LedVuMeter } from "@/components/ui/led-vu-meter"
import { DymoBadge } from "@/components/ui/dymo-badge"
import { sound } from "@/lib/audio-engine"

interface GlyphMatrixProps {
  modelName?: string
}

export function GlyphMatrix({ modelName = "GROQ-120B LPU" }: GlyphMatrixProps) {
  const [step, setStep] = React.useState(0)
  const [scrambleText, setScrambleText] = React.useState("INITIALIZING NEURAL CLUSTER...")
  const [elapsed, setElapsed] = React.useState(0)

  // Timer counter
  React.useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => +(prev + 0.1).toFixed(1))
    }, 100)
    return () => clearInterval(timer)
  }, [])

  // Step sequencer
  React.useEffect(() => {
    const sequence = [
      { t: 400, s: 1, text: "EXTRACTING KEYWORDS & SEMANTIC ENTITIES..." },
      { t: 1200, s: 2, text: "SYNTHESIZING RETENTION-MAXIMIZED TITLES..." },
      { t: 2000, s: 3, text: "ENCODING MULTI-TRACK METADATA PAYLOAD..." },
    ]

    const timers = sequence.map((item) =>
      setTimeout(() => {
        setStep(item.s)
        setScrambleText(item.text)
        sound.playRatchet(1400 + item.s * 300)
      }, item.t)
    )

    return () => timers.forEach(clearTimeout)
  }, [])

  const PIPELINE_STEPS = [
    { id: "01", label: "INGESTION & SCRIPT TOKENIZATION", desc: "PARSING RAW UTF-8 BUFFER" },
    { id: "02", label: "HIGH-SPEED LPU INFERENCE ENGINE", desc: `DISPATCHING TO ${modelName}` },
    { id: "03", label: "SEO METRICS & MULTI-TRACK ENCODING", desc: "CALCULATING RETENTION SCORES" },
  ]

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 font-mono">
      {/* Main Processing Chassis */}
      <div className="chassis-faceplate p-6 relative">
        {/* Corner Rivets */}
        <div className="absolute top-2.5 left-2.5 screw-rivet" />
        <div className="absolute top-2.5 right-2.5 screw-rivet" />
        <div className="absolute bottom-2.5 left-2.5 screw-rivet" />
        <div className="absolute bottom-2.5 right-2.5 screw-rivet" />

        {/* Top Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <DymoBadge variant="orange">SYNTHESIS MATRIX // ACTIVE</DymoBadge>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
              LPU INFERENCE IN PROGRESS
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-doto font-bold text-foreground">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B00] shadow-[0_0_8px_#FF3B00] animate-ping" />
            <span>RECORDING // {elapsed.toFixed(1)}s</span>
          </div>
        </div>

        {/* High-Speed Tape Deck */}
        <TapeDeck isPlaying={true} tapeProgress={0.65} label="HIGH-SPEED SPOOL // BUFFER INGESTION" />

        {/* The Nothing OS Glyph / Dot-Matrix Display Screen */}
        <div className="mt-6 p-6 lcd-screen relative flex flex-col gap-6 overflow-hidden">
          {/* LCD Scanline effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

          {/* Primary Scramble Display */}
          <div className="flex flex-col gap-2 relative z-10">
            <div className="flex items-center justify-between text-[9px] text-[#00FF66]/70 uppercase tracking-widest">
              <span>&gt; LPU_STREAM_01</span>
              <span>BUFFER STATUS: 100%</span>
            </div>

            <div className="font-doto font-black text-lg md:text-2xl text-[#00FF66] tracking-wider py-2">
              {scrambleText}
            </div>
          </div>

          {/* Stepped Pipeline Sequence */}
          <div className="flex flex-col gap-3 pt-4 border-t border-[#222B24] relative z-10">
            {PIPELINE_STEPS.map((p, idx) => {
              const isDone = step > idx
              const isCurrent = step === idx

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 border transition-colors ${
                    isDone
                      ? "border-[#00FF66]/40 bg-[#00FF66]/10 text-[#00FF66]"
                      : isCurrent
                      ? "border-[#FF3B00] bg-[#FF3B00]/10 text-foreground"
                      : "border-border/40 text-muted-foreground/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-doto font-bold text-xs">[{p.id}]</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs uppercase tracking-wider">{p.label}</span>
                      <span className="text-[9px] opacity-70 tracking-tighter">{p.desc}</span>
                    </div>
                  </div>

                  <div className="font-doto font-bold text-[10px]">
                    {isDone ? "[ COMPLETE ]" : isCurrent ? "[ PROCESSING... ]" : "[ QUEUED ]"}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Real-time Oscilloscope / VU Waveform */}
          <div className="pt-2">
            <LedVuMeter level={0.92} segments={24} label="NEURAL CLUSTER BANDWIDTH" />
          </div>
        </div>

      </div>
    </div>
  )
}
