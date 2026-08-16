"use client";

import { useState } from "react";
import { Header, ModelChoice } from "@/components/metagen/header";
import { TerminalCore, AppState } from "@/components/metagen/terminal-core";
import { MetadataResult } from "@/lib/types";

export default function Page() {
  const [selectedModel, setSelectedModel] = useState<ModelChoice>("auto");
  const [appState, setAppState] = useState<AppState>("input");
  const [result, setResult] = useState<MetadataResult | undefined>();

  const handleInitiateSequence = (script: string) => {
    setAppState("loading");
    setResult(undefined);
    
    // Simulate generation time (matching LoadingMatrix timings)
    setTimeout(() => {
      setResult({
        title: "The Future of AI: How Neural Networks are Changing Everything",
        description: "In this video, we dive deep into the world of Artificial Intelligence and explore how neural networks are reshaping industries.\n\nFrom healthcare to finance, discover the impact of machine learning models.\n\nDon't forget to subscribe for more tech insights!",
        tags: ["AI", "Neural Networks", "Machine Learning", "Tech Trends 2024", "Artificial Intelligence", "Deep Learning"],
        seo_score: 96,
        seo_breakdown: {
          title: 100,
          description: 90,
          tags: 95,
          keyword_relevance: 98,
          readability: 88
        },
        model: selectedModel === "groq" ? "GROQ LPU (120B)" : selectedModel === "mistral" ? "MISTRAL 7B (HF)" : "AUTO-HYBRID ENGINE"
      });
      setAppState("output");
    }, 2800); // 2.8s wait to let the matrix animation finish
  };

  const handleReset = () => {
    setAppState("input");
    setResult(undefined);
  };

  return (
    <div className="min-h-screen bg-dot-matrix font-mono flex flex-col">
      <Header selectedModel={selectedModel} onModelChange={setSelectedModel} />
      
      <main className="flex-1 w-full px-4 md:px-8 pb-10">
        <TerminalCore 
          appState={appState} 
          onInitiateSequence={handleInitiateSequence} 
          result={result}
          onReset={handleReset}
        />
      </main>
    </div>
  );
}
