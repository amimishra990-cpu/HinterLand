import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-xs border border-transparent bg-clip-padding text-[13.5px] font-medium leading-none whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-200 outline-none select-none hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-55 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_12px_34px_-18px_rgba(201,164,92,0.9)] hover:bg-[var(--action-primary-hover)] hover:shadow-[0_18px_42px_-18px_rgba(201,164,92,0.95)]",
        outline:
          "border-primary/70 bg-transparent text-forest hover:border-primary hover:bg-primary/[0.07]",
        secondary:
          "border-transparent bg-muted text-ink hover:bg-stone",
        ghost: "text-forest hover:bg-gold/[0.08]",
        attention:
          "border-terracotta bg-transparent text-ink hover:bg-terracotta/10",
        inverse: "bg-ivory text-deep hover:bg-white",
        destructive:
          "border-terracotta bg-transparent text-ink hover:bg-terracotta/10",
        link: "text-forest underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 gap-1.5 px-3 text-xs",
        lg: "h-12 px-6 text-sm",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
