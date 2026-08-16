"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Volume2, VolumeX, Database, Sun, Moon, Radio, Cpu, Sparkles } from "lucide-react"
import { HardwareButton } from "@/components/ui/hardware-button"
import { DymoBadge } from "@/components/ui/dymo-badge"
import { sound } from "@/lib/audio-engine"
import { ModelChoice } from "@/lib/types"
import { cn } from "@/lib/utils"

interface HardwareHeaderProps {
  selectedModel: ModelChoice
  onModelChange: (model: ModelChoice) => void
  onHistoryToggle: () => void
  historyCount?: number
}

export function HardwareHeader({
  selectedModel,
  onModelChange,
  onHistoryToggle,
  historyCount = 0,
}: HardwareHeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [isMuted, setIsMuted] = React.useState(false)
  const [timeStr, setTimeStr] = React.useState("00:00:00")

  React.useEffect(() => {
    setMounted(true)
    setIsMuted(sound.getMuted())

    const updateClock = () => {
      const d = new Date()
      setTimeStr(
        d.toTimeString().split(" ")[0]
      )
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  const toggleAudio = () => {
    const next = sound.toggleMute()
    setIsMuted(next)
    if (!next) sound.playClick(1000)
  }

  const toggleThemeMode = () => {
    sound.playClick(700)
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-chassis border-b-2 border-border shadow-[0_4px_0_0_var(--border)] px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 font-mono">
      {/* Corner Rivet Left */}
      <div className="absolute top-1.5 left-1.5 screw-rivet hidden md:block" />
      <div className="absolute top-1.5 right-1.5 screw-rivet hidden md:block" />

      {/* Brand & Identity Area */}
      <div className="flex items-center gap-4">
        {/* Logo Container */}
        <div className="h-7 flex items-center bg-chassis-inset px-2.5 py-1 border border-border">
          <img
            src="/logos/header_logo.svg"
            alt="MetaGen"
            className="h-full object-contain"
          />
        </div>

        {/* Real Dot Matrix Device Descriptor */}
        <div className="flex items-center gap-2">
          <span className="font-doto font-bold text-xs md:text-sm tracking-widest text-foreground uppercase">
            FIELD SYNTHESIZER
          </span>
          <DymoBadge variant="orange" className="hidden sm:inline-flex text-[8px] py-0">
            LPU // 120B
          </DymoBadge>
        </div>
      </div>

      {/* Telemetry / Live Status Clock */}
      <div className="hidden lg:flex items-center gap-3 bg-chassis-inset px-3 py-1 border border-border/80 text-[10px] tracking-widest uppercase text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_6px_#00FF66] animate-pulse" />
          <span className="text-foreground font-bold font-doto">ONLINE</span>
        </div>
        <span className="text-border">|</span>
        <span className="font-space-mono text-foreground font-bold">{timeStr}</span>
        <span className="text-border">|</span>
        <span className="text-[9px]">44.1kHz // 24-BIT</span>
      </div>

      {/* Control Bay: Model Selection + Tools */}
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {/* Model Switch Group (Mechanical Keycaps) */}
        <div className="flex items-center bg-chassis-inset p-1 border border-border gap-1">
          <HardwareButton
            size="sm"
            variant={selectedModel === "auto" ? "active" : "subtle"}
            hasLed
            ledColor="green"
            ledActive={selectedModel === "auto"}
            onClick={() => onModelChange("auto")}
            className="text-[9px] h-7 px-2"
          >
            AUTO
          </HardwareButton>

          <HardwareButton
            size="sm"
            variant={selectedModel === "groq" ? "active" : "subtle"}
            hasLed
            ledColor="orange"
            ledActive={selectedModel === "groq"}
            onClick={() => onModelChange("groq")}
            className="text-[9px] h-7 px-2"
          >
            <Cpu className="w-3 h-3 mr-0.5" />
            GROQ-120B
          </HardwareButton>

          <HardwareButton
            size="sm"
            variant={selectedModel === "mistral" ? "active" : "subtle"}
            hasLed
            ledColor="yellow"
            ledActive={selectedModel === "mistral"}
            onClick={() => onModelChange("mistral")}
            className="text-[9px] h-7 px-2"
          >
            MISTRAL-7B
          </HardwareButton>
        </div>

        {/* Sound FX Toggle */}
        <HardwareButton
          size="sm"
          variant="standard"
          onClick={toggleAudio}
          title={isMuted ? "Audio Muted (Click to enable)" : "Audio Active (Click to mute)"}
          className="h-8 px-2"
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-[#00FF66]" />
          )}
        </HardwareButton>

        {/* Neural Cache Tape Rack Toggle */}
        <HardwareButton
          size="sm"
          variant="standard"
          onClick={onHistoryToggle}
          title="Neural Cache / Tape Archive"
          className="h-8 px-2.5 gap-1.5"
        >
          <Database className="w-3.5 h-3.5 text-primary" />
          <span className="font-doto font-bold text-[10px]">
            [{historyCount.toString().padStart(2, "0")}]
          </span>
        </HardwareButton>

        {/* Theme Toggle */}
        <HardwareButton
          size="sm"
          variant="standard"
          onClick={toggleThemeMode}
          title="Toggle Dark OLED / Light Chalk"
          className="h-8 px-2"
        >
          {!mounted ? (
            <div className="w-3.5 h-3.5" />
          ) : theme === "light" ? (
            <Moon className="w-3.5 h-3.5" />
          ) : (
            <Sun className="w-3.5 h-3.5" />
          )}
        </HardwareButton>
      </div>
    </header>
  )
}
