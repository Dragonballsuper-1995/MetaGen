import * as React from "react"
import { cn } from "@/lib/utils"

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "muted" | "primary" | "destructive"
}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, variant = "default", ...props }, ref) => {
    
    const variants = {
      default: "bg-background border-border shadow-[4px_4px_0_0_var(--border)] dark:shadow-[4px_4px_0_0_var(--border)]",
      muted: "bg-muted border-border shadow-[4px_4px_0_0_var(--border)] dark:shadow-[4px_4px_0_0_var(--border)]",
      primary: "bg-primary/10 border-primary shadow-[4px_4px_0_0_var(--primary)] dark:shadow-[4px_4px_0_0_var(--primary)]",
      destructive: "bg-destructive/10 border-destructive shadow-[4px_4px_0_0_var(--destructive)] dark:shadow-[4px_4px_0_0_var(--destructive)]",
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-sm border-2 transition-all duration-150 ease-linear",
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Panel.displayName = "Panel"

export { Panel }
