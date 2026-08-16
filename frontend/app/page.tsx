"use client";

import { useState } from "react";
import { Header, ModelChoice } from "@/components/metagen/header";
import { TerminalCore, AppState } from "@/components/metagen/terminal-core";

export default function Page() {
  const [selectedModel, setSelectedModel] = useState<ModelChoice>("auto");
  const [appState, setAppState] = useState<AppState>("input");

  const handleInitiateSequence = (script: string) => {
    // Mock state transition for Phase 3
    setAppState("loading");
    
    // Simulate generation time for now (will be replaced in Phase 4)
    setTimeout(() => {
      setAppState("output");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-dot-matrix font-mono flex flex-col">
      <Header selectedModel={selectedModel} onModelChange={setSelectedModel} />
      
      <main className="flex-1 w-full px-4 md:px-8 pb-10">
        <TerminalCore 
          appState={appState} 
          onInitiateSequence={handleInitiateSequence} 
        />
      </main>
    </div>
  );
}
