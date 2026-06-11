"use client"

import { Bell, Search, Info } from "lucide-react"

export function Topbar() {
  return (
    <header className="h-14 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-64 group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-md pl-9 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-zinc-600"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          System Operational
        </div>
        
        <button className="text-zinc-400 hover:text-zinc-100 transition-colors relative p-1.5 rounded-md hover:bg-zinc-800">
          <Info className="w-4 h-4" />
        </button>

        <button className="text-zinc-400 hover:text-zinc-100 transition-colors relative p-1.5 rounded-md hover:bg-zinc-800">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 ring-2 ring-zinc-950" />
        </button>
      </div>
    </header>
  )
}
