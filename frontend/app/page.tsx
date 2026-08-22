"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/metagen/header"
import { TerminalCore, AppState } from "@/components/metagen/terminal-core"
import { HistorySidebar } from "@/components/metagen/history-sidebar"
import { DotGridCanvas } from "@/components/metagen/dot-grid-canvas"
import { TelemetryRibbon } from "@/components/metagen/telemetry-ribbon"
import { MetadataResult, HistoryItem, ModelChoice } from "@/lib/types"
import { useHistory } from "@/hooks/use-history"
import { useStreamGenerate } from "@/hooks/useStreamGenerate"

export default function Page() {
  const [selectedModel, setSelectedModel] = useState<ModelChoice>("auto")
  const [appState, setAppState] = useState<AppState>("input")
  const [result, setResult] = useState<MetadataResult | undefined>()
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [currentScript, setCurrentScript] = useState("")

  const { history, addToHistory, clearHistory } = useHistory()
  const stream = useStreamGenerate()
  const processedResultRef = useRef<MetadataResult | null>(null)

  // Transition to output once real streaming completes successfully (guarded against re-renders)
  useEffect(() => {
    if (
      stream.status === "completed" &&
      stream.result &&
      processedResultRef.current !== stream.result
    ) {
      processedResultRef.current = stream.result
      setResult(stream.result)
      addToHistory(stream.result, currentScript)
      setAppState("output")
    }
  }, [stream.status, stream.result, currentScript, addToHistory])

  const handleInitiateSequence = (script: string) => {
    processedResultRef.current = null
    setCurrentScript(script)
    setAppState("loading")
    setResult(undefined)
    stream.generate(script, selectedModel)
  }

  const handleRetry = () => {
    if (currentScript.trim()) {
      processedResultRef.current = null
      stream.generate(currentScript, selectedModel)
    }
  }

  const handleReset = () => {
    processedResultRef.current = null
    stream.reset()
    setAppState("input")
    setResult(undefined)
  }

  const handleHistorySelect = (item: HistoryItem) => {
    processedResultRef.current = item
    stream.restore(item)
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
    <div className="h-screen max-h-screen relative flex flex-col overflow-hidden selection:bg-primary/25">
      {/* Ambient Dot Grid Canvas */}
      <DotGridCanvas />

      {/* Control Deck Header (Fixed top) */}
      <Header
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onHistoryToggle={() => setIsHistoryOpen(true)}
      />

      {/* Main Terminal / Studio Stage */}
      <main
        className={`relative z-10 flex-1 w-full px-3 sm:px-6 md:px-8 min-h-0 flex flex-col items-center overflow-y-auto ${
          appState === "output" ? "justify-start pt-2.5 pb-24" : "justify-center py-4 pb-20"
        }`}
      >
        <TerminalCore
          appState={appState}
          onInitiateSequence={handleInitiateSequence}
          result={result}
          onReset={handleReset}
          onScriptChange={setCurrentScript}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          streamTokens={stream.tokens}
          streamProgressPercent={stream.streamProgressPercent}
          streamTags={stream.earlyTags}
          streamError={stream.error}
          onRetry={handleRetry}
        />
      </main>

      {/* Live Bottom Telemetry Marquee Ribbon (Fixed bottom) */}
      <TelemetryRibbon
        selectedModel={selectedModel}
        status={appState === "loading" ? "loading" : appState === "output" ? "output" : "idle"}
        tokenCount={tokenCount}
        byteCount={byteCount}
        seoScore={result?.seo_score ?? 97}
        telemetry={result?.telemetry}
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
