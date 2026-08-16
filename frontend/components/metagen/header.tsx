import { motion } from "framer-motion";
import { History, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { MetaGenLogo } from "./logo";

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
        {/* Custom MetaGen Dot Matrix Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => window.location.reload()}
        >
          <img 
            src="/logos/header_logo.svg" 
            alt="MetaGen Logo" 
            className="h-6 sm:h-7 w-auto transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="flex items-center mt-1">
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold leading-none hidden sm:inline-block border border-border/50 rounded-full px-2 py-0.5 ml-2 bg-muted/20">
              V2.5
            </span>
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
