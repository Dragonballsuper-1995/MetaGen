"use client"

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/panel"
import { TelemetryBar } from "@/components/metagen/telemetry-bar"
import { Zap } from "lucide-react"

export type AppState = "input" | "loading" | "output"

interface TerminalCoreProps {
  appState: AppState
  onInitiateSequence: (script: string) => void
}

export function TerminalCore({ appState, onInitiateSequence }: TerminalCoreProps) {
  const [script, setScript] = React.useState("")

  const handleGenerate = () => {
    if (script.trim().length === 0) return
    onInitiateSequence(script)
  }

  const SAMPLE_SCRIPT = "Welcome back to the channel! Today we're diving deep into the architecture of neural networks and how they're revolutionizing the way we build software. We'll explore Transformers, Attention Mechanisms, and how LLMs process natural language."

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 w-full mt-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-mono tracking-widest uppercase text-foreground">
          Metadata Synthesis
        </h1>
        {appState === "input" && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setScript(SAMPLE_SCRIPT)}
          >
            &gt; INJECT_SAMPLE
          </Button>
        )}
      </div>

      <Panel className="p-1 bg-muted/20 relative">
        {/* State Machine Switcher */}
        {appState === "input" && (
          <div className="flex flex-col gap-4 p-4">
            <Textarea 
              placeholder="> PASTE RAW SCRIPT DATA HERE..."
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="min-h-[250px] text-base leading-relaxed bg-background/95"
            />
            
            <div className="flex items-center justify-between">
              <TelemetryBar scriptLength={script.length} />
              
              <Button 
                onClick={handleGenerate} 
                disabled={script.trim().length === 0}
                className="w-48"
              >
                <Zap className="w-4 h-4 mr-2" />
                INITIATE SEQUENCE
              </Button>
            </div>
          </div>
        )}

        {appState === "loading" && (
          <div className="p-8 font-mono text-primary animate-pulse">
            &gt; INITIALIZING SYNTHESIS MATRIX...
            {/* Phase 4 will replace this with LoadingMatrix */}
          </div>
        )}

        {appState === "output" && (
          <div className="p-8 font-mono text-success">
            &gt; SYNTHESIS COMPLETE.
            {/* Phase 4 will replace this with OutputGrid */}
          </div>
        )}
      </Panel>
    </div>
  )
}
