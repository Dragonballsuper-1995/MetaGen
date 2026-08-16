import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    // Base classes enforce the Dot Matrix hardware-press aesthetic
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-sm font-mono text-xs font-bold uppercase tracking-widest ring-offset-background transition-all duration-150 ease-linear focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
    
    // Variants
    const variants = {
      default: "bg-primary text-primary-foreground border-2 border-primary hover:bg-primary/90 shadow-[4px_4px_0_0_var(--primary)]",
      destructive: "bg-destructive text-destructive-foreground border-2 border-destructive hover:bg-destructive/90 shadow-[4px_4px_0_0_var(--destructive)]",
      outline: "border-2 border-border bg-background text-foreground hover:bg-muted shadow-[4px_4px_0_0_var(--border)]",
      secondary: "bg-muted text-foreground border-2 border-border hover:bg-muted/80 shadow-[4px_4px_0_0_var(--border)]",
      ghost: "hover:bg-muted text-foreground border-2 border-transparent hover:border-border active:border-border hover:shadow-[4px_4px_0_0_var(--border)]",
    }
    
    // Sizes
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-[10px]",
      lg: "h-12 px-8 text-sm",
      icon: "h-10 w-10",
    }
    
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
