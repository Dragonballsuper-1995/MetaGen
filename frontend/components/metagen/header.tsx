"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Terminal, Cpu, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/panel"
import { cn } from "@/lib/utils"

export type ModelChoice = "auto" | "groq" | "mistral"

interface HeaderProps {
  selectedModel?: ModelChoice
  onModelChange?: (model: ModelChoice) => void
  onHistoryToggle?: () => void
}

export function Header({ selectedModel = "auto", onModelChange, onHistoryToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleModelSelect = (model: ModelChoice) => {
    if (onModelChange) {
      onModelChange(model)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-border bg-background/95 p-4 flex items-center justify-between shadow-[0_4px_0_0_var(--border)]">
      <div className="flex items-center gap-4">
        {/* Logo container */}
        <div className="h-8 flex items-center">
          {/* 
            Since the SVG handles dark mode internally via media queries, 
            we just render it using an img tag or object tag. 
          */}
          <img 
            src="/logos/header_logo.svg" 
            alt="MetaGen" 
            className="h-full object-contain"
          />
        </div>
        
        {/* Version Badge */}
        <div className="hidden md:flex items-center px-2 py-0.5 border-2 border-primary/30 bg-primary/10 text-primary rounded-sm font-mono text-[10px] uppercase tracking-widest font-bold">
          <Terminal className="w-3 h-3 mr-1" />
          v2.0.0_BETA
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Model Selector */}
        <Panel className="hidden md:flex items-center p-1 bg-muted/50 border-border">
          <ModelButton 
            active={selectedModel === "auto"} 
            onClick={() => handleModelSelect("auto")}
            label="AUTO"
          />
          <ModelButton 
            active={selectedModel === "groq"} 
            onClick={() => handleModelSelect("groq")}
            label="GROQ-120B"
            icon={<Cpu className="w-3 h-3 mr-1" />}
          />
          <ModelButton 
            active={selectedModel === "mistral"} 
            onClick={() => handleModelSelect("mistral")}
            label="MISTRAL-7B"
          />
        </Panel>

        {/* History Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={onHistoryToggle}
          title="Neural Cache"
        >
          <Database className="w-4 h-4" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          title="Toggle Theme"
        >
          {!mounted ? (
            <div className="w-4 h-4" /> // placeholder
          ) : theme === "light" ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </Button>
      </div>
    </header>
  )
}

function ModelButton({ 
  active, 
  onClick, 
  label, 
  icon 
}: { 
  active: boolean
  onClick: () => void
  label: string
  icon?: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center px-3 py-1.5 rounded-sm font-mono text-[10px] font-bold tracking-widest transition-all duration-150 ease-linear",
        active 
          ? "bg-primary text-primary-foreground shadow-[2px_2px_0_0_var(--border)] translate-y-[-1px] translate-x-[-1px] border-2 border-primary"
          : "bg-transparent text-muted-foreground hover:text-foreground border-2 border-transparent hover:border-border"
      )}
    >
      {icon}
      {label}
    </button>
  )
}
