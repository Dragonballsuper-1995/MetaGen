"use client"

import * as React from "react"
import { HardwareHeader } from "@/components/metagen/hardware-header"
import { HardwareWorkspace, SynthesisParams } from "@/components/metagen/hardware-workspace"
import { GlyphMatrix } from "@/components/metagen/glyph-matrix"
import { SamplerOutput } from "@/components/metagen/sampler-output"
import { TapeArchive } from "@/components/metagen/tape-archive"
import { useHistory } from "@/hooks/use-history"
import { MetadataResult, HistoryItem, ModelChoice } from "@/lib/types"
import { sound } from "@/lib/audio-engine"

export type MachineState = "ingest" | "synthesizing" | "output"

export default function Page() {
  const [machineState, setMachineState] = React.useState<MachineState>("ingest")
  const [selectedModel, setSelectedModel] = React.useState<ModelChoice>("groq")
  const [result, setResult] = React.useState<MetadataResult | null>(null)
  const [isArchiveOpen, setIsArchiveOpen] = React.useState(false)

  const { history, addToHistory, clearHistory } = useHistory()

  const handleInitiateSequence = (script: string, params: SynthesisParams) => {
    setMachineState("synthesizing")
    setResult(null)

    // Simulate synthesis latency matching GlyphMatrix sequencing
    const latency = selectedModel === "groq" ? 2200 : selectedModel === "mistral" ? 3000 : 2500

    setTimeout(() => {
      // Calculate dynamic scores based on parameters
      const score = Math.min(99, Math.round(90 + params.seoIntensity * 8))
      const modelLabel =
        selectedModel === "groq"
          ? "GROQ LPU 120B (0.2s TTFT)"
          : selectedModel === "mistral"
          ? "MISTRAL 7B (CUSTOM HF)"
          : "AUTO HYBRID ENGINE"

      // Mock synthesis response
      const generatedResult: MetadataResult = {
        title: "How Neural Networks & LPUs Actually Work (Full Hardware Breakdown)",
        description: `Welcome back to the studio! In this deep dive, we break down the fundamental physics and computer architecture behind next-generation AI hardware.\n\nFrom transformer attention matrices to custom silicon inference engines, discover why the industry is rapidly moving toward specialized LPU chips.\n\n00:00 - The Problem with Modern Computing\n03:15 - Transformer Attention in Silicon\n07:45 - LPU vs GPU Architecture\n12:30 - Future of Real-Time AI\n\nDrop a comment below with your thoughts, and subscribe for weekly deep dives into hardware and artificial intelligence!`,
        tags: [
          "Artificial Intelligence",
          "Neural Networks",
          "LPU Architecture",
          "Machine Learning",
          "Silicon Hardware",
          "Next.js 16",
          "Deep Learning",
          "Tech Explained",
        ],
        seo_score: score,
        seo_breakdown: {
          title: 98,
          description: 94,
          tags: 96,
          keyword_relevance: Math.round(92 + params.seoIntensity * 6),
          readability: Math.round(88 + params.lengthMode * 8),
        },
        model: modelLabel,
      }

      setResult(generatedResult)
      addToHistory(generatedResult, script)
      setMachineState("output")
      sound.playSuccessChime()
    }, latency)
  }

  const handleResetToIngest = () => {
    sound.playClick(900)
    setMachineState("ingest")
    setResult(null)
  }

  const handleSelectHistoricalTape = (item: HistoryItem) => {
    setResult(item)
    setMachineState("output")
    setIsArchiveOpen(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground bg-dot-matrix flex flex-col font-mono selection:bg-orange-500/30 selection:text-orange-200">
      {/* Top Hardware Control Faceplate */}
      <HardwareHeader
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onHistoryToggle={() => setIsArchiveOpen(true)}
        historyCount={history.length}
      />

      {/* Main Field Synthesizer Chassis Viewport */}
      <main className="flex-1 w-full px-3 md:px-8 py-6 md:py-10 flex flex-col items-center justify-center">
        {machineState === "ingest" && (
          <HardwareWorkspace
            onInitiateSequence={handleInitiateSequence}
            isGenerating={false}
          />
        )}

        {machineState === "synthesizing" && (
          <GlyphMatrix
            modelName={
              selectedModel === "groq"
                ? "GROQ-120B LPU"
                : selectedModel === "mistral"
                ? "MISTRAL-7B"
                : "AUTO-HYBRID"
            }
          />
        )}

        {machineState === "output" && result && (
          <SamplerOutput
            result={result}
            onReset={handleResetToIngest}
          />
        )}
      </main>

      {/* Cassette Storage Rack Drawer (Neural Cache) */}
      <TapeArchive
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        history={history}
        onSelect={handleSelectHistoricalTape}
        onClear={clearHistory}
      />

      {/* Bottom Technical Chassis Coordinates */}
      <footer className="w-full border-t border-border/80 bg-chassis-sub px-4 py-2 flex flex-wrap items-center justify-between text-[8px] font-mono text-muted-foreground uppercase tracking-widest">
        <div className="flex items-center gap-3">
          <span>METAGEN SPEC 2026 // TE-NOTHING ARCH</span>
          <span>CHASSIS: ANODIZED-AL</span>
        </div>
        <div className="flex items-center gap-3">
          <span>AUDIO ENGINE: WEB-AUDIO V2</span>
          <span>HOTKEYS: [CTRL+ENTER] RECORD [ESC] RESET</span>
        </div>
      </footer>
    </div>
  )
}
