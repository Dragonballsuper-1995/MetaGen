"use client";

import { useState } from "react";
import { Header, ModelChoice } from "@/components/metagen/header";

export default function Page() {
  const [selectedModel, setSelectedModel] = useState<ModelChoice>("auto");

  return (
    <div className="min-h-screen bg-dot-matrix font-mono flex flex-col">
      <Header selectedModel={selectedModel} onModelChange={setSelectedModel} />
      
      <main className="flex-1 flex items-center justify-center">
        <div className="text-primary text-xl tracking-widest uppercase animate-pulse">
          &gt; SYSTEM READY
        </div>
      </main>
    </div>
  );
}
