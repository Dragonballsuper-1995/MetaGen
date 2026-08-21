"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play,
  CheckCircle2,
  MoreVertical,
  Bell,
  Search as SearchIcon,
  Cast,
  Home,
  Compass,
  PlusCircle,
  FolderMinus,
  User,
  Monitor,
  Smartphone,
  Columns,
  Sparkles,
  Radio,
} from "lucide-react"

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
  channelName = "MetaGen Creator",
  viewCount = "64K views",
  uploadTime = "1 hour ago",
  duration = "12:45",
}: YoutubePreviewProps) {
  const [viewMode, setViewMode] = React.useState<"dual" | "desktop" | "mobile">("dual")

  const cleanSnippet = description
    ? description.split("\n").filter(Boolean).slice(0, 2).join(" ")
    : "Unlock the complete breakdown with deep architectural insights, production workflows, and real-world implementation..."

  return (
    <div className="bento-card p-4 sm:p-5 flex flex-col gap-3.5 w-full h-full max-h-full min-h-0 select-none">
      {/* ─── TOP BAR CONTROLS ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border pb-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          {/* YouTube Red Icon */}
          <div className="w-5 h-5 rounded-md bg-[#FF0000] flex items-center justify-center text-white shadow-xs">
            <Play className="w-2.5 h-2.5 fill-current translate-x-0.2" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
            YouTube Live Feed Simulator
          </span>
          <span className="hidden md:inline text-[11px] text-muted-foreground font-mono">
            (Real Multi-Video Feed)
          </span>
        </div>

        {/* View Mode Toggle Switcher */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border text-xs">
          <button
            onClick={() => setViewMode("dual")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              viewMode === "dual"
                ? "bg-surface text-foreground font-semibold shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Side-by-Side Dual View"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dual View</span>
          </button>

          <button
            onClick={() => setViewMode("desktop")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              viewMode === "desktop"
                ? "bg-surface text-foreground font-semibold shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Desktop Feed Grid"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop Feed</span>
          </button>

          <button
            onClick={() => setViewMode("mobile")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              viewMode === "mobile"
                ? "bg-surface text-foreground font-semibold shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Mobile App Feed"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile Feed</span>
          </button>
        </div>
      </div>

      {/* ─── SIMULATOR CONTENT STAGE ──────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        <div
          className={`grid gap-5 ${
            viewMode === "dual"
              ? "grid-cols-1 lg:grid-cols-12 items-start"
              : "grid-cols-1 max-w-5xl mx-auto"
          }`}
        >
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* DESKTOP YOUTUBE GRID SECTION                                      */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {(viewMode === "dual" || viewMode === "desktop") && (
            <div
              className={`${
                viewMode === "dual" ? "lg:col-span-8" : "w-full"
              } flex flex-col gap-3 rounded-2xl bg-[#0F0F0F] text-[#F1F1F1] border border-zinc-800 p-3.5 sm:p-4 shadow-xl`}
            >
              {/* Desktop Header Simulation */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-white font-bold tracking-tighter text-sm">
                    <div className="w-5 h-3.5 bg-[#FF0000] rounded-sm flex items-center justify-center">
                      <Play className="w-2 h-2 fill-white text-white" />
                    </div>
                    <span>YouTube</span>
                    <span className="text-[9px] font-normal text-zinc-400 ml-0.5">IN</span>
                  </div>
                </div>

                {/* Simulated Search Bar */}
                <div className="hidden sm:flex items-center bg-zinc-900 border border-zinc-700 rounded-full px-3 py-1 text-zinc-400 w-64 max-w-xs justify-between">
                  <span className="text-[11px] truncate">Search</span>
                  <SearchIcon className="w-3 h-3 text-zinc-400" />
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center font-bold text-[10px]">
                    S
                  </div>
                </div>
              </div>

              {/* Category Filter Chips Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-medium no-scrollbar">
                <span className="px-2.5 py-1 rounded-lg bg-white text-black font-semibold flex-shrink-0 cursor-pointer">
                  All
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex-shrink-0 cursor-pointer">
                  AI & Neural Networks
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex-shrink-0 cursor-pointer">
                  Podcasts
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex-shrink-0 cursor-pointer">
                  Software Engineering
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex-shrink-0 cursor-pointer">
                  Recently uploaded
                </span>
              </div>

              {/* Desktop Multi-Card Video Feed Grid */}
              <div
                className={`grid gap-4 mt-1 ${
                  viewMode === "desktop"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1 sm:grid-cols-2"
                }`}
              >
                {/* ── CARD 1: THE USER'S GENERATED VIDEO (HIGHLIGHTED) ── */}
                <div className="flex flex-col gap-2 relative group p-2.5 rounded-xl bg-zinc-900/90 border-2 border-primary shadow-lg shadow-primary/10 transition-all">
                  {/* Active Badge */}
                  <div className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-md bg-primary text-white text-[9px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1 z-10">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Your Generated Video</span>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-blue-950 via-zinc-900 to-black border border-primary/40 flex items-center justify-center">
                    <div className="absolute inset-0 bg-radial from-primary/20 via-transparent to-transparent opacity-70" />

                    <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105">
                      <Play className="w-4 h-4 fill-current translate-x-0.5" />
                    </div>

                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/85 text-white font-mono text-[10px] font-bold rounded">
                      {duration}
                    </div>

                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-xs text-white/90 font-mono text-[9px] font-medium rounded border border-white/10">
                      4K HDR
                    </div>
                  </div>

                  {/* Meta Details */}
                  <div className="flex gap-2.5 pt-1">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm ring-2 ring-primary/40">
                      M
                    </div>

                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <AnimatePresence mode="wait">
                        <motion.h4
                          key={title}
                          initial={{ opacity: 0, y: 2 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="font-sans text-xs sm:text-sm font-semibold text-white leading-snug line-clamp-2 hover:text-primary transition-colors cursor-pointer"
                        >
                          {title}
                        </motion.h4>
                      </AnimatePresence>

                      <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <span>{channelName}</span>
                        <CheckCircle2 className="w-3 h-3 text-zinc-400 inline" />
                      </div>

                      <div className="text-[11px] text-zinc-400">
                        <span>{viewCount}</span> • <span>{uploadTime}</span>
                      </div>

                      <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">
                        {cleanSnippet}
                      </p>
                    </div>

                    <MoreVertical className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 cursor-pointer" />
                  </div>
                </div>

                {/* ── CARD 2: REALISTIC NEIGHBOR (F1 Grand Prix) ── */}
                <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 opacity-85 hover:opacity-100 transition-opacity">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-red-950 via-zinc-900 to-black border border-white/5 flex items-center justify-center">
                    <div className="absolute inset-0 bg-radial from-red-500/10 via-transparent to-transparent" />
                    <span className="text-xs font-bold text-red-500/80 uppercase tracking-widest font-mono">
                      FORMULA 1
                    </span>
                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/85 text-white font-mono text-[10px] font-bold rounded">
                      13:14
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-[10px] flex-shrink-0">
                      F1
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <h4 className="font-sans text-xs sm:text-sm font-semibold text-white leading-snug line-clamp-2">
                        Drivers Look Ahead to the Weekend | 2026 Dutch Grand Prix
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <span>FORMULA 1</span>
                        <CheckCircle2 className="w-3 h-3 text-zinc-400 inline" />
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        <span>13K views</span> • <span>1 hour ago</span>
                      </div>
                    </div>
                    <MoreVertical className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                </div>

                {/* ── CARD 3: REALISTIC NEIGHBOR (Distributed Systems) ── */}
                <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 opacity-85 hover:opacity-100 transition-opacity">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-emerald-950 via-zinc-900 to-black border border-white/5 flex items-center justify-center">
                    <span className="text-xs font-bold text-emerald-500/80 uppercase tracking-widest font-mono">
                      50M REQ/MO ($15)
                    </span>
                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/85 text-white font-mono text-[10px] font-bold rounded">
                      2:26:16
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      C
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <h4 className="font-sans text-xs sm:text-sm font-semibold text-white leading-snug line-clamp-2">
                        50 Million HTTP Requests/Month on a $15 Budget (First 2 Hours)
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <span>Coddev</span>
                        <CheckCircle2 className="w-3 h-3 text-zinc-400 inline" />
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        <span>34K views</span> • <span>5 days ago</span>
                      </div>
                    </div>
                    <MoreVertical className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                </div>

                {/* ── CARD 4: REALISTIC NEIGHBOR (Live Stream) ── */}
                <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 opacity-85 hover:opacity-100 transition-opacity">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-amber-950 via-zinc-900 to-black border border-white/5 flex items-center justify-center">
                    <span className="text-xs font-bold text-amber-500/80 uppercase tracking-widest font-mono">
                      LIVE DEV STREAM
                    </span>
                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-red-600 text-white font-mono text-[9px] font-bold rounded flex items-center gap-1">
                      <Radio className="w-2.5 h-2.5 animate-pulse" />
                      <span>LIVE</span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      T
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <h4 className="font-sans text-xs sm:text-sm font-semibold text-white leading-snug line-clamp-2">
                        An Update, Stealing from Omarchy Quad, and New Architecture
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <span>Chris Titus Tech</span>
                        <CheckCircle2 className="w-3 h-3 text-zinc-400 inline" />
                      </div>
                      <div className="text-[11px] text-red-400 font-medium">
                        <span>337 watching now</span>
                      </div>
                    </div>
                    <MoreVertical className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* MOBILE YOUTUBE APP FEED SECTION                                    */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {(viewMode === "dual" || viewMode === "mobile") && (
            <div
              className={`${
                viewMode === "dual" ? "lg:col-span-4" : "max-w-sm mx-auto w-full"
              } flex flex-col rounded-3xl bg-black text-[#F1F1F1] border-4 border-zinc-800 overflow-hidden shadow-2xl`}
            >
              {/* Phone Status Bar Simulation */}
              <div className="flex items-center justify-between px-5 pt-2 pb-1 text-[11px] text-zinc-400 font-mono border-b border-zinc-900 bg-black">
                <span>11:48</span>
                <div className="w-16 h-3.5 bg-zinc-900 rounded-full mx-auto" />
                <span>5G 94%</span>
              </div>

              {/* Mobile YouTube Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900 bg-black">
                <div className="flex items-center gap-1 text-white font-bold text-sm tracking-tight">
                  <div className="w-4 h-3 bg-[#FF0000] rounded-xs flex items-center justify-center">
                    <Play className="w-1.5 h-1.5 fill-white text-white" />
                  </div>
                  <span>Premium</span>
                </div>

                <div className="flex items-center gap-3 text-zinc-300">
                  <Cast className="w-3.5 h-3.5" />
                  <Bell className="w-3.5 h-3.5" />
                  <SearchIcon className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Mobile Feed Scroll Area */}
              <div className="flex flex-col gap-4 p-3 overflow-y-auto max-h-[500px]">
                {/* ── MOBILE VIDEO 1: YOUR GENERATED VIDEO ── */}
                <div className="flex flex-col gap-2.5 pb-3 border-b border-zinc-900">
                  {/* Thumbnail */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-blue-950 via-zinc-900 to-black border border-primary/50 flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-primary/90 flex items-center justify-center text-white shadow-md">
                      <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                    </div>

                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/85 text-white font-mono text-[10px] font-bold rounded">
                      {duration}
                    </div>

                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-primary text-white text-[9px] font-bold rounded">
                      ✨ Active CTR Title
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0 ring-2 ring-primary/40">
                      M
                    </div>

                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <h4 className="font-sans text-xs font-semibold text-white leading-snug line-clamp-2">
                        {title}
                      </h4>
                      <div className="text-[11px] text-zinc-400">
                        <span>{channelName}</span> • <span>{uploadTime}</span>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                        <span>★ YouTube featured • High CTR Hook</span>
                      </div>
                    </div>

                    <MoreVertical className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  </div>
                </div>

                {/* ── MOBILE VIDEO 2: REALISTIC COMPETING VIDEO ── */}
                <div className="flex flex-col gap-2.5 opacity-80">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-red-950 via-zinc-900 to-black border border-white/10 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-red-500/80 font-mono">
                      FORMULA 1 • DUTCH GP
                    </span>
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/85 text-white font-mono text-[10px] font-bold rounded">
                      13:14
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      F1
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <h4 className="font-sans text-xs font-semibold text-white leading-snug line-clamp-2">
                        Drivers Look Ahead to the Weekend | 2026 Dutch Grand Prix
                      </h4>
                      <div className="text-[11px] text-zinc-400">
                        <span>FORMULA 1</span> • <span>13K views • 1h ago</span>
                      </div>
                    </div>
                    <MoreVertical className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                  </div>
                </div>
              </div>

              {/* Mobile Bottom Navigation Bar Simulation */}
              <div className="flex items-center justify-around py-2.5 border-t border-zinc-900 bg-black text-zinc-400 text-[10px]">
                <div className="flex flex-col items-center gap-0.5 text-white font-semibold">
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 hover:text-white">
                  <Compass className="w-4 h-4" />
                  <span>Shorts</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 text-white">
                  <PlusCircle className="w-6 h-6 text-zinc-200" />
                </div>
                <div className="flex flex-col items-center gap-0.5 hover:text-white">
                  <FolderMinus className="w-4 h-4" />
                  <span>Sub</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 hover:text-white">
                  <User className="w-4 h-4" />
                  <span>You</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
