"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ListTree, Settings, Wallet, KeyRound, Sparkles, ChevronRight } from "lucide-react"

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'History', href: '#', icon: ListTree },
  { name: 'API Access', href: '#', icon: KeyRound },
  { name: 'Billing', href: '#', icon: Wallet },
  { name: 'Settings', href: '#', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-zinc-950 border-r border-zinc-800 h-full z-20 text-zinc-100">
      <div className="p-6 flex items-center gap-3 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex items-baseline">
          <span className="text-xl font-bold tracking-tight">MetaGen</span>
        </div>
      </div>
      
      <div className="px-4 py-6 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-4 px-2">Navigation</div>
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '#' && pathname?.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-medium ${
                  isActive 
                    ? 'bg-zinc-800/50 text-white' 
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'opacity-70'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-zinc-900 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center">
             <span className="text-xs font-medium text-zinc-300">SC</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-200">Sujal Chhajed</span>
            <span className="text-[10px] text-zinc-500">Pro Plan</span>
          </div>
        </div>
      </div>
    </div>
  )
}
