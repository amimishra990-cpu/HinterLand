import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-xs border px-2 text-[10.5px] font-semibold tracking-[0.12em] whitespace-nowrap uppercase transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "border-forest/35 bg-forest/[0.06] text-forest",
        secondary: "border-transparent bg-muted text-ink/75",
        outline: "border-ink/25 bg-transparent text-ink/70",
        attention: "border-terracotta bg-terracotta/10 text-ink",
        gold: "border-gold bg-transparent text-ink/75",
        muted: "border-transparent bg-muted text-ink/70",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
