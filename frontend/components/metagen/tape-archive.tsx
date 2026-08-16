"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Database, Trash2, Play, Clock, Sparkles } from "lucide-react"
import { HardwareButton } from "@/components/ui/hardware-button"
import { DymoBadge } from "@/components/ui/dymo-badge"
import { sound } from "@/lib/audio-engine"
import { HistoryItem } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TapeArchiveProps {
  isOpen: boolean
  onClose: () => void
  history: HistoryItem[]
  onSelect: (item: HistoryItem) => void
  onClear: () => void
}

export function TapeArchive({
  isOpen,
  onClose,
  history,
  onSelect,
  onClear,
}: TapeArchiveProps) {
  const handleSelectTape = (item: HistoryItem) => {
    sound.playRelaySnap()
    onSelect(item)
  }

  const handlePurge = () => {
    sound.playRelaySnap()
    onClear()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "linear" }}
            className="fixed inset-0 bg-background/80 z-50 backdrop-grayscale"
            onClick={onClose}
          />

          {/* Cassette Tape Rack Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.2, ease: "linear" }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[440px] z-50 p-3 sm:p-5 pl-0"
          >
            <div className="w-full h-full chassis-faceplate flex flex-col relative overflow-hidden">
              {/* Corner Screws */}
              <div className="absolute top-2 left-2 screw-rivet" />
              <div className="absolute top-2 right-2 screw-rivet" />
              <div className="absolute bottom-2 left-2 screw-rivet" />
              <div className="absolute bottom-2 right-2 screw-rivet" />

              {/* Header Bar */}
              <div className="flex items-center justify-between p-4 border-b-2 border-border bg-chassis-sub">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-primary" />
                  <span className="font-doto font-bold text-xs uppercase tracking-widest text-foreground">
                    NEURAL CACHE // TAPE RACK
                  </span>
                </div>

                <button
                  onClick={onClose}
                  className="p-1 text-muted-foreground hover:text-foreground border border-border hover:border-foreground bg-chassis"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sub-header info */}
              <div className="px-4 py-2 bg-chassis-inset border-b border-border/80 flex items-center justify-between text-[9px] text-muted-foreground uppercase tracking-widest">
                <span>TOTAL TAPES ARCHIVED: [{history.length.toString().padStart(2, "0")}]</span>
                <DymoBadge variant="orange" className="text-[7px] py-0">PERSISTENT // LOCAL</DymoBadge>
              </div>

              {/* Tape Archive List */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground font-mono text-[10px] uppercase tracking-widest text-center opacity-40 gap-3">
                    <Database className="w-10 h-10" />
                    <span>NO TAPES IN STORAGE RACK</span>
                  </div>
                ) : (
                  history.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectTape(item)}
                      className="p-3.5 bg-chassis-sub border-2 border-border hover:border-primary transition-all cursor-pointer flex flex-col gap-2.5 relative group shadow-[2px_2px_0_0_var(--border)] active:translate-y-[1px]"
                    >
                      {/* Mini Cassette Spool Window */}
                      <div className="flex items-center justify-between bg-chassis-inset px-2.5 py-1 border border-border/70 text-[8px] text-muted-foreground uppercase tracking-widest">
                        <span className="font-doto font-bold text-primary">
                          TAPE-{(history.length - idx).toString().padStart(2, "0")}
                        </span>
                        <span>{item.time ? new Date(item.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "ARCHIVED"}</span>
                      </div>

                      {/* Tape Title Label */}
                      <div className="font-mono font-bold text-xs text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {item.title}
                      </div>

                      {/* Bottom Tape Telemetry */}
                      <div className="flex items-center justify-between text-[8px] font-mono text-muted-foreground uppercase tracking-widest pt-1 border-t border-border/50">
                        <span className="text-[#00FF66] font-bold font-doto">
                          SCORE: {item.seo_score ?? 96}/100
                        </span>
                        <span>[{item.tags.length} TAGS]</span>
                        <span className="font-bold text-foreground flex items-center gap-1 group-hover:text-primary">
                          <Play className="w-2.5 h-2.5 fill-current" />
                          LOAD TAPE
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Purge Action */}
              {history.length > 0 && (
                <div className="p-3.5 border-t-2 border-border bg-chassis-sub">
                  <HardwareButton
                    variant="record"
                    size="sm"
                    onClick={handlePurge}
                    className="w-full text-[10px]"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    [ PURGE TAPE ARCHIVE ]
                  </HardwareButton>
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
