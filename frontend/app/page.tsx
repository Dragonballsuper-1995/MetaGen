"use client";

import { useState, useCallback, useEffect } from "react";
import { LayoutGroup, AnimatePresence, motion } from "framer-motion";
import { HistorySidebar } from "@/components/metagen/history-sidebar";
import { MorphingContainer } from "@/components/metagen/morphing-container";
import { Header } from "@/components/metagen/header";
import { useGenerate } from "@/hooks/useGenerate";
import { useStreamGenerate } from "@/hooks/useStreamGenerate";
import { useWarmupAndDepsHealth } from "@/hooks/useWarmupAndDepsHealth";
import type { GenerationMode, MetadataResult, ModelChoice } from "@/lib/types";

export type AppState = "input" | "loading" | "output";

export interface GenerationResult extends MetadataResult {
  latency: number;
  model: string;
  timestamp: Date;
  inputScript: string;
}

export interface HistoryItem extends GenerationResult {
  id: string;
}

export default function MetaGenPage() {
  const [inputScript, setInputScript] = useState("");
  const [mode, setMode] = useState<GenerationMode>("stream");
  const [selectedModel, setSelectedModel] = useState<ModelChoice>("auto");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isStatusHovered, setIsStatusHovered] = useState(false);

  const streamGen = useStreamGenerate();
  const pollGen = useGenerate({
    onPollUnavailable: (inputText) => {
      setMode("stream");
      streamGen.generate(inputText, selectedModel);
    },
  });

  const { pollReady, warmupBadge } = useWarmupAndDepsHealth(mode);
  const gen = mode === "poll" ? pollGen : streamGen;

  // Determine UI state from hook status
  const getAppState = (): AppState => {
    if (gen.status === "idle" || gen.status === "error") return "input";
    if (gen.status === "loading" || gen.status === "streaming") return "loading";
    if (gen.status === "completed") return "output";
    return "input";
  };

  const state = getAppState();

  const handleGenerate = useCallback(async (script: string, overrideModel?: ModelChoice) => {
    const targetModel = overrideModel || selectedModel;
    if (overrideModel && overrideModel !== selectedModel) {
      setSelectedModel(overrideModel);
    }
    setInputScript(script);
    if (mode === "poll") {
      pollGen.generate(script, targetModel);
    } else {
      streamGen.generate(script, targetModel);
    }
  }, [mode, selectedModel, pollGen, streamGen]);

  // Resolve model name display
  const resolveModelName = useCallback((explicitModel?: string): string => {
    if (explicitModel && explicitModel.trim()) return explicitModel;
    if (selectedModel === "groq") return "OpenAI GPT-OSS 120B (Groq)";
    if (selectedModel === "mistral") return "Mistral 7B (Custom HF)";
    return "OpenAI GPT-OSS 120B (Groq)";
  }, [selectedModel]);

  // Sync result to history when completed
  useEffect(() => {
    if (gen.status === "completed" && gen.result) {
      const historyItem: HistoryItem = {
        ...gen.result,
        latency: gen.generationTime ? parseFloat(gen.generationTime.toFixed(2)) : 0,
        model: resolveModelName(gen.result.model),
        timestamp: new Date(),
        inputScript: inputScript,
        id: crypto.randomUUID(),
      };
      
      setHistory((prev) => {
        // Avoid duplicate history entries for the same generation
        if (prev.length > 0 && prev[0].inputScript === inputScript && prev[0].title === gen.result?.title) {
          return prev;
        }
        return [historyItem, ...prev].slice(0, 20);
      });
    }
  }, [gen.status, gen.result, gen.generationTime, inputScript, resolveModelName]);

  const handleRegenerate = useCallback(() => {
    if (inputScript) {
      handleGenerate(inputScript);
    }
  }, [inputScript, handleGenerate]);

  const handleReset = useCallback(() => {
    pollGen.reset();
    streamGen.reset();
    setInputScript("");
  }, [pollGen, streamGen]);

  const handleHistorySelect = useCallback((item: HistoryItem) => {
    const restoreData = {
      title: item.title,
      description: item.description,
      tags: item.tags,
      seo_score: item.seo_score,
      seo_breakdown: item.seo_breakdown,
      model: item.model,
    };

    if (mode === "poll") {
      pollGen.restore({
        ...restoreData,
        id: "restored",
        script: item.inputScript,
      });
    } else {
      streamGen.restore({
        ...restoreData,
        id: "restored",
        script: item.inputScript,
      });
    }
    setInputScript(item.inputScript);
    setIsHistoryOpen(false);
  }, [mode, pollGen, streamGen]);

  // Prepare result for UI
  const uiResult: GenerationResult | null = gen.result ? {
    ...gen.result,
    latency: gen.generationTime ? parseFloat(gen.generationTime.toFixed(2)) : 0,
    model: resolveModelName(gen.result.model),
    timestamp: new Date(),
    inputScript: inputScript,
  } : null;

  return (
    <div className="h-screen relative flex flex-col bg-background overflow-hidden selection:bg-primary/20">
      <Header onHistoryToggle={() => setIsHistoryOpen(true)} />

      {/* Premium Ambient background effects - OPTIMIZED for LCP */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-grid-white dark:bg-grid-white/[0.03] bg-grid-black/[0.01]" />
        
        {/* Static Optimized Radial Gradients instead of animating massive blurs */}
        <div
          className={`absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[80px] dark:bg-primary/10 transition-opacity duration-1000 ${state === 'loading' ? 'opacity-50' : 'opacity-20'}`}
          style={{ willChange: 'opacity' }}
        />
        <div
          className={`absolute top-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-accent/20 blur-[80px] dark:bg-accent/10 transition-opacity duration-1000 ${state === 'loading' ? 'opacity-40' : 'opacity-15'}`}
          style={{ willChange: 'opacity' }}
        />
      </div>

      {/* Redesigned Bottom-Left Model & Runtime Status Widget with Hover Card */}
      <div 
        className="fixed bottom-6 left-6 z-50 pointer-events-auto"
        onMouseEnter={() => setIsStatusHovered(true)}
        onMouseLeave={() => setIsStatusHovered(false)}
      >
        <div className="relative">
          {/* Main Status Pill */}
          <div 
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card/80 backdrop-blur-xl border border-border/70 shadow-lg text-foreground cursor-pointer hover:border-primary/40 hover:bg-card transition-all duration-300 select-none"
          >
            <div className="relative flex items-center justify-center">
              <span className={`w-2 h-2 rounded-full ${
                warmupBadge.tone.includes("emerald") || warmupBadge.tone.includes("green")
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"
                  : warmupBadge.tone.includes("yellow") || warmupBadge.tone.includes("amber")
                  ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]"
                  : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]"
              } animate-pulse`} />
            </div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground/90">
              {warmupBadge.text}
            </span>
            {mode === "poll" && !pollReady && (
              <span className="text-[10px] text-rose-500 font-bold uppercase">Poll Offline</span>
            )}
          </div>

          {/* Expanded Detail Popover on Hover */}
          <AnimatePresence>
            {isStatusHovered && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute bottom-full left-0 mb-2.5 w-72 rounded-2xl bg-card/95 backdrop-blur-2xl border border-border/80 p-3.5 shadow-2xl flex flex-col gap-2.5 z-50 text-foreground"
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                    <span className="text-xs font-bold text-foreground">Runtime Diagnostics</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    SSE Active
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Inference Mode:</span>
                    <span className="font-semibold text-foreground">{mode === "stream" ? "SSE Stream" : "Celery Poll"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Active Engine:</span>
                    <span className="font-semibold text-primary">
                      {selectedModel === "groq" ? "Groq 120B" : selectedModel === "mistral" ? "Mistral 7B (HF)" : "Auto Hybrid"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Model Status:</span>
                    <span className="font-semibold text-emerald-500">{warmupBadge.text}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Keep-Warm Heartbeat:</span>
                    <span className="font-semibold text-foreground/90">Enabled (Zero Cold-Start)</span>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-border/40 text-[9px] text-muted-foreground leading-tight">
                  Dual-path inference engine with automated cloud-to-local fallback and streaming tokens.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <main className="relative z-10 flex-1 px-4 md:px-8 pt-20 pb-6 flex flex-col max-w-7xl mx-auto w-full overflow-hidden">
        <div className="flex-1 flex flex-col justify-center min-h-0">
          <LayoutGroup>
            <MorphingContainer
              state={state}
              inputScript={inputScript}
              result={uiResult}
              error={gen.error}
              onGenerate={handleGenerate}
              onRegenerate={handleRegenerate}
              onReset={handleReset}
              onInputChange={setInputScript}
              streamTokens={mode === "stream" ? streamGen.tokens : ""}
              streamTags={mode === "stream" ? streamGen.earlyTags : null}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          </LayoutGroup>
        </div>
      </main>

      <AnimatePresence>
        {isHistoryOpen && (
          <HistorySidebar
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            history={history}
            onSelect={handleHistorySelect}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

