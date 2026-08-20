"use client"

import { useState } from "react"
import { Header } from "@/components/metagen/header"
import { TerminalCore, AppState } from "@/components/metagen/terminal-core"
import { HistorySidebar } from "@/components/metagen/history-sidebar"
import { DotGridCanvas } from "@/components/metagen/dot-grid-canvas"
import { TelemetryRibbon } from "@/components/metagen/telemetry-ribbon"
import { MetadataResult, HistoryItem, ModelChoice } from "@/lib/types"
import { useHistory } from "@/hooks/use-history"

export default function Page() {
  const [selectedModel, setSelectedModel] = useState<ModelChoice>("auto")
  const [appState, setAppState] = useState<AppState>("input")
  const [result, setResult] = useState<MetadataResult | undefined>()
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [currentScript, setCurrentScript] = useState("")

  const { history, addToHistory, clearHistory } = useHistory()

  const handleInitiateSequence = (script: string) => {
    setCurrentScript(script)
    setAppState("loading")
    setResult(undefined)

    // Simulate generation time (matching LoadingMatrix diagnostic steps)
    setTimeout(() => {
      // Intelligent mock synthesis dynamically adapting to input script content
      const isArchitecture = script.toLowerCase().includes("architect") || script.toLowerCase().includes("skyscraper")
      const isRust = script.toLowerCase().includes("rust") || script.toLowerCase().includes("distribut")
      const isHardware = script.toLowerCase().includes("synth") || script.toLowerCase().includes("hardware")

      let title = "The Future of AI: How Neural Networks are Changing Everything"
      let description = "In this video, we dive deep into the world of Artificial Intelligence and explore how neural networks are reshaping industries.\n\nFrom healthcare to finance, discover the impact of machine learning models and state-of-the-art transformer architectures.\n\nDon't forget to subscribe for more technical deep dives!"
      let tags = ["AI", "Neural Networks", "Machine Learning", "Tech Trends 2026", "Deep Learning", "Transformers", "Software Architecture"]

      if (isArchitecture) {
        title = "Sustainable Skyscrapers Revolution: The Future of Urban Architecture"
        description = "Imagine a future where cities thrive in harmony with nature. Discover how innovative buildings like Singapore's Jewel Changi and Italy's Bosco Verticale are redefining urban landscapes with cutting-edge features like vertical forests and advanced solar harvesting.\n\nThese eco-friendly marvels are not only visually stunning but also significantly reduce environmental impact through closed-loop water systems and sustainable materials."
        tags = ["Sustainable Architecture", "Green Buildings", "Vertical Forests", "Urban Design", "Jewel Changi", "Bosco Verticale", "Future Cities"]
      } else if (isRust) {
        title = "Building a High-Throughput Distributed Cache in Rust (Zero Data Loss)"
        description = "In this masterclass, we construct a high-performance distributed caching cluster from scratch using Rust and Tokio.\n\nWe benchmark memory throughput, analyze p99 latency under heavy concurrent load, and implement a Raft-based consensus protocol to guarantee zero data loss during network partitions."
        tags = ["Rust", "Distributed Systems", "Tokio", "Raft Consensus", "Systems Programming", "Concurrency", "High Performance"]
      } else if (isHardware) {
        title = "Inside a Custom Hardware Synthesizer: Complete PCB & Mechanical Teardown"
        description = "Unboxing and complete engineering teardown of the newest tactile portable synthesizer.\n\nWe analyze the custom aluminum chassis, PCB routing, mechanical rotary encoders, low-noise DAC convertors, and how physical-digital design principles create an unforgettable tactile user experience."
        tags = ["Hardware Teardown", "Synthesizer", "PCB Design", "Industrial Design", "Audio Engineering", "Electronics", "Product Teardown"]
      }

      const generatedResult: MetadataResult = {
        title,
        description,
        tags,
        seo_score: 97,
        seo_breakdown: {
          title: 100,
          description: 98,
          tags: 100,
          keyword_relevance: 96,
          readability: 92,
        },
        model:
          selectedModel === "groq"
            ? "OPENAI GPT-OSS 120B (GROQ)"
            : selectedModel === "mistral"
            ? "MISTRAL 7B (HF)"
            : "AUTO-HYBRID ENGINE",
      }

      setResult(generatedResult)
      addToHistory(generatedResult, script)
      setAppState("output")
    }, 2400)
  }

  const handleReset = () => {
    setAppState("input")
    setResult(undefined)
  }

  const handleHistorySelect = (item: HistoryItem) => {
    setResult(item)
    if (item.script) {
      setCurrentScript(item.script)
    }
    setAppState("output")
    setIsHistoryOpen(false)
  }

  const tokenCount = Math.ceil(currentScript.length / 4)
  const byteCount = new Blob([currentScript]).size

  return (
    <div className="h-screen max-h-screen relative flex flex-col justify-between overflow-hidden selection:bg-primary/25">
      {/* Ambient Dot Grid Canvas */}
      <DotGridCanvas />

      {/* Control Deck Header */}
      <Header
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onHistoryToggle={() => setIsHistoryOpen(true)}
      />

      {/* Main Terminal Stage */}
      <main className={`relative z-10 flex-1 w-full px-4 md:px-8 flex flex-col justify-center ${
        appState === "output" ? "overflow-y-auto py-4" : "overflow-hidden py-1"
      }`}>
        <TerminalCore
          appState={appState}
          onInitiateSequence={handleInitiateSequence}
          result={result}
          onReset={handleReset}
          onScriptChange={setCurrentScript}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </main>


      {/* Live Bottom Telemetry Marquee Ribbon */}
      <TelemetryRibbon
        selectedModel={selectedModel}
        status={appState === "loading" ? "loading" : appState === "output" ? "output" : "idle"}
        tokenCount={tokenCount}
        byteCount={byteCount}
        seoScore={result?.seo_score ?? 97}
      />

      {/* History Drawer */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={handleHistorySelect}
        onClear={clearHistory}
      />
    </div>
  )
}
