import { motion } from "framer-motion";
import { History, Moon, Sun, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface HeaderProps {
  onHistoryToggle: () => void;
}

export function Header({ onHistoryToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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
          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-xl hover:bg-secondary text-foreground transition-colors duration-300 h-9 w-9"
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
            className="gap-2 rounded-xl border-border/70 bg-card/60 hover:bg-secondary text-foreground transition-all duration-300 h-9 px-3"
          >
            <History className="w-4 h-4 text-muted-foreground" />
            <span className="hidden sm:inline font-medium text-xs">History</span>
          </Button>
        </motion.div>
      </div>
    </header>
  );
}
