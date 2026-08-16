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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b-2 border-border shadow-[0_4px_0_0_var(--border)] dark:shadow-[0_4px_0_0_var(--border)]">
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
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold leading-none hidden sm:inline-block border-2 border-primary/30 rounded-sm px-2 py-0.5 ml-2 bg-primary/10">
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
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-sm transition-colors duration-300 h-10 w-10"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-primary" />
              )}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onHistoryToggle}
            className="gap-2 transition-all duration-300"
          >
            <History className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">History</span>
          </Button>
        </motion.div>
      </div>
    </header>
  );
}
