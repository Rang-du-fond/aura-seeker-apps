import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

// shadcn ships typography as class recipes rather than a component. They are
// wrapped here so apps never style raw text themselves (and so the React
// Native build can map the same variants onto <Text>).
const textVariants = cva("", {
  variants: {
    variant: {
      // Two-level headline: wrap the first part in <strong> (Black), the rest
      // stays Light.
      display:
        "scroll-m-20 font-heading type-display font-light text-balance [&_strong]:font-extrabold",
      h1: "scroll-m-20 font-heading type-h1 font-bold text-balance",
      h2: "scroll-m-20 font-heading type-h2 font-bold",
      h3: "scroll-m-20 font-heading type-h3 font-semibold",
      // Section title on white: Light with a thin rule underneath.
      section:
        "scroll-m-20 border-b border-foreground pb-2 font-heading type-h1 font-light",
      p: "type-body",
      lead: "text-2xl leading-snug text-muted-foreground",
      small: "type-caption font-medium",
      muted: "type-caption font-medium text-muted-foreground",
      overline: "type-overline font-bold tracking-[0.12em] uppercase",
    },
  },
  defaultVariants: {
    variant: "p",
  },
})

type TextVariant = NonNullable<VariantProps<typeof textVariants>["variant"]>

const textElements = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  section: "h2",
  p: "p",
  lead: "p",
  small: "small",
  muted: "p",
  overline: "p",
} as const satisfies Record<TextVariant, React.ElementType>

function Text({
  className,
  variant = "p",
  asChild = false,
  ...props
}: React.ComponentProps<"p"> &
  VariantProps<typeof textVariants> & {
    asChild?: boolean
  }) {
  const Comp: React.ElementType = asChild
    ? Slot.Root
    : textElements[variant ?? "p"]

  return (
    <Comp
      data-slot="text"
      data-variant={variant}
      className={cn(textVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Text, textVariants }
