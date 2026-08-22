"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Clock, Database, Trash2, ChevronRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HistoryItem } from "@/lib/types"

interface HistorySidebarProps {
  isOpen: boolean
  onClose: () => void
  history: HistoryItem[]
  onSelect: (item: HistoryItem) => void
  onClear: () => void
}

export function HistorySidebar({
  isOpen,
  onClose,
  history,
  onSelect,
  onClear,
}: HistorySidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 35 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[440px] z-50 p-4 sm:p-6 flex flex-col"
          >
            <div className="studio-card w-full h-full flex flex-col bg-surface shadow-2xl overflow-hidden rounded-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-primary" />
                  <h2 className="font-sans text-sm font-bold text-foreground">
                    Generation History ({history.length})
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 rounded-xl hover:bg-muted"
                >
                  <X className="w-4 h-4 text-foreground" />
                </Button>
              </div>

              {/* History List */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-6 gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      No Metadata Generated Yet
                    </span>
                    <span className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                      When you generate YouTube titles, descriptions, and tags, they will be archived here for instant one-click recall.
                    </span>
                  </div>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onSelect(item)}
                      className="w-full text-left bg-surface hover:bg-muted border border-border hover:border-primary/50 p-4 rounded-xl transition-all flex flex-col gap-2 group shadow-sm"
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="font-sans text-sm font-semibold text-foreground line-clamp-2 pr-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground flex-shrink-0 mt-0.5" />
                      </div>

                      <div className="flex items-center justify-between w-full text-xs text-muted-foreground pt-1 border-t border-border">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {item.time
                              ? new Date(item.time).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Recent"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-bold font-mono">
                            {item.seo_score ?? 96}/100 SEO
                          </span>
                          <span>•</span>
                          <span>{item.tags.length} Tags</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Purge Button */}
              {history.length > 0 && (
                <div className="p-4 border-t border-border bg-muted/40">
                  <Button
                    variant="outline"
                    className="w-full h-9 text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive hover:text-white rounded-xl transition-colors"
                    onClick={onClear}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Clear History
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
