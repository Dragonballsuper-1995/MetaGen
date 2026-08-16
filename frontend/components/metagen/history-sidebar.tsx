"use client";

import { motion } from "framer-motion";
import { X, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HistoryItem } from "@/app/page";

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

export function HistorySidebar({
  isOpen,
  onClose,
  history,
  onSelect,
}: HistorySidebarProps) {
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
      />

      {/* Sidebar */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l-2 border-border z-50 overflow-hidden flex flex-col shadow-2xl"
      >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b-2 border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-inner">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                    Neural Cache
                  </h2>
                  <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">
                    {history.length} GENERATIONS
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-sm hover:bg-secondary text-foreground h-10 w-10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-16 h-16 rounded-sm bg-secondary flex items-center justify-center mb-4 border-2 border-border">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-mono font-bold text-foreground mb-2 uppercase tracking-widest">
                    CACHE_EMPTY
                  </h3>
                  <p className="text-xs font-mono text-muted-foreground max-w-xs uppercase">
                    > AWAITING DATA INPUT...
                  </p>
                </div>
              ) : (
                history.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onSelect(item)}
                    className="relative w-full text-left p-4 rounded-sm bg-background border-2 border-border/50 hover:border-primary/50 hover:bg-secondary/50 transition-all group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-inner group-hover:bg-primary/20 transition-colors">
                        <span className="text-xs font-mono font-bold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>
                            {item.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {item.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-[9px] font-mono rounded-sm bg-primary/10 border border-primary/20 text-muted-foreground uppercase"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="px-2 py-0.5 text-[9px] font-mono rounded-sm bg-primary/10 border border-primary/20 text-muted-foreground uppercase">
                              +{item.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>

            {/* Footer */}
            {history.length > 0 && (
              <div className="px-6 py-4 border-t-2 border-border bg-muted/30">
                <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground text-center">
                  > SESSION-BASED LOCAL STORAGE
                </p>
              </div>
            )}
      </motion.div>
    </>
  );
}
