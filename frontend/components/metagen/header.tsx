"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Database } from "lucide-react"
import { Button } from "@/components/ui/button"


interface HeaderProps {
  selectedModel?: ModelChoice
  onModelChange?: (model: ModelChoice) => void
  onHistoryToggle?: () => void
}

export function Header({
  selectedModel = "auto",
  onModelChange,
  onHistoryToggle,
}: HeaderProps) {
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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur-md px-4 md:px-8 py-3 flex items-center justify-between">
      {/* Brand: Using official header_logo.svg */}
      <div className="flex items-center gap-3">
        <div className="h-6 md:h-7 flex items-center">
          <img
            src="/logos/header_logo.svg"
            alt="MetaGen"
            className="h-full w-auto object-contain"
          />
        </div>
      </div>

      {/* Navigation & Controls */}
      <div className="flex items-center gap-2 md:gap-3">


        {/* Neural Cache / History */}
        <Button
          variant="outline"
          size="icon"
          onClick={onHistoryToggle}
          className="h-9 w-9 rounded-xl border-border bg-surface hover:bg-muted"
          title="Past Generations"
        >
          <Database className="w-4 h-4 text-foreground" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="h-9 w-9 rounded-xl border-border bg-surface hover:bg-muted"
          title="Toggle Theme"
        >
          {!mounted ? (
            <div className="w-4 h-4" />
          ) : theme === "light" ? (
            <Moon className="w-4 h-4 text-foreground" />
          ) : (
            <Sun className="w-4 h-4 text-foreground" />
          )}
        </Button>
      </div>
    </header>
  )
}
