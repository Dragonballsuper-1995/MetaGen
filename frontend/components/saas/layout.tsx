"use client"

import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"

export function SaaSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="relative z-10 flex flex-col h-full">
          <Topbar />
          <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
