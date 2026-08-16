import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-[11px] font-mono font-bold uppercase tracking-widest transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[2px] active:scale-[0.98] relative overflow-hidden group border-2",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 border-primary shadow-[0_0_10px_rgba(0,132,255,0)] hover:shadow-[0_0_15px_rgba(0,132,255,0.4)]',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive focus-visible:ring-destructive/20',
        outline:
          'border-border/80 bg-background/50 text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50 dark:bg-background/40',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent',
        ghost:
          'text-foreground/80 hover:bg-primary/10 hover:text-primary border-transparent dark:hover:bg-primary/10 dark:hover:text-primary',
        link: 'text-primary underline-offset-4 hover:underline border-transparent',
      },
      size: {
        default: 'h-10 px-5 py-2 has-[>svg]:px-4',
        sm: 'h-8 rounded-sm gap-1.5 px-3 has-[>svg]:px-2.5 text-[10px]',
        lg: 'h-11 rounded-sm px-8 has-[>svg]:px-5 text-[12px]',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
