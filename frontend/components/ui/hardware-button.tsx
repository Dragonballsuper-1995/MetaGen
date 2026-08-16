"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { sound } from "@/lib/audio-engine"

export interface HardwareButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "standard" | "record" | "accent" | "subtle" | "active"
  size?: "sm" | "md" | "lg" | "icon"
  hasLed?: boolean
  ledColor?: "orange" | "green" | "yellow" | "red"
  ledActive?: boolean
  microLabel?: string
}

export const HardwareButton = React.forwardRef<HTMLButtonElement, HardwareButtonProps>(
  (
    {
      className,
      variant = "standard",
      size = "md",
      hasLed = false,
      ledColor = "orange",
      ledActive = false,
      microLabel,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (variant === "record") {
        sound.playRelaySnap()
      } else {
        sound.playClick()
      }
      if (onClick) onClick(e)
    }

    const variants = {
      standard: "bg-chassis-sub text-foreground border-2 border-border hover:border-foreground/40 active:translate-y-[2px] active:shadow-none shadow-[2px_2px_0_0_var(--border)]",
      record: "bg-[#FF3B00] text-white border-2 border-[#FF6B3D] hover:bg-[#FF4D1A] active:translate-y-[2px] active:shadow-none shadow-[3px_3px_0_0_#992200] font-black",
      accent: "bg-foreground text-background border-2 border-foreground hover:opacity-90 active:translate-y-[2px] active:shadow-none shadow-[2px_2px_0_0_var(--border)]",
      subtle: "bg-transparent text-muted-foreground border-2 border-border/60 hover:text-foreground hover:border-border active:translate-y-[1px] active:shadow-none",
      active: "bg-primary text-primary-foreground border-2 border-primary translate-y-[1px] shadow-none",
    }

    const sizes = {
      sm: "h-7 px-2.5 text-[10px]",
      md: "h-9 px-3.5 text-xs",
      lg: "h-12 px-6 text-sm font-bold",
      icon: "h-9 w-9 p-0",
    }

    const ledStyles = {
      orange: "led-indicator-orange",
      green: "led-indicator-green",
      yellow: "led-indicator-yellow",
      red: "led-indicator-orange",
    }

    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 select-none uppercase tracking-widest font-mono rounded-none transition-all duration-75 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-40 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {microLabel && (
          <span className="absolute -top-3 left-1 text-[8px] font-mono tracking-tighter text-muted-foreground uppercase opacity-80 pointer-events-none">
            {microLabel}
          </span>
        )}

        {hasLed && (
          <span
            className={cn(
              "led-indicator",
              ledActive ? ledStyles[ledColor] : "led-indicator-off"
            )}
          />
        )}

        {children}
      </button>
    )
  }
)
HardwareButton.displayName = "HardwareButton"
