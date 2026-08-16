"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TapeDeckProps {
  isPlaying?: boolean
  tapeProgress?: number // 0 to 1
  label?: string
  className?: string
}

export function TapeDeck({
  isPlaying = false,
  tapeProgress = 0.25,
  label = "TAPE DECK // REEL-01",
  className,
}: TapeDeckProps) {
  // Left spool shrinks as tape plays, right spool grows
  const leftSpoolRadius = 32 - tapeProgress * 14
  const rightSpoolRadius = 18 + tapeProgress * 14

  return (
    <div
      className={cn(
        "p-3 bg-chassis-inset border border-border/80 flex flex-col gap-2 relative overflow-hidden font-mono select-none",
        className
      )}
    >
      {/* Top Tape Readout Bar */}
      <div className="flex items-center justify-between text-[8px] tracking-widest text-muted-foreground uppercase">
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-colors",
              isPlaying ? "bg-[#FF3B00] shadow-[0_0_6px_#FF3B00] animate-pulse" : "bg-muted-foreground/30"
            )}
          />
          {label}
        </span>
        <span className="font-doto font-bold text-foreground tracking-widest">
          {isPlaying ? "● REC" : "■ READY"} [{Math.floor(tapeProgress * 999).toString().padStart(3, "0")}]
        </span>
      </div>

      {/* Cassette Window & Spools */}
      <div className="relative h-20 bg-background/90 border border-border/60 rounded-none flex items-center justify-between px-6 overflow-hidden">
        {/* Subtle grid backdrop inside cassette */}
        <div className="absolute inset-0 bg-dot-matrix opacity-20 pointer-events-none" />

        {/* Magnetic Tape Span Line */}
        <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-[#5A4033] border-t border-[#3B2920] pointer-events-none -translate-y-1/2" />

        {/* Magnetic Read/Write Head in Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
          <div
            className={cn(
              "w-4 h-4 bg-chassis border border-border flex items-center justify-center transition-colors",
              isPlaying && "border-[#FF3B00] shadow-[0_0_8px_rgba(255,59,0,0.5)]"
            )}
          >
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                isPlaying ? "bg-[#FF3B00] animate-ping" : "bg-muted-foreground/40"
              )}
            />
          </div>
          <span className="text-[7px] text-muted-foreground font-bold tracking-tighter mt-0.5">HEAD</span>
        </div>

        {/* Left Spool (Feed) */}
        <div className="relative flex items-center justify-center z-10">
          {/* Tape Pack Ring */}
          <div
            className="absolute rounded-full bg-[#402C22] border border-[#2B1D16] transition-all duration-300"
            style={{ width: `${leftSpoolRadius * 2}px`, height: `${leftSpoolRadius * 2}px` }}
          />

          {/* Rotating Hub with Spoke Teeth */}
          <div
            className={cn(
              "w-10 h-10 rounded-full bg-chassis-sub border-2 border-border/80 flex items-center justify-center relative shadow-inner",
              isPlaying && "animate-spin"
            )}
            style={{ animationDuration: isPlaying ? "1.8s" : "0s" }}
          >
            {/* 3 Spoke Cutouts */}
            <div className="absolute w-full h-1 bg-chassis-inset" />
            <div className="absolute w-full h-1 bg-chassis-inset rotate-60" />
            <div className="absolute w-full h-1 bg-chassis-inset -rotate-60" />
            <div className="w-3 h-3 rounded-full bg-background border border-border z-10" />
          </div>
        </div>

        {/* Center Cassette Label */}
        <div className="z-10 px-2 py-0.5 bg-chassis border border-border/80 text-[8px] font-mono font-bold tracking-widest text-muted-foreground uppercase opacity-80">
          60 MIN // METAGEN
        </div>

        {/* Right Spool (Take-up) */}
        <div className="relative flex items-center justify-center z-10">
          {/* Tape Pack Ring */}
          <div
            className="absolute rounded-full bg-[#402C22] border border-[#2B1D16] transition-all duration-300"
            style={{ width: `${rightSpoolRadius * 2}px`, height: `${rightSpoolRadius * 2}px` }}
          />

          {/* Rotating Hub with Spoke Teeth */}
          <div
            className={cn(
              "w-10 h-10 rounded-full bg-chassis-sub border-2 border-border/80 flex items-center justify-center relative shadow-inner",
              isPlaying && "animate-spin"
            )}
            style={{ animationDuration: isPlaying ? "1.4s" : "0s" }}
          >
            {/* 3 Spoke Cutouts */}
            <div className="absolute w-full h-1 bg-chassis-inset" />
            <div className="absolute w-full h-1 bg-chassis-inset rotate-60" />
            <div className="absolute w-full h-1 bg-chassis-inset -rotate-60" />
            <div className="w-3 h-3 rounded-full bg-background border border-border z-10" />
          </div>
        </div>
      </div>
    </div>
  )
}
