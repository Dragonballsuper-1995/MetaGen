"use client";

import { useState, useCallback, useEffect } from "react";
import { LayoutGroup, AnimatePresence, motion } from "framer-motion";
import { HistorySidebar } from "@/components/metagen/history-sidebar";
import { MorphingContainer } from "@/components/metagen/morphing-container";
import { Header } from "@/components/metagen/header";
import { useGenerate } from "@/hooks/useGenerate";
import { useStreamGenerate } from "@/hooks/useStreamGenerate";
import { useWarmupAndDepsHealth } from "@/hooks/useWarmupAndDepsHealth";
import type { GenerationMode, MetadataResult } from "@/lib/types";

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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const streamGen = useStreamGenerate();
  const pollGen = useGenerate({
    onPollUnavailable: (inputText) => {
      setMode("stream");
      streamGen.generate(inputText);
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

  const handleGenerate = useCallback(async (script: string) => {
    setInputScript(script);
    if (mode === "poll") {
      pollGen.generate(script);
    } else {
      streamGen.generate(script);
    }
  }, [mode, pollGen, streamGen]);

  // Sync result to history when completed
  useEffect(() => {
    if (gen.status === "completed" && gen.result) {
      const historyItem: HistoryItem = {
        ...gen.result,
        latency: gen.generationTime ? parseFloat(gen.generationTime.toFixed(2)) : 0,
        model: "Mistral 7B Turbo",
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
  }, [gen.status, gen.result, gen.generationTime, inputScript]);

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
    };

    if (mode === "poll") {
      pollGen.restore({
        ...restoreData,
        id: "restored",
        script: item.inputScript
      });
    } else {
      streamGen.restore({
        ...restoreData,
        id: "restored",
        script: item.inputScript
      });
    }
    setInputScript(item.inputScript);
    setIsHistoryOpen(false);
  }, [mode, pollGen, streamGen]);

  // Prepare result for UI
  const uiResult: GenerationResult | null = gen.result ? {
    ...gen.result,
    latency: gen.generationTime ? parseFloat(gen.generationTime.toFixed(2)) : 0,
    model: "Mistral 7B Turbo",
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

      {/* Model Status Badge */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
        <div 
          className={`backdrop-blur-md px-3 py-1.5 rounded-full border font-mono text-[10px] font-bold uppercase tracking-wider shadow-lg ${warmupBadge.tone}`}
          title={warmupBadge.title}
        >
          {warmupBadge.text}
          {mode === "poll" && !pollReady && <span className="ml-2 text-red-500 underline underline-offset-2">Poll Offline</span>}
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

