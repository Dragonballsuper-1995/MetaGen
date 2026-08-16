import { motion } from "framer-motion";
import { History, Moon, Sun, Command, Zap, Brain, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import type { ModelChoice } from "@/lib/types";

interface HeaderProps {
  onHistoryToggle: () => void;
  selectedModel: ModelChoice;
  onModelChange: (model: ModelChoice) => void;
}

const MODEL_OPTIONS: { id: ModelChoice; label: string; shortLabel: string; icon: typeof Zap; desc: string; tone: string }[] = [
  {
    id: "auto",
    label: "Auto Hybrid",
    shortLabel: "Auto",
    icon: Sparkles,
    desc: "Lightning Cloud with Fallback",
    tone: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  },
  {
    id: "groq",
    label: "Groq 120B",
    shortLabel: "Groq 120B",
    icon: Zap,
    desc: "OpenAI GPT-OSS 120B (LPU ~500 T/s)",
    tone: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
  },
  {
    id: "mistral",
    label: "Custom Mistral",
    shortLabel: "Mistral 7B",
    icon: Brain,
    desc: "Custom Merged GGUF (HuggingFace)",
    tone: "text-blue-500 bg-blue-500/10 border-blue-500/30",
  },
];

export function Header({ onHistoryToggle, selectedModel, onModelChange }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const activeOption = MODEL_OPTIONS.find((m) => m.id === selectedModel) || MODEL_OPTIONS[0];
  const ActiveIcon = activeOption.icon;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/40 backdrop-blur-2xl border-b border-border/50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Unique Logo Design */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => window.location.reload()}
        >
          <div className="relative flex items-center justify-center">
            {/* Abstract Neural 'M' Logo */}
            <div className="relative w-11 h-11 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] group-hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.6)] transition-all duration-500">
               <div className="absolute inset-0 bg-grid-white/[0.2]" />
               <Command className="w-6 h-6 text-primary-foreground relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500" />
               
               {/* Animated Pulse Rings */}
               <div className="absolute inset-0 border-2 border-white/20 rounded-2xl animate-ping opacity-20" />
            </div>
            
            {/* Decorative Nodes */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-background animate-bounce delay-100 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
          </div>
          
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-foreground flex items-baseline">
              META
              <span className="text-primary ml-0.5">GEN</span>
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold leading-none">
                Intelligence
              </span>
              <div className="w-1 h-1 rounded-full bg-primary/40" />
              <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold leading-none">
                V2.5
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 sm:gap-3"
        >
          {/* Model Selector Dropdown & Active Indicator */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/80 hover:bg-accent/40 border border-border/60 hover:border-primary/40 text-foreground transition-all duration-200 shadow-sm"
              title={`Active Model: ${activeOption.desc}`}
            >
              <div className={`flex items-center justify-center w-5 h-5 rounded-full ${activeOption.tone}`}>
                <ActiveIcon className="w-3 h-3" />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold tracking-tight text-foreground">
                    {activeOption.label}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/80 p-2 shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-muted-foreground border-b border-border/40 mb-1">
                    Select Inference Engine
                  </div>
                  {MODEL_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = selectedModel === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          onModelChange(opt.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex items-start gap-2.5 p-2 rounded-xl text-left transition-all ${
                          isSelected 
                            ? "bg-primary/10 border border-primary/30 text-foreground" 
                            : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className={`mt-0.5 p-1.5 rounded-lg border ${opt.tone}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                              {opt.label}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] font-black uppercase tracking-wider text-primary px-1.5 py-0.5 rounded-full bg-primary/15">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground leading-tight truncate">
                            {opt.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="h-6 w-px bg-border hidden sm:block mx-0.5" />

          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-xl hover:bg-accent/50 transition-colors duration-300 h-9 w-9"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-blue-600" />
              )}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onHistoryToggle}
            className="gap-2 rounded-xl border-border bg-card/50 hover:bg-accent/50 text-foreground transition-all duration-300 h-9"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline font-medium text-xs">History</span>
          </Button>
        </motion.div>
      </div>
    </header>
  );
}
