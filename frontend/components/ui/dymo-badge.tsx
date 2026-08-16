import * as React from "react"
import { cn } from "@/lib/utils"

interface DymoBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "black" | "orange" | "aluminum"
}

export function DymoBadge({
  className,
  variant = "black",
  children,
  ...props
}: DymoBadgeProps) {
  const variants = {
    black: "dymo-label",
    orange: "dymo-label-orange",
    aluminum: "bg-[#E6E6DE] text-[#111111] border border-[#B0B0A4] shadow-[1px_1px_2px_rgba(0,0,0,0.2)] font-mono font-bold tracking-widest uppercase",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest select-none",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
