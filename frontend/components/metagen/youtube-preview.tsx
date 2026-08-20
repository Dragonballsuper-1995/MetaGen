"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Play, Eye, Sparkles, Smartphone, Monitor } from "lucide-react"

interface YoutubePreviewProps {
  title: string
  description: string
  channelName?: string
  viewCount?: string
  uploadTime?: string
  duration?: string
}

export function YoutubePreview({
  title,
  description,
  channelName = "MetaGen Studio",
  viewCount = "48K views",
  uploadTime = "2 hours ago",
  duration = "14:28",
}: YoutubePreviewProps) {
  const [deviceMode, setDeviceMode] = React.useState<"desktop" | "mobile">("desktop")

  // Truncate description to realistic 2 lines for search snippet
  const cleanSnippet = description
    ? description.split("\n").filter(Boolean).slice(0, 2).join(" ")
    : "Explore the complete breakdown with deep architectural insights, production workflows, and real-world implementation..."

  return (
    <div className="studio-card p-5 flex flex-col gap-4">
      {/* Simulator Top Controls */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Live YouTube Snippet Simulator
          </span>
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 text-xs">
          <button
            onClick={() => setDeviceMode("desktop")}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
              deviceMode === "desktop"
                ? "bg-background text-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            onClick={() => setDeviceMode("mobile")}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
              deviceMode === "mobile"
                ? "bg-background text-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>
      </div>

      {/* Simulated YouTube Search Result Card */}
      <div
        className={`bg-background/80 dark:bg-black/40 border border-border/80 rounded-xl p-4 transition-all duration-200 ${
          deviceMode === "mobile" ? "max-w-sm mx-auto" : "w-full"
        }`}
      >
        <div
          className={`flex ${
            deviceMode === "mobile" ? "flex-col gap-3" : "flex-col sm:flex-row gap-4"
          }`}
        >
          {/* Simulated 16:9 Video Thumbnail */}
          <div
            className={`relative flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border border-white/10 flex items-center justify-center group ${
              deviceMode === "mobile" ? "w-full" : "w-full sm:w-48 md:w-56"
            }`}
          >
            {/* Subtle Dot Matrix Wave overlay */}
            <div className="absolute inset-0 bg-subtle-grid opacity-30 pointer-events-none" />

            <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105">
              <Play className="w-4 h-4 fill-current translate-x-0.5" />
            </div>

            {/* Duration Badge */}
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/85 text-white font-mono text-[10px] font-bold rounded">
              {duration}
            </div>

            {/* 4K / HD Badge */}
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-white/80 font-mono text-[9px] font-medium rounded border border-white/10">
              4K HDR
            </div>
          </div>

          {/* Video Metadata Content */}
          <div className="flex flex-col justify-start gap-1.5 flex-1 min-w-0">
            {/* Title with smooth text transition */}
            <AnimatePresence mode="wait">
              <motion.h3
                key={title}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.15 }}
                className="font-sans text-sm sm:text-base font-semibold text-foreground leading-snug line-clamp-2 hover:text-primary transition-colors cursor-pointer"
              >
                {title || "Your High-Converting Video Title Will Appear Here"}
              </motion.h3>
            </AnimatePresence>

            {/* Channel Info & Metrics */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
              <span className="font-medium text-foreground/90">{channelName}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground fill-muted-foreground/20 inline" />
              <span>•</span>
              <span>{viewCount}</span>
              <span>•</span>
              <span>{uploadTime}</span>
            </div>

            {/* Channel Avatar + Snippet */}
            <div className="flex items-center gap-2 mt-1">
              <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0">
                M
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {cleanSnippet}
              </p>
            </div>

            {/* Badges / High CTR Tag */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Optimal CTR Length ({title.length} / 100)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
