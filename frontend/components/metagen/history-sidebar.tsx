"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Clock, Database, Trash2 } from "lucide-react"
import { Panel } from "@/components/ui/panel"
import { Button } from "@/components/ui/button"
import { HistoryItem } from "@/lib/types"

interface HistorySidebarProps {
  isOpen: boolean
  onClose: () => void
  history: HistoryItem[]
  onSelect: (item: HistoryItem) => void
  onClear: () => void
}

export function HistorySidebar({ isOpen, onClose, history, onSelect, onClear }: HistorySidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (Strict block color, no blur) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "linear" }}
            className="fixed inset-0 bg-background/80 z-50"
            onClick={onClose}
          />
          
          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.2, ease: "linear" }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] z-50 p-4 pl-0"
          >
            <Panel className="w-full h-full flex flex-col bg-background shadow-[-8px_8px_0_0_var(--border)] dark:shadow-[-8px_8px_0_0_var(--border)] relative">
              
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b-2 border-border bg-muted/50">
                <div className="flex items-center gap-2 text-foreground font-mono font-bold tracking-widest uppercase">
                  <Database className="w-4 h-4 text-primary" />
                  <h2>Neural Cache</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground font-mono text-[10px] uppercase tracking-widest text-center opacity-50 gap-2">
                    <Database className="w-8 h-8" />
                    <span>CACHE EMPTY</span>
                  </div>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onSelect(item)}
                      className="w-full text-left bg-background border-2 border-border p-3 rounded-sm hover:border-primary hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary flex flex-col gap-2 group"
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="font-sans font-bold text-sm text-foreground line-clamp-1 pr-2">
                          {item.title}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between w-full font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                        <div className="flex items-center gap-1 group-hover:text-primary transition-colors">
                          <Clock className="w-3 h-3" />
                          {item.time ? new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "UNKNOWN"}
                        </div>
                        <div className="flex gap-2">
                          <span className="text-success">{item.seo_score}/100</span>
                          <span>|</span>
                          <span>{item.tags.length} TAGS</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              {history.length > 0 && (
                <div className="p-4 border-t-2 border-border bg-muted/50">
                  <Button variant="destructive" className="w-full" onClick={onClear}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    PURGE CACHE
                  </Button>
                </div>
              )}

            </Panel>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
